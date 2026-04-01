'use client'

import { Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import type { QueueOrder } from '@/stores/queue.store'
import { getQueueStatusLabel } from '@/lib/queue-display'

function getStatusVariant(
  status: QueueOrder['status']
): 'outline' | 'ordered' | 'cooking' | 'ready' | 'settled' {
  switch (status) {
    case 'Ordered':
      return 'ordered'
    case 'Cooking':
      return 'cooking'
    case 'Ready':
      return 'ready'
    case 'Served':
    case 'Billed':
      return 'settled'
    default:
      return 'outline'
  }
}

const STATUS_CARD_CLASS: Record<string, string> = {
  Ordered: 'bg-status-occupied-bg border-4 border-status-occupied',
  Cooking: 'bg-status-check-requested-bg border-4 border-status-check-requested',
  Ready:   'bg-status-ready-bg border-4 border-status-ready',
  Served:  'bg-status-settled-bg border-4 border-status-settled',
  Billed:  'bg-status-settled-bg border-4 border-status-settled',
}

interface DeliveryCardProps {
  order: QueueOrder
}

export function DeliveryCard({ order }: DeliveryCardProps) {
  const router = useRouter()

  const platformLabel = order.platform === 'grab' ? 'Grab' : 'LINE MAN'
  const cardClass = STATUS_CARD_CLASS[order.status] ?? 'bg-card border border-border'

  return (
    <button
      onClick={() => router.push(`/order/${order.orderId}`)}
      aria-label={`${platformLabel} ${order.externalId}, ${order.status}`}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl p-6 w-[104px] h-[132px] touch-manipulation active:scale-[0.97] transition-transform text-center ${cardClass}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Corner badge: status */}
      <Badge
        variant={getStatusVariant(order.status)}
        className="absolute top-2 right-2 text-sm py-0"
      >
        {getQueueStatusLabel(order.status)}
      </Badge>

      {/* Truck icon */}
      <Truck size={24} className="text-muted-foreground shrink-0" />

      {/* Order info — mirrors TableTile text structure */}
      <div className="flex flex-col items-center gap-2 leading-5 whitespace-nowrap">
        <span className="text-sm font-semibold text-card-foreground">
          {platformLabel}
        </span>
        <span className="text-sm text-muted-foreground">
          {order.externalId}
        </span>
        {order.customerName && (
          <span className="text-xs text-muted-foreground/70 truncate max-w-full">
            {order.customerName}
          </span>
        )}
      </div>
    </button>
  )
}
