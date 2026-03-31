'use client'

import React, { useState, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { HandPlatter, X, Printer, ReceiptText, SendHorizontal, CircleCheckBig, CircleAlert, Loader, ConciergeBell } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  const { allItems, unsentItems, sentItems, sentAndVoidedItems } = useMemo(() => {
    const all: OrderLineItem[] = order ? order.rounds.flatMap((r) => r.items) : []
    return {
      allItems: all,
      unsentItems: all.filter((i) => i.status === 'unsent'),
      sentItems: all.filter((i) => i.status === 'sent' || i.status === 'ready' || i.status === 'served'),
      sentAndVoidedItems: all.filter((i) => i.status === 'sent' || i.status === 'ready' || i.status === 'served' || i.status === 'voided'),
    }
  }, [order])
  const displayItems = activeTab === 'unsent' ? unsentItems : sentAndVoidedItems
  const inKitchenCount = useMemo(
    () => (order ? order.rounds.flatMap((r) => r.items).filter((i) => i.status === 'sent').length : 0),
    [order],
  )

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
    // Build item summary before sending (items become 'sent' after sendRound)
    const lines = unsentItems
      .filter((i) => i.status !== 'voided')
      .map((i) => `${i.quantity}x ${i.menuItemName}`)

    useOrderStore.getState().sendRound(tableId)
    if (onSend) {
      onSend()
    } else {
      updateTable(tableId, { orderStage: 'Ordered' })
      setActiveTab('sent')
    }
    const SEND_TOAST_DURATION = 2000

    toast.success('ส่งออร์เดอร์เข้าครัวสำเร็จ', {
      duration: SEND_TOAST_DURATION,
      icon: React.createElement(CircleCheckBig, {
        size: 20,
        fill: 'var(--status-success)',
        color: 'var(--primary-foreground)',
        strokeWidth: 1.5,
      }),
      description: lines.length > 0
        ? React.createElement('span', null, lines.map((line, i) =>
            React.createElement(React.Fragment, { key: i }, i > 0 && React.createElement('br'), line)
          ))
        : undefined,
    })

    // Wait for the first toast to disappear, then start print invoice toast
    setTimeout(() => printOrderInvoice(), SEND_TOAST_DURATION)
  }

  // ---- Demo: Simulate KDS completing all sent items → ready ----
  function handleDemoKdsComplete() {
    useOrderStore.getState().markAllSentReady(tableId)
    toast('Demo: ครัวทำอาหารเสร็จทั้งหมด', {
      icon: React.createElement(ConciergeBell, { size: 20, className: 'text-primary' }),
    })
  }

  // ---- Serve item (mark ready → served) ----
  function handleServe(lineId: string) {
    useOrderStore.getState().markItemServed(tableId, lineId)
    toast.success('เสิร์ฟอาหารสำเร็จ')
  }

  // ---- Print Order Invoice (mock) ----
  function printOrderInvoice() {
    const printToastId = toast('กำลังพิมพ์ใบแจ้งหนี้', {
      duration: Infinity,
      icon: React.createElement(Loader, {
        size: 20,
        className: 'animate-spin text-muted-foreground',
      }),
    })

    setTimeout(() => {
      // Mock: 80% success, 20% failure
      if (Math.random() > 0.2) {
        toast.dismiss(printToastId)
        toast('พิมพ์ใบแจ้งหนี้สำเร็จ', {
          icon: React.createElement(CircleCheckBig, {
            size: 20,
            fill: 'var(--status-success)',
            color: 'var(--primary-foreground)',
            strokeWidth: 1.5,
          }),
        })
      } else {
        toast.dismiss(printToastId)
        toast('พิมพ์ใบแจ้งหนี้ไม่สำเร็จ', {
          icon: React.createElement(CircleAlert, {
            size: 20,
            fill: 'var(--destructive)',
            color: 'var(--primary-foreground)',
            strokeWidth: 1.5,
          }),
        })
      }
    }, 2000)
  }

  const label = headerLabel ?? table?.label ?? tableId

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative">

      {/* Close button — absolute top-right */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 size-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      )}

      {/* Content wrapper with padding */}
      <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">

        {/* Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-secondary p-2 rounded-md flex items-center justify-center shrink-0">
            <HandPlatter size={16} className="text-foreground" />
          </div>
          <p className="flex-1 font-semibold text-lg leading-7 truncate">{label}</p>
        </div>

        {/* Scrollable content area */}
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {/* Tab bar */}
          <div className="shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
              <TabsList className="w-full !h-auto p-[3px]">
                <TabsTrigger value="unsent" className="flex-1 gap-2 !h-11">
                  ยังไม่ได้สั่ง
                  {unsentCount > 0 && (
                    <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center px-1">
                      {unsentCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1 gap-2 !h-11">
                  สั่งแล้ว
                  {sentAndVoidedItems.length > 0 && (
                    <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center px-1">
                      {sentAndVoidedItems.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Demo: simulate KDS completing all sent items */}
          {activeTab === 'sent' && inKitchenCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 w-full gap-2 border-dashed border-primary/40 text-primary h-9"
              onClick={handleDemoKdsComplete}
            >
              <ConciergeBell size={14} />
              Demo: ครัวทำเสร็จ {inKitchenCount} รายการ
            </Button>
          )}

          {/* Scrollable body */}
          <ScrollArea className="flex-1 min-h-0">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                <HandPlatter size={28} className="opacity-30" />
                <p className="text-sm">
                  {activeTab === 'unsent' ? 'No unsent items' : 'No sent items'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayItems.map((item) => (
                  <TicketLineItem
                    key={item.lineId}
                    item={item}
                    onRemove={(lineId) => removeItem(tableId, lineId)}
                    onQtyChange={handleQtyChange}
                    onEditTap={onEditLineItem}
                    onVoidTap={(lineId) => setVoidingLineId(lineId)}
                    onServeTap={handleServe}
                    canRemove={canDoAction(role, 'void-pre-send')}
                    showPackToGo={!isTakeaway}
                    onTogglePackToGo={(lineId) => togglePackToGo(tableId, lineId)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Summary rows */}
          <div className="shrink-0">
            <Separator className="mb-2" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-muted-foreground">ยังไม่ได้สั่ง</p>
                <p className="text-sm font-medium tabular-nums text-muted-foreground">฿{unsentTotal.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-muted-foreground">สั่งแล้ว</p>
                <p className="text-sm font-medium tabular-nums text-muted-foreground">฿{sentTotal.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold leading-none">รวม</p>
                <p className="text-base font-semibold text-primary">฿{runningTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-14 text-sm" onClick={onPrintBill} disabled={sentItems.length === 0}>
              <Printer data-icon="inline-start" size={16} />
              พิมพ์ใบแจ้งหนี้
            </Button>
            <Button variant="outline" className="flex-1 h-14 text-sm" onClick={onCheckBill} disabled={sentItems.length === 0}>
              <ReceiptText data-icon="inline-start" size={16} />
              เช็คบิล
            </Button>
          </div>

          {!hideSend && (
            <Button
              className="w-full h-14"
              onClick={handleSend}
              disabled={unsentCount === 0}
            >
              <SendHorizontal data-icon="inline-start" size={16} />
              {sendLabel ?? `ส่งออร์เดอร์เข้าครัว${unsentCount > 0 ? ` ${unsentCount} รายการ` : ''}`}
            </Button>
          )}
        </div>
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
