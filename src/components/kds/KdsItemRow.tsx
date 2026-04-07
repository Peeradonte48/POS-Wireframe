'use client'

import { type LucideIcon, Shell, Soup, Ham, Salad, Flame, Droplets, Leaf, UtensilsCrossed, ShoppingBag } from 'lucide-react'
import { OrderLineItem, ModifierSelection } from '@/stores/order.store'
import { Badge } from '@/components/ui/badge'

interface KdsItemRowProps {
  item: OrderLineItem
}

// Modifier group → icon mapping
function getModifierIcon(groupId: string): LucideIcon {
  if (groupId === 'noodle-firmness') return Shell
  if (groupId === 'broth-richness') return Soup
  if (groupId === 'chashu') return Ham
  if (groupId.includes('topping') || groupId.includes('green') || groupId.includes('vegetable') || groupId.includes('salad')) return Salad
  if (groupId.includes('oil') || groupId.includes('fat')) return Droplets
  if (groupId.includes('garlic')) return Leaf
  return UtensilsCrossed
}

// Modifier group → color-coded background for icon circle
function getModifierColor(groupId: string): string {
  if (groupId === 'noodle-firmness') return 'bg-amber-100'
  if (groupId === 'broth-richness') return 'bg-emerald-100'
  if (groupId === 'chashu') return 'bg-orange-100'
  if (groupId.includes('topping') || groupId.includes('green') || groupId.includes('vegetable') || groupId.includes('salad')) return 'bg-lime-100'
  if (groupId === 'spice-level') return 'bg-red-100'
  if (groupId.includes('oil') || groupId.includes('fat')) return 'bg-cyan-100'
  if (groupId.includes('garlic')) return 'bg-indigo-100'
  return 'bg-gray-100'
}

function ModifierRow({ modifier, customValue }: { modifier: ModifierSelection; customValue?: number | null }) {
  const Icon = getModifierIcon(modifier.groupId)
  const bgColor = getModifierColor(modifier.groupId)

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className={`${bgColor} flex items-center justify-center rounded-full shrink-0 size-[30px]`}>
          <Icon size={14} className="text-secondary-foreground" />
        </div>
        <span className="text-base font-bold text-secondary-foreground truncate">
          {modifier.optionLabel}
        </span>
      </div>
      {customValue != null && (
        <Badge variant="secondary" className="text-xs font-semibold rounded-full h-5 min-w-5 px-1">
          {customValue}
        </Badge>
      )}
    </div>
  )
}

function SpiceRow({ spiceLevel, customValue }: { spiceLevel: number; customValue?: number | null }) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="bg-red-100 flex items-center justify-center rounded-full shrink-0 size-[30px]">
          <Flame size={14} className="text-secondary-foreground" />
        </div>
        <span className="text-base font-bold text-secondary-foreground">
          เผ็ด x{spiceLevel}
        </span>
      </div>
      {customValue != null && (
        <Badge variant="secondary" className="text-xs font-semibold rounded-full h-5 min-w-5 px-1">
          {customValue}
        </Badge>
      )}
    </div>
  )
}

export function KdsItemRow({ item }: KdsItemRowProps) {
  const isVoided = item.status === 'voided'

  if (isVoided) {
    return (
      <div className="flex flex-col gap-3 opacity-40">
        <div className="flex items-center gap-1">
          <span className="line-through text-lg font-bold">{item.menuItemName}</span>
          <Badge variant="outline" className="text-xs font-semibold uppercase">VOID</Badge>
        </div>
      </div>
    )
  }

  // Separate spice modifier from others
  const nonSpiceModifiers = item.modifiers.filter((m) => m.groupId !== 'spice-level')
  const hasSpice = item.spiceLevel !== null && item.spiceLevel > 0

  // Use a mock customization number (from the item's basePrice as placeholder)
  // In real implementation this would come from POS customization settings
  const customValue = 8 // Placeholder per Figma design

  return (
    <div className="flex flex-col gap-4">
      {/* Item name + quantity + pack-to-go */}
      <div className="flex items-center flex-wrap gap-1">
        <span className="text-lg font-bold text-foreground">{item.menuItemName}</span>
        <Badge variant="outline" className="text-xs font-semibold">
          {item.quantity}×
        </Badge>
        {item.packToGo && (
          <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center">
            <ShoppingBag size={12} />
          </Badge>
        )}
      </div>

      {/* Modifier rows with color-coded icons */}
      <div className="flex flex-col gap-3">
        {nonSpiceModifiers.map((mod, i) => (
          <ModifierRow key={i} modifier={mod} customValue={customValue} />
        ))}
        {hasSpice && (
          <SpiceRow spiceLevel={item.spiceLevel!} customValue={customValue} />
        )}
      </div>

      {/* Special request */}
      {item.specialRequest && (
        <div className="flex items-center gap-1.5">
          <span className="bg-orange-500 text-white text-xs font-semibold uppercase px-1.5 py-0.5 rounded shrink-0">
            ALLERGY
          </span>
          <span className="text-xs text-orange-700 dark:text-orange-300 truncate">
            {item.specialRequest}
          </span>
        </div>
      )}
    </div>
  )
}
