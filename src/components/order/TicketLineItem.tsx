'use client'

import { TrashBinTrashLinear } from 'solar-icon-set'
import { Badge } from '@/components/ui/badge'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Helper: build modifier summary string
// ---------------------------------------------------------------------------

export function buildModifierSummary(item: OrderLineItem): string {
  const parts: string[] = []

  const brothMod = item.modifiers.find((m) => m.groupId === 'broth')
  if (brothMod) parts.push(brothMod.optionLabel)

  if (item.spiceLevel !== null) parts.push(`Spice ${item.spiceLevel}`)

  const firmnessMod = item.modifiers.find((m) => m.groupId === 'noodle-firmness')
  if (firmnessMod) parts.push(firmnessMod.optionLabel)

  const toppingMods = item.modifiers.filter((m) => m.groupId === 'toppings')
  if (toppingMods.length > 0) {
    parts.push(toppingMods.map((t) => `+${t.optionLabel}`).join(', '))
  }

  if (item.specialRequest && item.specialRequest.trim().length > 0) {
    const req = item.specialRequest.trim()
    parts.push(`"${req.length > 20 ? req.slice(0, 20) + '…' : req}"`)
  }

  return parts.join(' · ')
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TicketLineItemProps {
  item: OrderLineItem
  onRemove: (lineId: string) => void
  onQtyChange: (lineId: string, delta: number) => void
  onEditTap: (lineId: string) => void
  onVoidTap: (lineId: string) => void
  canRemove?: boolean
}

// ---------------------------------------------------------------------------
// TicketLineItem
// ---------------------------------------------------------------------------

export function TicketLineItem({
  item,
  onRemove,
  onQtyChange,
  onEditTap,
  onVoidTap,
  canRemove = true,
}: TicketLineItemProps) {
  const modifierSummary = buildModifierSummary(item)
  const lineTotal = (item.basePrice * item.quantity).toFixed(0)

  // ── Voided ──────────────────────────────────────────────────────────────
  if (item.status === 'voided') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 border-b opacity-40">
        <span className="flex-1 text-sm line-through text-muted-foreground">
          {item.quantity} × {item.menuItemName}
        </span>
        <span className="text-sm text-muted-foreground">฿{lineTotal}</span>
        <Badge variant="destructive" className="text-[10px] px-1.5">Voided</Badge>
      </div>
    )
  }

  // ── Sent ────────────────────────────────────────────────────────────────
  if (item.status === 'sent') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 border-b">
        <span className="flex-1 text-sm text-muted-foreground truncate">
          {item.quantity} × {item.menuItemName}
        </span>
        <span className="text-sm text-muted-foreground shrink-0">฿{lineTotal}</span>
        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
          Sent
        </span>
        <button
          onClick={() => canRemove && onVoidTap(item.lineId)}
          disabled={!canRemove}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          aria-label="Void item"
        >
          <TrashBinTrashLinear size={14} />
        </button>
      </div>
    )
  }

  // ── Unsent ──────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-3 border-b">
      {/* Row 1: name + total price */}
      <div className="flex items-start gap-2">
        <button
          className="flex-1 text-left"
          onClick={() => onEditTap(item.lineId)}
        >
          <p className="text-sm font-semibold leading-snug">{item.menuItemName}</p>
          {modifierSummary && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{modifierSummary}</p>
          )}
        </button>
        <span className="text-sm font-bold shrink-0 pt-0.5">฿{lineTotal}</span>
      </div>

      {/* Row 2: qty stepper + trash */}
      <div className="flex items-center gap-2 mt-2">
        {/* Stepper pill */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => onQtyChange(item.lineId, -1)}
            className="w-9 h-11 flex items-center justify-center rounded-md hover:bg-card transition-colors text-base font-medium leading-none"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
          <button
            onClick={() => onQtyChange(item.lineId, 1)}
            className="w-9 h-11 flex items-center justify-center rounded-md hover:bg-card transition-colors text-base font-medium leading-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <div className="flex-1" />

        {/* Trash */}
        <button
          onClick={() => canRemove && onRemove(item.lineId)}
          disabled={!canRemove}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Remove item"
        >
          <TrashBinTrashLinear size={15} />
        </button>
      </div>
    </div>
  )
}
