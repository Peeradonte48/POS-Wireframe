'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  const committedIndex = hasSelection ? selectedIndex : 0

  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!hasSelection && options.length > 0) {
      onSelect(group.id, options[0].id, group.type)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayIdx = dragIdx ?? committedIndex
  const displayPct = max > 0 ? (displayIdx / max) * 100 : 0
  const isActive = hasSelection || dragIdx !== null

  const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)'
  const SETTLE_TRANSITION = `left 200ms ${EASE}, width 200ms ${EASE}, transform 150ms ease-out`

  const clientXtoFrac = useCallback((clientX: number): number => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  const applyPositionDOM = useCallback((pct: number, immediate: boolean) => {
    if (thumbRef.current) {
      thumbRef.current.style.transition = immediate ? 'transform 120ms ease-out, border-color 150ms' : SETTLE_TRANSITION
      thumbRef.current.style.left = `${pct}%`
    }
    if (fillRef.current) {
      fillRef.current.style.transition = immediate ? 'none' : `width 200ms ${EASE}`
      fillRef.current.style.width = `${pct}%`
    }
  }, [SETTLE_TRANSITION])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (max <= 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      isDragging.current = true
      if (thumbRef.current) {
        thumbRef.current.style.transform = 'translate(-50%, -50%) scale(1.15)'
        thumbRef.current.style.boxShadow = '0 6px 16px 0 rgba(0,0,0,0.15), 0 2px 4px 0 rgba(0,0,0,0.08)'
      }
      const frac = clientXtoFrac(e.clientX)
      const contIdx = frac * max
      applyPositionDOM(frac * 100, true)
      setDragIdx(Math.round(contIdx))
    },
    [max, clientXtoFrac, applyPositionDOM],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current || max <= 0) return
      const frac = clientXtoFrac(e.clientX)
      const contIdx = frac * max
      applyPositionDOM(frac * 100, true)
      const rounded = Math.round(contIdx)
      setDragIdx((prev) => (prev === rounded ? prev : rounded))
    },
    [max, clientXtoFrac, applyPositionDOM],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return
      isDragging.current = false
      if (thumbRef.current) {
        thumbRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
        thumbRef.current.style.boxShadow = ''
      }
      const frac = clientXtoFrac(e.clientX)
      const snapped = Math.round(Math.max(0, Math.min(max, frac * max)))
      const snapPct = max > 0 ? (snapped / max) * 100 : 0
      applyPositionDOM(snapPct, false)
      const option = options[snapped]
      if (option) onSelect(group.id, option.id, group.type)
      setDragIdx(null)
    },
    [max, clientXtoFrac, applyPositionDOM, options, group, onSelect],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (max <= 0) return
      let next = committedIndex
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, committedIndex - 1)
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(max, committedIndex + 1)
      else return
      e.preventDefault()
      const option = options[next]
      if (option) onSelect(group.id, option.id, group.type)
    },
    [max, committedIndex, options, group, onSelect],
  )

  return (
    <div className="flex flex-col">
      {/* Labels — tappable shortcuts; each button snaps the slider to its option */}
      <div className="relative h-6">
        {options.map((option, i) => {
          const pct = max > 0 ? (i / max) * 100 : 0
          const isLabelActive = isActive && displayIdx === i
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(group.id, option.id, group.type)}
              className={cn(
                'absolute bottom-0 px-1.5 py-0.5 -mx-1.5 rounded text-base leading-none whitespace-nowrap cursor-pointer',
                'transition-colors duration-150',
                'hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isLabelActive ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground',
              )}
              style={{
                left: `${pct}%`,
                transform:
                  i === 0
                    ? 'translateX(0)'
                    : i === max
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
              aria-label={`เลือก ${option.label}`}
            >
              {option.label}
              {option.priceAdj > 0 && (
                <span className="ml-0.5 text-xs opacity-60">+฿{option.priceAdj}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Touch surface — 44px hit area containing track + thumb */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        role="slider"
        tabIndex={0}
        aria-label={group.label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={committedIndex}
        aria-valuetext={options[committedIndex]?.label}
        className={cn(
          'relative h-11 flex items-center touch-none cursor-pointer select-none rounded-md',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          hasError && 'ring-1 ring-destructive/50',
        )}
      >
        {/* Track */}
        <div className="absolute left-0 right-0 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            ref={fillRef}
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              isActive ? 'bg-primary' : 'bg-muted-foreground/25',
            )}
            style={{
              width: `${displayPct}%`,
              transition: `width 200ms ${EASE}, background-color 150ms`,
            }}
          />
        </div>
        {/* Thumb — large 24px hit target */}
        <div
          ref={thumbRef}
          className={cn(
            'absolute top-1/2 size-6 rounded-full bg-background border-[3px]',
            isActive ? 'border-primary' : 'border-muted-foreground/40',
          )}
          style={{
            left: `${displayPct}%`,
            transform: 'translate(-50%, -50%) scale(1)',
            transition: `left 200ms ${EASE}, transform 150ms ease-out, border-color 150ms`,
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.04)',
          }}
        />
      </div>
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
              'inline-flex items-center justify-center rounded-lg border px-3 py-3 text-base font-medium transition-all min-h-[44px] min-w-[80px] max-w-[224px]',
              isSelected
                ? 'border-primary bg-primary/5 text-primary font-semibold'
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
      {modifierGroups.map((group, idx) => {
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
