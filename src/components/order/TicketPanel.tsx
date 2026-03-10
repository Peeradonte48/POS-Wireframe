'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { ManagerPinModal } from '@/components/auth/ManagerPinModal'
import { TicketLineItem } from '@/components/order/TicketLineItem'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TicketPanelProps {
  tableId: string
  onEditLineItem: (lineId: string) => void
}

// ---------------------------------------------------------------------------
// Helper: compute running total across all rounds for non-voided items
// ---------------------------------------------------------------------------

function computeTotal(allItems: OrderLineItem[]): number {
  return allItems.reduce((sum, item) => {
    if (item.status === 'voided') return sum
    const toppingAdj = item.modifiers
      .filter((m) => m.groupId === 'toppings')
      .reduce((adj, _m) => {
        // priceAdj is on the menu option, but we stored optionLabel not priceAdj.
        // The store doesn't hold priceAdj; the base price already accounts for the bowl.
        // Toppings with priceAdj are a nice-to-have — for this wireframe we sum
        // basePrice × qty only, as the topping priceAdj isn't stored in ModifierSelection.
        return adj
      }, 0)
    return sum + item.basePrice * item.quantity + toppingAdj
  }, 0)
}

// ---------------------------------------------------------------------------
// TicketPanel
// ---------------------------------------------------------------------------

export function TicketPanel({ tableId, onEditLineItem }: TicketPanelProps) {
  const order = useOrderStore((s) => s.orders[tableId])
  const { removeItem } = useOrderStore()
  const { updateTable } = useTableStore()

  const [voidingLineId, setVoidingLineId] = useState<string | null>(null)

  // Flatten all rounds for display purposes
  const allItems: OrderLineItem[] = order
    ? order.rounds.flatMap((r) => r.items)
    : []

  const hasUnsentItems = allItems.some((i) => i.status === 'unsent')
  const hasSentItems = allItems.some((i) => i.status === 'sent' || i.status === 'voided')
  const runningTotal = computeTotal(allItems)

  const multipleRounds = order ? order.rounds.length > 1 : false

  // ---- Qty change: read order live from store state ----
  function handleQtyChange(lineId: string, delta: number) {
    const currentOrder = useOrderStore.getState().orders[tableId]
    if (!currentOrder) return
    for (const round of currentOrder.rounds) {
      const item = round.items.find((i) => i.lineId === lineId)
      if (item && item.status === 'unsent') {
        const newQty = Math.max(1, item.quantity + delta)
        useOrderStore.getState().editItem(tableId, lineId, { ...item, quantity: newQty })
        return
      }
    }
  }

  // ---- Send to Kitchen ----
  function handleSend() {
    useOrderStore.getState().sendRound(tableId)
    updateTable(tableId, { orderStage: 'Ordered' })
    toast('Order sent to kitchen')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header area */}
      <div className="px-4 py-3 border-b">
        {allItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet</p>
        ) : hasSentItems && !hasUnsentItems ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // No explicit action needed — when the next item is added via ModifierSheet
              // the order store automatically creates a new unsent round.
            }}
          >
            Add Items
          </Button>
        ) : null}
      </div>

      {/* Body — scrollable list of all rounds */}
      <div className="flex-1 overflow-y-auto">
        {order &&
          order.rounds.map((round, i) => (
            <div key={round.roundId}>
              {multipleRounds && (
                <div className="text-xs text-muted-foreground px-4 py-1 bg-muted/50">
                  Round {i + 1} {round.sentAt ? '· Sent' : '· Pending'}
                </div>
              )}
              {round.items.map((item) => (
                <TicketLineItem
                  key={item.lineId}
                  item={item}
                  onRemove={(lineId) => removeItem(tableId, lineId)}
                  onQtyChange={handleQtyChange}
                  onEditTap={onEditLineItem}
                  onVoidTap={(lineId) => setVoidingLineId(lineId)}
                />
              ))}
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="h-16 border-t flex items-center justify-between px-4 gap-2 shrink-0">
        <span className="text-sm font-semibold">฿{runningTotal.toFixed(0)}</span>
        <Button
          onClick={handleSend}
          disabled={!hasUnsentItems}
          className="h-10 px-4"
        >
          Send to Kitchen
        </Button>
      </div>

      {/* Manager PIN modal for void authorization */}
      <ManagerPinModal
        open={voidingLineId !== null}
        onOpenChange={(open) => {
          if (!open) setVoidingLineId(null)
        }}
        actionLabel="Authorize: Void Item"
        onAuthorize={() => {
          if (voidingLineId) useOrderStore.getState().voidItem(tableId, voidingLineId)
          setVoidingLineId(null)
        }}
      />
    </div>
  )
}
