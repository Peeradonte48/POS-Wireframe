'use client'
import { useState, useEffect, useMemo } from 'react'
import { useTableStore } from '@/stores/table.store'
import { TableTile } from './TableTile'
import { Skeleton } from '@/components/ui/skeleton'
import type { TableRecord } from '@/stores/table.store'

interface TableGridProps {
  onTableTap: (table: TableRecord) => void
}

const TABLES_PER_ROW = 5
const TABLES_PER_SECTION = 10 // 2 rows of 5

const LEGEND = [
  { label: 'ว่าง',         dotClass: 'bg-card border border-border' },
  { label: 'มีลูกค้า',     dotClass: 'bg-status-occupied' },
  { label: 'รออาหาร',      dotClass: 'bg-status-check-requested' },
  { label: 'ต้องเก็บโต๊ะ', dotClass: 'bg-status-cleaning' },
]

function TableTileSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 w-[104px] h-[132px]">
      <Skeleton className="h-6 w-6 rounded" />
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-3 w-8" />
    </div>
  )
}

function TableSection({ tables, onTableTap }: { tables: TableRecord[]; onTableTap: (t: TableRecord) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-[10px] gap-y-[14px]" style={{ maxWidth: `${TABLES_PER_ROW * 104 + (TABLES_PER_ROW - 1) * 10}px` }}>
      {tables.map((table) => (
        <TableTile key={table.id} table={table} onTap={onTableTap} />
      ))}
    </div>
  )
}

export function TableGrid({ onTableTap }: TableGridProps) {
  const { tables } = useTableStore()
  const tableList = Object.values(tables)
    .filter((t): t is TableRecord => Boolean(t?.id))
    .sort((a, b) => a.id.localeCompare(b.id))

  // Split tables into sections of 10 (2 rows of 5)
  const sections = useMemo(() => {
    const result: TableRecord[][] = []
    for (let i = 0; i < tableList.length; i += TABLES_PER_SECTION) {
      result.push(tableList.slice(i, i + TABLES_PER_SECTION))
    }
    return result
  }, [tableList])

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="bg-muted border border-border rounded-md min-h-full px-3 py-2 flex flex-col">
        {/* Legend — centered at top */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-1">
          {LEGEND.map(({ label, dotClass }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`size-2 rounded-[2px] shrink-0 ${dotClass}`} />
              <span className="text-xs text-foreground whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        {/* Sections — centered, with large gap between sections */}
        <div className="flex-1 flex flex-col items-center gap-[111px] pt-[65px] pb-[65px]">
          {isLoading ? (
            <div className="flex flex-wrap justify-center gap-x-[10px] gap-y-[14px]" style={{ maxWidth: `${TABLES_PER_ROW * 104 + (TABLES_PER_ROW - 1) * 10}px` }}>
              {Array.from({ length: 10 }).map((_, i) => <TableTileSkeleton key={i} />)}
            </div>
          ) : tableList.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No tables configured
            </div>
          ) : (
            sections.map((section, idx) => (
              <TableSection key={idx} tables={section} onTableTap={onTableTap} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
