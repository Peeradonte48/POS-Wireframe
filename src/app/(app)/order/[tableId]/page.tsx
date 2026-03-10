'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useTableStore } from '@/stores/table.store'
import { MenuPanel } from '@/components/order/MenuPanel'

export default function OrderPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  const table = useTableStore((s) => s.tables[tableId])

  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

  // Suppress unused variable warnings until Plan 03 wires them up
  void editingLineId
  void setEditingLineId

  const headerLabel = table
    ? `${table.label} \u2022 ${table.guestCount ?? 0} guests`
    : tableId

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-md hover:bg-accent transition-colors"
          aria-label="Back to floor map"
        >
          <ChevronLeft className="w-5 h-5" />
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

        {/* Right panel — ticket (populated in Plan 04) */}
        <div className="w-80 flex flex-col">
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Ticket (Plan 04)
          </div>
          <div className="h-16 border-t flex items-center px-4 text-sm text-muted-foreground">
            Running total
          </div>
        </div>
      </div>
    </div>
  )
}
