'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ShoppingBasket } from 'lucide-react'
import { useOrderStore } from '@/stores/order.store'
import { useQueueStore } from '@/stores/queue.store'
import { useKdsStore } from '@/stores/kds.store'
import { MenuPanel } from '@/components/order/MenuPanel'
import { ModifierSheet } from '@/components/order/ModifierSheet'
import { SimpleItemDialog } from '@/components/order/SimpleItemDialog'
import { TicketPanel } from '@/components/order/TicketPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/mock-data/menu'

const ALL_CATEGORY_ID = 'all'
const CATEGORY_NAV = [
  { id: ALL_CATEGORY_ID, label: 'รายการทั้งหมด' },
  ...MENU_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
]

export default function DeliveryOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId
  const router = useRouter()

  const order = useQueueStore((s) => s.orders[orderId])

  const orderRounds = useOrderStore((s) => s.orders[orderId]?.rounds)
  const itemCount = useMemo(
    () =>
      orderRounds
        ?.flatMap((r) => r.items)
        .filter((i) => i.status !== 'voided')
        .reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    [orderRounds],
  )

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [simpleItemId, setSimpleItemId] = useState<string | null>(null)
  const [ticketOpen, setTicketOpen] = useState(false)

  useEffect(() => {
    if (!order) {
      router.replace('/table-map?tab=delivery')
    }
  }, [order, router])

  const selectedMenuItem = selectedMenuItemId
    ? (MENU_ITEMS.find((i) => i.id === selectedMenuItemId) ?? null)
    : null

  const editingLineItem = editingLineId
    ? (useOrderStore.getState().orders[orderId]?.rounds
        .flatMap((r) => r.items)
        .find((i) => i.lineId === editingLineId) ?? null)
    : null

  function handleCloseModifier() {
    setSelectedMenuItemId(null)
    setEditingLineId(null)
  }

  function handleConfirmOrder() {
    const orderData = useOrderStore.getState().orders[orderId]
    const allItems = orderData?.rounds.flatMap((r) => r.items) ?? []
    const sentItems = allItems.filter((i) => i.status !== 'unsent' && i.status !== 'voided')
    const counts: Record<string, { label: string; qty: number }> = {}
    for (const item of sentItems) {
      const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
      if (!menuItem) continue
      if (counts[item.menuItemId]) {
        counts[item.menuItemId].qty += item.quantity
      } else {
        counts[item.menuItemId] = { label: menuItem.name, qty: item.quantity }
      }
    }
    const summary = Object.values(counts)
      .map((c) => `${c.label} ×${c.qty}`)
      .join(', ')

    useQueueStore.getState().updateItemsSummary(orderId, summary)

    const externalId = order!.externalId ?? orderId
    useKdsStore.getState().addTicket(orderId, externalId, 'delivery', order!.platform)

    router.replace('/table-map?tab=delivery')
  }

  if (!order) return <div className="flex-1 flex items-center justify-center text-muted-foreground">Order not found</div>

  const platformLabel = order.platform === 'grab' ? 'Grab' : 'LINE MAN'
  const headerLabel = `${order.externalId ?? orderId} · ${platformLabel}${order.customerName ? ` · ${order.customerName}` : ''}`

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
              onClick={() => router.replace('/table-map?tab=delivery')}
              aria-label="Back to delivery queue"
              className="size-9 shrink-0"
            >
              <ChevronLeft size={16} />
            </Button>
            <Badge variant={order.platform === 'grab' ? 'grab' : 'lineman'}>
              {platformLabel}
            </Badge>
            <span className="text-sm font-medium text-foreground">{order.externalId ?? orderId}</span>
            {order.customerName && (
              <span className="text-xs text-muted-foreground">{order.customerName}</span>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
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

        {/* SimpleItemDialog — for items with no modifiers */}
        <SimpleItemDialog
          open={simpleItemId !== null}
          onClose={() => setSimpleItemId(null)}
          itemName={MENU_ITEMS.find((i) => i.id === simpleItemId)?.name}
          onConfirm={(qty) => {
            const item = MENU_ITEMS.find((i) => i.id === simpleItemId)
            if (item) {
              useOrderStore.getState().addItem(orderId, {
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
          tableId={orderId}
          editingLineId={editingLineId}
          editingLineItem={editingLineItem}
        />
      </div>

      {/* Ticket panel as right-side sheet */}
      <Sheet open={ticketOpen} onOpenChange={setTicketOpen}>
        <SheetContent side="right" className="p-0 w-80 sm:w-80 flex flex-col" showCloseButton={false}>
          <TicketPanel
            tableId={orderId}
            onClose={() => setTicketOpen(false)}
            onEditLineItem={(lineId) => {
              const orderData = useOrderStore.getState().orders[orderId]
              const item = orderData?.rounds
                .flatMap((r) => r.items)
                .find((i) => i.lineId === lineId)
              if (item) {
                setEditingLineId(lineId)
                setSelectedMenuItemId(item.menuItemId)
                setTicketOpen(false)
              }
            }}
            sendLabel="Confirm Order"
            headerLabel={order.externalId ?? orderId}
            onSend={handleConfirmOrder}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
