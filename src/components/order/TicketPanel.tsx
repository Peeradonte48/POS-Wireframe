'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { NotesLinear } from 'solar-icon-set'
import { Button } from '@/components/ui/button'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { useQueueStore } from '@/stores/queue.store'
import { canDoAction } from '@/lib/role-permissions'
import { ManagerPinModal } from '@/components/auth/ManagerPinModal'
import { TicketLineItem } from '@/components/order/TicketLineItem'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TicketPanelProps {
  tableId: string
  onEditLineItem: (lineId: string) => void
  onSend?: () => void
  hideSend?: boolean
  sendLabel?: string    // overrides "Send to Kitchen" button text
  headerLabel?: string  // overrides table?.label ?? tableId in panel header
}

// ---------------------------------------------------------------------------
// Helper: running total (non-voided items)
// ---------------------------------------------------------------------------

function computeTotal(allItems: OrderLineItem[]): number {
  return allItems.reduce((sum, item) => {
    if (item.status === 'voided') return sum
    return sum + item.basePrice * item.quantity
  }, 0)
}

// ---------------------------------------------------------------------------
// TicketPanel
// ---------------------------------------------------------------------------

export function TicketPanel({ tableId, onEditLineItem, onSend, hideSend, sendLabel, headerLabel }: TicketPanelProps) {
  const order = useOrderStore((s) => s.orders[tableId])
  const table = useTableStore((s) => s.tables[tableId])
  const { removeItem, togglePackToGo } = useOrderStore()
  const { updateTable } = useTableStore()
  const role = useSessionStore((s) => s.role)!

  // Detect if this is a takeaway/delivery order — non-reactive read (CLAUDE.md getState() pattern)
  // Pack-to-go toggle is dine-in only; isTakeaway is stable for the lifetime of this panel
  const isTakeaway = useQueueStore.getState().orders[tableId]?.channel === 'takeaway'

  const [voidingLineId, setVoidingLineId] = useState<string | null>(null)
  const voidAuthorizedRef = useRef(false)

  const allItems: OrderLineItem[] = order
    ? order.rounds.flatMap((r) => r.items)
    : []

  const hasUnsentItems = allItems.some((i) => i.status === 'unsent')
  const unsentCount = allItems.filter((i) => i.status === 'unsent').length
  const sentCount = allItems.filter((i) => i.status === 'sent').length
  const runningTotal = computeTotal(allItems)

  // ---- Qty change ----
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
    if (onSend) {
      onSend()
    } else {
      updateTable(tableId, { orderStage: 'Ordered' })
    }
    toast('Order sent to kitchen')
  }

  // ---- Subtitle text ----
  function subtitleText() {
    const parts: string[] = []
    if (unsentCount > 0) parts.push(`${unsentCount} unsent`)
    if (sentCount > 0) parts.push(`${sentCount} sent`)
    return parts.length > 0 ? parts.join(' · ') : 'Empty'
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">

      {/* Ticket header */}
      <div className="px-4 py-3.5 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <NotesLinear size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight truncate">
              {headerLabel ?? table?.label ?? tableId}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitleText()}</p>
          </div>
        </div>
      </div>

      {/* Scrollable body — round sections */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!order || allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <NotesLinear size={28} className="opacity-30" />
            <p className="text-sm">No items yet</p>
          </div>
        ) : (
          order.rounds.map((round, i) => {
            const isSent = !!round.sentAt
            return (
              <div key={round.roundId}>
                {/* Section label */}
                <div className="px-4 pt-3 pb-1">
                  <p className="caps">
                    {isSent ? `Round ${i + 1}` : 'New Items'}
                  </p>
                </div>
                {round.items.map((item) => (
                  <TicketLineItem
                    key={item.lineId}
                    item={item}
                    onRemove={(lineId) => removeItem(tableId, lineId)}
                    onQtyChange={handleQtyChange}
                    onEditTap={onEditLineItem}
                    onVoidTap={(lineId) => setVoidingLineId(lineId)}
                    canRemove={canDoAction(role, 'void-pre-send')}
                    canVoidSent={canDoAction(role, 'void-post-send')}
                    showPackToGo={!isTakeaway}
                    onTogglePackToGo={(lineId) => togglePackToGo(tableId, lineId)}
                  />
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <p className="caps">Total</p>
          <p className="text-xl font-black text-primary">฿{runningTotal.toFixed(0)}</p>
        </div>
        {!hideSend && (
          <Button
            size="cta"
            className="w-full"
            onClick={handleSend}
            disabled={!hasUnsentItems || (!onSend && !canDoAction(role, 'send-to-kitchen'))}
          >
            {sendLabel ?? 'Send to Kitchen'}
          </Button>
        )}
      </div>

      {/* Manager PIN modal for void authorization */}
      <ManagerPinModal
        open={voidingLineId !== null}
        onOpenChange={(open) => {
          if (!open) {
            const lineIdAtClose = voidingLineId
            setTimeout(() => {
              if (!voidAuthorizedRef.current && lineIdAtClose !== null) {
                toast.error('Void cancelled')
              }
              voidAuthorizedRef.current = false
            }, 0)
            setVoidingLineId(null)
          }
        }}
        actionLabel="Authorize: Void Item"
        onAuthorize={() => {
          voidAuthorizedRef.current = true
          if (voidingLineId) useOrderStore.getState().voidItem(tableId, voidingLineId)
          toast('Item voided — manager approved')
          setVoidingLineId(null)
        }}
      />
    </div>
  )
}
