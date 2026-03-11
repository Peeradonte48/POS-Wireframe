'use client'

import { KdsTicket } from '@/stores/kds.store'
import { useKdsStore } from '@/stores/kds.store'
import { useKdsTimer } from '@/components/kds/useKdsTimer'
import { KdsItemRow } from '@/components/kds/KdsItemRow'
import { OrderLineItem } from '@/stores/order.store'

interface KdsTicketCardProps {
  ticket: KdsTicket
  orderItems: OrderLineItem[]
}

export function KdsTicketCard({ ticket, orderItems }: KdsTicketCardProps) {
  const { bumpTicket, checkItem, uncheckItem } = useKdsStore()
  const { display, elapsedSeconds } = useKdsTimer(ticket.addedAt)

  const timerColorClass =
    elapsedSeconds >= 900
      ? 'text-red-500'
      : elapsedSeconds >= 600
        ? 'text-amber-500'
        : 'text-green-500'

  // Checkboxes are only interactive when the ticket is In Progress
  const checkboxesActive = ticket.stage === 'InProgress'

  // Check if all non-voided items are checked
  const nonVoidedItems = orderItems.filter((item) => item.status !== 'voided')
  const allNonVoidedChecked =
    nonVoidedItems.length > 0 &&
    nonVoidedItems.every((item) => ticket.checkedItems.has(item.lineId))

  // BUMP is blocked while InProgress until all non-voided items are checked
  const bumpBlocked = ticket.stage === 'InProgress' && !allNonVoidedChecked

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 bg-muted/30 flex justify-between items-center border-b border-border/40">
        <span className="font-bold text-base">{ticket.tableLabel}</span>
        <span className={`font-mono text-sm tabular-nums ${timerColorClass}`}>{display}</span>
      </div>

      {/* Body — item rows */}
      <div className="px-3 py-1 flex-1">
        {orderItems.map((item) => (
          <KdsItemRow
            key={item.lineId}
            item={item}
            isChecked={ticket.checkedItems.has(item.lineId)}
            interactive={checkboxesActive}
            onCheck={() => checkItem(ticket.ticketId, item.lineId)}
            onUncheck={() => uncheckItem(ticket.ticketId, item.lineId)}
          />
        ))}
        {orderItems.length === 0 && (
          <p className="text-xs text-muted-foreground/40 py-2">No items</p>
        )}
      </div>

      {/* Footer — BUMP button */}
      <div className="px-3 py-2 border-t border-border/40">
        <button
          onClick={() => !bumpBlocked && bumpTicket(ticket.ticketId)}
          disabled={bumpBlocked}
          className={`w-full font-bold text-sm py-2 rounded text-white transition-all ${
            bumpBlocked
              ? 'bg-muted-foreground/30 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 active:scale-95 ring-2 ring-green-400'
          }`}
        >
          {bumpBlocked ? `Check all items (${ticket.checkedItems.size}/${nonVoidedItems.length})` : 'BUMP'}
        </button>
      </div>
    </div>
  )
}
