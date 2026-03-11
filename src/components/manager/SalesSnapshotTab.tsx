'use client'
import { useMemo } from 'react'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'

export function SalesSnapshotTab() {
  const orders = useOrderStore((s) => s.orders)
  const tables = useTableStore((s) => s.tables)

  const { grossRevenue, vatAmount, netSales, coverCount, topItems } = useMemo(() => {
    const allItems = Object.values(orders).flatMap((o) => o.rounds.flatMap((r) => r.items))
    const soldItems = allItems.filter((i) => i.status !== 'voided')
    const grossRevenue = soldItems.reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
    const vatAmount = Math.round(grossRevenue * 0.07)
    const netSales = grossRevenue + vatAmount
    const coverCount = Object.values(tables)
      .filter((t) => t.openedAt !== null)
      .reduce((sum, t) => sum + (t.guestCount ?? 0), 0)
    const itemCountMap = soldItems.reduce<Record<string, { name: string; qty: number }>>(
      (acc, i) => {
        acc[i.menuItemId] = {
          name: i.menuItemName,
          qty: (acc[i.menuItemId]?.qty ?? 0) + i.quantity,
        }
        return acc
      },
      {},
    )
    const topItems = Object.values(itemCountMap).sort((a, b) => b.qty - a.qty).slice(0, 5)
    return { grossRevenue, vatAmount, netSales, coverCount, topItems }
  }, [orders, tables])

  const hasNoSales = grossRevenue === 0

  return (
    <div className="p-4 space-y-4">
      {hasNoSales && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No sales data for this shift
        </div>
      )}

      {/* Key Numbers */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Net Sales" value={`฿${netSales.toLocaleString()}`} />
        <StatCard label="VAT (7%)" value={`฿${vatAmount.toLocaleString()}`} />
        <StatCard label="Gross Revenue" value={`฿${grossRevenue.toLocaleString()}`} />
        <StatCard label="Covers" value={`${coverCount} pax`} />
      </div>

      {/* Top Items */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="caps">
          Top Items
        </p>
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No orders yet this shift</p>
        ) : (
          <div className="space-y-2">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}.</span>
                <span className="text-sm flex-1 truncate">{item.name}</span>
                <span className="text-sm font-medium tabular-nums">{item.qty} sold</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
