'use client'

import { useMemo, useState } from 'react'
import { useQueueStore } from '@/stores/queue.store'
import { TakeawayCard } from './TakeawayCard'
import { NewTakeawayModal } from './NewTakeawayModal'
import { Button } from '@/components/ui/button'
import { CirclePlus } from 'lucide-react'

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
    <div className="relative flex flex-col h-full gap-1.5">
      {/* Content container — muted background with border */}
      <div className="relative flex-1 min-h-[80px] overflow-y-auto rounded-md border border-border bg-muted px-3 py-2">
        {activeTakeawayOrders.length > 0 ? (
          <div className="flex flex-wrap gap-3.5 pb-20">
            {activeTakeawayOrders.map((order) => (
              <TakeawayCard key={order.orderId} order={order} />
            ))}
          </div>
        ) : null}

        {/* Create order button — centered at bottom */}
        <Button
          size="lg"
          onClick={() => setShowNewModal(true)}
          className="absolute bottom-[23px] left-1/2 -translate-x-1/2 h-14 px-8 rounded-md"
          style={{ boxShadow: 'var(--shadow-panel)' }}
        >
          <CirclePlus size={16} />
          สร้างออร์เดอร์
        </Button>
      </div>

      <NewTakeawayModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  )
}
