'use client'

import type { OrderLineItem } from '@/stores/order.store'
import { buildModifierSummary } from '@/components/order/TicketLineItem'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const formatBaht = (amount: number): string => `฿${amount.toLocaleString()}`

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillLineItemProps {
  item: OrderLineItem
}

// ---------------------------------------------------------------------------
// BillLineItem
// ---------------------------------------------------------------------------

export function BillLineItem({ item }: BillLineItemProps) {
  const modifierSummary = buildModifierSummary(item)

  return (
    <div className="flex items-start justify-between py-3 gap-4">
      {/* Left: item name + modifiers */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{item.menuItemName}</p>
        {modifierSummary && (
          <p className="text-sm text-muted-foreground mt-0.5">{modifierSummary}</p>
        )}
      </div>

      {/* Right: qty × price */}
      <div className="shrink-0 text-sm text-right tabular-nums">
        {item.quantity} × {formatBaht(item.basePrice * item.quantity)}
      </div>
    </div>
  )
}
