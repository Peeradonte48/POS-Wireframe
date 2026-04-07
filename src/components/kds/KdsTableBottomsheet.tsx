'use client'

import { X, ReplyAll, HandPlatter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { KdsTicket } from '@/stores/kds.store'
import { KdsTicketCard } from '@/components/kds/KdsTicketCard'
import { OrderLineItem } from '@/stores/order.store'
import { useKdsTimer } from '@/components/kds/useKdsTimer'

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
  onClose: () => void
  onSendAll: () => void
}

function BottomsheetHeader({ group, totalCount, onClose }: { group: TableGroup; totalCount: number; onClose: () => void }) {
  const { display, urgency } = useKdsTimer(group.earliestAddedAt)

  const timerBadgeClass =
    urgency === 'green'
      ? 'bg-[#16a34a] text-white border-transparent'
      : urgency === 'amber'
        ? 'bg-[#d97706] text-white border-transparent'
        : 'bg-[#dc2626] text-white border-transparent'

  return (
    <div className="flex items-center justify-between p-6 pb-4 shrink-0">
      <div className="flex items-center gap-1.5">
        <HandPlatter size={16} className="text-card-foreground" />
        <span className="text-base font-semibold text-card-foreground">
          {group.tableLabel}
        </span>
        <Badge variant="outline" className="text-xs font-semibold">
          {group.completedItems}/{totalCount}
        </Badge>
        <Badge className={`text-xs font-semibold ${timerBadgeClass}`}>
          {display}
        </Badge>
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function KdsTableBottomsheet({ group, getOrderItems, filterMenuItemId, onClose, onSendAll }: KdsTableBottomsheetProps) {
  const allItems = group.tickets.flatMap((t) => {
    const items = getOrderItems(t).filter((i) => i.status !== 'voided' && !t.sentLineIds.has(i.lineId))
    return filterMenuItemId ? items.filter((i) => i.menuItemId === filterMenuItemId) : items
  })
  const totalCount = allItems.reduce((sum, i) => sum + i.quantity, 0)

  // Use menu-item header when filtering, table header when showing all
  const isMenuFilter = !!filterMenuItemId
  const uniqueItemNames = [...new Set(allItems.map((i) => i.menuItemName))]
  const menuHeaderName = uniqueItemNames[0] ?? group.tableLabel

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet content */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl flex flex-col h-[80vh] animate-in slide-in-from-bottom duration-200">
        {/* Header — table-style or menu-item-style */}
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
          <BottomsheetHeader group={group} totalCount={totalCount} onClose={onClose} />
        )}

        {/* Ticket cards */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="bg-muted border border-border rounded-md overflow-hidden h-full">
            <div className="flex gap-2.5 p-3 overflow-x-auto items-stretch h-full">
              {group.tickets.flatMap((ticket) => {
                const nonVoided = getOrderItems(ticket).filter((i) => i.status !== 'voided')
                let unsent = nonVoided.filter((i) => !ticket.sentLineIds.has(i.lineId))
                if (filterMenuItemId) unsent = unsent.filter((i) => i.menuItemId === filterMenuItemId)
                return unsent.map((item) => (
                  <KdsTicketCard
                    key={`${ticket.ticketId}-${item.lineId}`}
                    ticket={ticket}
                    item={item}
                    totalNonVoidedCount={nonVoided.length}
                    hideHeader={!isMenuFilter}
                  />
                ))
              })}
            </div>
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
