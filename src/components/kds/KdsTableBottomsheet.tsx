'use client'

import { useMemo, useState } from 'react'
import { X, ReplyAll, HandPlatter, ArrowLeftRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { KdsTicket, useKdsStore } from '@/stores/kds.store'
import { KdsTicketCard } from '@/components/kds/KdsTicketCard'
import { OrderLineItem } from '@/stores/order.store'
import { useKdsTimer } from '@/components/kds/useKdsTimer'
import { useTableStore } from '@/stores/table.store'
import { toast } from 'sonner'

interface TableGroup {
  tableId: string
  tableLabel: string
  tickets: KdsTicket[]
  totalItems: number
  completedItems: number
  earliestAddedAt: number
}

interface KdsTableBottomsheetProps {
  group: TableGroup
  getOrderItems: (ticket: KdsTicket) => OrderLineItem[]
  /** When set, only show cards matching this menu item ID */
  filterMenuItemId?: string
  /** A = default, B = with inline summary sidebar */
  variant?: 'A' | 'B'
  onClose: () => void
  onSendAll: () => void
}

function BottomsheetTimerBadge({ addedAt }: { addedAt: number }) {
  const { display, urgency } = useKdsTimer(addedAt)
  const cls =
    urgency === 'green'
      ? 'bg-[#16a34a] text-white border-transparent'
      : urgency === 'amber'
        ? 'bg-[#d97706] text-white border-transparent'
        : 'bg-[#dc2626] text-white border-transparent'
  return <Badge className={`text-xs font-semibold ${cls}`}>{display}</Badge>
}

function VariantToggle({ variant, onToggle }: { variant: 'A' | 'B'; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      <ArrowLeftRight size={12} />
      Design {variant}
    </button>
  )
}

/** Inline summary sidebar for Design B */
function InlineSummary({ group, getOrderItems }: { group: TableGroup; getOrderItems: (ticket: KdsTicket) => OrderLineItem[] }) {
  const { sendLineItem } = useKdsStore()

  const aggregatedItems = useMemo(() => {
    const map = new Map<string, { menuItemId: string; menuItemName: string; totalQuantity: number; ticketLineIds: { ticketId: string; lineId: string }[] }>()
    for (const ticket of group.tickets) {
      const items = getOrderItems(ticket).filter((i) => i.status !== 'voided' && !(ticket.sentLineIds ?? new Set()).has(i.lineId) && !(ticket.cancelledLineIds ?? new Set()).has(i.lineId))
      for (const item of items) {
        const existing = map.get(item.menuItemId)
        if (existing) {
          existing.totalQuantity += item.quantity
          existing.ticketLineIds.push({ ticketId: ticket.ticketId, lineId: item.lineId })
        } else {
          map.set(item.menuItemId, {
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            totalQuantity: item.quantity,
            ticketLineIds: [{ ticketId: ticket.ticketId, lineId: item.lineId }],
          })
        }
      }
    }
    return Array.from(map.values())
  }, [group.tickets, getOrderItems])

  function handleSendAllItem(item: typeof aggregatedItems[number]) {
    for (const { ticketId, lineId } of item.ticketLineIds) {
      const ticket = group.tickets.find((t) => t.ticketId === ticketId)
      if (!ticket) continue
      const nonVoided = getOrderItems(ticket).filter((i) => i.status !== 'voided')
      const activeCount = nonVoided.filter((i) => !(ticket.cancelledLineIds ?? new Set()).has(i.lineId)).length
      sendLineItem(ticketId, lineId, activeCount)
    }
    useTableStore.getState().updateTable(group.tableId, { orderStage: 'Served' })
    toast.success('ส่งออร์เดอร์สำเร็จ')
  }

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shrink-0 w-[290px] h-full"
      style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
    >
      <div className="p-6 pb-3">
        <span className="text-base font-semibold text-card-foreground">
          สรุปรายการอาหารที่ต้องทำ
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-2 px-6 pb-6 overflow-auto">
        {aggregatedItems.map((item) => (
          <div key={item.menuItemId} className="flex items-center gap-2">
            <div className="flex flex-1 items-center justify-between min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {item.menuItemName}
              </span>
              <Badge variant="outline" className="text-xs font-semibold shrink-0 ml-2">
                {item.totalQuantity}×
              </Badge>
            </div>
            <button
              className="shrink-0 size-9 rounded-md flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 active:scale-[0.97] transition-all"
              onClick={() => handleSendAllItem(item)}
              style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
            >
              <ReplyAll size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KdsTableBottomsheet({ group, getOrderItems, filterMenuItemId, variant: initialVariant = 'A', onClose, onSendAll }: KdsTableBottomsheetProps) {
  const [variant, setVariant] = useState(initialVariant)
  const allItems = group.tickets.flatMap((t) => {
    const items = getOrderItems(t).filter((i) => i.status !== 'voided' && !t.sentLineIds.has(i.lineId))
    return filterMenuItemId ? items.filter((i) => i.menuItemId === filterMenuItemId) : items
  })
  const totalCount = allItems.reduce((sum, i) => sum + i.quantity, 0)

  const isMenuFilter = !!filterMenuItemId
  const uniqueItemNames = [...new Set(allItems.map((i) => i.menuItemName))]
  const menuHeaderName = uniqueItemNames[0] ?? group.tableLabel

  // Design B shows inline summary only for table view (not menu filter)
  const showInlineSummary = variant === 'B' && !isMenuFilter

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet content */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl flex flex-col h-[80vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        {isMenuFilter ? (
          <div className="flex items-center justify-between p-6 pb-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold text-card-foreground">
                {menuHeaderName}
              </span>
              <Badge variant="outline" className="text-xs font-semibold">
                {group.completedItems}/{totalCount}
              </Badge>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-6 pb-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <HandPlatter size={16} className="text-card-foreground" />
              <span className="text-base font-semibold text-card-foreground">
                {group.tableLabel}
              </span>
              <Badge variant="outline" className="text-xs font-semibold">
                {group.completedItems}/{totalCount}
              </Badge>
              <BottomsheetTimerBadge addedAt={group.earliestAddedAt} />
            </div>
            <div className="flex items-center gap-2">
              <VariantToggle variant={variant} onToggle={() => setVariant((v) => v === 'A' ? 'B' : 'A')} />
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Ticket cards + optional inline summary */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className={`flex gap-4 h-full ${showInlineSummary ? '' : ''}`}>
            {/* Cards area */}
            <div className={`bg-muted border border-border rounded-md overflow-hidden ${showInlineSummary ? 'flex-1 min-w-0' : 'w-full'} h-full`}>
              <div className="flex gap-2.5 p-3 overflow-x-auto items-stretch h-full">
                {group.tickets.flatMap((ticket) => {
                  const nonVoided = getOrderItems(ticket).filter((i) => i.status !== 'voided')
                  let items = nonVoided.filter((i) => !ticket.sentLineIds.has(i.lineId))
                  if (filterMenuItemId) items = items.filter((i) => i.menuItemId === filterMenuItemId)
                  const cancelledIds = ticket.cancelledLineIds ?? new Set<string>()
                  const activeCount = nonVoided.filter((i) => !cancelledIds.has(i.lineId)).length
                  return items.map((item) => (
                    <KdsTicketCard
                      key={`${ticket.ticketId}-${item.lineId}`}
                      ticket={ticket}
                      item={item}
                      totalNonVoidedCount={activeCount}
                      hideHeader={!isMenuFilter}
                    />
                  ))
                })}
              </div>
            </div>

            {/* Inline summary sidebar — Design B only */}
            {showInlineSummary && (
              <InlineSummary group={group} getOrderItems={getOrderItems} />
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-col gap-2 p-6 shrink-0">
          <button
            onClick={onSendAll}
            className="flex w-full h-14 items-center justify-center gap-2 rounded-md bg-foreground text-background text-base font-medium hover:bg-foreground/90 active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            <ReplyAll size={16} />
            ส่งทั้งหมด
          </button>
          <button
            onClick={onClose}
            className="flex w-full h-14 items-center justify-center rounded-md border border-input bg-background text-foreground text-base font-medium hover:bg-muted active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}
