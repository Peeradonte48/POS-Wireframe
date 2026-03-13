'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AltArrowLeftLinear } from 'solar-icon-set'
import { toast } from 'sonner'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { Button } from '@/components/ui/button'
import { BillLineItem } from '@/components/payment/BillLineItem'
import { TotalsSection } from '@/components/payment/TotalsSection'
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector'
import { CashPanel } from '@/components/payment/CashPanel'
import { QrPanel } from '@/components/payment/QrPanel'
import { CardPanel } from '@/components/payment/CardPanel'
import { ReceiptScreen } from '@/components/payment/ReceiptScreen'
import { SplitSheet } from '@/components/payment/SplitSheet'
import { MergeSheet } from '@/components/table-map/MergeSheet'
import { useBillStore } from '@/stores/bill.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'

// ---------------------------------------------------------------------------
// PaymentPage
// ---------------------------------------------------------------------------

export default function PaymentPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  // ---- Stores ----
  const order = useOrderStore((s) => s.getOrder(tableId))
  const role = useSessionStore((s) => s.role)!

  // ---- View state machine ----
  const [viewState, setViewState] = useState<'payment' | 'receipt'>('payment')

  // ---- Payment state ----
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponAmount, setCouponAmount] = useState<number>(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [cashReceived, setCashReceived] = useState<number>(0)

  // ---- Split sheet ----
  const [splitSheetOpen, setSplitSheetOpen] = useState(false)

  // Auto-open if an in-progress split already exists in bill.store (resume mid-split)
  // Guard: do not auto-open SplitSheet when a merge is active
  useEffect(() => {
    const existingSplit = useBillStore.getState().getSplit(tableId)
    if (existingSplit && !useBillStore.getState().getMergedSecondaries(tableId).length) {
      setSplitSheetOpen(true)
    }
  }, [tableId])

  // ---- Merge state ----
  // Select the raw merges record (stable reference) to avoid returning a new array
  // on every render, which would cause an infinite useSyncExternalStore loop.
  const merges = useBillStore((s) => s.merges)
  const mergedSecondaryIds = useMemo(
    () => Object.entries(merges).filter(([, primary]) => primary === tableId).map(([tid]) => tid),
    [merges, tableId],
  )
  const isMerged = mergedSecondaryIds.length > 0
  const { dissolveAll } = useBillStore()
  const tables = useTableStore((s) => s.tables)
  const [mergeSheetOpen, setMergeSheetOpen] = useState(false)

  // Captured snapshot for receipt screen (built in Plan 02)
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

  // tableOrders for grouped display when merge is active
  const tableOrders = isMerged
    ? [tableId, ...mergedSecondaryIds].map((tid) => ({
        tableId: tid,
        label: tables[tid]?.label ?? tid,
        guestCount: tables[tid]?.guestCount ?? null,
        items: (tid === tableId
          ? (order?.rounds.flatMap((r) => r.items) ?? [])
          : (useOrderStore.getState().getOrder(tid)?.rounds.flatMap((r) => r.items) ?? [])
        ).filter((item) => item.status !== 'voided'),
      }))
    : null

  const subtotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
    [billItems],
  )

  const discountAmount = couponApplied ? couponAmount : 0
  const discountedSubtotal = subtotal - discountAmount
  const vatAmount = Math.round(discountedSubtotal * 0.07)
  const grandTotal = discountedSubtotal + vatAmount

  // ---- Coupon ----
  function handleApplyCoupon() {
    if (couponCode.trim() && couponAmount > 0) {
      setCouponApplied(true)
    }
  }

  // ---- Confirm payment ----
  function handleConfirmPayment() {
    if (!paymentMethod) return
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

  // ---- Reprint receipt ----
  function handleReprint() {
    toast('Receipt sent to printer')
  }

  // ---- Confirm button disabled logic ----
  const confirmDisabled =
    !canDoAction(role, 'confirm-payment') ||
    paymentMethod === null ||
    (paymentMethod === 'Cash' && cashReceived > 0 && cashReceived < grandTotal)

  const confirmHint = !canDoAction(role, 'confirm-payment')
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
      <>
        <ReceiptScreen
          tableId={tableId}
          grandTotal={receiptData.grandTotal}
          paymentMethod={receiptData.paymentMethod}
          paidAt={receiptData.paidAt}
          onReprint={handleReprint}
          onBackToFloor={() => router.push('/table-map')}
        />
      </>
    )
  }

  // ---- Payment view ----
  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => router.push('/table-map')}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Back to floor plan"
          >
            <AltArrowLeftLinear size={20} />
          </button>

          <span className="text-sm font-medium">Table {tableId} — Bill</span>

          {/* Right spacer for symmetry */}
          <div className="w-8" />
        </header>

        {/* Scrollable main content — centered on wide tablets */}
        <main className="overflow-y-auto flex-1 pb-24">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {/* Items section */}
          <section>
            <p className="caps mb-2">
              Items
            </p>
            {isMerged && tableOrders ? (
              tableOrders.map((group) => (
                <section key={group.tableId} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="caps">{group.label}{group.guestCount !== null ? ` — ${group.guestCount} guests` : ''}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground text-xs h-auto py-0.5 px-2"
                      onClick={() => dissolveAll(tableId)}
                    >
                      Dissolve Merge
                    </Button>
                  </div>
                  <div className="divide-y">
                    {group.items.map((item) => (
                      <BillLineItem key={item.lineId} item={item} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="divide-y">
                {billItems.map((item) => (
                  <BillLineItem key={item.lineId} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Totals + coupon */}
          <TotalsSection
            subtotal={subtotal}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            couponAmount={couponAmount}
            setCouponAmount={setCouponAmount}
            couponApplied={couponApplied}
            onApplyCoupon={handleApplyCoupon}
            setCouponApplied={setCouponApplied}
            vatAmount={vatAmount}
            grandTotal={grandTotal}
            discountAmount={discountAmount}
            onSplitBill={() => setSplitSheetOpen(true)}
            onMergeBill={() => setMergeSheetOpen(true)}
            isMergeActive={isMerged}
          />

          {/* Payment method selector */}
          <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />

          {/* Conditional sub-panel */}
          {paymentMethod === 'Cash' && (
            <CashPanel
              grandTotal={grandTotal}
              cashReceived={cashReceived}
              setCashReceived={setCashReceived}
            />
          )}
          {/* discountApplied = discountAmount (page state) → QrPanel prop naming differs intentionally */}
          {paymentMethod === 'QR PromptPay' && (
            <QrPanel grandTotal={grandTotal} discountApplied={discountAmount} />
          )}
          {paymentMethod === 'Card' && <CardPanel grandTotal={grandTotal} />}
          </div>
        </main>

        {/* Sticky bottom bar */}
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

      <MergeSheet
        open={mergeSheetOpen}
        onClose={() => setMergeSheetOpen(false)}
        primaryTableId={tableId}
        onMergeConfirmed={() => setMergeSheetOpen(false)}
      />
    </>
  )
}
