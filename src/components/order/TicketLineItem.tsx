'use client'

import { TrashBinTrashLinear } from 'solar-icon-set'
import { Badge } from '@/components/ui/badge'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Helper: build modifier summary string
// "Tonkotsu • Spice 3 • Katame • +Extra Chashu, +Egg"
// ---------------------------------------------------------------------------

export function buildModifierSummary(item: OrderLineItem): string {
  const parts: string[] = []

  // Broth
  const brothMod = item.modifiers.find((m) => m.groupId === 'broth')
  if (brothMod) parts.push(brothMod.optionLabel)

  // Spice level
  if (item.spiceLevel !== null) parts.push(`Spice ${item.spiceLevel}`)

  // Noodle firmness
  const firmnessMod = item.modifiers.find((m) => m.groupId === 'noodle-firmness')
  if (firmnessMod) parts.push(firmnessMod.optionLabel)

  // Toppings
  const toppingMods = item.modifiers.filter((m) => m.groupId === 'toppings')
  if (toppingMods.length > 0) {
    parts.push(toppingMods.map((t) => `+${t.optionLabel}`).join(', '))
  }

  // Special request (truncated to 20 chars)
  if (item.specialRequest && item.specialRequest.trim().length > 0) {
    const req = item.specialRequest.trim()
    parts.push(`"${req.length > 20 ? req.slice(0, 20) + '…' : req}"`)
  }

  return parts.join(' • ')
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
  canRemove?: boolean  // role-gated: false disables the pre-send trash and void buttons
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

  const outerClass =
    item.status === 'voided'
      ? 'opacity-40'
      : item.status === 'sent'
        ? 'opacity-60'
        : ''

  const nameClass =
    item.status === 'voided'
      ? 'text-sm font-medium line-through'
      : 'text-sm font-medium'

  return (
    <div className={outerClass}>
      <div className="flex items-start gap-2 px-4 py-3 border-b">
        {/* Left: item info — tappable for unsent items */}
        {item.status === 'unsent' ? (
          <button
            className="flex-1 text-left"
            onClick={() => onEditTap(item.lineId)}
          >
            <div className="flex items-center gap-1 flex-wrap">
              <span className={nameClass}>{item.menuItemName}</span>
            </div>
            {modifierSummary && (
              <p className="text-xs text-muted-foreground mt-0.5">{modifierSummary}</p>
            )}
          </button>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className={nameClass}>{item.menuItemName}</span>
              {item.status === 'voided' && (
                <Badge variant="destructive" className="text-xs ml-1">Voided</Badge>
              )}
            </div>
            {modifierSummary && (
              <p className="text-xs text-muted-foreground mt-0.5">{modifierSummary}</p>
            )}
          </div>
        )}

        {/* Right: controls */}
        {item.status === 'unsent' && (
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {/* Qty controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onQtyChange(item.lineId, -1)}
                className="w-6 h-6 flex items-center justify-center rounded border border-border text-sm hover:bg-accent transition-colors"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center text-sm tabular-nums">{item.quantity}</span>
              <button
                onClick={() => onQtyChange(item.lineId, 1)}
                className="w-6 h-6 flex items-center justify-center rounded border border-border text-sm hover:bg-accent transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {/* Trash */}
            <button
              onClick={() => canRemove && onRemove(item.lineId)}
              disabled={!canRemove}
              className="w-7 h-7 flex items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors ml-1 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Remove item"
            >
              <TrashBinTrashLinear size={15} />
            </button>
          </div>
        )}

        {item.status === 'sent' && (
          <button
            onClick={() => canRemove && onVoidTap(item.lineId)}
            disabled={!canRemove}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors shrink-0 mt-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Void item"
          >
            <TrashBinTrashLinear size={15} />
          </button>
        )}

        {/* voided — no controls */}
      </div>
    </div>
  )
}
