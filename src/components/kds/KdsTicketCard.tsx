'use client'

import { KdsTicket, useKdsStore } from '@/stores/kds.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { useKdsTimer } from '@/components/kds/useKdsTimer'
import { KdsItemRow } from '@/components/kds/KdsItemRow'
import { OrderLineItem } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useQueueStore } from '@/stores/queue.store'
import { HandPlatter, Check, User } from 'lucide-react'

interface KdsTicketCardProps {
  ticket: KdsTicket
  orderItems: OrderLineItem[]
}

export function KdsTicketCard({ ticket, orderItems }: KdsTicketCardProps) {
  const { completeTicket, checkItem, uncheckItem } = useKdsStore()
  const role = useSessionStore((s) => s.role)!
  const { display, elapsedSeconds } = useKdsTimer(ticket.addedAt)

  const nonVoidedItems = orderItems.filter((item) => item.status !== 'voided')
  const checkedCount = nonVoidedItems.filter((item) => ticket.checkedItems.has(item.lineId)).length
  const allNonVoidedChecked = nonVoidedItems.length > 0 && checkedCount === nonVoidedItems.length

  // Bump is blocked until all items checked or role doesn't have permission
  const bumpBlocked = !allNonVoidedChecked || !canDoAction(role, 'kds-bump')

  // Checkboxes are interactive when New or InProgress
  const checkboxesActive = ticket.stage === 'New' || ticket.stage === 'InProgress'

  // Timer badge color: red when urgent (≥900s), amber when medium (600–899s), red otherwise
  const timerBgClass =
    elapsedSeconds >= 900
      ? 'bg-primary text-primary-foreground'
      : elapsedSeconds >= 600
        ? 'bg-status-check-requested-bg text-status-check-requested'
        : 'bg-primary text-primary-foreground'

  function handleComplete() {
    if (bumpBlocked) return

    // Complete ticket and remove from board in one action
    completeTicket(ticket.ticketId)
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Served' })

    // Cross-store write-back for delivery/takeaway tickets
    if (ticket.orderType === 'delivery' || ticket.orderType === 'takeaway') {
      useQueueStore.getState().advanceStatus(ticket.tableId)
    }

    const queueOrder = useQueueStore.getState().orders[ticket.tableId]
    if (queueOrder) {
      useQueueStore.getState().advanceStatus(ticket.tableId)
    }
  }

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shrink-0 w-[290px] min-w-[260px] max-w-sm"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* ── CardHeader ── */}
      <div className="p-6 pb-0 flex flex-col gap-0">

        {/* Order Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="bg-secondary flex items-center justify-center p-2 rounded-md shrink-0"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <HandPlatter size={16} className="text-secondary-foreground" />
            </div>
            <span className="font-semibold text-base text-card-foreground">{ticket.tableLabel}</span>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${timerBgClass}`}
          >
            {display}
          </span>
        </div>

        {/* Order items */}
        <div className="flex flex-col gap-3 mt-3">
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
            <p className="text-xs text-muted-foreground/40 py-1">ไม่มีรายการ</p>
          )}
        </div>

        {/* Sender row */}
        {ticket.senderName && (
          <div className="flex items-center gap-1 mt-3 pb-0">
            <User size={16} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{ticket.senderName}</span>
          </div>
        )}
      </div>

      {/* ── CardFooter ── */}
      <div className="border-t border-border px-6 py-4 mt-6 flex items-center gap-2">
        <button
          onClick={handleComplete}
          disabled={bumpBlocked}
          className={`flex flex-1 h-14 items-center justify-center gap-2 rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground transition-opacity ${
            bumpBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 active:scale-[0.98]'
          }`}
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <Check size={16} />
          <span>ออร์เดอร์เสร็จ</span>
          <span className="bg-secondary text-secondary-foreground text-xs font-semibold h-4 min-w-5 px-1 flex items-center justify-center rounded-full">
            {checkedCount}/{nonVoidedItems.length}
          </span>
        </button>
      </div>
    </div>
  )
}
