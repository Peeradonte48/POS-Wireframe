'use client'
import { useMemo } from 'react'
import { Armchair, Scissors, Link, Pause } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { TableRecord, TableStatus, OrderStage } from '@/stores/table.store'
import { useTableStore } from '@/stores/table.store'
import { useBillStore } from '@/stores/bill.store'
import { useOrderStore } from '@/stores/order.store'
import { isRoundEscalated } from '@/lib/order-tracking'
import { useDwellTimer } from './useDwellTimer'

const TABLE_CAPACITY = 10

const STATUS_CARD_CLASS: Record<TableStatus, string> = {
  Open:           'bg-card border border-border',
  Occupied:       'bg-status-occupied-bg border-4 border-status-occupied',
  Reserved:       'bg-status-reserved-bg border-4 border-status-reserved',
  CheckRequested: 'bg-status-check-requested-bg border-4 border-status-check-requested',
  Cleaning:       'bg-status-cleaning-bg border-4 border-status-cleaning',
}

const STAGE_VARIANT: Record<OrderStage, 'ordered' | 'cooking' | 'ready' | 'settled'> = {
  Ordered: 'ordered',
  Cooking: 'cooking',
  Ready:   'ready',
  Served:  'settled',
  Billed:  'settled',
}

interface TableTileProps {
  table: TableRecord
  onTap: (table: TableRecord) => void
}

export function TableTile({ table, onTap }: TableTileProps) {
  const isWaitingKitchen =
    table.status === 'Occupied' &&
    (table.orderStage === 'Ordered' || table.orderStage === 'Cooking' || table.orderStage === 'Ready')
  const cardClass = isWaitingKitchen
    ? 'bg-status-check-requested-bg border-4 border-status-check-requested'
    : STATUS_CARD_CLASS[table.status]

  // Always call hooks unconditionally (React hooks rule)
  const dwellTime = useDwellTimer(table.openedAt)
  const splits = useBillStore((s) => s.splits)
  const split = useMemo(() => splits?.[table.id], [splits, table.id])
  const paidCount = split ? Object.keys(split.payments).length : 0
  const paymentSessions = useBillStore((s) => s.paymentSessions)
  const hasActiveSession = Boolean(paymentSessions[table.id])
  const isSplitPaused = split !== undefined && paidCount > 0 && paidCount < split.seatCount
  const isPaused = hasActiveSession || isSplitPaused
  const merges = useBillStore((s) => s.merges)
  const isMergedSecondary = table.id in merges
  const primaryTableId = merges[table.id] ?? null
  const mergedSecondaryIds = useMemo(
    () => Object.keys(merges).filter((k) => merges[k] === table.id),
    [merges, table.id],
  )
  const isMergedPrimary = mergedSecondaryIds.length > 0

  const orders = useOrderStore((s) => s.orders)

  const isEscalated = useMemo(() => {
    if (table.status !== 'Occupied' && table.status !== 'CheckRequested') return false
    if (table.orderStage === null || table.orderStage === 'Served' || table.orderStage === 'Billed') return false
    const order = orders[table.id]
    if (!order) return false
    return order.rounds
      .filter((r) => r.sentAt !== null)
      .some((r) => isRoundEscalated(r.sentAt))
  }, [orders, table.id, table.status, table.orderStage])

  const router = useRouter()

  const showMergeBadge = isMergedSecondary || isMergedPrimary
  const showSplitBadge = !showMergeBadge && split !== undefined && table.status === 'CheckRequested'
  const primaryLabel = isMergedSecondary
    ? useTableStore.getState().tables[primaryTableId ?? '']?.label ?? primaryTableId
    : undefined

  const guestCount = table.guestCount ?? 0

  return (
    <button
      onClick={() => {
        // Paused payment → direct resume, bypass bottom sheet
        if (hasActiveSession) {
          router.push(`/payment/${table.id}`)
          return
        }
        if (isSplitPaused) {
          router.push(`/payment/${table.id}/split-summary`)
          return
        }
        // Merged tables (primary or secondary) → go directly to primary's payment page
        if (isMergedSecondary && primaryTableId) {
          router.push(`/payment/${primaryTableId}`)
          return
        }
        if (isMergedPrimary) {
          router.push(`/payment/${table.id}`)
          return
        }
        onTap(table)
      }}
      aria-label={
        isPaused
          ? `โต๊ะ ${table.label} — รอชำระ, แตะเพื่อกลับไปทำต่อ`
          : `โต๊ะ ${table.label}, ${table.status}, ${guestCount} ที่นั่ง`
      }
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl p-6 w-[104px] h-[132px] touch-manipulation active:scale-[0.97] transition-transform text-center ${cardClass}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Corner badge: split / merge / order stage */}
      {isPaused ? (
        <Badge variant="paused" className="absolute top-2 right-2 text-sm py-0">
          <Pause size={10} className="mr-0.5" />
          รอชำระ
        </Badge>
      ) : showSplitBadge ? (
        <Badge className="absolute top-2 right-2 text-sm py-0 bg-status-split-bg text-status-split border-0">
          <Scissors size={10} className="mr-0.5" />
          {paidCount}/{split!.seatCount} paid
        </Badge>
      ) : showMergeBadge ? (
        <Badge className="absolute top-2 right-2 text-sm py-0 bg-status-merged-bg text-status-merged border-0">
          <Link size={10} className="mr-0.5" />
          {isMergedSecondary ? `→${primaryLabel}` : `+${mergedSecondaryIds.length}`}
        </Badge>
      ) : table.orderStage !== null && (table.status === 'Occupied' || table.status === 'CheckRequested') ? (
        <Badge
          variant={isEscalated ? 'escalated' : STAGE_VARIANT[table.orderStage]}
          className="absolute top-2 right-2 text-sm py-0"
        >
          {table.orderStage}
        </Badge>
      ) : null}

      {/* Armchair icon */}
      <Armchair size={24} className="text-muted-foreground shrink-0" />

      {/* Table info */}
      <div className="flex flex-col items-center gap-2 leading-5 whitespace-nowrap">
        <span className="text-sm font-semibold text-card-foreground">
          โต๊ะที่ {table.label.replace(/^T/, '')}
        </span>
        <span className="text-sm text-muted-foreground">
          {guestCount}/{TABLE_CAPACITY} คน
        </span>
        {dwellTime && table.status === 'Occupied' && (
          <span className="text-xs font-mono text-muted-foreground/70">{dwellTime}</span>
        )}
      </div>
    </button>
  )
}
