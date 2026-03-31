'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrder } from '@/stores/queue.store'
import { getQueueStatusLabel } from '@/lib/queue-display'

function getCtaLabel(status: QueueOrder['status']): string | null {
  switch (status) {
    case 'Confirmed':
      return 'Mark Preparing'
    case 'Preparing':
      return 'Mark Ready for Rider'
    case 'ReadyForRider':
      return 'Confirm Picked Up'
    default:
      return null
  }
}

function getStatusVariant(
  status: QueueOrder['status']
): 'outline' | 'ordered' | 'cooking' | 'ready' | 'settled' {
  switch (status) {
    case 'Confirmed':
      return 'ordered'
    case 'Preparing':
      return 'cooking'
    case 'ReadyForRider':
      return 'ready'
    case 'PickedUp':
      return 'settled'
    default:
      return 'outline'
  }
}


interface DeliveryCardProps {
  order: QueueOrder
}

export function DeliveryCard({ order }: DeliveryCardProps) {
  const advanceStatus = useQueueStore((s) => s.advanceStatus)

  const platformLabel = order.platform === 'grab' ? 'Grab' : 'LINE MAN'
  const platformVariant = order.platform === 'grab' ? 'grab' : 'lineman'
  const ctaLabel = getCtaLabel(order.status)

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={platformVariant}>{platformLabel}</Badge>
          <span className="text-xs font-mono text-muted-foreground">{order.externalId}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(order.status)}>
            {getQueueStatusLabel(order.status)}
          </Badge>
        </div>
      </div>

      {/* Customer + items */}
      <div className="flex flex-col gap-0.5">
        {order.customerName && (
          <span className="text-sm font-semibold text-foreground">{order.customerName}</span>
        )}
        {order.itemsSummary && (
          <span className="text-xs text-muted-foreground">{order.itemsSummary}</span>
        )}
      </div>

      {/* Action row */}
      {ctaLabel && (
        <Button
          size="sm"
          variant={order.status === 'ReadyForRider' ? 'default' : 'outline'}
          onClick={() => advanceStatus(order.orderId)}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
