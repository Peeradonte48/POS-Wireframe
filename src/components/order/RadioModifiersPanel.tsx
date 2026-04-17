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
      className="flex flex-1 gap-3 items-start max-w-[224px] min-w-[80px] min-h-[44px] text-left cursor-pointer"
    >
      {/* Radio circle — selected: white bg + primary border + red dot; unselected: hollow on card */}
      <span
        className={cn(
          'shrink-0 size-4 mt-px rounded-full border flex items-center justify-center transition-colors',
          isSelected
            ? 'border-primary bg-background'
            : 'border-input bg-transparent',
        )}
        style={isSelected ? { boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } : undefined}
      >
        {isSelected && <span className="size-2 rounded-full bg-primary" />}
      </span>

      {/* Label wrapper — Thai on top, English UPPERCASE below */}
      <span className="flex flex-col gap-1.5 flex-1 min-w-0 pt-px">
        <span
          className={cn(
            'text-sm leading-none truncate',
            isSelected ? 'font-semibold text-foreground' : 'font-normal text-foreground',
          )}
        >
          {option.label}
          {option.priceAdj > 0 && (
            <span className="ml-1 text-xs opacity-60">+฿{option.priceAdj}</span>
          )}
        </span>
        {option.labelEn && (
          <span className="text-sm leading-5 text-muted-foreground truncate">
            {option.labelEn}
          </span>
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
            role="radiogroup"
            aria-label={group.label}
            className={cn(
              'flex flex-col gap-3 p-2 rounded-md w-full bg-muted',
              hasError && 'ring-1 ring-destructive/50',
            )}
          >
            {/* Header — icon + label + required tag */}
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

            {/* Options row — flex grid, one column per option */}
            <div className="flex gap-2 items-start w-full">
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
