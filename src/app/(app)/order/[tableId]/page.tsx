'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Pen, XCircle, ShoppingBasket, ReceiptText, CircleCheck } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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

  // Queue context detection
  const queueChannel = useQueueStore.getState().orders[tableId]?.channel
  const isTakeaway = queueChannel === 'takeaway'
  const isDelivery = queueChannel === 'delivery'
  const queueStatus = useQueueStore((s) => s.orders[tableId]?.status)
  const queueCustomerName = useQueueStore((s) => s.orders[tableId]?.customerName)
  const queueCustomerPhone = useQueueStore((s) => s.orders[tableId]?.customerPhone)
  const isTakingStatus = queueStatus === 'Taking'

  // Takeaway modal state
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const table = useTableStore((s) => s.tables[tableId])

  const orderRounds = useOrderStore((s) => s.orders[tableId]?.rounds)
  const allItems = useMemo(
    () => orderRounds?.flatMap((r) => r.items).filter((i) => i.status !== 'voided') ?? [],
    [orderRounds],
  )
  const itemCount = useMemo(
    () => allItems.reduce((sum, i) => sum + i.quantity, 0),
    [allItems],
  )
  const hasSentItems = useMemo(
    () => allItems.some((i) => i.status === 'sent' || i.status === 'ready' || i.status === 'served'),
    [allItems],
  )
  const hasUnsentItems = useMemo(
    () => allItems.some((i) => i.status === 'unsent'),
    [allItems],
  )

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [simpleItemId, setSimpleItemId] = useState<string | null>(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [checkBillConfirmOpen, setCheckBillConfirmOpen] = useState(false)

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

  const showAddedToast = useCallback((name: string, qty: number) => {
    toast('เพิ่มรายการอาหารสำเร็จ', {
      icon: React.createElement(CircleCheck, { size: 16 }),
      description: `${qty}x ${name}`,
      action: {
        label: 'ไปดู',
        onClick: () => setTicketOpen(true),
      },
    })
  }, [])

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
              {itemCount > 0 && (
                <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center px-1">
                  {itemCount}
                </span>
              )}
            </Button>
            {!isDelivery && (isTakeaway ? !isTakingStatus : true) && (
              <Button
                size="sm"
                className="gap-2"
                disabled={!hasSentItems}
                onClick={() => {
                  if (hasUnsentItems) {
                    setCheckBillConfirmOpen(true)
                  } else {
                    router.push(`/payment/${tableId}`)
                  }
                }}
              >
                <ReceiptText size={16} data-icon="inline-start" />
                เช็คบิล
              </Button>
            )}
            {isDelivery && hasSentItems && (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  useQueueStore.getState().setStatus(tableId, 'Billed')
                  toast.success('ออร์เดอร์เดลิเวอรี่เสร็จสิ้น')
                  router.push('/table-map')
                }}
              >
                <ReceiptText size={16} data-icon="inline-start" />
                สำเร็จ
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
                tableId={tableId}
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
              showAddedToast(item.name, qty)
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
          onItemAdded={showAddedToast}
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
        <SheetContent side="right" className="p-0 w-96 sm:w-96 flex flex-col" showCloseButton={false}>
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
            onCheckBill={!isDelivery && (!isTakeaway || !isTakingStatus) ? () => router.push(`/payment/${tableId}`) : undefined}
          />
        </SheetContent>
      </Sheet>

      {/* Confirm check bill with unsent items */}
      <Dialog open={checkBillConfirmOpen} onOpenChange={setCheckBillConfirmOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">มีรายการที่ยังไม่ได้ส่งครัว</DialogTitle>
            <DialogDescription>
              ยังมีออเดอร์ที่ยังไม่ได้ส่งเข้าครัว ต้องการดำเนินการเช็คบิลต่อหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setCheckBillConfirmOpen(false)
                router.push(`/payment/${tableId}`)
              }}
            >
              ดำเนินการต่อ
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCheckBillConfirmOpen(false)}
            >
              ยกเลิก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
