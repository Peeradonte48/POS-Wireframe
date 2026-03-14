'use client'

import { useEffect, useMemo } from 'react'
import { useQueueStore } from '@/stores/queue.store'
import { DeliveryCard } from './DeliveryCard'
import { cn } from '@/lib/utils'

export function DeliveryPanel() {
  const orders = useQueueStore((s) => s.orders)
  const demoActive = useQueueStore((s) => s.demoActive)
  const autoAccept = useQueueStore((s) => s.autoAccept)
  const simulateOrder = useQueueStore((s) => s.simulateOrder)
  const toggleDemoActive = useQueueStore((s) => s.toggleDemoActive)
  const toggleAutoAccept = useQueueStore((s) => s.toggleAutoAccept)

  // Derive filtered lists — NEVER inside Zustand selectors (infinite loop risk)
  const pendingOrders = useMemo(
    () =>
      Object.values(orders)
        .filter((o) => o.channel === 'delivery' && o.status === 'Pending')
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  )

  const activeOrders = useMemo(
    () =>
      Object.values(orders)
        .filter(
          (o) =>
            o.channel === 'delivery' &&
            o.status !== 'Pending' &&
            o.status !== 'PickedUp' &&
            o.status !== 'Rejected'
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  )

  // Demo simulation loop — mirrors kds/page.tsx pattern exactly
  useEffect(() => {
    if (!demoActive) return
    let timeoutId: ReturnType<typeof setTimeout>
    function scheduleNext() {
      const delay = 10_000 + Math.random() * 5_000 // 10–15 seconds
      timeoutId = setTimeout(() => {
        simulateOrder()
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [demoActive, simulateOrder])

  const hasAnyOrders = pendingOrders.length > 0 || activeOrders.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header row with demo controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0 flex-wrap">
        <span className="text-sm font-semibold text-foreground mr-auto">Delivery Queue</span>
        <button
          onClick={toggleAutoAccept}
          className={cn(
            'text-xs border rounded-full px-3 py-1 transition-colors font-medium',
            autoAccept
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}
        >
          Auto-accept {autoAccept ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={
            demoActive
              ? toggleDemoActive
              : () => {
                  simulateOrder()
                  toggleDemoActive()
                }
          }
          className={cn(
            'text-xs border border-border rounded px-3 py-1.5 transition-colors',
            demoActive
              ? 'bg-status-escalated-bg text-status-escalated border-status-escalated/30'
              : 'hover:bg-muted text-muted-foreground'
          )}
        >
          {demoActive ? 'Stop Demo' : 'Simulate Order'}
        </button>
      </div>

      {/* Scrollable order list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-4">
        {/* Pending orders — highlighted section */}
        {pendingOrders.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-status-check-requested uppercase tracking-wide mb-2">
              Waiting for response ({pendingOrders.length})
            </p>
            <div className="flex flex-col gap-3">
              {pendingOrders.map((order) => (
                <DeliveryCard key={order.orderId} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <section>
            {pendingOrders.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Active Orders
              </p>
            )}
            <div className="flex flex-col gap-3">
              {activeOrders.map((order) => (
                <DeliveryCard key={order.orderId} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasAnyOrders && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-16">
            <span className="text-3xl">🛵</span>
            <p className="text-sm font-medium text-foreground">No delivery orders</p>
            <p className="text-xs text-muted-foreground">
              Tap &quot;Simulate Order&quot; to generate a demo incoming order
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
