'use client'
import { useMemo } from 'react'
import { Armchair, Scissors, Link } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { TableRecord, TableStatus, OrderStage } from '@/stores/table.store'
import { useTableStore } from '@/stores/table.store'
import { useBillStore } from '@/stores/bill.store'
import { useOrderStore } from '@/stores/order.store'
import { useKdsStore } from '@/stores/kds.store'
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
  const split = useBillStore((s) => s.getSplit(table.id))
  const paidCount = split ? Object.keys(split.payments).length : 0
  const merges = useBillStore((s) => s.merges)
  const isMergedSecondary = table.id in merges
  const primaryTableId = merges[table.id] ?? null
  const mergedSecondaryIds = useMemo(
    () => Object.keys(merges).filter((k) => merges[k] === table.id),
    [merges, table.id],
  )
  const isMergedPrimary = mergedSecondaryIds.length > 0

  const tickets = useKdsStore((s) => s.tickets)
  const orders = useOrderStore((s) => s.orders)

  const isEscalated = useMemo(() => {
    if (table.status !== 'Occupied' && table.status !== 'CheckRequested') return false
    if (table.orderStage === null || table.orderStage === 'Served' || table.orderStage === 'Billed') return false
    const order = orders[table.id]
    if (!order) return false
    return order.rounds
      .filter((r) => r.sentAt !== null)
      .some((r) => isRoundEscalated(r.sentAt))
  }, [tickets, orders, table.id, table.status, table.orderStage])

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
        if (isMergedSecondary && primaryTableId) {
          router.push(`/payment/${primaryTableId}`)
          return
        }
        onTap(table)
      }}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl p-6 min-h-[110px] touch-manipulation active:scale-[0.97] transition-transform w-full text-center ${cardClass}`}
    >
      {/* Corner badge: split / merge / order stage */}
      {showSplitBadge ? (
        <Badge className="absolute top-2 right-2 text-[10px] py-0 bg-status-split-bg text-status-split border-0">
          <Scissors size={10} className="mr-0.5" />
          {paidCount}/{split!.seatCount} paid
        </Badge>
      ) : showMergeBadge ? (
        <Badge className="absolute top-2 right-2 text-[10px] py-0 bg-status-merged-bg text-status-merged border-0">
          <Link size={10} className="mr-0.5" />
          {isMergedSecondary ? `→${primaryLabel}` : `+${mergedSecondaryIds.length}`}
        </Badge>
      ) : table.orderStage !== null && (table.status === 'Occupied' || table.status === 'CheckRequested') ? (
        <Badge
          variant={isEscalated ? 'escalated' : STAGE_VARIANT[table.orderStage]}
          className="absolute top-2 right-2 text-[10px] py-0"
        >
          {table.orderStage}
        </Badge>
      ) : null}

      {/* Armchair icon */}
      <Armchair size={24} className="text-muted-foreground shrink-0" />

      {/* Table info */}
      <div className="flex flex-col items-center gap-1 leading-tight">
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">
          {table.label}
        </span>
        <span className="text-sm text-muted-foreground">
          {guestCount}/{TABLE_CAPACITY}
        </span>
        {dwellTime && table.status === 'Occupied' && (
          <span className="text-xs font-mono text-muted-foreground/70">{dwellTime}</span>
        )}
      </div>
    </button>
  )
}
