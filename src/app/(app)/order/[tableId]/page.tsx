'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AltArrowLeftLinear, PenLinear, CloseCircleLinear } from 'solar-icon-set'
import { useTableStore } from '@/stores/table.store'
import { useOrderStore } from '@/stores/order.store'
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrderStatus } from '@/stores/queue.store'
import { MenuPanel } from '@/components/order/MenuPanel'
import { ModifierSheet } from '@/components/order/ModifierSheet'
import { TicketPanel } from '@/components/order/TicketPanel'
import { Badge } from '@/components/ui/badge'
import { EditCustomerModal } from '@/components/queue/EditCustomerModal'
import { ConfirmCancelDialog } from '@/components/queue/ConfirmCancelDialog'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/mock-data/menu'
import { cn } from '@/lib/utils'

const ALL_CATEGORY_ID = 'all'

const CATEGORY_NAV = [
  { id: ALL_CATEGORY_ID, label: 'All Items' },
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
  const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
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
      ? `${table.label} \u2022 ${table.guestCount ?? 0} guests`
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
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to floor map"
          >
            <AltArrowLeftLinear size={20} />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold">{headerLabel}</span>
            {isTakeaway && queueCustomerPhone && (
              <span className="text-xs text-muted-foreground">{queueCustomerPhone}</span>
            )}
            {isTakeaway && !isTakingStatus && (
              <Badge variant="outline" className="text-xs mt-0.5">
                {queueStatusLabel(queueStatus)}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isTakeaway && isTakingStatus && (
              <>
                <button
                  onClick={() => setShowEditCustomer(true)}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted transition-colors"
                  aria-label="Edit customer"
                >
                  <PenLinear size={18} />
                </button>
                <button
                  onClick={() => setShowConfirmCancel(true)}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted text-destructive transition-colors"
                  aria-label="Cancel order"
                >
                  <CloseCircleLinear size={18} />
                </button>
              </>
            )}
            {!isTakeaway && <div className="w-11" />}
          </div>
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
            <div className={isTakeaway && !isTakingStatus ? 'pointer-events-none opacity-50' : ''}>
              <MenuPanel
                onItemTap={(itemId) => setSelectedMenuItemId(itemId)}
                activeCategory={activeCategory}
              />
            </div>
          </div>

          {/* Column 3: Ticket */}
          <div className="w-56 md:w-64 lg:w-72 xl:w-80 border-l border-border flex flex-col bg-card shrink-0 overflow-hidden" style={{ boxShadow: 'var(--shadow-panel)' }}>
            <TicketPanel
              tableId={tableId}
              onEditLineItem={(lineId) => {
                const order = useOrderStore.getState().orders[tableId]
                const item = order?.rounds
                  .flatMap((r) => r.items)
                  .find((i) => i.lineId === lineId)
                if (item) {
                  setEditingLineId(lineId)
                  setSelectedMenuItemId(item.menuItemId)
                }
              }}
              onSend={isTakeaway ? () => {
                router.push(`/payment/${tableId}`)
              } : undefined}
              hideSend={isTakeaway && !isTakingStatus}
            />
          </div>
        </div>

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
    </>
  )
}
