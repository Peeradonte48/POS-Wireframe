'use client'

import { useState, useMemo } from 'react'
import { CirclePlus } from 'lucide-react'
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
        .filter((o) => o.channel === 'delivery' && o.status !== 'Billed')
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  )

  return (
    <div className="relative flex flex-col h-full">
      {/* Order area */}
      <div className="flex-1 min-h-[80px] overflow-y-auto min-h-0 bg-muted border border-border rounded-md mx-0 p-3 relative">
        {activeOrders.length > 0 ? (
          <div className="flex flex-wrap gap-3.5 pb-20">
            {activeOrders.map((order) => (
              <DeliveryCard key={order.orderId} order={order} />
            ))}
          </div>
        ) : null}

        {/* Create order button — centered at bottom */}
        <Button
          size="lg"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 h-14 px-8 rounded-md"
          style={{ boxShadow: 'var(--shadow-floating)' }}
          onClick={() => setNewOrderOpen(true)}
        >
          <CirclePlus size={16} />
          สร้างออร์เดอร์
        </Button>
      </div>

      <NewDeliveryModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </div>
  )
}
