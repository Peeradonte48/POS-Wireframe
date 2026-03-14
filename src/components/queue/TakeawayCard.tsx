'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrder } from '@/stores/queue.store'

function getStatusBadgeVariant(status: QueueOrder['status']): 'outline' | 'ordered' | 'ready' | 'settled' {
  switch (status) {
    case 'Taking':    return 'outline'
    case 'Sent':      return 'ordered'
    case 'Ready':     return 'ready'
    case 'Collected': return 'settled'
    default:          return 'outline'
  }
}

function getStatusLabel(status: QueueOrder['status']): string {
  switch (status) {
    case 'Taking':    return 'Taking'
    case 'Sent':      return 'Sent to Kitchen'
    case 'Ready':     return 'Ready'
    case 'Collected': return 'Collected'
    default:          return status
  }
}

interface TakeawayCardProps {
  order: QueueOrder
}

export function TakeawayCard({ order }: TakeawayCardProps) {
  const advanceStatus = useQueueStore((s) => s.advanceStatus)

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-mono font-bold text-foreground">{order.orderId}</span>
        <Badge variant={getStatusBadgeVariant(order.status)}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Customer info */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">{order.customerName}</span>
        {order.customerPhone && (
          <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
        )}
        <span className="text-xs text-muted-foreground mt-0.5">{order.itemsSummary}</span>
      </div>

      {/* CTA */}
      {order.status === 'Taking' && (
        <Button size="sm" variant="outline" onClick={() => {
          // Phase 18 will wire this to order entry navigation
          // For now: advance to 'Sent' as a placeholder
          advanceStatus(order.orderId)
        }}>
          Start Order
        </Button>
      )}
      {order.status === 'Ready' && (
        <Button size="sm" onClick={() => advanceStatus(order.orderId)}>
          Mark Collected
        </Button>
      )}
    </div>
  )
}
