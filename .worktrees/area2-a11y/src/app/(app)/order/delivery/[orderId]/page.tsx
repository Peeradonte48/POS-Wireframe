'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useOrderStore } from '@/stores/order.store'
import { useQueueStore } from '@/stores/queue.store'
import { useKdsStore } from '@/stores/kds.store'
import { MenuPanel } from '@/components/order/MenuPanel'
import { ModifierSheet } from '@/components/order/ModifierSheet'
import { TicketPanel } from '@/components/order/TicketPanel'
import { Badge } from '@/components/ui/badge'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/mock-data/menu'
import { cn } from '@/lib/utils'

const ALL_CATEGORY_ID = 'all'
const CATEGORY_NAV = [
  { id: ALL_CATEGORY_ID, label: 'All Items' },
  ...MENU_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
]

export default function DeliveryOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId
  const router = useRouter()

  const order = useQueueStore((s) => s.orders[orderId])

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

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

  if (!order) return null

  const platformLabel = order.platform === 'grab' ? 'Grab' : 'LINE MAN'

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => router.replace('/table-map?tab=delivery')}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to delivery queue"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Badge variant={order.platform === 'grab' ? 'grab' : 'lineman'}>
                {platformLabel}
              </Badge>
              <span className="text-sm font-semibold">{order.externalId ?? orderId}</span>
            </div>
            {order.customerName && (
              <span className="text-xs text-muted-foreground mt-0.5">{order.customerName}</span>
            )}
          </div>

          <div className="w-11" />
        </header>

        {/* 3-column body */}
        <div className="flex flex-row flex-1 min-h-0 overflow-hidden">

          {/* Column 1: Category sidebar */}
          <aside className="w-32 md:w-36 lg:w-44 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto py-2">
            {CATEGORY_NAV.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'w-full text-left px-3 lg:px-4 py-3 text-xs md:text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {cat.label}
                </button>
              )
            })}
          </aside>

          {/* Column 2: Menu photo grid */}
          <div className="flex-1 overflow-y-auto bg-background">
            <div>
              <MenuPanel
                onItemTap={(itemId) => setSelectedMenuItemId(itemId)}
                activeCategory={activeCategory}
              />
            </div>
          </div>

          {/* Column 3: Ticket */}
          <div className="w-56 md:w-64 lg:w-72 xl:w-80 border-l border-border flex flex-col bg-card shrink-0 overflow-hidden" style={{ boxShadow: 'var(--shadow-panel)' }}>
            <TicketPanel
              tableId={orderId}
              onEditLineItem={(lineId) => {
                const orderData = useOrderStore.getState().orders[orderId]
                const item = orderData?.rounds
                  .flatMap((r) => r.items)
                  .find((i) => i.lineId === lineId)
                if (item) {
                  setEditingLineId(lineId)
                  setSelectedMenuItemId(item.menuItemId)
                }
              }}
              sendLabel="Confirm Order"
              headerLabel={order.externalId ?? orderId}
              onSend={handleConfirmOrder}
            />
          </div>
        </div>

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
    </>
  )
}
