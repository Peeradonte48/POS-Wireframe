'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { FileText, X, Printer, ReceiptText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  sendLabel?: string    // overrides CTA button text
  headerLabel?: string  // overrides table?.label ?? tableId in panel header
  onClose?: () => void
  onPrintBill?: () => void
  onCheckBill?: () => void
}

type ActiveTab = 'unsent' | 'sent'

// ---------------------------------------------------------------------------
// Helper: sum non-voided items
// ---------------------------------------------------------------------------

function computeItemsTotal(items: OrderLineItem[]): number {
  return items.reduce((sum, item) => {
    if (item.status === 'voided') return sum
    return sum + item.basePrice * item.quantity
  }, 0)
}

// ---------------------------------------------------------------------------
// TicketPanel
// ---------------------------------------------------------------------------

export function TicketPanel({
  tableId,
  onEditLineItem,
  onSend,
  hideSend,
  sendLabel,
  headerLabel,
  onClose,
  onPrintBill,
  onCheckBill,
}: TicketPanelProps) {
  const order = useOrderStore((s) => s.orders[tableId])
  const table = useTableStore((s) => s.tables[tableId])
  const { removeItem, togglePackToGo } = useOrderStore()
  const { updateTable } = useTableStore()
  const role = useSessionStore((s) => s.role)!

  // Pack-to-go toggle is dine-in only; isTakeaway is stable for the lifetime of this panel
  const isTakeaway = useQueueStore.getState().orders[tableId]?.channel === 'takeaway'

  const [activeTab, setActiveTab] = useState<ActiveTab>('unsent')
  const [voidingLineId, setVoidingLineId] = useState<string | null>(null)
  const voidAuthorizedRef = useRef(false)

  const allItems: OrderLineItem[] = order
    ? order.rounds.flatMap((r) => r.items)
    : []

  const unsentItems = allItems.filter((i) => i.status === 'unsent')
  const sentItems = allItems.filter((i) => i.status === 'sent')
  const displayItems = activeTab === 'unsent' ? unsentItems : sentItems

  const unsentCount = unsentItems.length
  const unsentTotal = computeItemsTotal(unsentItems)
  const sentTotal = computeItemsTotal(sentItems)
  const runningTotal = unsentTotal + sentTotal

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

  const label = headerLabel ?? table?.label ?? tableId

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0">
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-primary" />
        </div>
        <p className="flex-1 font-bold text-base leading-tight truncate">{label}</p>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="px-4 py-3 shrink-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="unsent" className="flex-1 gap-1.5">
              ยังไม่ได้สั่ง
              {unsentCount > 0 && (
                <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                  {unsentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1">
              สั่งแล้ว
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1 min-h-0">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <FileText size={28} className="opacity-30" />
            <p className="text-sm">
              {activeTab === 'unsent' ? 'No unsent items' : 'No sent items'}
            </p>
          </div>
        ) : (
          displayItems.map((item) => (
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
          ))
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="shrink-0">
        <Separator />

        {/* Summary rows */}
        <div className="px-4 pt-3 pb-2 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">ยังไม่ได้สั่ง</p>
            <p className="text-sm tabular-nums text-muted-foreground">฿{unsentTotal.toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">สั่งแล้ว</p>
            <p className="text-sm tabular-nums text-muted-foreground">฿{sentTotal.toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm font-bold">รวม</p>
            <p className="text-base font-black text-primary">฿{runningTotal.toFixed(2)}</p>
          </div>
        </div>

        <Separator />

        {/* Print + Check bill buttons */}
        <div className="px-4 py-2 flex gap-2">
          <Button variant="outline" className="flex-1 text-xs" onClick={onPrintBill}>
            <Printer data-icon="inline-start" />
            พิมพ์ใบแจ้งหนี้
          </Button>
          <Button variant="outline" className="flex-1 text-xs" onClick={onCheckBill}>
            <ReceiptText data-icon="inline-start" />
            เช็คบิล
          </Button>
        </div>

        {/* Send to Kitchen CTA */}
        {!hideSend && (
          <div className="px-4 pb-4">
            <Button
              size="cta"
              className="w-full"
              onClick={handleSend}
              disabled={unsentCount === 0 || (!onSend && !canDoAction(role, 'send-to-kitchen'))}
            >
              <ArrowRight data-icon="inline-start" />
              {sendLabel ?? `ส่งออร์เดอร์เข้าครัว ${unsentCount} รายการ`}
            </Button>
          </div>
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
