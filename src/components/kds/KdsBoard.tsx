'use client'

import { useEffect, useState, useMemo } from 'react'
import { CheckCheck } from 'lucide-react'
import { useOrderStore } from '@/stores/order.store'
import { useKdsStore, KdsTicket } from '@/stores/kds.store'
import { useTableStore } from '@/stores/table.store'
import { useQueueStore } from '@/stores/queue.store'
import { KdsTicketCard } from '@/components/kds/KdsTicketCard'
import { OrderLineItem } from '@/stores/order.store'
import { getDemoOrderItems } from '@/lib/mock-data/kds-demo'
import { CookingPot, GlassWater } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/session.store'

// Station tab definitions
// In demo/wireframe: all tickets are Hot Kitchen; Bar tab is empty
const STATIONS = [
  { key: 'hot',  label: 'ครัวร้อน', icon: CookingPot },
  { key: 'bar',  label: 'บาร์น้ำ',  icon: GlassWater },
] as const

type Station = typeof STATIONS[number]['key']

export function KdsBoard() {
  const allOrders = useOrderStore((s) => s.orders)
  const { tickets, addTicket, completedTableIds } = useKdsStore()
  const sessionStaffName = useSessionStore((s) => s.staffName)
  const tables = useTableStore((s) => s.tables)

  const [activeStation, setActiveStation] = useState<Station>('hot')

  // Ticket counts per station
  const stationCounts = useMemo(() => {
    const active = Object.values(tickets).filter((t) => {
      const items = getOrderItems(t)
      return items.some((item) => item.status !== 'voided')
    })
    return {
      hot: active.filter((t) => t.station !== 'bar').length,
      bar: active.filter((t) => t.station === 'bar').length,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, allOrders])

  // Auto-register tickets for tables with sent rounds
  useEffect(() => {
    const tablesWithSentOrders = Object.values(allOrders).filter((order) =>
      order.rounds.some((r) => r.sentAt !== null),
    )
    tablesWithSentOrders.forEach((order) => {
      // Skip tables already completed on KDS
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

  function getOrderItems(ticket: KdsTicket): OrderLineItem[] {
    const order = allOrders[ticket.tableId]
    if (order) {
      return order.rounds
        .filter((r) => r.sentAt !== null)
        .flatMap((r) => r.items.filter((item) => item.status !== 'unsent'))
    }
    return getDemoOrderItems(ticket)
  }

  const visibleTickets = useMemo(() => {
    return Object.values(tickets).filter((t) => {
      if (t.station !== activeStation) return false
      const items = getOrderItems(t)
      return items.some((item) => item.status !== 'voided')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, allOrders, activeStation])

  return (
    <>
      {/* ── Station tabs ── */}
      <div className="bg-muted h-9 rounded-lg p-[3px] flex shrink-0">
        {STATIONS.map(({ key, label, icon: Icon }) => {
          const isActive = activeStation === key
          const count = stationCounts[key]
          return (
            <button
              key={key}
              onClick={() => setActiveStation(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-background border border-border text-foreground'
                  : 'text-foreground hover:text-foreground/80',
              )}
              style={isActive ? { boxShadow: 'var(--shadow-card)' } : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
              {count > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-semibold leading-none h-5 min-w-5 flex items-center justify-center px-1 rounded-full">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Ticket grid ── */}
      <div className="flex-1 min-h-0 bg-muted border border-border rounded-none overflow-hidden">
        <div className="h-full overflow-y-auto p-3">
          {visibleTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
              <CheckCheck size={32} className="text-muted-foreground/50" />
              <p className="text-base font-bold text-foreground">ครัวพร้อม</p>
              <p className="text-sm text-muted-foreground">ออร์เดอร์ใหม่จะปรากฏที่นี่โดยอัตโนมัติ</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start">
              {visibleTickets.map((ticket) => (
                <KdsTicketCard
                  key={ticket.ticketId}
                  ticket={ticket}
                  orderItems={getOrderItems(ticket)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
