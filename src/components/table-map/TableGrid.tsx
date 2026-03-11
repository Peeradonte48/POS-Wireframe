'use client'
import { useState, useEffect } from 'react'
import { useTableStore } from '@/stores/table.store'
import { TableTile } from './TableTile'
import { Skeleton } from '@/components/ui/skeleton'
import type { TableRecord } from '@/stores/table.store'

interface TableGridProps {
  onTableTap: (table: TableRecord) => void
}

function TableTileSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 min-h-[88px] space-y-2">
      <Skeleton className="h-3 w-[60px]" />
      <Skeleton className="h-3 w-[80px]" />
    </div>
  )
}

export function TableGrid({ onTableTap }: TableGridProps) {
  const { tables } = useTableStore()
  const tableList = Object.values(tables).sort((a, b) => a.id.localeCompare(b.id))
  const availableCount = tableList.filter((t) => t.status === 'Open').length

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Floor Plan</h1>
        <span className="text-sm text-muted-foreground">
          {availableCount} / {tableList.length} tables available
        </span>
      </div>
      {/* Grid: 3 cols mobile, 4 cols tablet */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, i) => <TableTileSkeleton key={i} />)
        ) : tableList.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground">
            No tables configured
          </div>
        ) : (
          tableList.map((table) => (
            <TableTile key={table.id} table={table} onTap={onTableTap} />
          ))
        )}
      </div>
    </div>
  )
}
