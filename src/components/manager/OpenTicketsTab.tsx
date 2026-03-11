'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTableStore } from '@/stores/table.store'
import { useOrderStore } from '@/stores/order.store'
import { Badge } from '@/components/ui/badge'
import { MOCK_STAFF } from '@/lib/mock-data/staff'

// Helper: format elapsed time from openedAt timestamp
function formatElapsed(openedAt: number): string {
  const minutes = Math.floor((Date.now() - openedAt) / 60000)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function OpenTicketsTab() {
  const router = useRouter()
  const tables = useTableStore((s) => s.tables)
  const getOrder = useOrderStore((s) => s.getOrder)

  const occupiedTables = useMemo(
    () => Object.values(tables).filter((t) => t.status === 'Occupied'),
    [tables],
  )

  // Build staff list with assigned table labels (matched via waiterName)
  const staffWithTables = useMemo(() => {
    return MOCK_STAFF.map((staff) => {
      const assignedTableIds = Object.values(tables)
        .filter((t) => t.waiterName === staff.name && t.status === 'Occupied')
        .map((t) => t.label)
      return { ...staff, assignedTableIds }
    })
  }, [tables])

  return (
    <div className="divide-y">
      {/* Open Tickets Section */}
      <div>
        <div className="px-4 py-2 bg-muted/40 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Open Tickets
          </p>
          <span className="text-xs text-muted-foreground">{occupiedTables.length} tables</span>
        </div>

        {occupiedTables.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No open tickets
          </div>
        ) : (
          occupiedTables.map((table) => {
            // Compute estimated total inline to avoid complex helper type annotation
            const order = getOrder(table.id)
            const estimatedTotal = order
              ? order.rounds
                  .flatMap((r) => r.items)
                  .filter((i) => i.status !== 'voided')
                  .reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
              : 0

            return (
              <button
                key={table.id}
                onClick={() => router.push(`/order/${table.id}`)}
                className="w-full flex items-start gap-3 px-4 py-3 border-b text-left hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{table.label}</span>
                    {table.orderStage && (
                      <Badge variant="outline" className="text-xs">{table.orderStage}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {table.waiterName ?? 'Unassigned'} · {table.guestCount ?? 0} pax
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-sm font-medium tabular-nums">฿{estimatedTotal.toLocaleString()}</p>
                  {table.openedAt && (
                    <p className="text-xs text-muted-foreground">{formatElapsed(table.openedAt)}</p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Staff List Section */}
      <div>
        <div className="px-4 py-2 bg-muted/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            On Shift
          </p>
        </div>
        {staffWithTables.map((staff) => (
          <div
            key={staff.id}
            className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{staff.name}</p>
              {staff.assignedTableIds.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  Tables: {staff.assignedTableIds.join(', ')}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">{staff.role}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
