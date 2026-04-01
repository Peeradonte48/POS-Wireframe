'use client'

import { ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import type { QueueOrder } from '@/stores/queue.store'
import { getQueueStatusBadgeVariant, getQueueStatusLabel } from '@/lib/queue-display'

const STATUS_CARD_CLASS: Record<string, string> = {
  Taking:    'bg-card border border-border',
  Sent:      'bg-status-occupied-bg border-4 border-status-occupied',
  Ready:     'bg-status-ready-bg border-4 border-status-ready',
  Collected: 'bg-status-settled-bg border-4 border-status-settled',
  Cancelled: 'bg-status-settled-bg border-4 border-status-settled',
}

interface TakeawayCardProps {
  order: QueueOrder
}

export function TakeawayCard({ order }: TakeawayCardProps) {
  const router = useRouter()

  const cardClass = STATUS_CARD_CLASS[order.status] ?? 'bg-card border border-border'
  const customerLabel = order.customerName ?? 'Guest'

  return (
    <button
      onClick={() => router.push(`/order/${order.orderId}`)}
      aria-label={`${order.orderId}, ${customerLabel}, ${order.status}`}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl p-6 w-[104px] h-[132px] touch-manipulation active:scale-[0.97] transition-transform text-center ${cardClass}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Corner badge: status */}
      {order.status !== 'Taking' && (
        <Badge
          variant={getQueueStatusBadgeVariant(order.status)}
          className="absolute top-2 right-2 text-sm py-0"
        >
          {getQueueStatusLabel(order.status)}
        </Badge>
      )}

      {/* Icon */}
      <ShoppingBag size={24} className="text-muted-foreground shrink-0" />

      {/* Order info */}
      <div className="flex flex-col items-center gap-2 leading-5 whitespace-nowrap">
        <span className="text-sm font-semibold text-card-foreground">
          {order.orderId}
        </span>
        <span className="text-xs text-muted-foreground/70 truncate max-w-full">
          {customerLabel}
        </span>
      </div>
    </button>
  )
}
