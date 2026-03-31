'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBillStore } from '@/stores/bill.store'
import { SeatPaymentPanel } from '@/components/payment/SeatPaymentPanel'
import type { SeatPaymentRecord } from '@/stores/bill.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomValueSplitPanelProps {
  tableId: string
  grandTotal: number
  onAllPaid: () => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// CustomValueSplitPanel
// ---------------------------------------------------------------------------

export function CustomValueSplitPanel({ tableId, grandTotal, onAllPaid, onCancel }: CustomValueSplitPanelProps) {
  const [activeSeatIndex, setActiveSeatIndex] = useState<number | null>(null)
  const [showCancelWarning, setShowCancelWarning] = useState(false)

  const { addCustomPayer, recordPayment, cancelSplit, getSplit, setCustomAmount } = useBillStore()
  const split = getSplit(tableId)
  const paidCount = split ? Object.keys(split.payments).length : 0

  if (!split) return null

  const payers = Array.from({ length: split.seatCount }, (_, i) => i)
  const sumBefore = (upToIndex: number) => split.customAmounts.slice(0, upToIndex).reduce((s, a) => s + a, 0)
  const totalPaid = Object.values(split.payments).reduce((s, p) => s + p.amount, 0)
  const remaining = grandTotal - totalPaid

  function handleSeatPaid(seatIndex: number, record: SeatPaymentRecord) {
    recordPayment(tableId, seatIndex, record)
    setActiveSeatIndex(null)
    const updatedSplit = useBillStore.getState().getSplit(tableId)
    if (!updatedSplit) return
    const allPaid = Array.from({ length: updatedSplit.seatCount }, (_, i) => i)
      .every((i) => updatedSplit.payments[i] !== undefined)
    if (allPaid) {
      cancelSplit(tableId)
      onAllPaid()
    }
  }

  function handleConfirmCancel() {
    cancelSplit(tableId)
    setShowCancelWarning(false)
    onCancel()
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <h2 className="text-lg font-semibold">Split by Value</h2>

      <div className="space-y-2">
        {payers.map((i) => {
          const isLast = i === split.seatCount - 1
          const payment = split.payments[i]
          const isSettled = payment !== undefined
          const isActive = activeSeatIndex === i
          const amountEntered = split.customAmounts[i] ?? 0
          const balanceBefore = sumBefore(i)
          const remainingForThis = grandTotal - balanceBefore
          const displayAmount = isLast ? Math.max(0, remainingForThis) : amountEntered
          const lastPayerOverflow = isLast && remainingForThis < 0
          const isOverAmount = !isLast && amountEntered > remainingForThis
          const canPay = isLast
            ? !lastPayerOverflow && payers.slice(0, i).every((j) => split.payments[j] !== undefined)
            : amountEntered > 0 && !isOverAmount

          return (
            <div key={i} className={`rounded-xl border p-3 space-y-2 transition-opacity ${isSettled ? 'opacity-60' : ''}`}
              style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Payer {i + 1}</span>
                  {isSettled && <Badge variant="settled">Settled</Badge>}
                  {isSettled && <span className="text-xs text-muted-foreground">{payment.method}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!isSettled && !isLast && (
                    <input type="number" min={1} max={remainingForThis}
                      value={amountEntered === 0 ? '' : amountEntered} placeholder="฿0"
                      onChange={(e) => setCustomAmount(tableId, i, Math.max(0, Number(e.target.value) || 0))}
                      className="w-24 text-right border rounded-md px-2 py-1 text-sm bg-background"
                    />
                  )}
                  {!isSettled && isLast && (
                    <span className="font-semibold text-sm">
                      ฿{displayAmount.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">remainder</span>
                    </span>
                  )}
                  {isSettled && <span className="font-semibold">฿{payment.amount.toLocaleString()}</span>}
                  {!isSettled && (
                    <Button size="sm" disabled={!canPay} onClick={() => setActiveSeatIndex(isActive ? null : i)}>
                      {isActive ? 'Close' : 'Pay'}
                    </Button>
                  )}
                </div>
              </div>
              {!isSettled && !isLast && isOverAmount && (
                <p className="text-xs text-destructive">Amount exceeds ฿{remainingForThis.toLocaleString()} remaining</p>
              )}
              {!isSettled && lastPayerOverflow && (
                <p className="text-xs text-destructive">Other payers exceed the total — reduce their amounts first</p>
              )}
              {isActive && !isSettled && (
                <SeatPaymentPanel seatIndex={i} seatTotal={isLast ? displayAmount : amountEntered}
                  tableId={tableId} onPaid={(record) => handleSeatPaid(i, record)} />
              )}
            </div>
          )
        })}
      </div>

      {paidCount === 0 && (
        <Button variant="outline" className="w-full" onClick={() => addCustomPayer(tableId)}>+ Add Payer</Button>
      )}

      <div className="flex justify-between text-sm border-t pt-3">
        <span className="text-muted-foreground">Remaining</span>
        <span className={remaining === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
          {remaining === 0 ? '฿0 — all covered' : `฿${remaining.toLocaleString()}`}
        </span>
      </div>

      {/* Cancel section */}
      <div className="border-t pt-2">
        {showCancelWarning ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive font-medium">Cancelling will clear all payment progress</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelWarning(false)}>Keep going</Button>
              <Button variant="destructive" className="flex-1" onClick={handleConfirmCancel}>Confirm cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground"
            onClick={() => paidCount > 0 ? setShowCancelWarning(true) : handleConfirmCancel()}>
            Cancel split
          </Button>
        )}
      </div>
    </div>
  )
}
