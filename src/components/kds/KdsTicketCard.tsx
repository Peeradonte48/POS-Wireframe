'use client'

import { KdsTicket, useKdsStore } from '@/stores/kds.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { useKdsTimer } from '@/components/kds/useKdsTimer'
import { KdsItemRow } from '@/components/kds/KdsItemRow'
import { OrderLineItem } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useQueueStore } from '@/stores/queue.store'
import { HandPlatter, Check, User, ArrowRight } from 'lucide-react'

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

  // Timer badge color: red when urgent (≥900s), amber when medium (600–899s), green otherwise
  const timerBgClass =
    elapsedSeconds >= 900
      ? 'bg-primary text-primary-foreground'
      : elapsedSeconds >= 600
        ? 'bg-status-check-requested-bg text-status-check-requested'
        : 'bg-primary text-primary-foreground'

  function handleBump() {
    if (bumpBlocked) return
    const prevStage = ticket.stage
    useKdsStore.getState().bumpTicket(ticket.ticketId)

    // Cross-store write-back for delivery/takeaway tickets
    if (ticket.orderType === 'delivery' || ticket.orderType === 'takeaway') {
      if (prevStage === 'New' || prevStage === 'InProgress') {
        useQueueStore.getState().advanceStatus(ticket.tableId)
      }
    }

    // Table orderStage write-back for dine-in tickets
    if (prevStage === 'New') {
      useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Cooking' })
    } else if (prevStage === 'InProgress') {
      useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Ready' })
    }
  }

  function handleComplete() {
    if (bumpBlocked) return
    completeTicket(ticket.ticketId)
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Served' })
    const queueOrder = useQueueStore.getState().orders[ticket.tableId]
    if (queueOrder) {
      useQueueStore.getState().advanceStatus(ticket.tableId)
    }
  }


  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shrink-0 w-[290px]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* ── CardHeader ── */}
      <div className="p-6 pb-0 flex flex-col gap-3">

        {/* Order Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              className="bg-secondary flex items-center justify-center p-2 rounded-md shrink-0"
              style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
            >
              <HandPlatter size={16} className="text-secondary-foreground" />
            </button>
            <span className="font-semibold text-base text-card-foreground">{ticket.tableLabel}</span>
          </div>
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-md ${timerBgClass}`}
          >
            {display}
          </span>
        </div>

        {/* Order items */}
        <div className="flex flex-col gap-2">
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
          <div className="flex items-center gap-1 pb-0">
            <User size={16} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{ticket.senderName}</span>
          </div>
        )}
      </div>

      {/* ── CardFooter ── */}
      <div className="border-t border-border px-6 py-4 flex items-center gap-2">
        {/* BUMP button — visible for New and InProgress stages */}
        {(ticket.stage === 'New' || ticket.stage === 'InProgress') && (
          <button
            onClick={handleBump}
            disabled={bumpBlocked}
            className={`flex flex-1 h-10 items-center justify-center gap-2 rounded-md border border-border bg-secondary px-8 py-2 text-sm font-medium text-secondary-foreground transition-opacity ${
              bumpBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/80 active:scale-[0.98]'
            }`}
            style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
          >
            <span>BUMP</span>
            <ArrowRight size={16} />
            {/* Progress badge */}
            <span className="bg-card text-card-foreground text-xs font-semibold h-4 min-w-5 px-1 flex items-center justify-center rounded-full">
              {checkedCount}/{nonVoidedItems.length}
            </span>
          </button>
        )}

        {/* Done button — visible only for Ready stage */}
        {ticket.stage === 'Ready' && (
          <button
            onClick={handleComplete}
            disabled={bumpBlocked}
            className={`flex flex-1 h-10 items-center justify-center gap-2 rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground transition-opacity ${
              bumpBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 active:scale-[0.98]'
            }`}
            style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
          >
            <Check size={16} />
            <span>ออร์เดอร์เสร็จ</span>
            {/* Progress badge */}
            <span className="bg-secondary text-secondary-foreground text-xs font-semibold h-4 min-w-5 px-1 flex items-center justify-center rounded-full">
              {checkedCount}/{nonVoidedItems.length}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
