'use client'

import { Badge } from '@/components/ui/badge'
import { KdsTicket } from '@/stores/kds.store'
import { useKdsStore } from '@/stores/kds.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { useKdsTimer } from '@/components/kds/useKdsTimer'
import { KdsItemRow } from '@/components/kds/KdsItemRow'
import { OrderLineItem } from '@/stores/order.store'

const KDS_STAGE_CONFIG = {
  New:        { bgClass: 'bg-status-open-bg',            textClass: 'text-status-open' },
  InProgress: { bgClass: 'bg-status-check-requested-bg', textClass: 'text-status-check-requested' },
  Ready:      { bgClass: 'bg-status-reserved-bg',        textClass: 'text-status-reserved' },
} as const

interface KdsTicketCardProps {
  ticket: KdsTicket
  orderItems: OrderLineItem[]
}

export function KdsTicketCard({ ticket, orderItems }: KdsTicketCardProps) {
  const { bumpTicket, checkItem, uncheckItem } = useKdsStore()
  const role = useSessionStore((s) => s.role)!
  const { display, elapsedSeconds } = useKdsTimer(ticket.addedAt)

  const timerColorClass =
    elapsedSeconds >= 900
      ? 'text-status-occupied'
      : elapsedSeconds >= 600
        ? 'text-status-check-requested'
        : 'text-status-open'

  // Checkboxes are only interactive when the ticket is In Progress
  const checkboxesActive = ticket.stage === 'InProgress'

  // Check if all non-voided items are checked
  const nonVoidedItems = orderItems.filter((item) => item.status !== 'voided')
  const allNonVoidedChecked =
    nonVoidedItems.length > 0 &&
    nonVoidedItems.every((item) => ticket.checkedItems.has(item.lineId))

  // BUMP is blocked while InProgress until all non-voided items are checked, or by role
  const bumpBlocked = (ticket.stage === 'InProgress' && !allNonVoidedChecked) || !canDoAction(role, 'kds-bump')

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shrink-0">
      {/* Header */}
      <div className="px-3 py-2 bg-muted/30 flex justify-between items-center border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">{ticket.tableLabel}</span>
          <Badge className={`${KDS_STAGE_CONFIG[ticket.stage].bgClass} ${KDS_STAGE_CONFIG[ticket.stage].textClass} border-0 text-xs`}>
            {ticket.stage === 'InProgress' ? 'In Progress' : ticket.stage}
          </Badge>
        </div>
        <span className={`font-mono text-sm tabular-nums ${timerColorClass}`}>{display}</span>
      </div>

      {/* Body — item rows */}
      <div className="px-3 py-1">
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
              : 'bg-status-open hover:bg-status-open/80 active:scale-95 ring-2 ring-status-open/60'
          }`}
        >
          {bumpBlocked ? `Check all items (${ticket.checkedItems.size}/${nonVoidedItems.length})` : 'BUMP'}
        </button>
      </div>
    </div>
  )
}
