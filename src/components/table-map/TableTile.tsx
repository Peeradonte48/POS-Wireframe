'use client'
import {
  RadioLinear,
  UsersGroupRoundedLinear,
  CalendarDateLinear,
  WalletLinear,
  StarLinear,
  ClockCircleLinear,
} from 'solar-icon-set'
import { Badge } from '@/components/ui/badge'
import type { TableRecord, TableStatus } from '@/stores/table.store'
import { useDwellTimer } from './useDwellTimer'

type SolarIcon = React.ComponentType<{ size?: number; className?: string }>

const STATUS_CONFIG: Record<TableStatus, {
  borderClass: string
  textClass: string
  label: string
  Icon: SolarIcon
}> = {
  Open:           { borderClass: 'border-l-status-open',            textClass: 'text-status-open',            label: 'Open',            Icon: RadioLinear              },
  Occupied:       { borderClass: 'border-l-status-occupied',        textClass: 'text-status-occupied',        label: 'Occupied',        Icon: UsersGroupRoundedLinear  },
  Reserved:       { borderClass: 'border-l-status-reserved',        textClass: 'text-status-reserved',        label: 'Reserved',        Icon: CalendarDateLinear       },
  CheckRequested: { borderClass: 'border-l-status-check-requested', textClass: 'text-status-check-requested', label: 'Check Requested', Icon: WalletLinear             },
  Cleaning:       { borderClass: 'border-l-status-cleaning',        textClass: 'text-status-cleaning',        label: 'Cleaning',        Icon: StarLinear               },
}

interface TableTileProps {
  table: TableRecord
  onTap: (table: TableRecord) => void
}

export function TableTile({ table, onTap }: TableTileProps) {
  const { borderClass, textClass, label, Icon } = STATUS_CONFIG[table.status]
  // Always call useDwellTimer unconditionally (React hooks rule)
  const dwellTime = useDwellTimer(table.openedAt)

  return (
    <button
      onClick={() => onTap(table)}
      className={`relative flex flex-col gap-1 rounded-xl border border-border bg-card p-3 border-l-4 ${borderClass} min-h-[88px] touch-manipulation active:scale-[0.97] transition-transform w-full text-left`}
    >
      {/* Table label */}
      <span className="text-xs font-semibold text-foreground">{table.label}</span>

      {/* Status row */}
      <span className={`text-xs ${textClass} flex items-center gap-1`}>
        <Icon size={12} />
        {label}
      </span>

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

      {/* Order stage badge */}
      {table.orderStage !== null && (
        <Badge variant="outline" className="absolute top-2 right-2 text-[10px] py-0">
          {table.orderStage}
        </Badge>
      )}
    </button>
  )
}
