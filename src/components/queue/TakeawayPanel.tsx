'use client'

import { useMemo, useState } from 'react'
import { useQueueStore } from '@/stores/queue.store'
import { TakeawayCard } from './TakeawayCard'
import { NewTakeawayModal } from './NewTakeawayModal'
import { AddSquareLinear } from 'solar-icon-set'

export function TakeawayPanel() {
  const [showNewModal, setShowNewModal] = useState(false)

  const orders = useQueueStore((s) => s.orders)

  // Derive filtered list — NEVER inside Zustand selector (infinite loop risk)
  const activeTakeawayOrders = useMemo(
    () =>
      Object.values(orders)
        .filter((o) => o.channel === 'takeaway' && o.status !== 'Collected' && o.status !== 'Cancelled')
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  )

  return (
    <div className="relative flex flex-col h-full">
      {/* Scrollable order list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-3 pb-20">
        {activeTakeawayOrders.length > 0 ? (
          activeTakeawayOrders.map((order) => (
            <TakeawayCard key={order.orderId} order={order} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-16">
            <span className="text-3xl">🥡</span>
            <p className="text-sm font-medium text-foreground">No takeaway orders</p>
            <p className="text-xs text-muted-foreground">
              Tap + to create a new takeaway order
            </p>
          </div>
        )}
      </div>

      {/* FAB — New Takeaway Order */}
      <button
        onClick={() => setShowNewModal(true)}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-colors hover:bg-primary/90 active:scale-95"
        style={{ boxShadow: 'var(--shadow-floating)' }}
        aria-label="New Takeaway Order"
      >
        <AddSquareLinear size={24} />
      </button>

      <NewTakeawayModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  )
}
