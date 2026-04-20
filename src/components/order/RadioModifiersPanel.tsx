'use client'

import {
  Shell, Soup, Ham, Salad, Flame, Droplets, Clover,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuModifierGroup, MenuModifierOption } from '@/lib/mock-data/menu'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RadioModifiersPanelProps {
  modifierGroups: MenuModifierGroup[]
  selections: Record<string, string[]>
  onSelect: (groupId: string, optionId: string, type: 'single' | 'multi') => void
  errors: Set<string>
  groupRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

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
// RadioItem — bilingual radio button matching Figma Design C
// ---------------------------------------------------------------------------

function RadioItem({
  option,
  isSelected,
  onSelect,
}: {
  option: MenuModifierOption
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-3 py-2.5 text-base whitespace-nowrap min-h-[48px] cursor-pointer transition-colors',
        isSelected
          ? 'border-primary bg-primary/5 font-semibold text-primary'
          : 'border-input bg-background font-normal text-foreground hover:border-primary/40',
      )}
    >
      {/* Radio circle — selected: primary border + filled dot; unselected: hollow */}
      <span
        className={cn(
          'shrink-0 size-4 rounded-full border flex items-center justify-center transition-colors',
          isSelected ? 'border-primary bg-background' : 'border-input bg-background',
        )}
      >
        {isSelected && <span className="size-2 rounded-full bg-primary" />}
      </span>

      <span className="leading-none">
        {option.label}
        {option.priceAdj > 0 && (
          <span className="ml-1 text-xs opacity-60">+฿{option.priceAdj}</span>
        )}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// RadioModifiersPanel — bilingual radio cards per Figma Design C
// ---------------------------------------------------------------------------

export function RadioModifiersPanel({
  modifierGroups,
  selections,
  onSelect,
  errors,
  groupRefs,
}: RadioModifiersPanelProps) {
  if (modifierGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <p className="text-sm">ไม่มีตัวเลือกปรับแต่ง</p>
      </div>
    )
  }

  return (
    <>
      {modifierGroups.map((group, idx) => {
        const hasError = errors.has(group.id)
        const selected = selections[group.id] ?? []
        const IconComp = GROUP_ICONS[group.id]

        return (
          <div
            key={group.id}
            ref={(el) => {
              if (groupRefs) groupRefs.current[group.id] = el
            }}
            role="radiogroup"
            aria-label={group.label}
            className={cn(
              'flex flex-col gap-3 p-2 rounded-md w-full bg-muted',
              hasError && 'ring-1 ring-destructive/50',
            )}
          >
            {/* Header — icon + numbered label + required tag */}
            <div className="flex items-center gap-1.5">
              {IconComp && (
                <IconComp
                  size={16}
                  className={cn('shrink-0', hasError ? 'text-destructive' : 'text-foreground')}
                />
              )}
              <span
                className={cn(
                  'text-base font-semibold leading-none',
                  hasError ? 'text-destructive' : 'text-card-foreground',
                )}
              >
                {idx + 1}.{group.label}
              </span>
              <span
                className={cn(
                  'text-sm font-normal leading-snug',
                  hasError ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {group.required ? '(บังคับ)' : '(ไม่บังคับ)'}
              </span>
            </div>

            {/* Options — wrapping pill row */}
            <div className="flex flex-wrap gap-2 items-start w-full">
              {group.options.map((option) => (
                <RadioItem
                  key={option.id}
                  option={option}
                  isSelected={selected.includes(option.id)}
                  onSelect={() => onSelect(group.id, option.id, group.type)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}
