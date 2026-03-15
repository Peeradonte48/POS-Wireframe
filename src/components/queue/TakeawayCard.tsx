'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CloseSquareLinear } from 'solar-icon-set'
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrder } from '@/stores/queue.store'
import { useOrderStore } from '@/stores/order.store'
import { MENU_ITEMS } from '@/lib/mock-data/menu'
import { ConfirmCancelDialog } from '@/components/queue/ConfirmCancelDialog'

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
  const router = useRouter()
  const advanceStatus = useQueueStore((s) => s.advanceStatus)
  const cancelOrder = useQueueStore((s) => s.cancelOrder)
  const [showCancel, setShowCancel] = useState(false)

  const orderData = useOrderStore((s) => s.orders[order.orderId])
  const itemsSummary = useMemo(() => {
    if (!orderData || order.status === 'Taking') return 'No items yet'
    const items = orderData.rounds
      .flatMap((r) => r.items)
      .filter((i) => i.status !== 'voided')
    if (items.length === 0) return 'No items yet'
    const grouped = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.menuItemId] = (acc[item.menuItemId] ?? 0) + item.quantity
      return acc
    }, {})
    const parts = Object.entries(grouped).map(([id, qty]) => {
      const label = MENU_ITEMS.find((m) => m.id === id)?.name ?? id
      return `${qty}x ${label}`
    })
    const MAX_ITEMS = 3
    if (parts.length <= MAX_ITEMS) return parts.join(', ')
    return `${parts.slice(0, MAX_ITEMS).join(', ')} +${parts.length - MAX_ITEMS} more`
  }, [orderData, order.status])

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
        <span className="text-xs text-muted-foreground mt-0.5">{itemsSummary}</span>
      </div>

      {/* CTA */}
      {order.status === 'Taking' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/order/${order.orderId}`)}
          >
            Start Order
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="min-w-[36px] text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowCancel(true)}
            aria-label="Cancel order"
          >
            <CloseSquareLinear size={16} />
          </Button>
        </div>
      )}
      {order.status === 'Ready' && (
        <Button size="sm" onClick={() => advanceStatus(order.orderId)}>
          Mark Collected
        </Button>
      )}
      <ConfirmCancelDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={() => {
          cancelOrder(order.orderId)
          setShowCancel(false)
        }}
        orderId={order.orderId}
        customerName={order.customerName}
      />
    </div>
  )
}
