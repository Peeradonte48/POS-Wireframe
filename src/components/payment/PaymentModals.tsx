'use client'

import React from 'react'
import { Banknote, QrCode, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CashDialog } from '@/components/payment/CashDialog'
import { QrSheet } from '@/components/payment/QrSheet'
import { SplitSheet } from '@/components/payment/SplitSheet'
import { ValueSplitSheet } from '@/components/payment/ValueSplitSheet'
import { ItemSplitSheet } from '@/components/payment/ItemSplitSheet'
import { MergeSheet } from '@/components/table-map/MergeSheet'
import { CrmLookupDialog, type CrmMember } from '@/components/payment/CrmLookupDialog'
import { useBillStore } from '@/stores/bill.store'
import { useTableStore } from '@/stores/table.store'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PaymentModalsProps {
  tableId: string
  grandTotal: number
  isTakeaway: boolean
  isMerged: boolean
  mergedSecondaryIds: string[]
  billItems: OrderLineItem[]
  crmMember: CrmMember | null
  // Dialog open state
  crmDialogOpen: boolean
  setCrmDialogOpen: (open: boolean) => void
  qrSheetOpen: boolean
  setQrSheetOpen: (open: boolean) => void
  cashDialogOpen: boolean
  setCashDialogOpen: (open: boolean) => void
  splitSheetOpen: boolean
  setSplitSheetOpen: (open: boolean) => void
  mergeSheetOpen: boolean
  setMergeSheetOpen: (open: boolean) => void
  splitConfirmDialogOpen: boolean
  setSplitConfirmDialogOpen: (open: boolean) => void
  valueSplitSheetOpen: boolean
  setValueSplitSheetOpen: (open: boolean) => void
  itemSplitSheetOpen: boolean
  setItemSplitSheetOpen: (open: boolean) => void
  paymentMethodDialogOpen: boolean
  setPaymentMethodDialogOpen: (open: boolean) => void

  // Callbacks
  onCrmMemberFound: (member: CrmMember) => void
  onConfirmPayment: () => void
  onAllPaid: () => void
  onPaymentMethodSelect: (method: PaymentMethod) => void
  onCashClose: () => void
  initialCashAmount?: number
  onCashAmountChange?: (amount: number) => void
}

// ---------------------------------------------------------------------------
// PaymentModals
// ---------------------------------------------------------------------------

export function PaymentModals({
  tableId,
  grandTotal,
  isTakeaway,
  isMerged: _isMerged,
  mergedSecondaryIds,
  billItems,
  crmMember: _crmMember,
  crmDialogOpen,
  setCrmDialogOpen,
  qrSheetOpen,
  setQrSheetOpen,
  cashDialogOpen,
  setCashDialogOpen,
  splitSheetOpen,
  setSplitSheetOpen,
  mergeSheetOpen,
  setMergeSheetOpen,
  splitConfirmDialogOpen,
  setSplitConfirmDialogOpen,
  valueSplitSheetOpen,
  setValueSplitSheetOpen,
  itemSplitSheetOpen,
  setItemSplitSheetOpen,
  paymentMethodDialogOpen,
  setPaymentMethodDialogOpen,
  onCrmMemberFound,
  onConfirmPayment,
  onAllPaid,
  onPaymentMethodSelect,
  onCashClose,
  initialCashAmount,
  onCashAmountChange,
}: PaymentModalsProps) {
  const router = useRouter()
  const { setCrmMember, dissolveAll } = useBillStore()

  return (
    <>
      {/* Split sheet (per-seat payment) */}
      {!isTakeaway && (
        <SplitSheet
          open={splitSheetOpen}
          onClose={() => setSplitSheetOpen(false)}
          tableId={tableId}
          grandTotal={grandTotal}
          billItems={billItems}
          onAllPaid={() => {
            useTableStore.getState().updateTable(tableId, { orderStage: 'Billed' })
            mergedSecondaryIds.forEach((id) => useTableStore.getState().markCleaning(id))
            dissolveAll(tableId)
            onAllPaid()
          }}
        />
      )}

      {/* Merge sheet */}
      {!isTakeaway && (
        <MergeSheet
          open={mergeSheetOpen}
          onClose={() => setMergeSheetOpen(false)}
          primaryTableId={tableId}
          onMergeConfirmed={() => setMergeSheetOpen(false)}
        />
      )}

      {/* Split payment confirm dialog */}
      <Dialog open={splitConfirmDialogOpen} onOpenChange={setSplitConfirmDialogOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">ยืนยันการแบ่งจ่าย</DialogTitle>
            <DialogDescription>
              เมื่อเริ่มแบ่งจ่ายแล้วจจะไม่สามารถเพิ่มคูปองได้อีก{'\n'}ต้องการดำเนินการต่อหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setSplitConfirmDialogOpen(false)
                setValueSplitSheetOpen(true)
              }}
            >
              ยืนยัน
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSplitConfirmDialogOpen(false)}
            >
              ยกเลิก
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Value split sheet */}
      {!isTakeaway && (
        <ValueSplitSheet
          open={valueSplitSheetOpen}
          onClose={() => setValueSplitSheetOpen(false)}
          grandTotal={grandTotal}
          tableId={tableId}
          onProceed={() => {
            setValueSplitSheetOpen(false)
            router.push(`/payment/${tableId}/split-summary`)
          }}
        />
      )}

      {/* Item split sheet */}
      {!isTakeaway && (
        <ItemSplitSheet
          open={itemSplitSheetOpen}
          onClose={() => setItemSplitSheetOpen(false)}
          tableId={tableId}
          orderItems={billItems}
          onProceed={() => {
            setItemSplitSheetOpen(false)
            router.push(`/payment/${tableId}/split-summary`)
          }}
        />
      )}

      {/* CRM member lookup dialog */}
      <CrmLookupDialog
        open={crmDialogOpen}
        onClose={() => setCrmDialogOpen(false)}
        onMemberFound={(member) => {
          setCrmMember(tableId, member)
          setCrmDialogOpen(false)
          onCrmMemberFound(member)
        }}
      />

      {/* QR PromptPay bottom sheet */}
      <QrSheet
        open={qrSheetOpen}
        onClose={() => setQrSheetOpen(false)}
        grandTotal={grandTotal}
        onConfirm={() => {
          setQrSheetOpen(false)
          onConfirmPayment()
        }}
      />

      {/* Cash payment dialog */}
      <CashDialog
        open={cashDialogOpen}
        onClose={onCashClose}
        grandTotal={grandTotal}
        onConfirm={() => {
          setCashDialogOpen(false)
          onConfirmPayment()
        }}
        initialAmount={initialCashAmount}
        onAmountChange={onCashAmountChange}
      />

      {/* Payment method selection dialog */}
      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">วิธีการชำระเงิน</DialogTitle>
            <DialogDescription>เลือกวิธีการชำระเงิน</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {(
              [
                { method: 'Cash' as PaymentMethod, label: 'เงินสด', icon: Banknote },
                { method: 'QR PromptPay' as PaymentMethod, label: 'QR Code Promptpay', icon: QrCode },
                { method: 'Card' as PaymentMethod, label: 'Credit Card', icon: CreditCard },
              ] as { method: PaymentMethod; label: string; icon: React.ElementType }[]
            ).map(({ method, label, icon: Icon }) => (
              <Button
                key={method}
                variant="outline"
                className="h-14 w-full gap-2 text-sm font-medium"
                onClick={() => {
                  setPaymentMethodDialogOpen(false)
                  onPaymentMethodSelect(method)
                }}
              >
                <Icon size={16} />
                {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}

// Re-export types for parent consumption
export type { PaymentMethod }
