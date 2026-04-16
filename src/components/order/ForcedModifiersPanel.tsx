'use client'

import {
  Shell, Soup, Ham, Salad, Flame, Droplets,
  type LucideIcon,
} from 'lucide-react'
import { Clover } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuModifierGroup } from '@/lib/mock-data/menu'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ForcedModifiersPanelProps {
  modifierGroups: MenuModifierGroup[]
  selections: Record<string, string[]>
  onSelect: (groupId: string, optionId: string, type: 'single' | 'multi') => void
  errors: Set<string>
  groupRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

// ---------------------------------------------------------------------------
// Icon map — matches Figma design icons per modifier group
// ---------------------------------------------------------------------------

const GROUP_ICONS: Record<string, LucideIcon> = {
  'noodle-firmness': Shell,
  'broth-richness': Soup,
  'chashu': Ham,
  'onion': Salad,
  'spice-level': Flame,
  'garlic': Clover,
  'broth-oil': Droplets,
}

// ---------------------------------------------------------------------------
// ForcedModifiersPanel — Tab-style segmented controls per Figma design
// ---------------------------------------------------------------------------

export function ForcedModifiersPanel({
  modifierGroups,
  selections,
  onSelect,
  errors,
  groupRefs,
}: ForcedModifiersPanelProps) {
  if (modifierGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <p className="text-sm">ไม่มีตัวเลือกปรับแต่ง</p>
      </div>
    )
  }

  return (
    <>
      {modifierGroups.map((group) => {
        const hasError = errors.has(group.id)
        const selected = selections[group.id] ?? []
        const IconComp = GROUP_ICONS[group.id]

        return (
          <div
            key={group.id}
            ref={(el) => {
              if (groupRefs) groupRefs.current[group.id] = el
            }}
            className="flex flex-col gap-2"
          >
            {/* Group header — icon + label + required tag */}
            <div className="flex items-center gap-1.5">
              {IconComp && (
                <IconComp
                  size={16}
                  className={cn(
                    'shrink-0',
                    hasError ? 'text-destructive' : 'text-foreground',
                  )}
                />
              )}
              <span
                className={cn(
                  'text-base font-semibold leading-none',
                  hasError ? 'text-destructive' : 'text-card-foreground',
                )}
              >
                {group.label}
              </span>
              <span
                className={cn(
                  'text-sm font-normal leading-snug',
                  hasError ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {group.required ? '(required)' : '(optional)'}
              </span>
            </div>

            {/* Tab-style segmented control */}
            <div
              className={cn(
                'inline-flex w-full items-center rounded-lg p-[3px] bg-muted',
                hasError && 'ring-1 ring-destructive/50',
              )}
            >
              {group.options.map((option) => {
                const isSelected = selected.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelect(group.id, option.id, group.type)}
                    className={cn(
                      'relative flex-1 inline-flex items-center justify-center rounded-md px-2 py-2.5 text-sm font-medium whitespace-nowrap transition-all min-h-[44px]',
                      isSelected
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-foreground/60 hover:text-foreground',
                    )}
                  >
                    {option.label}
                    {option.priceAdj > 0 && (
                      <span className="ml-1 text-xs opacity-60">+฿{option.priceAdj}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
