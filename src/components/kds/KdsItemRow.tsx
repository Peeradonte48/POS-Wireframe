'use client'

import { type LucideIcon, Shell, Soup, Ham, Salad, Flame, Droplets, Leaf, UtensilsCrossed, ShoppingBag } from 'lucide-react'
import { OrderLineItem, ModifierSelection } from '@/stores/order.store'

interface KdsItemRowProps {
  item: OrderLineItem
  isChecked: boolean
  interactive: boolean
  onCheck: () => void
  onUncheck: () => void
}

// Map modifier groupId to icon
function getModifierIcon(groupId: string): LucideIcon {
  if (groupId === 'noodle-firmness') return Shell
  if (groupId === 'broth-richness') return Soup
  if (groupId === 'chashu') return Ham
  if (groupId.includes('topping') || groupId.includes('green') || groupId.includes('vegetable') || groupId.includes('salad')) return Salad
  if (groupId.includes('oil') || groupId.includes('fat')) return Droplets
  if (groupId.includes('garlic')) return Leaf
  return UtensilsCrossed
}

function ModifierBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1 py-0.5">
      <Icon size={12} className="text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  )
}

function ModifierList({ modifiers, spiceLevel }: { modifiers: ModifierSelection[]; spiceLevel: number | null }) {
  const items: { icon: LucideIcon; label: string }[] = []

  modifiers.forEach((m) => {
    items.push({ icon: getModifierIcon(m.groupId), label: m.optionLabel })
  })

  if (spiceLevel !== null && spiceLevel > 0) {
    items.push({ icon: Flame, label: `เผ็ด x${spiceLevel}` })
  }

  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0">
      {items.map((item, i) => (
        <ModifierBadge key={i} icon={item.icon} label={item.label} />
      ))}
    </div>
  )
}

export function KdsItemRow({ item, isChecked, interactive, onCheck, onUncheck }: KdsItemRowProps) {
  const isVoided = item.status === 'voided'

  if (isVoided) {
    return (
      <div className="flex items-center gap-2 py-1 opacity-40">
        <div className="w-4 h-4 shrink-0 rounded border border-input" />
        <div className="flex gap-1 items-center">
          <span className="line-through text-sm font-medium">{item.menuItemName}</span>
          <span className="text-sm border border-border text-muted-foreground px-1.5 py-0.5 rounded uppercase font-semibold">
            VOID
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-0 items-start w-full ${isChecked ? 'opacity-50' : ''}`}>
      <div className="flex flex-1 gap-2 items-start">
        {/* Checkbox */}
        <button
          className="cursor-pointer flex items-start gap-2 shrink-0 pt-0.5"
          onClick={() => (isChecked ? onUncheck() : onCheck())}
          disabled={!interactive}
        >
          <div
            className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
              isChecked
                ? 'bg-primary border-primary'
                : 'bg-background border-input'
            } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {isChecked && (
              <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Item details */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          {/* Item name + quantity badge + pack-to-go badge */}
          <div className="flex gap-1 items-start flex-wrap">
            <span className={`text-sm font-medium text-foreground ${isChecked ? 'line-through' : ''}`}>
              {item.menuItemName}
            </span>
            <div className="bg-background border border-border flex items-center justify-center px-2 py-0.5 rounded-md shrink-0">
              <span className="text-xs font-semibold text-foreground">{item.quantity}×</span>
            </div>
            {item.packToGo && (
              <div className="bg-background border border-border flex items-center justify-center h-5 w-5 rounded-md shrink-0">
                <ShoppingBag size={12} className="text-foreground" />
              </div>
            )}
          </div>

          {/* Modifier badges */}
          <ModifierList modifiers={item.modifiers} spiceLevel={item.spiceLevel} />

          {/* Special request */}
          {item.specialRequest && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="bg-orange-500 text-white text-xs font-semibold uppercase px-1.5 py-0.5 rounded shrink-0">
                ALLERGY
              </span>
              <span className="text-xs text-orange-700 dark:text-orange-300 truncate">
                {item.specialRequest}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
