'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBillStore } from '@/stores/bill.store'
import { useTableStore } from '@/stores/table.store'
import { SeatPaymentPanel } from '@/components/payment/SeatPaymentPanel'
import type { SeatPaymentRecord } from '@/stores/bill.store'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewState =
  | 'mode-select'
  | 'equal-config'
  | 'equal-seats'
  | 'per-seat-assign'
  | 'per-seat-pay'

interface SplitSheetProps {
  open: boolean
  onClose: () => void
  tableId: string
  grandTotal: number         // full bill grand total (post-discount)
  billItems: OrderLineItem[] // non-voided items from order (for per-seat assignment)
  onAllPaid: () => void      // called after last seat paid — navigate to ReceiptScreen
}

// ---------------------------------------------------------------------------
// SplitSheet
// ---------------------------------------------------------------------------

export function SplitSheet({ open, onClose, tableId, grandTotal, billItems, onAllPaid }: SplitSheetProps) {
  const [view, setView] = useState<ViewState>('mode-select')
  const [seatCountInput, setSeatCountInput] = useState<number>(2)
  const [activeSeatIndex, setActiveSeatIndex] = useState<number | null>(null)

  // Per-seat assign state
  const [assigningLineId, setAssigningLineId] = useState<string | null>(null)
  const [assigningQty, setAssigningQty] = useState<number>(1)
  const [assigningFromSeatIndex, setAssigningFromSeatIndex] = useState<number | null>(null)

  // Cancel warning state (when partial payments exist)
  const [showCancelWarning, setShowCancelWarning] = useState(false)

  // Revert to single bill confirm state
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)

  const { initEqualSplit, initPerSeatSplit, assignItem, removeAssignment, recordPayment, cancelSplit, getSplit } =
    useBillStore()

  const split = getSplit(tableId)
  const paidCount = split ? Object.keys(split.payments).length : 0

  // Default seat count from table store
  const defaultGuestCount = useTableStore.getState().tables[tableId]?.guestCount ?? 2

  // Reset view when sheet opens
  useEffect(() => {
    if (open) {
      setView('mode-select')
      setActiveSeatIndex(null)
      setAssigningLineId(null)
      setAssigningFromSeatIndex(null)
      setShowCancelWarning(false)
      setShowRevertConfirm(false)
      setSeatCountInput(defaultGuestCount)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function handleCancelSplit() {
    const hasPayments = split && Object.keys(split.payments).length > 0
    if (hasPayments) {
      setShowCancelWarning(true)
    } else {
      cancelSplit(tableId)
      toast('Split cancelled')
      onClose()
    }
  }

  function handleConfirmCancel() {
    cancelSplit(tableId)
    toast('Split cancelled')
    setShowCancelWarning(false)
    onClose()
  }

  function handleSeatPaid(seatIndex: number, record: SeatPaymentRecord) {
    recordPayment(tableId, seatIndex, record)
    setActiveSeatIndex(null)

    // Check if all seats paid after recording
    const updatedSplit = useBillStore.getState().getSplit(tableId)
    if (!updatedSplit) return

    const allPaid = Array.from({ length: updatedSplit.seatCount }, (_, i) => i).every(
      (i) => updatedSplit.payments[i] !== undefined,
    )

    if (allPaid) {
      useTableStore.getState().markCleaning(tableId)
      cancelSplit(tableId)
      onClose()
      onAllPaid()
    }
  }

  // Calculate unassigned qty for a lineItem
  function getUnassignedQty(lineId: string, totalQty: number): number {
    if (!split) return totalQty
    const assigned = split.assignments
      .filter((a) => a.lineId === lineId)
      .reduce((sum, a) => sum + a.assignedQty, 0)
    return totalQty - assigned
  }

  // Check if all items are fully assigned
  function allItemsAssigned(): boolean {
    return billItems.every((item) => getUnassignedQty(item.lineId, item.quantity) === 0)
  }

  // Seat total for per-seat-pay view
  function computeSeatTotal(seatIndex: number): number {
    if (!split) return 0
    const seatSubtotal = split.assignments
      .filter((a) => a.seatIndex === seatIndex)
      .reduce((sum, a) => {
        const item = billItems.find((it) => it.lineId === a.lineId)
        return sum + (item ? a.assignedQty * item.basePrice : 0)
      }, 0)
    const seatVat = Math.round(seatSubtotal * 0.07)
    return seatSubtotal + seatVat
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderCancelSection() {
    // Hide cancel in per-seat-pay after first payment (show warning logic handles it)
    if (view === 'per-seat-pay' && split && Object.keys(split.payments).length > 0) {
      return (
        <div className="px-4 pb-4 pt-2 border-t">
          {showCancelWarning ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">
                Cancelling will clear all payment progress
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelWarning(false)}
                >
                  Keep going
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleConfirmCancel}>
                  Confirm cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleCancelSplit}>
              Cancel split
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="px-4 pb-4 pt-2 border-t">
        {showCancelWarning ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive font-medium">
              Cancelling will clear all payment progress
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelWarning(false)}
              >
                Keep going
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleConfirmCancel}>
                Confirm cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleCancelSplit}>
            Cancel split
          </Button>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // View: mode-select
  // ---------------------------------------------------------------------------

  function renderModeSelect() {
    return (
      <div className="px-4 py-4 space-y-4">
        <h2 className="text-lg font-semibold text-center">Split Bill</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Equal Split card */}
          <Button
            variant="option-card"
            onClick={() => setView('equal-config')}
          >
            <p className="font-semibold text-sm">Equal Split</p>
            <p className="text-xs text-muted-foreground">Divide total equally among guests</p>
          </Button>

          {/* Per Seat card */}
          <Button
            variant="option-card"
            onClick={() => {
              initPerSeatSplit(tableId, defaultGuestCount)
              setView('per-seat-assign')
            }}
          >
            <p className="font-semibold text-sm">Per Seat</p>
            <p className="text-xs text-muted-foreground">Assign each item to a seat</p>
          </Button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // View: equal-config
  // ---------------------------------------------------------------------------

  function renderEqualConfig() {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('mode-select')}>← Back</Button>
          <h2 className="text-lg font-semibold">Equal Split</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="seat-count-input">
            Number of seats
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeatCountInput(Math.max(2, seatCountInput - 1))}
              disabled={seatCountInput <= 2}
            >
              −
            </Button>
            <input
              id="seat-count-input"
              type="number"
              min={2}
              max={20}
              value={seatCountInput}
              onChange={(e) => {
                const v = Math.min(20, Math.max(2, Number(e.target.value) || 2))
                setSeatCountInput(v)
              }}
              className="w-16 text-center border rounded-md px-2 py-1 text-base bg-background"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeatCountInput(Math.min(20, seatCountInput + 1))}
              disabled={seatCountInput >= 20}
            >
              +
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Each seat: ฿{Math.floor(grandTotal / seatCountInput).toLocaleString()} – ฿{Math.ceil(grandTotal / seatCountInput).toLocaleString()}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            initEqualSplit(tableId, grandTotal, seatCountInput)
            setView('equal-seats')
          }}
        >
          Confirm — {seatCountInput} seats
        </Button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // View: equal-seats
  // ---------------------------------------------------------------------------

  function renderEqualSeats() {
    if (!split) return null
    const seats = Array.from({ length: split.seatCount }, (_, i) => i)

    return (
      <div className="px-4 py-4 space-y-3">
        <h2 className="text-lg font-semibold">Equal Split — {split.seatCount} seats</h2>
        <div className="space-y-2">
          {seats.map((i) => {
            const amount = split.equalAmounts[i] ?? 0
            const payment = split.payments[i]
            const isSettled = payment !== undefined
            const isActive = activeSeatIndex === i

            return (
              <div
                key={i}
                className={`rounded-xl border p-3 space-y-2 transition-opacity ${isSettled ? 'opacity-60' : ''}`}
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Seat {i + 1}</span>
                    {isSettled && (
                      <Badge variant="settled">Settled</Badge>
                    )}
                    {isSettled && (
                      <span className="text-xs text-muted-foreground">{payment.method}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">฿{amount.toLocaleString()}</span>
                    {!isSettled && (
                      <Button
                        size="sm"
                        onClick={() => setActiveSeatIndex(isActive ? null : i)}
                      >
                        {isActive ? 'Close' : 'Pay'}
                      </Button>
                    )}
                  </div>
                </div>

                {isActive && !isSettled && (
                  <SeatPaymentPanel
                    seatIndex={i}
                    seatTotal={amount}
                    tableId={tableId}
                    onPaid={(record) => handleSeatPaid(i, record)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // View: per-seat-assign
  // ---------------------------------------------------------------------------

  function renderPerSeatAssign() {
    if (!split) return null
    const seats = Array.from({ length: split.seatCount }, (_, i) => i)

    const unassignedItems = billItems.filter(
      (item) => getUnassignedQty(item.lineId, item.quantity) > 0,
    )

    function handleItemTap(lineId: string) {
      if (assigningLineId === lineId && assigningFromSeatIndex === null) {
        setAssigningLineId(null)
      } else {
        setAssigningLineId(lineId)
        setAssigningQty(1)
        setAssigningFromSeatIndex(null)
      }
    }

    function handleAssignToSeat(seatIndex: number) {
      if (!assigningLineId) return
      // If re-assigning from a seat, remove the old assignment first
      if (assigningFromSeatIndex !== null) {
        removeAssignment(tableId, assigningLineId, assigningFromSeatIndex)
      }
      assignItem(tableId, assigningLineId, seatIndex, assigningQty)
      setAssigningLineId(null)
      setAssigningFromSeatIndex(null)
    }

    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('mode-select')}>← Back</Button>
          <h2 className="text-lg font-semibold">Assign Items</h2>
        </div>

        {/* Unassigned bucket */}
        <div className="space-y-2">
          <p className="caps">Unassigned ({unassignedItems.length})</p>
          {unassignedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">All items assigned</p>
          ) : (
            unassignedItems.map((item) => {
              const unassignedQty = getUnassignedQty(item.lineId, item.quantity)
              const isAssigning = assigningLineId === item.lineId

              return (
                <div key={item.lineId} className="space-y-2">
                  <button
                    onClick={() => handleItemTap(item.lineId)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors
                      ${isAssigning ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  >
                    <div className="flex justify-between">
                      <span>{item.menuItemName}</span>
                      <span className="text-muted-foreground">×{unassignedQty} · ฿{item.basePrice.toLocaleString()}</span>
                    </div>
                  </button>

                  {isAssigning && (
                    <div
                      className="rounded-lg border bg-muted/30 p-3 space-y-2"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      {/* Qty stepper (only if unassignedQty > 1) */}
                      {unassignedQty > 1 && (
                        <div className="flex items-center gap-3 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssigningQty(Math.max(1, assigningQty - 1))}
                            disabled={assigningQty <= 1}
                          >
                            −
                          </Button>
                          <span className="w-8 text-center font-medium">{assigningQty}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssigningQty(Math.min(unassignedQty, assigningQty + 1))}
                            disabled={assigningQty >= unassignedQty}
                          >
                            +
                          </Button>
                        </div>
                      )}

                      {/* Seat picker */}
                      <div className="flex overflow-x-auto gap-2 pb-1 snap-x">
                        {seats.map((seatIdx) => (
                          <Button
                            key={seatIdx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignToSeat(seatIdx)}
                          >
                            Seat {seatIdx + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Seat sections — assigned items */}
        {seats.map((seatIdx) => {
          const assignedToSeat = split.assignments.filter((a) => a.seatIndex === seatIdx)
          if (assignedToSeat.length === 0) return null

          return (
            <div key={seatIdx} className="space-y-1">
              <p className="caps">Seat {seatIdx + 1}</p>
              {assignedToSeat.map((a) => {
                const item = billItems.find((it) => it.lineId === a.lineId)
                if (!item) return null
                const isReassigning = assigningLineId === a.lineId && assigningFromSeatIndex === seatIdx
                return (
                  <div key={a.lineId} className="space-y-2">
                    <button
                      onClick={() => {
                        if (isReassigning) {
                          setAssigningLineId(null)
                          setAssigningFromSeatIndex(null)
                        } else {
                          setAssigningLineId(a.lineId)
                          setAssigningQty(a.assignedQty)
                          setAssigningFromSeatIndex(seatIdx)
                        }
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors
                        ${isReassigning ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    >
                      <div className="flex justify-between">
                        <span>{item.menuItemName}</span>
                        <span className="text-muted-foreground">
                          ×{a.assignedQty} · ฿{(a.assignedQty * item.basePrice).toLocaleString()}
                        </span>
                      </div>
                    </button>

                    {isReassigning && (
                      <div
                        className="rounded-lg border bg-muted/30 p-3 space-y-2"
                        style={{ boxShadow: 'var(--shadow-card)' }}
                      >
                        <p className="text-xs text-muted-foreground text-center">Move to seat or unassign</p>
                        <div className="flex overflow-x-auto gap-2 pb-1 snap-x">
                          {seats.filter((s) => s !== seatIdx).map((s) => (
                            <Button
                              key={s}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignToSeat(s)}
                            >
                              Seat {s + 1}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/40 hover:bg-destructive/10"
                            onClick={() => {
                              removeAssignment(tableId, a.lineId, seatIdx)
                              setAssigningLineId(null)
                              setAssigningFromSeatIndex(null)
                            }}
                          >
                            Unassign
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Continue to Pay */}
        <Button
          className="w-full"
          disabled={!allItemsAssigned()}
          onClick={() => setView('per-seat-pay')}
        >
          Continue to Pay
        </Button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // View: per-seat-pay
  // ---------------------------------------------------------------------------

  function renderPerSeatPay() {
    if (!split) return null
    const seats = Array.from({ length: split.seatCount }, (_, i) => i)

    return (
      <div className="px-4 py-4 space-y-3">
        <h2 className="text-lg font-semibold">Pay by Seat</h2>
        <div className="space-y-2">
          {seats.map((i) => {
            const payment = split.payments[i]
            const isSettled = payment !== undefined
            const isActive = activeSeatIndex === i
            const seatTotal = computeSeatTotal(i)

            // Mini-receipt breakdown
            const seatSubtotal = split.assignments
              .filter((a) => a.seatIndex === i)
              .reduce((sum, a) => {
                const item = billItems.find((it) => it.lineId === a.lineId)
                return sum + (item ? a.assignedQty * item.basePrice : 0)
              }, 0)
            const seatVat = Math.round(seatSubtotal * 0.07)

            return (
              <div
                key={i}
                className={`rounded-xl border p-3 space-y-2 transition-opacity ${isSettled ? 'opacity-60' : ''}`}
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Seat {i + 1}</span>
                    {isSettled && (
                      <Badge variant="settled">Settled</Badge>
                    )}
                    {isSettled && (
                      <span className="text-xs text-muted-foreground">{payment.method}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">฿{seatTotal.toLocaleString()}</span>
                    {!isSettled && (
                      <Button
                        size="sm"
                        onClick={() => setActiveSeatIndex(isActive ? null : i)}
                      >
                        {isActive ? 'Close' : 'Pay'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mini-receipt */}
                {!isSettled && !isActive && (
                  <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>฿{seatSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT 7%</span>
                      <span>฿{seatVat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-foreground">
                      <span>Total</span>
                      <span>฿{seatTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {isActive && !isSettled && (
                  <SeatPaymentPanel
                    seatIndex={i}
                    seatTotal={seatTotal}
                    tableId={tableId}
                    onPaid={(record) => handleSeatPaid(i, record)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div
        style={{ boxShadow: 'var(--shadow-floating)' }}
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
          transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {open && (
          <>
            {view === 'mode-select' && renderModeSelect()}
            {view === 'equal-config' && renderEqualConfig()}
            {view === 'equal-seats' && renderEqualSeats()}
            {view === 'per-seat-assign' && renderPerSeatAssign()}
            {view === 'per-seat-pay' && renderPerSeatPay()}

            {renderCancelSection()}

            {/* Revert to Single Bill (MERGE-02) */}
            <div className="border-t mx-4" />
            <div className="px-4 pb-6 pt-3">
              {!showRevertConfirm ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    disabled={paidCount > 0}
                    onClick={() => setShowRevertConfirm(true)}
                  >
                    Revert to Single Bill
                  </Button>
                  {paidCount > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Cannot revert — {paidCount} seat(s) already paid
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-center text-foreground">
                    Revert to single bill? This will remove all seat assignments.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRevertConfirm(false)}
                    >
                      Keep Split
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        cancelSplit(tableId)
                        toast('Reverted to single bill')
                        setShowRevertConfirm(false)
                        onClose()
                      }}
                    >
                      Revert
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
