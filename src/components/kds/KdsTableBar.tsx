'use client'

import { useMemo, useState } from 'react'
import { HandPlatter, ReplyAll, CircleX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { KdsTicket, useKdsStore } from '@/stores/kds.store'
import { useTableStore } from '@/stores/table.store'
import { useKdsTimer } from '@/components/kds/useKdsTimer'
import { OrderLineItem } from '@/stores/order.store'
import { KdsTableBottomsheet } from '@/components/kds/KdsTableBottomsheet'
import { KdsTableSendConfirmDialog } from '@/components/kds/KdsTableSendConfirmDialog'
import { toast } from 'sonner'

interface KdsTableBarProps {
  tickets: KdsTicket[]
  getOrderItems: (ticket: KdsTicket) => OrderLineItem[]
}

export interface TableGroup {
  tableId: string
  tableLabel: string
  tickets: KdsTicket[]
  totalItems: number
  completedItems: number
  earliestAddedAt: number
  /** True when all non-voided, non-sent items for this table are cancelled */
  allCancelled: boolean
  /** True when all cancelled items have been acknowledged via cancel info dialog */
  allAcknowledged: boolean
}

function TableBarCard({
  group,
  onCardClick,
  onSendAll,
}: {
  group: TableGroup
  onCardClick: () => void
  onSendAll: (e: React.MouseEvent) => void
}) {
  const { display, urgency } = useKdsTimer(group.earliestAddedAt)

  // All-cancelled + all-acknowledged variant (disabled, will auto-disappear)
  if (group.allCancelled && group.allAcknowledged) {
    return (
      <div
        className="bg-card border border-border rounded-xl overflow-hidden flex items-center p-4 shrink-0 opacity-30 pointer-events-none transition-opacity duration-500"
        style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-card border border-input flex items-center justify-center rounded-md shrink-0 size-9">
            <HandPlatter size={16} className="text-foreground" />
          </div>
          <span className="font-semibold text-base text-card-foreground whitespace-nowrap">
            {group.tableLabel}
          </span>
          <Badge className="bg-[#dc2626] text-white border-transparent text-xs font-semibold shrink-0 gap-1">
            <CircleX size={12} />
            ออร์เดอร์ถูกยกเลิก
          </Badge>
        </div>
      </div>
    )
  }

  // All-cancelled variant (clickable)
  if (group.allCancelled) {
    return (
      <div
        className="bg-card border border-border rounded-xl overflow-hidden flex items-center p-4 shrink-0 cursor-pointer hover:bg-accent/50 transition-colors"
        style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
        onClick={onCardClick}
      >
        <div className="flex items-center gap-2">
          <div
            className="bg-card border border-input flex items-center justify-center rounded-md shrink-0 size-9"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            <HandPlatter size={16} className="text-foreground" />
          </div>
          <span className="font-semibold text-base text-card-foreground whitespace-nowrap">
            {group.tableLabel}
          </span>
          <Badge className="bg-[#dc2626] text-white border-transparent text-xs font-semibold shrink-0 gap-1">
            <CircleX size={12} />
            ออร์เดอร์ถูกยกเลิก
          </Badge>
        </div>
      </div>
    )
  }

  const timerBadgeClass =
    urgency === 'green'
      ? 'bg-[#16a34a] text-white border-transparent'
      : urgency === 'amber'
        ? 'bg-[#d97706] text-white border-transparent'
        : 'bg-[#dc2626] text-white border-transparent'

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex items-center gap-4 p-4 shrink-0 cursor-pointer hover:bg-accent/50 transition-colors"
      style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
      onClick={onCardClick}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="bg-card border border-input flex items-center justify-center rounded-md shrink-0 size-9"
          style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
        >
          <HandPlatter size={16} className="text-foreground" />
        </div>
        <span className="font-semibold text-base text-card-foreground whitespace-nowrap">
          {group.tableLabel}
        </span>
        <Badge variant="outline" className="text-xs font-semibold shrink-0">
          {group.completedItems}/{group.totalItems}
        </Badge>
        <Badge className={`text-xs font-semibold shrink-0 ${timerBadgeClass}`}>
          {display}
        </Badge>
      </div>

      <button
        className="shrink-0 size-9 rounded-md flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 active:scale-[0.97] transition-all"
        onClick={onSendAll}
        style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
      >
        <ReplyAll size={16} />
      </button>
    </div>
  )
}

export function KdsTableBar({ tickets, getOrderItems }: KdsTableBarProps) {
  const { sendAllTableTickets } = useKdsStore()
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [confirmGroup, setConfirmGroup] = useState<TableGroup | null>(null)

  const tableGroups = useMemo(() => {
    const map = new Map<string, TableGroup>()
    for (const ticket of tickets) {
      const items = getOrderItems(ticket)
      const nonVoided = items.filter((i) => i.status !== 'voided')
      const cancelledIds = ticket.cancelledLineIds ?? new Set<string>()
      const sentIds = ticket.sentLineIds ?? new Set<string>()
      const activeItems = nonVoided.filter((i) => !cancelledIds.has(i.lineId) && !sentIds.has(i.lineId))
      const completed = nonVoided.filter((i) => ticket.checkedItems.has(i.lineId))

      const existing = map.get(ticket.tableId)
      if (existing) {
        existing.tickets.push(ticket)
        existing.totalItems += activeItems.length
        existing.completedItems += completed.length
        if (ticket.addedAt < existing.earliestAddedAt) {
          existing.earliestAddedAt = ticket.addedAt
        }
      } else {
        map.set(ticket.tableId, {
          tableId: ticket.tableId,
          tableLabel: ticket.tableLabel,
          tickets: [ticket],
          totalItems: activeItems.length,
          completedItems: completed.length,
          earliestAddedAt: ticket.addedAt,
          allCancelled: false,
          allAcknowledged: false,
        })
      }
    }
    // Compute allCancelled and allAcknowledged for each group
    for (const group of map.values()) {
      const unsent = group.tickets.flatMap((t) => {
        const cancelledIds = t.cancelledLineIds ?? new Set<string>()
        const sentIds = t.sentLineIds ?? new Set<string>()
        const acknowledgedIds = t.acknowledgedCancelLineIds ?? new Set<string>()
        return getOrderItems(t).filter((i) => i.status !== 'voided' && !sentIds.has(i.lineId))
          .map((i) => ({ lineId: i.lineId, isCancelled: cancelledIds.has(i.lineId), isAcknowledged: acknowledgedIds.has(i.lineId) }))
      })
      group.allCancelled = unsent.length > 0 && unsent.every((i) => i.isCancelled)
      group.allAcknowledged = group.allCancelled && unsent.every((i) => i.isAcknowledged)
    }
    return Array.from(map.values())
  }, [tickets, getOrderItems])

  if (tableGroups.length === 0) return null

  function doSendAll(group: TableGroup) {
    sendAllTableTickets(group.tableId)
    useTableStore.getState().updateTable(group.tableId, { orderStage: 'Served' })
    toast.success('ส่งออร์เดอร์สำเร็จ')
    setSelectedTableId(null)
    setConfirmGroup(null)
  }

  function handleReplyAllClick(group: TableGroup, e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmGroup(group)
  }

  const selectedGroup = selectedTableId
    ? tableGroups.find((g) => g.tableId === selectedTableId)
    : null

  return (
    <>
      {/* Bottom bar */}
      <div className="shrink-0 flex items-center gap-4 overflow-x-auto px-6 py-2">
        {tableGroups.map((group) => (
          <TableBarCard
            key={group.tableId}
            group={group}
            onCardClick={() => setSelectedTableId(group.tableId)}
            onSendAll={(e) => handleReplyAllClick(group, e)}
          />
        ))}
      </div>

      {/* Table bottomsheet — opens on card click */}
      {selectedGroup && !confirmGroup && (
        <KdsTableBottomsheet
          group={selectedGroup}
          getOrderItems={getOrderItems}
          onClose={() => setSelectedTableId(null)}
          onSendAll={() => setConfirmGroup(selectedGroup)}
        />
      )}

      {/* Table send confirm dialog */}
      {confirmGroup && (
        <KdsTableSendConfirmDialog
          tableLabel={confirmGroup.tableLabel}
          totalCount={confirmGroup.totalItems}
          onConfirm={() => doSendAll(confirmGroup)}
          onCancel={() => setConfirmGroup(null)}
        />
      )}
    </>
  )
}
