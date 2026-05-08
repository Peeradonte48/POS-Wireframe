'use client'
import { useMemo } from 'react'
import { Users, Clock3, HandPlatter, Check, Scissors, Link, Pause } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { TableRecord, TableStatus } from '@/stores/table.store'
import { useTableStore } from '@/stores/table.store'
import { useBillStore } from '@/stores/bill.store'
import { useOrderStore } from '@/stores/order.store'
import { isRoundEscalated } from '@/lib/order-tracking'
import { useDwellTimer } from './useDwellTimer'

const TABLE_CAPACITY = 10

const STATUS_BORDER: Record<TableStatus, string> = {
  Open:           'border border-border',
  Occupied:       'border-4 border-status-occupied',
  Reserved:       'border-4 border-status-reserved',
  CheckRequested: 'border-4 border-status-check-requested',
  Cleaning:       'border-4 border-status-cleaning',
}

interface TableTileProps {
  table: TableRecord
  onTap: (table: TableRecord) => void
}

export function TableTile({ table, onTap }: TableTileProps) {
  const isWaitingKitchen =
    table.status === 'Occupied' &&
    (table.orderStage === 'Ordered' || table.orderStage === 'Cooking' || table.orderStage === 'Ready')
  const isAllServed =
    (table.status === 'Occupied' &&
      (table.orderStage === 'Served' || table.orderStage === 'Billed')) ||
    table.status === 'Cleaning'

  // Visual border: Occupied with active kitchen → red; Occupied fully served → green; Cleaning → blue.
  const borderClass = isWaitingKitchen
    ? 'border-4 border-status-check-requested'
    : isAllServed && table.status !== 'Cleaning'
    ? 'border-4 border-status-ready'
    : STATUS_BORDER[table.status]

  // Open uses tighter padding (px-4 py-3); all bordered states use p-3.
  const paddingClass = table.status === 'Open' ? 'px-4 py-3' : 'p-3'

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
  const order = orders[table.id]

  const totalItems = useMemo(() => {
    if (!order) return 0
    return order.rounds
      .filter((r) => r.sentAt !== null)
      .flatMap((r) => r.items)
      .filter((i) => i.status !== 'voided').length
  }, [order])

  const servedItems = isAllServed ? totalItems : 0

  const escalatedCount = useMemo(() => {
    if (!order) return 0
    return order.rounds.filter((r) => r.sentAt !== null && isRoundEscalated(r.sentAt)).length
  }, [order])

  const isEscalated = !isAllServed && escalatedCount > 0

  const router = useRouter()

  const showMergeBadge = isMergedSecondary || isMergedPrimary
  const showSplitBadge = !showMergeBadge && split !== undefined && table.status === 'CheckRequested'
  const primaryLabel = isMergedSecondary
    ? useTableStore.getState().tables[primaryTableId ?? '']?.label ?? primaryTableId
    : undefined

  const guestCount = table.guestCount ?? 0
  const showClock =
    dwellTime !== null &&
    (table.status === 'Occupied' || table.status === 'CheckRequested' || table.status === 'Cleaning')
  const showPlatter =
    totalItems > 0 &&
    (isWaitingKitchen ||
      isAllServed ||
      table.status === 'CheckRequested')

  // Match Figma: outer CardContent gap = 12px when info row stack is present, 8px when title-only/single-row.
  const contentGap = table.status === 'Open' ? 'gap-2' : 'gap-3'

  return (
    <button
      onClick={() => {
        if (hasActiveSession) {
          router.push(`/payment/${table.id}`)
          return
        }
        if (isSplitPaused) {
          router.push(`/payment/${table.id}/split-summary`)
          return
        }
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
      data-testid={`table-tile-${table.label}`}
      data-status={table.status}
      className={`relative flex flex-col items-center bg-card rounded-[14px] w-[104px] h-[132px] touch-manipulation active:scale-[0.97] transition-transform text-center ${paddingClass} ${borderClass}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Workflow corner badges (split / merge / paused) — overlay; not in Figma but workflow-critical */}
      {isPaused ? (
        <Badge variant="paused" className="absolute top-1.5 right-1.5 text-xs py-0">
          <Pause size={10} className="mr-0.5" />
          รอชำระ
        </Badge>
      ) : showSplitBadge ? (
        <Badge className="absolute top-1.5 right-1.5 text-xs py-0 bg-status-split-bg text-status-split border-0">
          <Scissors size={10} className="mr-0.5" />
          {paidCount}/{split!.seatCount}
        </Badge>
      ) : showMergeBadge ? (
        <Badge className="absolute top-1.5 right-1.5 text-xs py-0 bg-status-merged-bg text-status-merged border-0">
          <Link size={10} className="mr-0.5" />
          {isMergedSecondary ? `→${primaryLabel}` : `+${mergedSecondaryIds.length}`}
        </Badge>
      ) : null}

      {/* CardContent: title + info column, aligned to top */}
      <div className={`flex flex-col items-center justify-start ${contentGap} w-full flex-1`}>
        {/* Title — "โต๊ะ XX" with 4px gap, 18px bold, leading-7 */}
        <div className="flex items-start gap-1 text-[18px] font-bold leading-7 text-primary whitespace-nowrap">
          <span>โต๊ะ</span>
          <span>{table.label.replace(/^T/, '')}</span>
        </div>

        {/* Info column — left-aligned rows, gap-1 between rows */}
        <div className="flex flex-col items-start justify-center gap-1 text-[14px] leading-5 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={16} className="shrink-0" />
            <span>
              {guestCount}/{TABLE_CAPACITY}
            </span>
          </div>

          {showClock && (
            <div className="flex items-center gap-1">
              <Clock3 size={16} className="shrink-0" />
              <span className="font-mono">{dwellTime}</span>
            </div>
          )}

          {showPlatter && (
            <div className="flex items-center justify-center gap-1">
              <HandPlatter size={16} className="shrink-0" />
              <span>
                {servedItems}/{totalItems}
              </span>
              {isAllServed ? (
                <span className="flex items-center justify-center p-0.5 rounded-md bg-status-ready border border-transparent">
                  <Check size={12} strokeWidth={3} className="text-white" />
                </span>
              ) : isEscalated ? (
                <span className="flex items-center justify-center min-w-[20px] px-0.5 rounded-full bg-destructive border border-transparent text-white text-xs font-semibold leading-4">
                  {escalatedCount}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
