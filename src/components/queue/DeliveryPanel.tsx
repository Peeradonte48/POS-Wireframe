'use client'

import { useState, useMemo } from 'react'
import { useQueueStore } from '@/stores/queue.store'
import { DeliveryCard } from './DeliveryCard'
import { Button } from '@/components/ui/button'
import { NewDeliveryModal } from './NewDeliveryModal'

export function DeliveryPanel() {
  const orders = useQueueStore((s) => s.orders)
  const [newOrderOpen, setNewOrderOpen] = useState(false)

  // Derive filtered list — NEVER inside Zustand selectors (infinite loop risk)
  const activeOrders = useMemo(
    () =>
      Object.values(orders)
        .filter((o) => o.channel === 'delivery' && o.status !== 'PickedUp')
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header row */}
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground mr-auto">Delivery Queue</span>
        <Button size="sm" onClick={() => setNewOrderOpen(true)}>+ New Order</Button>
      </div>

      {/* Scrollable order list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-4">
        {/* Active orders */}
        {activeOrders.length > 0 && (
          <section>
            <div className="flex flex-col gap-3">
              {activeOrders.map((order) => (
                <DeliveryCard key={order.orderId} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {activeOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-16">
            <span className="text-3xl">🛵</span>
            <p className="text-sm font-medium text-foreground">No delivery orders</p>
            <p className="text-xs text-muted-foreground">
              Tap &apos;+ New Order&apos; to add a delivery order
            </p>
          </div>
        )}
      </div>

      <NewDeliveryModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </div>
  )
}
