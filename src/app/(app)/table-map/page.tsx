'use client'
import { useState } from 'react'
import { TableGrid } from '@/components/table-map/TableGrid'
import type { TableRecord } from '@/stores/table.store'

export default function TableMapPage() {
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null)

  return (
    <div className="min-h-full">
      <TableGrid onTableTap={setSelectedTable} />
      {/* Plan 03: TableBottomSheet and OpenTableModal will render here */}
    </div>
  )
}
