'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTableStore } from '@/stores/table.store'
import { useBillStore } from '@/stores/bill.store'
import { Button } from '@/components/ui/button'
import { CrmLookupDialog } from '@/components/payment/CrmLookupDialog'
import { ReceiptScreen } from '@/components/payment/ReceiptScreen'
import { PerSeatPaymentPanel } from '@/components/payment/PerSeatPaymentPanel'
import { CustomSplitPaymentPanel } from '@/components/payment/CustomSplitPaymentPanel'
import { useSplitSummary } from '@/components/payment/useSplitSummary'

// ---------------------------------------------------------------------------
// SplitSummaryPage — orchestrator
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'

interface ReceiptData {
  amount: number
  method: PaymentMethod
  paidAt: Date
  payerLabel: string
}

export default function SplitSummaryPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  const { splitOrigin, splitAmounts, billItems, crmMember, split, subtotal, vatAmount, promotions, discountTotal } =
    useSplitSummary(tableId)

  const table = useTableStore((s) => s.tables[tableId])
  const tableLabel = table?.label ?? tableId

  const { setCrmMember, clearCrmMember } = useBillStore()
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // ---- All paid: show receipt, then table lifecycle transition on exit ----
  function handleAllPaid() {
    useTableStore.getState().markCleaning(tableId)
    const totalPaid = splitAmounts.reduce((sum, a) => sum + a, 0)
    setReceiptData({
      amount: totalPaid + Math.round(totalPaid * 0.07),
      method: 'Cash',
      paidAt: new Date(),
      payerLabel: tableLabel,
    })
  }

  // ---- Fallback if no split data ----
  if (!split || splitAmounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">ไม่พบข้อมูลการแบ่งจ่าย</p>
        <Button onClick={() => router.back()}>กลับ</Button>
      </div>
    )
  }

  // ---- Receipt view (between payments or final) ----
  if (receiptData) {
    return (
      <ReceiptScreen
        tableId={receiptData.payerLabel}
        grandTotal={receiptData.amount}
        paymentMethod={receiptData.method}
        paidAt={receiptData.paidAt}
        onReprint={() => toast('Receipt sent to printer')}
        onBackToFloor={() => { clearCrmMember(tableId); router.push('/table-map') }}
        ctaLabel="กลับไปที่ Floor Plan"
        crmMember={crmMember}
      />
    )
  }

  return (
    <>
      {/* Item-split (แยกบิล) layout */}
      {splitOrigin === 'item' && (
        <PerSeatPaymentPanel
          tableId={tableId}
          tableLabel={tableLabel}
          splitAmounts={splitAmounts}
          billItems={billItems}
          itemBills={split.itemBills}
          crmMember={crmMember}
          onCrmChange={() => setCrmDialogOpen(true)}
          onAllPaid={handleAllPaid}
        />
      )}

      {/* Value-split (แบ่งจ่าย) layout */}
      {splitOrigin === 'value' && (
        <CustomSplitPaymentPanel
          tableId={tableId}
          tableLabel={tableLabel}
          splitAmounts={splitAmounts}
          billItems={billItems}
          subtotal={subtotal}
          vatAmount={vatAmount}
          promotions={promotions}
          discountTotal={discountTotal}
          guestCount={table?.guestCount ?? null}
          crmMember={crmMember}
          onCrmChange={() => setCrmDialogOpen(true)}
          onAllPaid={handleAllPaid}
        />
      )}

      {/* CRM member lookup dialog */}
      <CrmLookupDialog
        open={crmDialogOpen}
        onClose={() => setCrmDialogOpen(false)}
        onMemberFound={(member) => {
          setCrmMember(tableId, member)
          setCrmDialogOpen(false)
        }}
      />
    </>
  )
}
