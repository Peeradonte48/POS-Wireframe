'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, Crown, TicketPercent, Coins, ScissorsLineDashed, Link, HandPlatter } from 'lucide-react'
import { toast } from 'sonner'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BillLineItem } from '@/components/payment/BillLineItem'
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector'
import { CashPanel } from '@/components/payment/CashPanel'
import { QrPanel } from '@/components/payment/QrPanel'
import { CardPanel } from '@/components/payment/CardPanel'
import { ReceiptScreen } from '@/components/payment/ReceiptScreen'
import { SplitSheet } from '@/components/payment/SplitSheet'
import { MergeSheet } from '@/components/table-map/MergeSheet'
import { useBillStore } from '@/stores/bill.store'
import { useQueueStore } from '@/stores/queue.store'
import { useKdsStore } from '@/stores/kds.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'
type ViewState = 'checkBill' | 'checkout' | 'receipt'

// ---------------------------------------------------------------------------
// PaymentPage
// ---------------------------------------------------------------------------

export default function PaymentPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  // ---- Takeaway detection ----
  const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
  const queueOrder = isTakeaway ? useQueueStore.getState().orders[tableId] : undefined

  // ---- Stores ----
  const order = useOrderStore((s) => s.getOrder(tableId))
  const role = useSessionStore((s) => s.role)!

  // ---- View state machine ----
  const [viewState, setViewState] = useState<ViewState>('checkBill')

  // ---- Payment state ----
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponAmount, setCouponAmount] = useState<number>(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [cashReceived, setCashReceived] = useState<number>(0)

  // ---- Split sheet ----
  const [splitSheetOpen, setSplitSheetOpen] = useState(false)

  useEffect(() => {
    if (isTakeaway) return
    const existingSplit = useBillStore.getState().getSplit(tableId)
    if (existingSplit && !useBillStore.getState().getMergedSecondaries(tableId).length) {
      setSplitSheetOpen(true)
    }
  }, [tableId, isTakeaway])

  // ---- Merge state ----
  const merges = useBillStore((s) => s.merges)
  const mergedSecondaryIds = useMemo(
    () => Object.entries(merges).filter(([, primary]) => primary === tableId).map(([tid]) => tid),
    [merges, tableId],
  )
  const isMerged = mergedSecondaryIds.length > 0
  const { dissolveAll } = useBillStore()
  const tables = useTableStore((s) => s.tables)
  const [mergeSheetOpen, setMergeSheetOpen] = useState(false)

  // ---- Receipt data ----
  const [receiptData, setReceiptData] = useState<{
    grandTotal: number
    paymentMethod: PaymentMethod
    paidAt: Date
  } | null>(null)

  // ---- Bill assembly ----
  const billItems = useMemo(() => {
    const primaryItems = order
      ? order.rounds.flatMap((r) => r.items).filter((item) => item.status !== 'voided')
      : []
    if (!isMerged) return primaryItems
    const secondaryItems = mergedSecondaryIds.flatMap((tid) => {
      const secOrder = useOrderStore.getState().getOrder(tid)
      if (!secOrder) return []
      return secOrder.rounds.flatMap((r) => r.items).filter((item) => item.status !== 'voided')
    })
    return [...primaryItems, ...secondaryItems]
  }, [order, isMerged, mergedSecondaryIds])

  // tableOrders for grouped display
  const tableOrders = useMemo(() => {
    if (isMerged) {
      return [tableId, ...mergedSecondaryIds].map((tid) => ({
        tableId: tid,
        label: tables[tid]?.label ?? tid,
        guestCount: tables[tid]?.guestCount ?? null,
        items: (tid === tableId
          ? (order?.rounds.flatMap((r) => r.items) ?? [])
          : (useOrderStore.getState().getOrder(tid)?.rounds.flatMap((r) => r.items) ?? [])
        ).filter((item) => item.status !== 'voided'),
      }))
    }
    return [{
      tableId,
      label: tables[tableId]?.label ?? tableId,
      guestCount: tables[tableId]?.guestCount ?? null,
      items: billItems,
    }]
  }, [isMerged, mergedSecondaryIds, tableId, tables, order, billItems])

  const subtotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
    [billItems],
  )

  const discountAmount = couponApplied ? couponAmount : 0
  const discountedSubtotal = subtotal - discountAmount
  const vatAmount = Math.round(discountedSubtotal * 0.07)
  const grandTotal = discountedSubtotal + vatAmount

  // ---- Confirm payment ----
  function handleConfirmPayment() {
    if (!paymentMethod) return

    if (isTakeaway) {
      useQueueStore.getState().advanceStatus(tableId)
      useKdsStore.getState().addTicket(tableId, tableId, 'takeaway')
      toast.success('Payment confirmed')
      router.push('/table-map')
      return
    }

    const { markCleaning, updateTable } = useTableStore.getState()
    markCleaning(tableId)
    mergedSecondaryIds.forEach((id) => markCleaning(id))
    dissolveAll(tableId)
    updateTable(tableId, { orderStage: 'Billed' })
    updateTable(tableId, {
      paidAmount: grandTotal,
      paymentMethod: paymentMethod,
      discountApplied: discountAmount,
    })
    toast.success('Payment confirmed')
    setReceiptData({ grandTotal, paymentMethod, paidAt: new Date() })
    setViewState('receipt')
  }

  function handleReprint() {
    toast('Receipt sent to printer')
  }

  const confirmDisabled =
    (!isTakeaway && !canDoAction(role, 'confirm-payment')) ||
    paymentMethod === null ||
    (paymentMethod === 'Cash' && cashReceived > 0 && cashReceived < grandTotal)

  const confirmHint = (!isTakeaway && !canDoAction(role, 'confirm-payment'))
    ? `Role "${role}" cannot confirm payment — switch to Cashier or Manager`
    : paymentMethod === null
      ? 'Select a payment method above to continue'
      : paymentMethod === 'Cash' && cashReceived > 0 && cashReceived < grandTotal
        ? 'Cash received is less than the total'
        : null

  // ---- Empty order guard ----
  if (!order || billItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No order data found.</p>
        <Button onClick={() => router.push('/table-map')}>Back to Floor Plan</Button>
      </div>
    )
  }

  // ---- Receipt view ----
  if (viewState === 'receipt' && receiptData) {
    return (
      <ReceiptScreen
        tableId={tableId}
        grandTotal={receiptData.grandTotal}
        paymentMethod={receiptData.paymentMethod}
        paidAt={receiptData.paidAt}
        onReprint={handleReprint}
        onBackToFloor={() => router.push('/table-map')}
      />
    )
  }

  // ---- Checkout view ----
  if (viewState === 'checkout') {
    return (
      <>
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="h-[52px] border-b flex items-center gap-2 px-6 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => setViewState('checkBill')}
              aria-label="Back to bill summary"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="font-medium text-base leading-none">
              {isTakeaway ? `${tableId} · ${queueOrder?.customerName ?? ''}` : 'ชำระเงิน'}
            </span>
          </header>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
              <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
              {paymentMethod === 'Cash' && (
                <CashPanel
                  grandTotal={grandTotal}
                  cashReceived={cashReceived}
                  setCashReceived={setCashReceived}
                />
              )}
              {paymentMethod === 'QR PromptPay' && (
                <QrPanel grandTotal={grandTotal} discountApplied={discountAmount} />
              )}
              {paymentMethod === 'Card' && <CardPanel grandTotal={grandTotal} />}
            </div>
          </div>

          {/* Sticky bottom */}
          <div className="sticky bottom-0 bg-background border-t p-4">
            <div className="max-w-2xl mx-auto space-y-2">
              <Button
                size="cta"
                className="w-full text-base"
                disabled={confirmDisabled}
                onClick={handleConfirmPayment}
              >
                Confirm Payment — ฿{grandTotal.toLocaleString()}
              </Button>
              {confirmHint && (
                <p className="text-xs text-center text-muted-foreground">{confirmHint}</p>
              )}
            </div>
          </div>
        </div>

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
              setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date() })
              setViewState('receipt')
            }}
          />
        )}
      </>
    )
  }

  // ---- Check Bill view (default) ----
  return (
    <>
      <div className="flex flex-col h-full">
        {/* Sub-header */}
        <header className="border-b flex items-center gap-2 px-6 py-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => router.push('/table-map')}
            aria-label="Back to floor plan"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none">สรุปรายการชำระ</span>
        </header>

        {/* Two-column content */}
        <div className="flex flex-1 min-h-0">
          {/* Left panel – scrollable order items */}
          <div className="flex-1 min-w-0 overflow-y-auto px-4 py-6 flex flex-col gap-6">
            {/* Summary totals */}
            <div className="flex flex-col gap-4">
              {/* ราคารวม */}
              <div className="flex items-center justify-between">
                <p className="font-medium text-base text-muted-foreground leading-6">ราคารวม</p>
                <div className="w-20 flex justify-end">
                  <p className="font-semibold text-base text-foreground leading-6">
                    ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* ส่วนลดท้ายใบเสร็จ */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-base text-muted-foreground leading-6">ส่วนลดท้ายใบเสร็จ</p>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </div>
                <div className="w-20 flex justify-end">
                  <p className="font-semibold text-base text-foreground leading-6">
                    ฿{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* VAT */}
              <div className="flex items-start justify-between">
                <p className="font-medium text-base text-muted-foreground leading-6">VAT</p>
                <div className="w-20 flex justify-end">
                  <p className="font-semibold text-base text-foreground leading-6">
                    ฿{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="py-2">
              <Separator />
            </div>

            {/* Table groups with line items */}
            <div className="flex flex-col gap-4">
              {tableOrders.map((group) => {
                const groupSubtotal = group.items.reduce(
                  (sum, item) => sum + item.basePrice * item.quantity,
                  0,
                )
                return (
                  <div key={group.tableId} className="flex flex-col gap-4">
                    {/* Table header row */}
                    <div className="flex items-center gap-[10px] py-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-8 rounded-md shrink-0"
                        aria-label="Table"
                      >
                        <HandPlatter size={16} />
                      </Button>
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        <p className="font-semibold text-lg leading-7 shrink-0">{group.label}</p>
                        {group.guestCount !== null && (
                          <p className="text-sm text-muted-foreground leading-5 shrink-0">
                            ลูกค้า {group.guestCount} คน
                          </p>
                        )}
                      </div>
                      <div className="w-20 flex justify-end shrink-0">
                        <p className="font-medium text-lg leading-7 text-right">
                          ฿{groupSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Line items */}
                    <div className="flex flex-col gap-4">
                      {group.items.map((item) => (
                        <BillLineItem key={item.lineId} item={item} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel – totals & actions */}
          <div
            className="border-l flex flex-col gap-6 px-4 py-6 shrink-0 w-[282px]"
            style={{ boxShadow: 'var(--shadow-panel)' }}
          >
            {/* Grand total display */}
            <div className="flex flex-col gap-4 items-center justify-center h-32 leading-none p-4 whitespace-nowrap">
              <p className="font-medium text-xl text-muted-foreground">รวมสุทธิ</p>
              <p className="font-semibold text-3xl text-destructive">
                ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Add member button */}
            <div className="border border-border rounded-[14px] p-4">
              <Button
                variant="ghost"
                className="w-full h-10 text-primary gap-2"
                onClick={() => toast('Member lookup coming soon')}
              >
                <Crown size={16} />
                เพิ่มเบอร์สมาชิกลูกค้า
              </Button>
            </div>

            {/* Coupon button */}
            {!isTakeaway && (
              <div>
                <Button
                  variant="outline"
                  className="w-full h-10 gap-2"
                  onClick={() => toast('Coupon scan coming soon')}
                >
                  <TicketPercent size={16} />
                  ใช้คูปองส่วนลด
                </Button>
              </div>
            )}

            {/* Separator */}
            <div className="py-2">
              <Separator />
            </div>

            {/* Bill management */}
            {!isTakeaway && (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-base text-muted-foreground leading-6">จัดการบิล</p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full h-10 gap-2"
                    onClick={() => setSplitSheetOpen(true)}
                    disabled={isMerged}
                  >
                    <Coins size={16} />
                    แบ่งจ่าย
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-10 gap-2"
                    onClick={() => toast('Separate bill coming soon')}
                  >
                    <ScissorsLineDashed size={16} />
                    แยกบิล
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-10 gap-2"
                    onClick={() => setMergeSheetOpen(true)}
                    disabled={isMerged}
                  >
                    <Link size={16} />
                    รวมบิล
                  </Button>
                </div>
              </div>
            )}

            {/* Spacer to push proceed button to bottom */}
            <div className="flex-1" />

            {/* Proceed to payment button */}
            <Button
              className="w-full h-14 text-base font-semibold gap-2"
              onClick={() => setViewState('checkout')}
            >
              ดำเนินการชำระเงิน
            </Button>
          </div>
        </div>
      </div>

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
            setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date() })
            setViewState('receipt')
          }}
        />
      )}

      {!isTakeaway && (
        <MergeSheet
          open={mergeSheetOpen}
          onClose={() => setMergeSheetOpen(false)}
          primaryTableId={tableId}
          onMergeConfirmed={() => setMergeSheetOpen(false)}
        />
      )}
    </>
  )
}
