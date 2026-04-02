'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector'
import { CashPanel } from '@/components/payment/CashPanel'
import { QrPanel } from '@/components/payment/QrPanel'
import { CardPanel } from '@/components/payment/CardPanel'
import type { SeatPaymentRecord } from '@/stores/bill.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'

interface SeatPaymentPanelProps {
  seatIndex: number              // 0-based, displayed as "Seat {seatIndex + 1}"
  seatTotal: number              // pre-computed seat total (satang-correct)
  tableId: string
  onPaid: (record: SeatPaymentRecord) => void  // called after confirm
}

// ---------------------------------------------------------------------------
// SeatPaymentPanel
// ---------------------------------------------------------------------------

export function SeatPaymentPanel({ seatIndex, seatTotal, onPaid }: SeatPaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [cashReceived, setCashReceived] = useState(0)

  // Confirm is disabled when:
  // - no method selected, OR
  // - Cash selected AND cash entered but insufficient
  const isUnderpayment =
    paymentMethod === 'Cash' && cashReceived > 0 && cashReceived < seatTotal
  const confirmDisabled = paymentMethod === null || isUnderpayment

  function handleConfirm() {
    if (!paymentMethod) return
    onPaid({ method: paymentMethod, paidAt: Date.now(), amount: seatTotal })
  }

  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-4"
      style={{ boxShadow: 'var(--shadow-panel)' }}
    >
      {/* Seat header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          Seat {seatIndex + 1}
        </h3>
        <span className="text-lg font-bold">฿{seatTotal.toLocaleString()}</span>
      </div>

      {/* Method selector */}
      <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />

      {/* Sub-panels */}
      {paymentMethod === 'Cash' && (
        <CashPanel
          grandTotal={seatTotal}
          cashReceived={cashReceived}
          setCashReceived={setCashReceived}
        />
      )}
      {paymentMethod === 'QR PromptPay' && (
        <QrPanel grandTotal={seatTotal} discountApplied={0} />
      )}
      {paymentMethod === 'Card' && (
        <CardPanel grandTotal={seatTotal} />
      )}

      {/* Confirm */}
      <Button
        className="w-full"
        disabled={confirmDisabled}
        onClick={handleConfirm}
      >
        Confirm Payment — ฿{seatTotal.toLocaleString()}
      </Button>
    </div>
  )
}
