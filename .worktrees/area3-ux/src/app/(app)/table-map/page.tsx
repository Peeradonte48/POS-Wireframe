'use client'
import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Armchair, ShoppingBag, Truck, Sparkles } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TableGrid } from '@/components/table-map/TableGrid'
import { OpenTableModal } from '@/components/table-map/OpenTableModal'
import { DeliveryPanel } from '@/components/queue/DeliveryPanel'
import { TakeawayPanel } from '@/components/queue/TakeawayPanel'
import { useQueueStore } from '@/stores/queue.store'
import { useTableStore } from '@/stores/table.store'
import { useBillStore } from '@/stores/bill.store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { TableRecord } from '@/stores/table.store'

export default function TableMapPage() {
  const router = useRouter()
  const [openModalTableId, setOpenModalTableId] = useState<string | null>(null)
  const [cleaningTable, setCleaningTable] = useState<TableRecord | null>(null)
  const { markClean } = useTableStore()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'dine-in')

  // Zustand selector safety — raw Record, derive in useMemo
  const orders = useQueueStore((s) => s.orders)

  const activeDeliveryCount = useMemo(
    () =>
      Object.values(orders).filter(
        (o) =>
          o.channel === 'delivery' &&
          ['Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
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
    if (table.status === 'Open') {
      setOpenModalTableId(table.id)
    } else if (table.status === 'Cleaning') {
      setCleaningTable(table)
    } else {
      router.push(`/order/${table.id}`)
    }
  }

  const handleConfirmClean = () => {
    if (!cleaningTable) return
    useBillStore.getState().cancelSplit(cleaningTable.id)
    useBillStore.getState().dissolveAll(cleaningTable.id)
    markClean(cleaningTable.id)
    setCleaningTable(null)
  }

  const handleCloseModal = () => {
    setOpenModalTableId(null)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      {/* Full-width tab bar with icons */}
      <TabsList className="shrink-0 mx-4 mt-3 mb-0 w-[calc(100%-2rem)]">
        <TabsTrigger value="dine-in" className="flex-1 flex items-center gap-2">
          <Armchair size={16} />
          <span>Dine-in</span>
        </TabsTrigger>
        <TabsTrigger value="takeaway" className="flex-1 flex items-center gap-2">
          <ShoppingBag size={16} />
          <span>Take-away</span>
          {activeTakeawayCount > 0 && (
            <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center px-1">
              {activeTakeawayCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="delivery" className="flex-1 flex items-center gap-2">
          <Truck size={16} />
          <span>Delivery</span>
          {activeDeliveryCount > 0 && (
            <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center px-1">
              {activeDeliveryCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Dine-in tab */}
      <TabsContent value="dine-in" className="flex-1 min-h-0 mt-0">
        <div className="min-h-full h-full relative">
          <TableGrid onTableTap={handleTableTap} />
          <OpenTableModal
            tableId={openModalTableId}
            onClose={handleCloseModal}
          />

          <Dialog
            open={cleaningTable !== null}
            onOpenChange={(open) => { if (!open) setCleaningTable(null) }}
          >
            <DialogContent showCloseButton={false} className="max-w-xs">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-status-cleaning-bg border-2 border-status-cleaning shrink-0">
                    <Sparkles size={18} className="text-status-cleaning" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <DialogTitle>ยืนยันเก็บโต๊ะ</DialogTitle>
                    <DialogDescription>
                      {cleaningTable?.label} เก็บโต๊ะเรียบร้อยแล้ว?
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCleaningTable(null)}
                >
                  ยังไม่พร้อม
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmClean}
                >
                  ยืนยัน
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
