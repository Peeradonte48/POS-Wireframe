'use client'
import { useTableStore } from '@/stores/table.store'
import { TableTile } from './TableTile'
import type { TableRecord } from '@/stores/table.store'

interface TableGridProps {
  onTableTap: (table: TableRecord) => void
}

export function TableGrid({ onTableTap }: TableGridProps) {
  const { tables } = useTableStore()
  const tableList = Object.values(tables).sort((a, b) => a.id.localeCompare(b.id))
  const availableCount = tableList.filter((t) => t.status === 'Open').length

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
        {tableList.map((table) => (
          <TableTile key={table.id} table={table} onTap={onTableTap} />
        ))}
      </div>
    </div>
  )
}
