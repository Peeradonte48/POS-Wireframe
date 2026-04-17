'use client'

import {
  Shell, Soup, Ham, Salad, Flame, Droplets, Clover,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuModifierGroup } from '@/lib/mock-data/menu'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SliderModifiersPanelProps {
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
// Slider group IDs — groups rendered as stepped slider controls
// Keep in sync with modifier group IDs in src/lib/mock-data/menu.ts
// ---------------------------------------------------------------------------

const SLIDER_GROUP_IDS = new Set([
  'noodle-firmness',
  'broth-richness',
  'spice-level',
  'garlic',
  'broth-oil',
])

// ---------------------------------------------------------------------------
// ModifierSlider — stepped range input with red filled track per Figma
// ---------------------------------------------------------------------------

function ModifierSlider({
  group,
  selected,
  onSelect,
  hasError,
}: {
  group: MenuModifierGroup
  selected: string[]
  onSelect: (groupId: string, optionId: string, type: 'single' | 'multi') => void
  hasError: boolean
}) {
  const options = group.options
  const max = options.length - 1
  const selectedIndex = options.findIndex((o) => selected.includes(o.id))
  const hasSelection = selectedIndex >= 0
  const currentIndex = hasSelection ? selectedIndex : 0

  // Calculate fill percentage for the CSS gradient
  const fillPercent = hasSelection && max > 0 ? (currentIndex / max) * 100 : 0

  return (
    <div className="flex flex-col gap-2">
      {/* Labels — each positioned at the exact % the slider thumb sits at */}
      <div className="relative h-5">
        {options.map((option, i) => {
          const pct = max > 0 ? (i / max) * 100 : 0
          return (
            <span
              key={option.id}
              className={cn(
                'absolute text-sm leading-tight select-none whitespace-nowrap',
                hasSelection && i === selectedIndex
                  ? 'font-semibold text-foreground'
                  : 'font-normal text-muted-foreground',
              )}
              style={{
                left: `${pct}%`,
                transform:
                  i === 0
                    ? 'translateX(0)'        // first label: left-aligned at 0%
                    : i === max
                      ? 'translateX(-100%)'  // last label: right-aligned at 100%
                      : 'translateX(-50%)',  // middle labels: centered on position
              }}
            >
              {option.label}
              {option.priceAdj > 0 && (
                <span className="ml-0.5 text-xs opacity-60">+฿{option.priceAdj}</span>
              )}
            </span>
          )
        })}
      </div>

      {/* Native range input styled via CSS */}
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={currentIndex}
        onChange={(e) => {
          const idx = Number(e.target.value)
          const option = options[idx]
          if (option) {
            onSelect(group.id, option.id, group.type)
          }
        }}
        className={cn(
          'modifier-slider w-full',
          !hasSelection && 'modifier-slider--unselected',
          hasError && 'modifier-slider--error',
        )}
        style={{
          '--slider-fill': `${fillPercent}%`,
        } as React.CSSProperties}
        aria-label={group.label}
        aria-valuetext={options[currentIndex]?.label}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ModifierChips — rounded pill buttons for discrete choice groups
// ---------------------------------------------------------------------------

function ModifierChips({
  group,
  selected,
  onSelect,
  hasError,
}: {
  group: MenuModifierGroup
  selected: string[]
  onSelect: (groupId: string, optionId: string, type: 'single' | 'multi') => void
  hasError: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2',
        hasError && 'outline outline-1 outline-destructive/50 outline-offset-2 rounded-lg',
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
              'inline-flex items-center justify-center rounded-lg border px-3 py-3 text-sm font-medium transition-all min-h-[44px] min-w-[80px] max-w-[224px]',
              isSelected
                ? 'border-primary text-foreground'
                : 'border-border bg-background text-foreground hover:border-primary/40',
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
  )
}

// ---------------------------------------------------------------------------
// SliderModifiersPanel — renders slider or chips per group type
// ---------------------------------------------------------------------------

export function SliderModifiersPanel({
  modifierGroups,
  selections,
  onSelect,
  errors,
  groupRefs,
}: SliderModifiersPanelProps) {
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
        const isSlider = SLIDER_GROUP_IDS.has(group.id)

        return (
          <div
            key={group.id}
            ref={(el) => {
              if (groupRefs) groupRefs.current[group.id] = el
            }}
            className="flex flex-col gap-3"
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

            {/* Render slider or chips based on group classification */}
            {isSlider ? (
              <ModifierSlider
                group={group}
                selected={selected}
                onSelect={onSelect}
                hasError={hasError}
              />
            ) : (
              <ModifierChips
                group={group}
                selected={selected}
                onSelect={onSelect}
                hasError={hasError}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
