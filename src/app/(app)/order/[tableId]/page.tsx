'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Pen, XCircle, ShoppingBasket, ReceiptText } from 'lucide-react'
import { useTableStore } from '@/stores/table.store'
import { useOrderStore } from '@/stores/order.store'
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrderStatus } from '@/stores/queue.store'
import { MenuPanel } from '@/components/order/MenuPanel'
import { ModifierSheet } from '@/components/order/ModifierSheet'
import { SimpleItemDialog } from '@/components/order/SimpleItemDialog'
import { TicketPanel } from '@/components/order/TicketPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditCustomerModal } from '@/components/queue/EditCustomerModal'
import { ConfirmCancelDialog } from '@/components/queue/ConfirmCancelDialog'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/mock-data/menu'

const ALL_CATEGORY_ID = 'all'

const CATEGORY_NAV = [
  { id: ALL_CATEGORY_ID, label: 'รายการทั้งหมด' },
  ...MENU_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
]

function queueStatusLabel(status: QueueOrderStatus | undefined): string {
  switch (status) {
    case 'Sent':      return 'Sent to Kitchen'
    case 'Ready':     return 'Ready for Collection'
    case 'Collected': return 'Collected'
    default:          return status ?? ''
  }
}

export default function OrderPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  // Takeaway context detection
  const isTakeaway = useQueueStore.getState().orders[tableId]?.channel === 'takeaway'
  const queueStatus = useQueueStore((s) => s.orders[tableId]?.status)
  const queueCustomerName = useQueueStore((s) => s.orders[tableId]?.customerName)
  const queueCustomerPhone = useQueueStore((s) => s.orders[tableId]?.customerPhone)
  const isTakingStatus = queueStatus === 'Taking'

  // Takeaway modal state
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const table = useTableStore((s) => s.tables[tableId])

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [simpleItemId, setSimpleItemId] = useState<string | null>(null)
  const [ticketOpen, setTicketOpen] = useState(false)

  const selectedMenuItem = selectedMenuItemId
    ? (MENU_ITEMS.find((i) => i.id === selectedMenuItemId) ?? null)
    : null

  const editingLineItem = editingLineId
    ? (useOrderStore.getState().orders[tableId]?.rounds
        .flatMap((r) => r.items)
        .find((i) => i.lineId === editingLineId) ?? null)
    : null

  const headerLabel = isTakeaway
    ? `${tableId} · ${queueCustomerName ?? ''}`
    : table
      ? `${table.label} \u2022 ${table.guestCount ?? 0} คน`
      : tableId

  function handleCloseModifier() {
    setSelectedMenuItemId(null)
    setEditingLineId(null)
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          {/* Left: back + breadcrumb */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              aria-label="Back to floor map"
              className="size-9 shrink-0"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium text-foreground">{headerLabel}</span>
            {isTakeaway && queueCustomerPhone && (
              <span className="text-xs text-muted-foreground">{queueCustomerPhone}</span>
            )}
            {isTakeaway && !isTakingStatus && (
              <Badge variant="outline" className="text-xs">
                {queueStatusLabel(queueStatus)}
              </Badge>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            {isTakeaway && isTakingStatus && (
              <>
                <button
                  onClick={() => setShowEditCustomer(true)}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted transition-colors"
                  aria-label="Edit customer"
                >
                  <Pen size={18} />
                </button>
                <button
                  onClick={() => setShowConfirmCancel(true)}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted text-destructive transition-colors"
                  aria-label="Cancel order"
                >
                  <XCircle size={18} />
                </button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setTicketOpen(true)}
            >
              <ShoppingBasket size={16} data-icon="inline-start" />
              อาหารที่สั่ง
            </Button>
            {!isTakeaway && (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => router.push(`/payment/${tableId}`)}
              >
                <ReceiptText size={16} data-icon="inline-start" />
                เช็คบิล
              </Button>
            )}
          </div>
        </header>

        {/* Full-width body */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Category tabs */}
          <div className="px-4 pt-4 pb-0 shrink-0">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="w-full">
                {CATEGORY_NAV.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="flex-1">
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto">
            <div className={isTakeaway && !isTakingStatus ? 'pointer-events-none opacity-50' : ''}>
              <MenuPanel
                onItemTap={(itemId) => {
                  const item = MENU_ITEMS.find((i) => i.id === itemId)
                  if (item && item.modifierGroups.length === 0) {
                    setSimpleItemId(itemId)
                  } else {
                    setSelectedMenuItemId(itemId)
                  }
                }}
                activeCategory={activeCategory}
              />
            </div>
          </div>
        </div>

        {/* SimpleItemDialog — for items with no modifiers */}
        <SimpleItemDialog
          open={simpleItemId !== null}
          onClose={() => setSimpleItemId(null)}
          itemName={MENU_ITEMS.find((i) => i.id === simpleItemId)?.name}
          onConfirm={(qty) => {
            const item = MENU_ITEMS.find((i) => i.id === simpleItemId)
            if (item) {
              useOrderStore.getState().addItem(tableId, {
                lineId: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                menuItemId: item.id,
                menuItemName: item.name,
                basePrice: item.basePrice,
                modifiers: [],
                spiceLevel: null,
                specialRequest: '',
                quantity: qty,
                status: 'unsent',
              })
            }
            setSimpleItemId(null)
          }}
        />

        {/* ModifierSheet — global overlay */}
        <ModifierSheet
          open={selectedMenuItemId !== null}
          onClose={handleCloseModifier}
          menuItem={selectedMenuItem}
          tableId={tableId}
          editingLineId={editingLineId}
          editingLineItem={editingLineItem}
        />

        {isTakeaway && (
          <>
            <EditCustomerModal
              open={showEditCustomer}
              onClose={() => setShowEditCustomer(false)}
              orderId={tableId}
              initialName={queueCustomerName ?? ''}
              initialPhone={queueCustomerPhone}
            />
            <ConfirmCancelDialog
              open={showConfirmCancel}
              onClose={() => setShowConfirmCancel(false)}
              onConfirm={() => {
                useQueueStore.getState().cancelOrder(tableId)
                setShowConfirmCancel(false)
                router.push('/table-map')
              }}
              orderId={tableId}
              customerName={queueCustomerName ?? ''}
            />
          </>
        )}
      </div>

      {/* Ticket panel as right-side sheet */}
      <Sheet open={ticketOpen} onOpenChange={setTicketOpen}>
        <SheetContent side="right" className="p-0 w-80 sm:w-80 flex flex-col" showCloseButton={false}>
          <TicketPanel
            tableId={tableId}
            onClose={() => setTicketOpen(false)}
            onEditLineItem={(lineId) => {
              const order = useOrderStore.getState().orders[tableId]
              const item = order?.rounds
                .flatMap((r) => r.items)
                .find((i) => i.lineId === lineId)
              if (item) {
                setEditingLineId(lineId)
                setSelectedMenuItemId(item.menuItemId)
                setTicketOpen(false)
              }
            }}
            onSend={isTakeaway && isTakingStatus ? () => {
              useQueueStore.getState().advanceStatus(tableId)
              router.push('/table-map')
            } : undefined}
            hideSend={isTakeaway && !isTakingStatus}
            onCheckBill={!isTakeaway ? () => router.push(`/payment/${tableId}`) : undefined}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
