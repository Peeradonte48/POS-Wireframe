'use client'

import Image from 'next/image'
import { Trash2, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrderLineItem } from '@/stores/order.store'
import { MENU_ITEMS } from '@/lib/mock-data/menu'

// ---------------------------------------------------------------------------
// Module-level lookups (stable, no re-computation per render)
// ---------------------------------------------------------------------------

const MENU_ITEM_MAP = new Map(MENU_ITEMS.map((m) => [m.id, m]))

const MODIFIER_ICON_MAP = new Map<string, string>()
for (const menuItem of MENU_ITEMS) {
  for (const group of menuItem.modifierGroups) {
    if (group.icon && !MODIFIER_ICON_MAP.has(group.id)) {
      MODIFIER_ICON_MAP.set(group.id, group.icon)
    }
  }
}

// ---------------------------------------------------------------------------
// Helper: build modifier summary string (kept for backward-compat)
// ---------------------------------------------------------------------------

export function buildModifierSummary(item: OrderLineItem): string {
  const parts: string[] = []
  if (item.modifiers.length > 0) {
    parts.push(item.modifiers.map((m) => m.optionLabel).join(' · '))
  }
  if (item.specialRequest && item.specialRequest.trim().length > 0) {
    const req = item.specialRequest.trim()
    parts.push(`"${req.length > 20 ? req.slice(0, 20) + '…' : req}"`)
  }
  return parts.join(' · ')
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ItemThumbnail({ item }: { item: OrderLineItem }) {
  const menuItem = MENU_ITEM_MAP.get(item.menuItemId)
  return (
    <div className="w-[60px] h-[60px] rounded-xl overflow-hidden shrink-0 bg-muted relative">
      {menuItem?.imagePath ? (
        <Image
          src={menuItem.imagePath}
          alt={item.menuItemName}
          fill
          className="object-cover"
          sizes="60px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {menuItem?.thumbnailPlaceholder ?? '🍜'}
        </div>
      )}
    </div>
  )
}

function ModifierChips({ item }: { item: OrderLineItem }) {
  if (item.modifiers.length === 0 && !item.specialRequest?.trim()) return null
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
      {item.modifiers.map((mod) => {
        const icon = MODIFIER_ICON_MAP.get(mod.groupId) ?? '·'
        return (
          <span key={`${mod.groupId}-${mod.optionId}`} className="text-[11px] text-muted-foreground flex items-center gap-0.5">
            <span className="text-[11px] leading-none">{icon}</span>
            <span>{mod.optionLabel}</span>
          </span>
        )
      })}
      {item.specialRequest?.trim() && (
        <span className="text-[11px] text-muted-foreground italic">
          &ldquo;{item.specialRequest.trim().slice(0, 20)}{item.specialRequest.trim().length > 20 ? '…' : ''}&rdquo;
        </span>
      )}
    </div>
  )
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
  canVoidSent?: boolean
  showPackToGo?: boolean
  onTogglePackToGo?: (lineId: string) => void
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
  canVoidSent = false,
  showPackToGo = false,
  onTogglePackToGo,
}: TicketLineItemProps) {
  const lineTotal = (item.basePrice * item.quantity).toFixed(0)

  // ── Voided ──────────────────────────────────────────────────────────────
  if (item.status === 'voided') {
    return (
      <div className="flex items-start gap-3 px-4 py-3 border-b opacity-40">
        <ItemThumbnail item={item} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2">
            <span className="text-sm line-through text-muted-foreground">{item.menuItemName}</span>
            <span className="text-sm text-muted-foreground shrink-0">฿{lineTotal}</span>
          </div>
          <Badge variant="destructive" className="text-[10px] px-1.5 mt-1">Voided</Badge>
        </div>
      </div>
    )
  }

  // ── Sent ────────────────────────────────────────────────────────────────
  if (item.status === 'sent') {
    return (
      <div className="flex items-start gap-3 px-4 py-3 border-b">
        <ItemThumbnail item={item} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold leading-snug">{item.menuItemName}</span>
            <span className="text-sm font-bold shrink-0">฿{lineTotal}</span>
          </div>
          <ModifierChips item={item} />
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0 bg-muted rounded-lg p-0.5">
              <span className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/50 text-base font-medium">−</span>
              <span className="w-6 text-center text-sm font-bold tabular-nums text-muted-foreground">{item.quantity}</span>
              <span className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground/50 text-base font-medium">+</span>
            </div>
            <div className="flex-1" />
            {showPackToGo && (
              <button
                onClick={() => onTogglePackToGo?.(item.lineId)}
                className={cn(
                  'h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-[11px] font-medium transition-colors',
                  item.packToGo
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
                )}
                aria-label={item.packToGo ? 'Remove pack-to-go flag' : 'Flag as pack-to-go'}
              >
                <ShoppingBag size={12} />
                ส่งกลับบ้าน
              </button>
            )}
            {canVoidSent && (
              <button
                onClick={() => onVoidTap(item.lineId)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Void item"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Unsent ──────────────────────────────────────────────────────────────
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b">
      <ItemThumbnail item={item} />

      <div className="flex-1 min-w-0">
        {/* Name + price */}
        <button className="w-full text-left" onClick={() => onEditTap(item.lineId)}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug">{item.menuItemName}</p>
            <span className="text-sm font-bold shrink-0">฿{lineTotal}</span>
          </div>
        </button>

        {/* Modifier chips */}
        <ModifierChips item={item} />

        {/* Stepper + actions */}
        <div className="flex items-center gap-2 mt-2">
          {/* Stepper pill */}
          <div className="flex items-center gap-0 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => onQtyChange(item.lineId, -1)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-card transition-colors text-base font-medium leading-none"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
            <button
              onClick={() => onQtyChange(item.lineId, 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-card transition-colors text-base font-medium leading-none"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <div className="flex-1" />

          {/* Pack-to-go labeled button (dine-in only) */}
          {showPackToGo && (
            <button
              onClick={() => onTogglePackToGo?.(item.lineId)}
              className={cn(
                'h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-[11px] font-medium transition-colors',
                item.packToGo
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
              )}
              aria-label={item.packToGo ? 'Remove pack-to-go flag' : 'Flag as pack-to-go'}
            >
              <ShoppingBag size={12} />
              ส่งกลับบ้าน
            </button>
          )}

          {/* Trash */}
          <button
            onClick={() => canRemove && onRemove(item.lineId)}
            disabled={!canRemove}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Remove item"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
