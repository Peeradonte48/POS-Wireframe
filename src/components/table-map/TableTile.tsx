'use client'
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
import type { TableRecord, TableStatus } from '@/stores/table.store'
import { useTableStore } from '@/stores/table.store'
import { useBillStore } from '@/stores/bill.store'
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
  const showSplitBadge = split !== undefined && table.status === 'CheckRequested'

  const isMergedSecondary = useBillStore((s) => s.isMergedSecondary(table.id))
  const primaryTableId = useBillStore((s) => s.getPrimaryTable(table.id))
  const router = useRouter()

  const showMergeBadge = isMergedSecondary
  const primaryLabel = showMergeBadge
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
          Merged→{primaryLabel}
        </Badge>
      ) : table.orderStage !== null ? (
        <Badge variant="outline" className="absolute top-2 right-2 text-[10px] py-0">
          {table.orderStage}
        </Badge>
      ) : null}
    </button>
  )
}
