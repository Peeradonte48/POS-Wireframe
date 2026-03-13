'use client'
import { useMemo } from 'react'
import {
  RadioLinear,
  UsersGroupRoundedLinear,
  CalendarDateLinear,
  WalletLinear,
  StarLinear,
  ClockCircleLinear,
  ScissorsLinear,
  LinkLinear,
} from 'solar-icon-set'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { TableRecord, TableStatus, OrderStage } from '@/stores/table.store'
import { useTableStore } from '@/stores/table.store'
import { useBillStore } from '@/stores/bill.store'
import { useOrderStore } from '@/stores/order.store'
import { useKdsStore } from '@/stores/kds.store'
import { isRoundEscalated } from '@/lib/order-tracking'
import { useDwellTimer } from './useDwellTimer'

type SolarIcon = React.ComponentType<{ size?: number; className?: string }>

const STATUS_CONFIG: Record<TableStatus, {
  borderClass: string
  textClass: string
  bgClass: string
  label: string
  Icon: SolarIcon
}> = {
  Open:           { borderClass: 'border-l-status-open',            textClass: 'text-status-open',            bgClass: 'bg-status-open-bg',             label: 'Open',            Icon: RadioLinear              },
  Occupied:       { borderClass: 'border-l-status-occupied',        textClass: 'text-status-occupied',        bgClass: 'bg-status-occupied-bg',         label: 'Occupied',        Icon: UsersGroupRoundedLinear  },
  Reserved:       { borderClass: 'border-l-status-reserved',        textClass: 'text-status-reserved',        bgClass: 'bg-status-reserved-bg',         label: 'Reserved',        Icon: CalendarDateLinear       },
  CheckRequested: { borderClass: 'border-l-status-check-requested', textClass: 'text-status-check-requested', bgClass: 'bg-status-check-requested-bg',  label: 'Check Requested', Icon: WalletLinear             },
  Cleaning:       { borderClass: 'border-l-status-cleaning',        textClass: 'text-status-cleaning',        bgClass: 'bg-status-cleaning-bg',         label: 'Cleaning',        Icon: StarLinear               },
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
  const { borderClass, textClass, bgClass, label, Icon } = STATUS_CONFIG[table.status]
  // Always call useDwellTimer unconditionally (React hooks rule)
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
    // Only check escalation for tables that are Occupied or CheckRequested with an active order
    if (table.status !== 'Occupied' && table.status !== 'CheckRequested') return false
    if (table.orderStage === null || table.orderStage === 'Served' || table.orderStage === 'Billed') return false
    const order = orders[table.id]
    if (!order) return false
    // Guard: filter rounds where sentAt is non-null (unsent rounds must never trigger escalation)
    return order.rounds
      .filter((r) => r.sentAt !== null)
      .some((r) => isRoundEscalated(r.sentAt))
  }, [tickets, orders, table.id, table.status, table.orderStage])

  const router = useRouter()

  // Merge badge takes priority; a secondary table's split is irrelevant (payment via primary)
  const showMergeBadge = isMergedSecondary || isMergedPrimary
  const showSplitBadge = !showMergeBadge && split !== undefined && table.status === 'CheckRequested'
  const primaryLabel = isMergedSecondary
    ? useTableStore.getState().tables[primaryTableId ?? '']?.label ?? primaryTableId
    : undefined

  return (
    <button
      onClick={() => {
        if (isMergedSecondary && primaryTableId) {
          router.push(`/payment/${primaryTableId}`)
          return
        }
        onTap(table)
      }}
      className={`relative flex flex-col gap-1 rounded-xl border border-border bg-card p-3 border-l-4 ${borderClass} min-h-[88px] touch-manipulation active:scale-[0.97] transition-transform w-full text-left`}
    >
      {/* Table label */}
      <span className="text-xs font-semibold text-foreground">{table.label}</span>

      {/* Status row */}
      <Badge className={`${bgClass} ${textClass} flex items-center gap-1 border-0`}>
        <Icon size={12} />
        {label}
      </Badge>

      {/* Guest count — Occupied only */}
      {table.status === 'Occupied' && table.guestCount !== null && (
        <span className="text-xs text-muted-foreground">{table.guestCount} guests</span>
      )}

      {/* Dwell timer — Occupied only */}
      {table.status === 'Occupied' && dwellTime && (
        <span className="text-xs font-mono text-muted-foreground flex items-center gap-0.5">
          <ClockCircleLinear size={10} />
          {dwellTime}
        </span>
      )}

      {/* Order stage badge / split progress badge / merge badge */}
      {showSplitBadge ? (
        <Badge
          className="absolute top-2 right-2 text-[10px] py-0 bg-status-split-bg text-status-split border-0"
        >
          <ScissorsLinear size={10} className="mr-0.5" />
          {paidCount}/{split!.seatCount} paid
        </Badge>
      ) : showMergeBadge ? (
        <Badge className="absolute top-2 right-2 text-[10px] py-0 bg-status-merged-bg text-status-merged border-0">
          <LinkLinear size={10} className="mr-0.5" />
          {isMergedSecondary ? `Merged→${primaryLabel}` : `+${mergedSecondaryIds.length} merged`}
        </Badge>
      ) : table.orderStage !== null && (table.status === 'Occupied' || table.status === 'CheckRequested') ? (
        <Badge
          variant={isEscalated ? 'escalated' : STAGE_VARIANT[table.orderStage]}
          className="absolute top-2 right-2 text-[10px] py-0"
        >
          {table.orderStage}
        </Badge>
      ) : null}
    </button>
  )
}
