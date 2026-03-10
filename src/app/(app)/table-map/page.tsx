'use client'
import { useState } from 'react'
import { TableGrid } from '@/components/table-map/TableGrid'
import { TableBottomSheet } from '@/components/table-map/TableBottomSheet'
import { OpenTableModal } from '@/components/table-map/OpenTableModal'
import type { TableRecord } from '@/stores/table.store'

export default function TableMapPage() {
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null)
  const [openModalTableId, setOpenModalTableId] = useState<string | null>(null)

  const handleTableTap = (table: TableRecord) => {
    setSelectedTable(table)
  }

  const handleCloseSheet = () => {
    setSelectedTable(null)
  }

  const handleOpenTableModal = () => {
    if (selectedTable) {
      setOpenModalTableId(selectedTable.id)
      setSelectedTable(null) // close bottom sheet while modal is open
    }
  }

  const handleCloseModal = () => {
    setOpenModalTableId(null)
  }

  return (
    <div className="min-h-full">
      <TableGrid onTableTap={handleTableTap} />
      <TableBottomSheet
        table={selectedTable}
        onClose={handleCloseSheet}
        onOpenTableModal={handleOpenTableModal}
      />
      <OpenTableModal
        tableId={openModalTableId}
        onClose={handleCloseModal}
      />
    </div>
  )
}
