'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AltArrowLeftLinear } from 'solar-icon-set'
import { toast, Toaster } from 'sonner'
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

  // Captured snapshot for receipt screen (built in Plan 02)
  const [receiptData, setReceiptData] = useState<{
    grandTotal: number
    paymentMethod: PaymentMethod
    paidAt: Date
  } | null>(null)

  // ---- Bill assembly ----
  const billItems = useMemo(() => {
    if (!order) return []
    return order.rounds.flatMap((r) => r.items).filter((item) => item.status !== 'voided')
  }, [order])

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
    updateTable(tableId, { orderStage: 'Billed' })
    updateTable(tableId, {
      paidAmount: grandTotal,
      paymentMethod: paymentMethod,
      discountApplied: discountAmount,
    })
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
        <Toaster position="top-center" />
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
      <Toaster position="top-center" />

      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => router.push('/table-map')}
            className="flex items-center justify-center w-8 h-8 -ml-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Back to floor plan"
          >
            <AltArrowLeftLinear size={20} />
          </button>

          <span className="text-sm font-medium">Table {tableId} — Bill</span>

          {/* Right spacer for symmetry */}
          <div className="w-8" />
        </header>

        {/* Scrollable main content */}
        <main className="overflow-y-auto flex-1 px-4 py-4 space-y-6 pb-24">
          {/* Items section */}
          <section>
            <p className="text-sm font-medium text-muted-foreground uppercase mb-2 tracking-wide">
              Items
            </p>
            <div className="divide-y">
              {billItems.map((item) => (
                <BillLineItem key={item.lineId} item={item} />
              ))}
            </div>
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
            vatAmount={vatAmount}
            grandTotal={grandTotal}
            discountAmount={discountAmount}
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
          {paymentMethod === 'QR PromptPay' && <QrPanel grandTotal={grandTotal} />}
          {paymentMethod === 'Card' && <CardPanel grandTotal={grandTotal} />}
        </main>

        {/* Sticky bottom bar */}
        <div className="sticky bottom-0 bg-background border-t p-4">
          <Button
            className="w-full"
            disabled={confirmDisabled}
            onClick={handleConfirmPayment}
          >
            Confirm Payment — ฿{grandTotal.toLocaleString()}
          </Button>
        </div>
      </div>
    </>
  )
}
