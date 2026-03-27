'use client'

import type { LucideIcon } from 'lucide-react'
import { Shell, Soup, Ham, Salad, Flame, Droplets, Sprout, Tag } from 'lucide-react'
import type { OrderLineItem } from '@/stores/order.store'
import { MENU_ITEMS } from '@/lib/mock-data/menu'

// ---------------------------------------------------------------------------
// Modifier group → icon mapping
// ---------------------------------------------------------------------------

const MODIFIER_ICONS: Record<string, LucideIcon> = {
  'noodle-firmness': Shell,
  'broth-richness': Soup,
  'chashu': Ham,
  'onion': Salad,
  'spice-level': Flame,
  'garlic': Sprout,
  'broth-oil': Droplets,
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillLineItemProps {
  item: OrderLineItem
  qty?: number  // override item.quantity (for item-split per-bill display)
}

// ---------------------------------------------------------------------------
// BillLineItem
// ---------------------------------------------------------------------------

export function BillLineItem({ item, qty: qtyOverride }: BillLineItemProps) {
  const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
  const imagePath = menuItem?.imagePath
  const qty = qtyOverride ?? item.quantity

  return (
    <div className="flex gap-2 items-start py-0">
      {/* Thumbnail */}
      <div className="relative rounded-md shrink-0 size-20 overflow-hidden bg-accent">
        {imagePath ? (
          <img
            src={imagePath}
            alt={item.menuItemName}
            className="absolute inset-0 size-full object-cover rounded-md"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            {menuItem?.thumbnailPlaceholder ?? '🍜'}
          </div>
        )}
      </div>

      {/* Name + modifier badges */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base text-foreground leading-6">{item.menuItemName}</p>
        {item.modifiers.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-0 mt-2">
            {item.modifiers.map((mod) => {
              const Icon = MODIFIER_ICONS[mod.groupId] ?? Tag
              return (
                <span
                  key={`${mod.groupId}-${mod.optionId}`}
                  className="flex items-center gap-1 py-0.5"
                >
                  <Icon size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{mod.optionLabel}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Qty badge */}
      <div className="border border-border rounded-md shrink-0">
        <span className="flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-4">
          {qty}×
        </span>
      </div>

      {/* Price */}
      <div className="shrink-0 w-20 flex justify-end">
        <p className="font-medium text-base text-foreground text-right leading-6">
          ฿{(item.basePrice * qty).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
