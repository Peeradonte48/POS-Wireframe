'use client'

import { KdsTicket, useKdsStore } from '@/stores/kds.store'
import { useKdsTimer } from '@/components/kds/useKdsTimer'
import { KdsItemRow } from '@/components/kds/KdsItemRow'
import { OrderLineItem } from '@/stores/order.store'
import { HandPlatter, SendHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface KdsTicketCardProps {
  ticket: KdsTicket
  /** Single menu item to display in this card */
  item: OrderLineItem
  totalNonVoidedCount?: number
  /** Hide the colored table header — used inside table bottomsheet */
  hideHeader?: boolean
}

const URGENCY_HEADER_COLORS = {
  green: 'bg-[#16a34a]',
  amber: 'bg-[#d97706]',
  red: 'bg-[#dc2626]',
} as const

export function KdsTicketCard({ ticket, item, totalNonVoidedCount, hideHeader }: KdsTicketCardProps) {
  const { sendLineItem } = useKdsStore()
  const { display, urgency } = useKdsTimer(ticket.addedAt)

  function handleSend() {
    sendLineItem(ticket.ticketId, item.lineId, totalNonVoidedCount ?? 1)
    toast.success('ส่งออร์เดอร์สำเร็จ')
  }

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shrink-0 w-[240px] min-w-[240px] self-stretch"
      style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
    >
      {/* ── Card Header — colored by urgency (hidden inside table bottomsheet) ── */}
      {!hideHeader && (
        <div className={`${URGENCY_HEADER_COLORS[urgency]} flex items-center justify-between gap-2 p-4`}>
          <div className="flex items-center gap-1.5">
            <div
              className="bg-white/20 border border-white/10 flex items-center justify-center rounded-md shrink-0 size-9"
              style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
            >
              <HandPlatter size={16} className="text-white" />
            </div>
            <span className="font-semibold text-base text-white">{ticket.tableLabel}</span>
          </div>
          <Badge
            variant="outline"
            className="bg-white border-border text-foreground text-xs font-semibold"
          >
            {display}
          </Badge>
        </div>
      )}

      {/* ── Card Body — single item with modifiers ── */}
      <div className="flex-1 flex flex-col gap-4 overflow-auto p-4">
        <KdsItemRow item={item} />
      </div>

      {/* ── Card Footer — Send button ── */}
      <div className="border-t border-border p-4">
        <button
          onClick={handleSend}
          className="flex w-full h-14 items-center justify-center gap-2 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 active:scale-[0.97] transition-all"
          style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
        >
          <SendHorizontal size={16} />
          ส่งออร์เดอร์
        </button>
      </div>
    </div>
  )
}
