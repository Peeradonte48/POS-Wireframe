'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { Inbox } from 'lucide-react'
import { useOrderStore } from '@/stores/order.store'
import { useKdsStore, KdsTicket } from '@/stores/kds.store'
import { useTableStore } from '@/stores/table.store'
import { useQueueStore } from '@/stores/queue.store'
import { KdsTicketCard } from '@/components/kds/KdsTicketCard'
import { KdsSummaryPanel } from '@/components/kds/KdsSummaryPanel'
import { KdsTableBar } from '@/components/kds/KdsTableBar'
import { OrderLineItem } from '@/stores/order.store'
import { getDemoOrderItems } from '@/lib/mock-data/kds-demo'
import { useSessionStore } from '@/stores/session.store'

export function KdsBoard() {
  const allOrders = useOrderStore((s) => s.orders)
  const { tickets, addTicket, completedTableIds } = useKdsStore()
  const sessionStaffName = useSessionStore((s) => s.staffName)
  const tables = useTableStore((s) => s.tables)

  // Auto-register tickets for tables with sent rounds
  useEffect(() => {
    const tablesWithSentOrders = Object.values(allOrders).filter((order) =>
      order.rounds.some((r) => r.sentAt !== null),
    )
    tablesWithSentOrders.forEach((order) => {
      if (completedTableIds.has(order.tableId)) return
      const alreadyRegistered = Object.values(tickets).some(
        (t) => t.tableId === order.tableId,
      )
      if (!alreadyRegistered) {
        if (useQueueStore.getState().orders[order.tableId]) return
        const tableRecord = tables[order.tableId]
        const tableLabel = tableRecord?.label ?? order.tableId
        addTicket(order.tableId, tableLabel, undefined, undefined, 'hot', sessionStaffName ?? undefined)
      }
    })
  }, [allOrders, tickets, tables, addTicket, completedTableIds, sessionStaffName])

  const getOrderItems = useCallback((ticket: KdsTicket): OrderLineItem[] => {
    const order = allOrders[ticket.tableId]
    if (order) {
      return order.rounds
        .filter((r) => r.sentAt !== null)
        .flatMap((r) => r.items.filter((item) => item.status !== 'unsent'))
    }
    return getDemoOrderItems(ticket)
  }, [allOrders])

  const visibleTickets = useMemo(() => {
    return Object.values(tickets)
      .filter((t) => {
        const items = getOrderItems(t)
        // Show ticket if it has any non-voided items that aren't sent (active OR cancelled)
        return items.some((item) => item.status !== 'voided' && !(t.sentLineIds ?? new Set<string>()).has(item.lineId))
      })
      .sort((a, b) => a.addedAt - b.addedAt)
  }, [tickets, getOrderItems])

  const hasTickets = visibleTickets.length > 0

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      {/* Main content area: tickets + summary sidebar */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Left: Ticket cards area */}
        <div className="flex-1 min-w-0 bg-muted border border-border rounded-md overflow-hidden">
          {hasTickets ? (
            <div className="h-full overflow-x-auto p-3">
              <div className="flex flex-nowrap gap-2.5 items-stretch h-full">
                {visibleTickets.flatMap((ticket) => {
                  const nonVoided = getOrderItems(ticket).filter((i) => i.status !== 'voided')
                  const cancelledIds = ticket.cancelledLineIds ?? new Set<string>()
                  const sentIds = ticket.sentLineIds ?? new Set<string>()
                  const active = nonVoided.filter((i) => !sentIds.has(i.lineId) && !cancelledIds.has(i.lineId))
                  const cancelled = nonVoided.filter((i) => !sentIds.has(i.lineId) && cancelledIds.has(i.lineId))
                  const activeCount = nonVoided.filter((i) => !cancelledIds.has(i.lineId)).length
                  return [
                    ...active.map((item) => (
                      <KdsTicketCard
                        key={`${ticket.ticketId}-${item.lineId}`}
                        ticket={ticket}
                        item={item}
                        totalNonVoidedCount={activeCount}
                      />
                    )),
                    ...cancelled.map((item) => (
                      <KdsTicketCard
                        key={`${ticket.ticketId}-${item.lineId}`}
                        ticket={ticket}
                        item={item}
                        totalNonVoidedCount={activeCount}
                      />
                    )),
                  ]
                })}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-6 h-full p-6">
              <div
                className="bg-card border border-border flex items-center justify-center p-2 rounded-md size-12"
                style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
              >
                <Inbox size={24} className="text-foreground" />
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xl font-semibold text-foreground">
                  ยังไม่มีออร์เดอร์
                </p>
                <p className="text-sm text-muted-foreground">
                  ออร์เดอร์ใหม่จะปรากฏที่นี่โดยอัตโนมัติ
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary sidebar */}
        <KdsSummaryPanel tickets={visibleTickets} getOrderItems={getOrderItems} />
      </div>

      {/* Bottom: Table bar */}
      <KdsTableBar tickets={visibleTickets} getOrderItems={getOrderItems} />
    </div>
  )
}
