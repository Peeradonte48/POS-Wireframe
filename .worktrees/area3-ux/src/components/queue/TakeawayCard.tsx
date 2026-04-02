'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrder } from '@/stores/queue.store'
import { useOrderStore } from '@/stores/order.store'
import { ConfirmCancelDialog } from '@/components/queue/ConfirmCancelDialog'
import { ConfirmStepBackDialog } from '@/components/queue/ConfirmStepBackDialog'

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
    case 'Cancelled': return 'Cancelled'
    default:          return status
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

interface TakeawayCardProps {
  order: QueueOrder
}

export function TakeawayCard({ order }: TakeawayCardProps) {
  const router = useRouter()
  const advanceStatus = useQueueStore((s) => s.advanceStatus)
  const stepBack = useQueueStore((s) => s.stepBack)
  const cancelOrder = useQueueStore((s) => s.cancelOrder)

  const [showCancel, setShowCancel] = useState(false)
  const [showStepBack, setShowStepBack] = useState(false)

  const orderData = useOrderStore((s) => s.orders[order.orderId])

  const itemCount = useMemo(() => {
    if (!orderData) return 0
    return orderData.rounds
      .flatMap((r) => r.items)
      .filter((i) => i.status !== 'voided').length
  }, [orderData])

  const customerLabel = order.customerName ?? 'Guest'
  const isTerminal = order.status === 'Collected' || order.status === 'Cancelled'

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
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {formatTime(order.createdAt)}
        </span>
      </div>

      {/* Body row: customer · item count */}
      <p className="text-sm font-semibold text-foreground">
        {customerLabel}
        <span className="font-normal text-muted-foreground"> · {itemCount} items</span>
      </p>

      {/* Action bar */}
      {!isTerminal && (
        <div className="flex gap-2">
          {/* Left: cancel (Taking) or Step Back (Sent / Ready) */}
          {order.status === 'Taking' && (
            <Button
              size="sm"
              variant="ghost"
              className="min-w-[36px] text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowCancel(true)}
              aria-label="Cancel order"
            >
              <X size={16} />
            </Button>
          )}
          {order.status === 'Sent' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStepBack(true)}
            >
              ← Step Back
            </Button>
          )}
          {order.status === 'Ready' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => stepBack(order.orderId)}
            >
              ← Step Back
            </Button>
          )}

          {/* Right: primary action */}
          {order.status === 'Taking' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => router.push(`/order/${order.orderId}`)}
            >
              Start Order
            </Button>
          )}
          {order.status === 'Sent' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => advanceStatus(order.orderId)}
            >
              Mark Ready
            </Button>
          )}
          {order.status === 'Ready' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => advanceStatus(order.orderId)}
            >
              Mark Collected
            </Button>
          )}
        </div>
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

      {order.status === 'Sent' && (
        <ConfirmStepBackDialog
          open={showStepBack}
          onClose={() => setShowStepBack(false)}
          onConfirm={() => {
            stepBack(order.orderId)
            setShowStepBack(false)
          }}
          currentStatus={order.status}
        />
      )}
    </div>
  )
}
