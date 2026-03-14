'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQueueStore } from '@/stores/queue.store'
import { RejectReasonDialog } from './RejectReasonDialog'
import type { QueueOrder } from '@/stores/queue.store'

const PENDING_WINDOW_MS = 30_000

function CountdownRing({ pendingAt }: { pendingAt: number }) {
  const [progress, setProgress] = useState(() =>
    Math.min((Date.now() - pendingAt) / PENDING_WINDOW_MS, 1)
  )
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    function tick() {
      const p = Math.min((Date.now() - pendingAt) / PENDING_WINDOW_MS, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [pendingAt])

  const ringColor =
    progress > 0.75
      ? 'var(--color-status-escalated)'
      : progress > 0.5
        ? 'var(--color-status-check-requested)'
        : 'var(--color-status-ready)'

  return (
    <div
      className="relative h-10 w-10 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(${ringColor} ${(1 - progress) * 360}deg, var(--border) ${(1 - progress) * 360}deg)`,
        WebkitMask: 'radial-gradient(circle, transparent 60%, black 61%)',
        mask: 'radial-gradient(circle, transparent 60%, black 61%)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold tabular-nums text-foreground">
          {Math.max(0, Math.round((PENDING_WINDOW_MS - (Date.now() - pendingAt)) / 1000))}s
        </span>
      </div>
    </div>
  )
}

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
): 'default' | 'outline' | 'destructive' | 'ordered' | 'cooking' | 'ready' | 'settled' {
  switch (status) {
    case 'Confirmed':
      return 'ordered'
    case 'Preparing':
      return 'cooking'
    case 'ReadyForRider':
      return 'ready'
    case 'PickedUp':
      return 'settled'
    case 'Rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getStatusLabel(status: QueueOrder['status']): string {
  switch (status) {
    case 'Confirmed':
      return 'Accepted'
    case 'Preparing':
      return 'Preparing'
    case 'ReadyForRider':
      return 'Ready for Rider'
    case 'PickedUp':
      return 'Picked Up'
    case 'Rejected':
      return 'Rejected'
    default:
      return status
  }
}

interface DeliveryCardProps {
  order: QueueOrder
}

export function DeliveryCard({ order }: DeliveryCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const acceptOrder = useQueueStore((s) => s.acceptOrder)
  const rejectOrder = useQueueStore((s) => s.rejectOrder)
  const advanceStatus = useQueueStore((s) => s.advanceStatus)

  const platformLabel = order.platform === 'grab' ? 'Grab' : 'LINE MAN'
  const platformVariant = order.platform === 'grab' ? 'grab' : 'lineman'
  const ctaLabel = getCtaLabel(order.status)
  const isPending = order.status === 'Pending'

  return (
    <>
      <div
        className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={platformVariant}>{platformLabel}</Badge>
            <span className="text-xs font-mono text-muted-foreground">{order.orderId}</span>
          </div>
          <div className="flex items-center gap-2">
            {isPending && order.pendingAt !== undefined && (
              <CountdownRing pendingAt={order.pendingAt} />
            )}
            {!isPending && (
              <Badge variant={getStatusVariant(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            )}
          </div>
        </div>

        {/* Customer + items */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{order.customerName}</span>
          <span className="text-xs text-muted-foreground">{order.itemsSummary}</span>
          {order.status === 'Rejected' && order.rejectionReason && (
            <span className="text-xs text-destructive mt-1">Reason: {order.rejectionReason}</span>
          )}
        </div>

        {/* Action row */}
        {isPending && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => acceptOrder(order.orderId)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setShowRejectDialog(true)}
            >
              Reject
            </Button>
          </div>
        )}
        {!isPending && ctaLabel && (
          <Button
            size="sm"
            variant={order.status === 'ReadyForRider' ? 'default' : 'outline'}
            onClick={() => advanceStatus(order.orderId)}
          >
            {ctaLabel}
          </Button>
        )}
      </div>

      <RejectReasonDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={(reason) => {
          rejectOrder(order.orderId, reason)
          setShowRejectDialog(false)
        }}
      />
    </>
  )
}
