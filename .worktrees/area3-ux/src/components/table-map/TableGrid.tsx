'use client'
import { useState, useEffect, useMemo } from 'react'
import { Armchair } from 'lucide-react'
import { useTableStore } from '@/stores/table.store'
import { TableTile } from './TableTile'
import { Skeleton } from '@/components/ui/skeleton'
import type { TableRecord } from '@/stores/table.store'

interface TableGridProps {
  onTableTap: (table: TableRecord) => void
}

const LEGEND = [
  { label: 'ว่าง',         dotClass: 'bg-card border border-border' },
  { label: 'มีลูกค้า',     dotClass: 'bg-status-occupied' },
  { label: 'รออาหาร',      dotClass: 'bg-status-check-requested' },
  { label: 'ต้องเก็บโต๊ะ', dotClass: 'bg-status-cleaning' },
]

function TableTileSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 min-h-[110px] space-y-2">
      <Skeleton className="h-6 w-6 rounded" />
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-3 w-8" />
    </div>
  )
}

export function TableGrid({ onTableTap }: TableGridProps) {
  const { tables } = useTableStore()
  const tableList = Object.values(tables)
    .filter((t): t is TableRecord => Boolean(t?.id))
    .sort((a, b) => a.id.localeCompare(b.id))

  const hasActiveSessions = useMemo(
    () => tableList.some((t) => t.status !== 'Open' && t.status !== 'Reserved'),
    [tableList]
  )

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="bg-muted border border-border rounded-lg overflow-hidden h-full min-h-[400px] p-3 flex flex-col gap-3">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4">
          {LEGEND.map(({ label, dotClass }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`size-2 rounded-[2px] shrink-0 ${dotClass}`} />
              <span className="text-xs text-foreground whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-[10px]">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => <TableTileSkeleton key={i} />)
          ) : tableList.length === 0 ? (
            <div className="col-span-5 flex items-center justify-center h-40 text-muted-foreground text-sm">
              No tables configured
            </div>
          ) : (
            tableList.map((table) => (
              <TableTile key={table.id} table={table} onTap={onTableTap} />
            ))
          )}
        </div>

        {/* Empty state: no active sessions */}
        {!isLoading && tableList.length > 0 && !hasActiveSessions && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
            <Armchair size={28} className="text-muted-foreground/50" />
            <p className="text-base font-bold text-foreground">ยังไม่มีโต๊ะที่เปิด</p>
            <p className="text-sm text-muted-foreground">แตะโต๊ะบนแผนผังเพื่อเปิดเซสชัน</p>
          </div>
        )}
      </div>
    </div>
  )
}
