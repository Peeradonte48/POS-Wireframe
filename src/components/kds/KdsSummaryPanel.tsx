'use client'

import { useMemo, useState, Fragment } from 'react'
import { Inbox, ReplyAll } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderLineItem } from '@/stores/order.store'
import { KdsTicket, useKdsStore } from '@/stores/kds.store'
import { KdsSendConfirmDialog } from '@/components/kds/KdsSendConfirmDialog'
import { KdsTableBottomsheet } from '@/components/kds/KdsTableBottomsheet'
import { toast } from 'sonner'

const TIME_GROUP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

interface KdsSummaryPanelProps {
  tickets: KdsTicket[]
  getOrderItems: (ticket: KdsTicket) => OrderLineItem[]
}

export interface AggregatedItem {
  menuItemId: string
  menuItemName: string
  totalQuantity: number
  ticketIds: string[]
}

interface TimeGroup {
  /** Timestamp of the first order in this group */
  startedAt: number
  /** Formatted time string HH:MM */
  timeLabel: string
  items: AggregatedItem[]
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function KdsSummaryPanel({ tickets, getOrderItems }: KdsSummaryPanelProps) {
  const [pendingSend, setPendingSend] = useState<AggregatedItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<AggregatedItem | null>(null)

  // Group orders by 5-minute time windows, then aggregate items within each group
  const timeGroups = useMemo(() => {
    // Collect all (ticket, item) pairs sorted by ticket addedAt
    const entries: { ticket: KdsTicket; item: OrderLineItem }[] = []
    for (const ticket of tickets) {
      const items = getOrderItems(ticket)
      for (const item of items) {
        if (item.status === 'voided' || ticket.sentLineIds.has(item.lineId) || (ticket.cancelledLineIds ?? new Set()).has(item.lineId)) continue
        entries.push({ ticket, item })
      }
    }
    entries.sort((a, b) => a.ticket.addedAt - b.ticket.addedAt)

    // Build time groups
    const groups: TimeGroup[] = []

    for (const { ticket, item } of entries) {
      // Find an existing group where this ticket's time falls within 5 min of group start
      let targetGroup = groups.find(
        (g) => ticket.addedAt - g.startedAt < TIME_GROUP_WINDOW_MS,
      )
      if (!targetGroup) {
        targetGroup = {
          startedAt: ticket.addedAt,
          timeLabel: `${formatTime(ticket.addedAt)} - ${formatTime(ticket.addedAt + TIME_GROUP_WINDOW_MS)}`,
          items: [],
        }
        groups.push(targetGroup)
      }

      // Aggregate within the group by menuItemId
      const existing = targetGroup.items.find((a) => a.menuItemId === item.menuItemId)
      if (existing) {
        existing.totalQuantity += item.quantity
        if (!existing.ticketIds.includes(ticket.ticketId)) {
          existing.ticketIds.push(ticket.ticketId)
        }
      } else {
        targetGroup.items.push({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          totalQuantity: item.quantity,
          ticketIds: [ticket.ticketId],
        })
      }
    }

    return groups
  }, [tickets, getOrderItems])

  const hasItems = timeGroups.length > 0

  // Build affected tables for the confirm dialog
  const affectedTables = useMemo(() => {
    const target = pendingSend ?? selectedItem
    if (!target) return []
    const tableMap = new Map<string, { tableLabel: string; itemCount: number; earliestAddedAt: number }>()
    for (const ticketId of target.ticketIds) {
      const ticket = tickets.find((t) => t.ticketId === ticketId)
      if (!ticket) continue
      const items = getOrderItems(ticket).filter((i) => i.status !== 'voided' && i.menuItemId === target.menuItemId && !ticket.sentLineIds.has(i.lineId) && !(ticket.cancelledLineIds ?? new Set()).has(i.lineId))
      const count = items.reduce((sum, i) => sum + i.quantity, 0)
      const existing = tableMap.get(ticket.tableId)
      if (existing) {
        existing.itemCount += count
        if (ticket.addedAt < existing.earliestAddedAt) existing.earliestAddedAt = ticket.addedAt
      } else {
        tableMap.set(ticket.tableId, {
          tableLabel: ticket.tableLabel,
          itemCount: count,
          earliestAddedAt: ticket.addedAt,
        })
      }
    }
    return Array.from(tableMap.values())
  }, [pendingSend, selectedItem, tickets, getOrderItems])

  // Build a table group for the bottomsheet from the selected aggregated item
  const bottomsheetGroup = useMemo(() => {
    if (!selectedItem) return null
    const relevantTickets = selectedItem.ticketIds
      .map((id) => tickets.find((t) => t.ticketId === id))
      .filter((t): t is KdsTicket => t != null)

    const totalItems = relevantTickets.reduce((sum, t) => {
      const items = getOrderItems(t).filter((i) => i.status !== 'voided' && i.menuItemId === selectedItem.menuItemId && !t.sentLineIds.has(i.lineId) && !(t.cancelledLineIds ?? new Set()).has(i.lineId))
      return sum + items.length
    }, 0)

    const earliestAddedAt = Math.min(...relevantTickets.map((t) => t.addedAt))

    return {
      tableId: selectedItem.menuItemId,
      tableLabel: selectedItem.menuItemName,
      tickets: relevantTickets,
      totalItems,
      completedItems: 0,
      earliestAddedAt,
    }
  }, [selectedItem, tickets, getOrderItems])

  function handleConfirmSend() {
    if (!pendingSend) return
    const { sendLineItem } = useKdsStore.getState()
    for (const ticketId of pendingSend.ticketIds) {
      const ticket = tickets.find((t) => t.ticketId === ticketId)
      if (!ticket) continue
      const allItems = getOrderItems(ticket)
      const nonVoided = allItems.filter((i) => i.status !== 'voided')
      const matchingItems = nonVoided.filter((i) => i.menuItemId === pendingSend.menuItemId && !ticket.sentLineIds.has(i.lineId))
      for (const item of matchingItems) {
        sendLineItem(ticketId, item.lineId, nonVoided.length)
      }
    }
    toast.success('ส่งออร์เดอร์สำเร็จ')
    setPendingSend(null)
    setSelectedItem(null)
  }

  function handleBottomsheetSendAll() {
    if (selectedItem) {
      setPendingSend(selectedItem)
    }
  }

  return (
    <>
      <div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shrink-0 w-[290px] max-w-[384px] h-full"
        style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <span className="text-base font-semibold text-card-foreground">
            สรุปรายการอาหารที่ต้องทำ
          </span>
        </div>

        {hasItems ? (
          <div className="flex-1 flex flex-col p-6 pt-3 overflow-auto">
            {timeGroups.map((group, groupIdx) => (
              <Fragment key={group.startedAt}>
                {/* Time separator */}
                <div className="relative my-3">
                  <Separator />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
                    <span className="text-xs text-muted-foreground">{group.timeLabel}</span>
                  </div>
                </div>

                {/* Items in this time group */}
                <div className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <div
                      key={`${groupIdx}-${item.menuItemId}`}
                      className="flex items-center gap-2 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors p-1 -mx-1"
                      onClick={() => setSelectedItem(item)}
                    >
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
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingSend(item)
                        }}
                        style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
                      >
                        <ReplyAll size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            <div
              className="bg-card border border-border flex items-center justify-center p-2 rounded-md size-12"
              style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
            >
              <Inbox size={24} className="text-foreground" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center w-full">
              <p className="text-xl font-semibold text-foreground">
                ยังไม่มีรายการอาหารที่ต้องทำ
              </p>
              <p className="text-sm text-muted-foreground">
                รายการอาหารใหม่จะปรากฏที่นี่โดยอัตโนมัติ
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottomsheet — opens when clicking a menu item row */}
      {selectedItem && bottomsheetGroup && !pendingSend && (
        <KdsTableBottomsheet
          group={bottomsheetGroup}
          getOrderItems={getOrderItems}
          filterMenuItemId={selectedItem.menuItemId}
          onClose={() => setSelectedItem(null)}
          onSendAll={handleBottomsheetSendAll}
        />
      )}

      {/* Send confirmation dialog */}
      {pendingSend && (
        <KdsSendConfirmDialog
          itemName={pendingSend.menuItemName}
          totalCount={pendingSend.totalQuantity}
          affectedTables={affectedTables}
          onConfirm={handleConfirmSend}
          onCancel={() => setPendingSend(null)}
        />
      )}
    </>
  )
}
