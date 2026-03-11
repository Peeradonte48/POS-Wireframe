'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AltArrowLeftLinear } from 'solar-icon-set'
import { Toaster } from 'sonner'
import { useTableStore } from '@/stores/table.store'
import { useOrderStore } from '@/stores/order.store'
import { MenuPanel } from '@/components/order/MenuPanel'
import { ModifierSheet } from '@/components/order/ModifierSheet'
import { TicketPanel } from '@/components/order/TicketPanel'
import { MENU_ITEMS } from '@/lib/mock-data/menu'

export default function OrderPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  const table = useTableStore((s) => s.tables[tableId])

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

  const headerLabel = table
    ? `${table.label} \u2022 ${table.guestCount ?? 0} guests`
    : tableId

  function handleCloseModifier() {
    setSelectedMenuItemId(null)
    setEditingLineId(null)
  }

  return (
    <>
      <Toaster position="top-center" />

      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 -ml-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Back to floor map"
          >
            <AltArrowLeftLinear size={20} />
          </button>

          <span className="text-sm font-medium">{headerLabel}</span>

          {/* Right — empty space for symmetry */}
          <div className="w-8" />
        </header>

        {/* Body */}
        <div className="flex flex-row h-[calc(100vh-3.5rem)]">
          {/* Left panel — menu browser */}
          <div className="flex-1 border-r flex flex-col overflow-hidden">
            <MenuPanel onItemTap={(itemId) => setSelectedMenuItemId(itemId)} />
          </div>

          {/* Right panel — ticket */}
          <div className="w-80 flex flex-col border-l">
            <TicketPanel
              tableId={tableId}
              onEditLineItem={(lineId) => {
                const order = useOrderStore.getState().orders[tableId]
                const item = order?.rounds.flatMap((r) => r.items).find((i) => i.lineId === lineId)
                if (item) {
                  setEditingLineId(lineId)
                  setSelectedMenuItemId(item.menuItemId)
                }
              }}
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
      </div>
    </>
  )
}
