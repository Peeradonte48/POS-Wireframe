'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBillStore } from '@/stores/bill.store'
import { SeatPaymentPanel } from '@/components/payment/SeatPaymentPanel'
import { useTableStore } from '@/stores/table.store'
import type { SeatPaymentRecord } from '@/stores/bill.store'
import type { OrderLineItem } from '@/stores/order.store'

export interface PerSeatSplitPanelProps {
  tableId: string
  items: OrderLineItem[]
  onAllPaid: () => void
  onCancel: () => void
}

export function PerSeatSplitPanel({ tableId, items, onAllPaid, onCancel }: PerSeatSplitPanelProps) {
  const [view, setView] = useState<'assign' | 'pay'>('assign')
  const [activeSeatIndex, setActiveSeatIndex] = useState<number | null>(null)
  const [assigningLineId, setAssigningLineId] = useState<string | null>(null)
  const [assigningQty, setAssigningQty] = useState(1)
  const [assigningFromSeat, setAssigningFromSeat] = useState<number | null>(null)
  const [showCancelWarning, setShowCancelWarning] = useState(false)

  const { assignItem, removeAssignment, recordPayment, cancelSplit, getSplit } = useBillStore()
  const splitRaw = getSplit(tableId)
  const paidCount = splitRaw ? Object.keys(splitRaw.payments).length : 0
  if (!splitRaw) return null
  const split = splitRaw

  const seats = Array.from({ length: split.seatCount }, (_, i) => i)
  const getUnassigned = (lineId: string, totalQty: number) =>
    totalQty - split.assignments.filter((a) => a.lineId === lineId).reduce((s, a) => s + a.assignedQty, 0)
  const allAssigned = items.every((item) => getUnassigned(item.lineId, item.quantity) === 0)

  function doAssign(seatIndex: number) {
    if (!assigningLineId) return
    if (assigningFromSeat !== null) removeAssignment(tableId, assigningLineId, assigningFromSeat)
    assignItem(tableId, assigningLineId, seatIndex, assigningQty)
    setAssigningLineId(null); setAssigningFromSeat(null)
  }

  function handleSeatPaid(i: number, record: SeatPaymentRecord) {
    recordPayment(tableId, i, record); setActiveSeatIndex(null)
    const s = useBillStore.getState().getSplit(tableId)
    if (!s) return
    const active = Array.from({ length: s.seatCount }, (_, j) => j).filter((j) => s.assignments.some((a) => a.seatIndex === j))
    if (active.every((j) => s.payments[j] !== undefined)) {
      useTableStore.getState().markCleaning(tableId); cancelSplit(tableId); onAllPaid()
    }
  }

  function computeSeatTotal(seatIndex: number) {
    const sub = split.assignments.filter((a) => a.seatIndex === seatIndex)
      .reduce((s, a) => { const it = items.find((x) => x.lineId === a.lineId); return s + (it ? a.assignedQty * it.basePrice : 0) }, 0)
    return sub + Math.round(sub * 0.07)
  }

  const CancelSection = () => (
    <div className="border-t pt-2">
      {paidCount > 0 && showCancelWarning ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive font-medium">Cancelling will clear all payment progress</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelWarning(false)}>Keep going</Button>
            <Button variant="destructive" className="flex-1" onClick={() => { cancelSplit(tableId); setShowCancelWarning(false); onCancel() }}>Confirm cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="w-full text-muted-foreground"
          onClick={() => paidCount > 0 ? setShowCancelWarning(true) : (cancelSplit(tableId), onCancel())}>
          Cancel split
        </Button>
      )}
    </div>
  )

  if (view === 'assign') {
    const unassigned = items.filter((item) => getUnassigned(item.lineId, item.quantity) > 0)
    return (
      <div className="px-4 py-4 space-y-4">
        <h2 className="text-lg font-semibold">Assign Items</h2>
        <div className="space-y-2">
          <p className="caps">Unassigned ({unassigned.length})</p>
          {unassigned.length === 0 ? <p className="text-sm text-muted-foreground py-2">All items assigned</p> : unassigned.map((item) => {
            const uQty = getUnassigned(item.lineId, item.quantity)
            const active = assigningLineId === item.lineId && assigningFromSeat === null
            return (
              <div key={item.lineId} className="space-y-2">
                <button onClick={() => active ? setAssigningLineId(null) : (setAssigningLineId(item.lineId), setAssigningQty(1), setAssigningFromSeat(null))}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                  <div className="flex justify-between"><span>{item.menuItemName}</span><span className="text-muted-foreground">×{uQty} · ฿{item.basePrice.toLocaleString()}</span></div>
                </button>
                {active && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2" style={{ boxShadow: 'var(--shadow-card)' }}>
                    {uQty > 1 && <div className="flex items-center gap-3 justify-center">
                      <Button variant="outline" size="sm" onClick={() => setAssigningQty(Math.max(1, assigningQty - 1))} disabled={assigningQty <= 1}>−</Button>
                      <span className="w-8 text-center font-medium">{assigningQty}</span>
                      <Button variant="outline" size="sm" onClick={() => setAssigningQty(Math.min(uQty, assigningQty + 1))} disabled={assigningQty >= uQty}>+</Button>
                    </div>}
                    <div className="flex overflow-x-auto gap-2 pb-1 snap-x">
                      {seats.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => doAssign(s)}>Seat {s + 1}</Button>)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {seats.map((seatIdx) => {
          const assigned = split.assignments.filter((a) => a.seatIndex === seatIdx)
          if (!assigned.length) return null
          return (
            <div key={seatIdx} className="space-y-1">
              <p className="caps">Seat {seatIdx + 1}</p>
              {assigned.map((a) => {
                const item = items.find((it) => it.lineId === a.lineId)
                if (!item) return null
                const isRe = assigningLineId === a.lineId && assigningFromSeat === seatIdx
                return (
                  <div key={a.lineId} className="space-y-2">
                    <button onClick={() => isRe ? (setAssigningLineId(null), setAssigningFromSeat(null)) : (setAssigningLineId(a.lineId), setAssigningQty(a.assignedQty), setAssigningFromSeat(seatIdx))}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${isRe ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                      <div className="flex justify-between"><span>{item.menuItemName}</span><span className="text-muted-foreground">×{a.assignedQty} · ฿{(a.assignedQty * item.basePrice).toLocaleString()}</span></div>
                    </button>
                    {isRe && (
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2" style={{ boxShadow: 'var(--shadow-card)' }}>
                        <p className="text-xs text-muted-foreground text-center">Move to seat or unassign</p>
                        <div className="flex overflow-x-auto gap-2 pb-1 snap-x">
                          {seats.filter((s) => s !== seatIdx).map((s) => <Button key={s} variant="outline" size="sm" onClick={() => doAssign(s)}>Seat {s + 1}</Button>)}
                          <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10"
                            onClick={() => { removeAssignment(tableId, a.lineId, seatIdx); setAssigningLineId(null); setAssigningFromSeat(null) }}>
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
        <Button className="w-full" disabled={!allAssigned} onClick={() => setView('pay')}>Continue to Pay</Button>
        <CancelSection />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <h2 className="text-lg font-semibold">Pay by Seat</h2>
      <div className="space-y-2">
        {seats.map((i) => {
          const payment = split.payments[i]; const isSettled = payment !== undefined
          const isActive = activeSeatIndex === i; const seatTotal = computeSeatTotal(i)
          if (seatTotal === 0) return null
          const sub = split.assignments.filter((a) => a.seatIndex === i)
            .reduce((s, a) => { const it = items.find((x) => x.lineId === a.lineId); return s + (it ? a.assignedQty * it.basePrice : 0) }, 0)
          return (
            <div key={i} className={`rounded-xl border p-3 space-y-2 transition-opacity ${isSettled ? 'opacity-60' : ''}`} style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Seat {i + 1}</span>
                  {isSettled && <><Badge variant="settled">Settled</Badge><span className="text-xs text-muted-foreground">{payment.method}</span></>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">฿{seatTotal.toLocaleString()}</span>
                  {!isSettled && <Button size="sm" onClick={() => setActiveSeatIndex(isActive ? null : i)}>{isActive ? 'Close' : 'Pay'}</Button>}
                </div>
              </div>
              {!isSettled && !isActive && (
                <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>฿{sub.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>VAT 7%</span><span>฿{Math.round(sub * 0.07).toLocaleString()}</span></div>
                  <div className="flex justify-between font-medium text-foreground"><span>Total</span><span>฿{seatTotal.toLocaleString()}</span></div>
                </div>
              )}
              {isActive && !isSettled && <SeatPaymentPanel seatIndex={i} seatTotal={seatTotal} tableId={tableId} onPaid={(r) => handleSeatPaid(i, r)} />}
            </div>
          )
        })}
      </div>
      <CancelSection />
    </div>
  )
}
