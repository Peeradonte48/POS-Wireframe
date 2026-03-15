'use client'
import { useState, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TableGrid } from '@/components/table-map/TableGrid'
import { TableBottomSheet } from '@/components/table-map/TableBottomSheet'
import { OpenTableModal } from '@/components/table-map/OpenTableModal'
import { DeliveryPanel } from '@/components/queue/DeliveryPanel'
import { TakeawayPanel } from '@/components/queue/TakeawayPanel'
import { useQueueStore } from '@/stores/queue.store'
import type { TableRecord } from '@/stores/table.store'

export default function TableMapPage() {
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null)
  const [openModalTableId, setOpenModalTableId] = useState<string | null>(null)

  // Zustand selector safety — raw Record, derive in useMemo
  const orders = useQueueStore((s) => s.orders)

  const pendingDeliveryCount = useMemo(
    () =>
      Object.values(orders).filter(
        (o) => o.channel === 'delivery' && o.status === 'Pending'
      ).length,
    [orders]
  )

  const activeTakeawayCount = useMemo(
    () =>
      Object.values(orders).filter(
        (o) => o.channel === 'takeaway' && o.status !== 'Collected' && o.status !== 'Cancelled'
      ).length,
    [orders]
  )

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
    <Tabs defaultValue="dine-in" className="flex flex-col h-full">
      <TabsList className="shrink-0 mx-4 mt-3 mb-0 self-start">
        <TabsTrigger value="dine-in">Dine-in</TabsTrigger>
        <TabsTrigger value="takeaway" className="flex items-center gap-1">
          Takeaway
          {activeTakeawayCount > 0 && (
            <span className="h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {activeTakeawayCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="delivery" className="flex items-center gap-1">
          Delivery
          {pendingDeliveryCount > 0 && (
            <span className="h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {pendingDeliveryCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Dine-in tab — existing triplet, completely unchanged behavior */}
      <TabsContent value="dine-in" className="flex-1 min-h-0 mt-0">
        <div className="min-h-full relative">
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
      </TabsContent>

      {/* Takeaway tab */}
      <TabsContent value="takeaway" className="flex-1 min-h-0 mt-0">
        <TakeawayPanel />
      </TabsContent>

      {/* Delivery tab */}
      <TabsContent value="delivery" className="flex-1 min-h-0 mt-0">
        <DeliveryPanel />
      </TabsContent>
    </Tabs>
  )
}
