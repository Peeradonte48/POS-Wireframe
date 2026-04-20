'use client'

import { useCallback, useRef, useState } from 'react'
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

// Padding inside the container (p-[3px])
const PAD = 3

// ---------------------------------------------------------------------------
// SegmentedControl — single group with drag-following highlight
// ---------------------------------------------------------------------------

function SegmentedControl({ group, selected, onSelect, hasError }: {
  group: MenuModifierGroup
  selected: string[]
  onSelect: (groupId: string, optionId: string, type: 'single' | 'multi') => void
  hasError: boolean
}) {
  const count = group.options.length
  const selectedIdx = group.options.findIndex((o) => selected.includes(o.id))
  const isSingle = group.type === 'single'

  const containerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const activeIdx = dragIdx ?? selectedIdx

  // Convert finger clientX to a clamped continuous index (0 to count-1)
  const fingerToIndex = useCallback(
    (clientX: number): number => {
      const container = containerRef.current
      if (!container) return 0
      const rect = container.getBoundingClientRect()
      const innerWidth = rect.width - PAD * 2
      const x = clientX - rect.left - PAD
      const frac = Math.max(0, Math.min(1, x / innerWidth))
      // Map to continuous index: 0 at left edge, count-1 at right edge
      return frac * (count - 1)
    },
    [count],
  )

  // Calculate the left px offset for a continuous index
  const indexToLeft = useCallback(
    (idx: number): string => {
      const stepWidth = `(100% - ${PAD * 2}px) / ${count}`
      const centerOffset = idx / (count - 1) * (count - 1)
      return `calc(${PAD}px + ${centerOffset} * ${stepWidth})`
    },
    [count],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isSingle) return
      isDragging.current = true
      const highlight = highlightRef.current
      if (!highlight) return
      // Apply lifted style — scale up + stronger shadow
      highlight.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out'
      highlight.style.transform = 'scaleX(1.05) scaleY(1.1)'
      highlight.style.boxShadow = '0 4px 12px 0 rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.08)'

      // Move to finger position immediately
      const touch = e.touches[0]
      if (touch) {
        const contIdx = fingerToIndex(touch.clientX)
        const stepWidth = `(100% - ${PAD * 2}px) / ${count}`
        highlight.style.left = `calc(${PAD}px + ${contIdx} * ${stepWidth})`
        setDragIdx(Math.round(Math.max(0, Math.min(count - 1, contIdx))))
      }
    },
    [isSingle, fingerToIndex, count],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSingle || !isDragging.current) return
      const touch = e.touches[0]
      if (!touch) return

      // Bounds check — ignore if finger left the container
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      if (
        touch.clientX < rect.left ||
        touch.clientX > rect.right ||
        touch.clientY < rect.top - 20 ||
        touch.clientY > rect.bottom + 20
      ) return

      // Move highlight continuously (no React re-render — direct DOM)
      const highlight = highlightRef.current
      if (!highlight) return
      const contIdx = fingerToIndex(touch.clientX)
      const stepWidth = `(100% - ${PAD * 2}px) / ${count}`
      highlight.style.left = `calc(${PAD}px + ${contIdx} * ${stepWidth})`
      // No transition on left during drag — follow finger instantly
      highlight.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out'
      // Track which discrete option is under the finger for text color
      const rounded = Math.round(Math.max(0, Math.min(count - 1, contIdx)))
      setDragIdx((prev) => (prev === rounded ? prev : rounded))
    },
    [isSingle, fingerToIndex, count],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isSingle || !isDragging.current) return
      isDragging.current = false

      const highlight = highlightRef.current
      if (highlight) {
        // Remove lifted style — snap back
        highlight.style.transition = 'left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.2s ease-out, box-shadow 0.2s ease-out'
        highlight.style.transform = ''
        highlight.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)'
      }

      // Snap to nearest option
      const touch = e.changedTouches[0]
      if (touch) {
        const contIdx = fingerToIndex(touch.clientX)
        const snappedIdx = Math.round(Math.max(0, Math.min(count - 1, contIdx)))
        const option = group.options[snappedIdx]
        if (option) {
          onSelect(group.id, option.id, 'single')
          // Snap highlight to exact position
          if (highlight) {
            const stepWidth = `(100% - ${PAD * 2}px) / ${count}`
            highlight.style.left = `calc(${PAD}px + ${snappedIdx} * ${stepWidth})`
          }
        }
      }
      setDragIdx(null)
    },
    [isSingle, fingerToIndex, count, group, onSelect],
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex w-full items-center rounded-lg p-[3px] bg-muted',
        isSingle && 'touch-none',
        hasError && 'ring-1 ring-destructive/50',
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding highlight — follows finger during drag, snaps on release */}
      {isSingle && selectedIdx >= 0 && (
        <div
          ref={highlightRef}
          className="absolute top-[3px] bottom-[3px] rounded-md bg-background"
          style={{
            width: `calc((100% - ${PAD * 2}px) / ${count})`,
            left: `calc(${PAD}px + ${selectedIdx} * (100% - ${PAD * 2}px) / ${count})`,
            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            transition: 'left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      )}

      {group.options.map((option, i) => {
        const isSelected = selected.includes(option.id)
        const isActive = isSingle ? activeIdx === i : isSelected
        return (
          <button
            key={option.id}
            type="button"
            data-option-id={option.id}
            onClick={() => onSelect(group.id, option.id, group.type)}
            className={cn(
              'relative z-[1] flex-1 inline-flex items-center justify-center rounded-md px-2 py-2.5 text-base whitespace-nowrap min-h-[44px]',
              'transition-[color,border-color,background-color,font-weight] duration-150 ease-out',
              isActive
                ? 'font-semibold text-primary border border-primary/40'
                : 'font-medium text-foreground/60 hover:text-foreground border border-transparent',
              !isSingle && isSelected && 'bg-background shadow-sm',
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
            className="flex flex-col gap-2"
          >
            {/* Group header — icon + numbered label + required tag */}
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

            <SegmentedControl
              group={group}
              selected={selected}
              onSelect={onSelect}
              hasError={hasError}
            />
          </div>
        )
      })}
    </>
  )
}
