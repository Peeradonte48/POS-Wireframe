'use client'

import { useOrderStore } from '@/stores/order.store'
import { useKdsStore, KdsStage } from '@/stores/kds.store'
import { useTableStore } from '@/stores/table.store'
import { KdsTicketCard } from '@/components/kds/KdsTicketCard'
import { OrderLineItem } from '@/stores/order.store'

const STAGES: { stage: KdsStage; label: string }[] = [
  { stage: 'New', label: 'New' },
  { stage: 'InProgress', label: 'In Progress' },
  { stage: 'Ready', label: 'Ready' },
]

export function KdsBoard() {
  const allOrders = useOrderStore((s) => s.orders)
  const { tickets, addTicket } = useKdsStore()
  const tables = useTableStore((s) => s.tables)

  // Auto-register tickets for tables that have sent rounds but no KDS ticket yet
  const tablesWithSentOrders = Object.values(allOrders).filter((order) =>
    order.rounds.some((r) => r.sentAt !== null),
  )

  tablesWithSentOrders.forEach((order) => {
    const alreadyRegistered = Object.values(tickets).some(
      (t) => t.tableId === order.tableId,
    )
    if (!alreadyRegistered) {
      const tableRecord = tables[order.tableId]
      const tableLabel = tableRecord?.label ?? order.tableId
      addTicket(order.tableId, tableLabel)
    }
  })

  // Helper: get sent+voided items for a tableId (flatten all sent rounds, exclude unsent)
  function getOrderItems(tableId: string): OrderLineItem[] {
    const order = allOrders[tableId]
    if (!order) return []
    return order.rounds
      .filter((r) => r.sentAt !== null)
      .flatMap((r) => r.items.filter((item) => item.status !== 'unsent'))
  }

  return (
    <div className="flex flex-1 gap-2 p-3 overflow-hidden">
      {STAGES.map(({ stage, label }) => {
        const stageTickets = Object.values(tickets).filter((t) => t.stage === stage)

        return (
          <div key={stage} className="flex flex-col flex-1 min-w-0">
            {/* Column header */}
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              {label}
            </div>

            {/* Ticket list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2">
              {stageTickets.length === 0 ? (
                <div className="text-xs text-muted-foreground/40 text-center mt-4">
                  No tickets
                </div>
              ) : (
                stageTickets.map((ticket) => (
                  <KdsTicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    orderItems={getOrderItems(ticket.tableId)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
