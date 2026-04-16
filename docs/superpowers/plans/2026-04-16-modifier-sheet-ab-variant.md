# Modifier Sheet A/B Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Design B variant to the order modifier sheet with sliders, chips, and notes textarea — togglable via a button for usability testing.

**Architecture:** Create `SliderModifiersPanel.tsx` as a sibling to the existing `ForcedModifiersPanel.tsx`. `ModifierSheet.tsx` gets a variant toggle (`useState<'A' | 'B'>`) that conditionally renders one panel or the other. Both panels share the same `selections` state and `onSelect` callback. A special request textarea is added for Design B only.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS 4, lucide-react icons, native `<input type="range">` with CSS custom styling

**Figma Rule:** All visual implementation MUST use Figma MCP tools (`get_design_context`, `get_screenshot` on node `2756:4887` in file `ghdDNXA7Xtk46CgjNb5zTv`) to extract exact values. Review against Figma after each visual task to verify 100% pixel-perfect match. If any element is unclear, ask for clarification.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/order/SliderModifiersPanel.tsx` | **CREATE** | Design B modifier controls: `ModifierSlider`, `ModifierChips`, and the panel that renders them per group |
| `src/components/order/ModifierSheet.tsx` | **MODIFY** | Add variant state, toggle button, conditional panel render, special request textarea |

No store changes. No changes to `ForcedModifiersPanel.tsx`.

---

### Task 1: Create SliderModifiersPanel with ModifierSlider

**Files:**
- Create: `src/components/order/SliderModifiersPanel.tsx`

- [ ] **Step 1: Fetch Figma design context for slider styling**

Before writing any code, use the Figma MCP tools to inspect node `2756:4887` in file `ghdDNXA7Xtk46CgjNb5zTv`. Extract exact values for:
- Slider track height, border-radius, colors (filled vs unfilled)
- Thumb size, border width, border color, background, box-shadow
- Label font size, font weight, color (selected vs unselected)
- Spacing between label row and slider track
- Spacing between modifier groups

Use `get_screenshot` to visually verify your understanding of the slider component before coding.

- [ ] **Step 2: Create SliderModifiersPanel.tsx with ModifierSlider sub-component**

Create the file with the slider control for level-based modifier groups. The component must match the Figma design pixel-perfect.

```tsx
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

export interface SliderModifiersPanelProps {
  modifierGroups: MenuModifierGroup[]
  selections: Record<string, string[]>
  onSelect: (groupId: string, optionId: string, type: 'single' | 'multi') => void
  errors: Set<string>
  groupRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLIDER_GROUPS = new Set([
  'noodle-firmness',
  'broth-richness',
  'spice-level',
  'garlic',
  'broth-oil',
])

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
// ModifierSlider — Stepped slider with red track per Figma design
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
  const selectedIndex = options.findIndex((o) => selected.includes(o.id))
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0
  const maxIndex = options.length - 1

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const idx = parseInt(e.target.value, 10)
    const option = options[idx]
    if (option) onSelect(group.id, option.id, 'single')
  }

  // Calculate fill percentage for the red track
  const fillPercent = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0

  return (
    <div className={cn('flex flex-col gap-2', hasError && 'ring-1 ring-destructive/50 rounded-lg p-2')}>
      {/* Label row — all option labels spread across the width */}
      <div className="flex justify-between">
        {options.map((option, idx) => (
          <span
            key={option.id}
            className={cn(
              'text-sm',
              idx === currentIndex
                ? 'font-semibold text-foreground'
                : 'font-normal text-muted-foreground',
            )}
          >
            {option.label}
          </span>
        ))}
      </div>

      {/* Slider track — native range input with CSS custom styling */}
      {/* IMPORTANT: Extract exact track height, thumb size, colors from Figma */}
      {/* The inline styles below are initial values — adjust to match Figma exactly */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={currentIndex}
          onChange={handleChange}
          className="modifier-slider w-full"
          style={{
            '--slider-fill': `${fillPercent}%`,
          } as React.CSSProperties}
          aria-label={group.label}
        />
      </div>
    </div>
  )
}
```

The CSS for the slider will be added in a later step. Continue building the rest of the component:

```tsx
// ---------------------------------------------------------------------------
// ModifierChips — Rounded pill buttons per Figma design
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
    <div className={cn(
      'flex flex-wrap gap-2',
      hasError && 'ring-1 ring-destructive/50 rounded-lg p-2',
    )}>
      {group.options.map((option) => {
        const isSelected = selected.includes(option.id)
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(group.id, option.id, group.type)}
            className={cn(
              'rounded-full px-5 py-2.5 text-sm transition-all min-h-[44px]',
              isSelected
                ? 'border-2 border-foreground bg-muted font-semibold text-foreground'
                : 'border border-border bg-background font-normal text-muted-foreground hover:text-foreground',
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
// SliderModifiersPanel — Design B modifier controls
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
        const isSlider = SLIDER_GROUPS.has(group.id)

        return (
          <div
            key={group.id}
            ref={(el) => {
              if (groupRefs) groupRefs.current[group.id] = el
            }}
            className="flex flex-col gap-2"
          >
            {/* Group header — icon + label + required tag (same as Design A) */}
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
```

Write this as a single file: `src/components/order/SliderModifiersPanel.tsx`.

- [ ] **Step 3: Add slider CSS to globals.css**

Add CSS for the native range input slider styling to `src/app/globals.css`. The styles MUST match the Figma design exactly — red filled track, gray unfilled track, white thumb with red border.

Refer to the Figma screenshot and extract exact values. Add this CSS at the end of `globals.css` (before the closing comments if any):

```css
/* ---------------------------------------------------------------------------
   Modifier slider (Design B) — stepped range input with red track
   --------------------------------------------------------------------------- */

.modifier-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--color-primary) 0%,
    var(--color-primary) var(--slider-fill),
    var(--color-muted) var(--slider-fill),
    var(--color-muted) 100%
  );
  outline: none;
  cursor: pointer;
}

.modifier-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-background);
  border: 2.5px solid var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.modifier-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-background);
  border: 2.5px solid var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.modifier-slider::-moz-range-progress {
  background: var(--color-primary);
  border-radius: 3px;
  height: 6px;
}

.modifier-slider::-moz-range-track {
  background: var(--color-muted);
  border-radius: 3px;
  height: 6px;
}
```

**IMPORTANT:** These are starting values. After adding, compare against the Figma design using `get_screenshot` and adjust track height, thumb size, border width, colors, and shadow to match exactly.

- [ ] **Step 4: Verify slider and chips visually against Figma**

Run `npm run build` to confirm no type errors. Then run `npm run dev`, open the modifier sheet for a ramen item, and compare the slider + chips rendering against the Figma screenshot (node `2756:4887`, file `ghdDNXA7Xtk46CgjNb5zTv`).

Use `get_screenshot` from Figma MCP to get a fresh reference. Adjust any CSS values (track height, thumb size, spacing, chip border-radius, font sizes) until it matches 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/order/SliderModifiersPanel.tsx src/app/globals.css
git commit -m "feat: add SliderModifiersPanel with slider and chip controls for Design B"
```

---

### Task 2: Add variant toggle and conditional rendering to ModifierSheet

**Files:**
- Modify: `src/components/order/ModifierSheet.tsx`

- [ ] **Step 1: Add imports and variant state to ModifierSheetContent**

At the top of `ModifierSheet.tsx`, add the import for the new panel and the toggle icon:

```tsx
import { ArrowLeftRight } from 'lucide-react'
import { SliderModifiersPanel } from '@/components/order/SliderModifiersPanel'
```

Inside the `ModifierSheetContent` function, add variant state and special request state after the existing state declarations (after line 56):

```tsx
const [variant, setVariant] = useState<'A' | 'B'>('A')
const [specialRequest, setSpecialRequest] = useState(() => editingLineItem?.specialRequest ?? '')
```

- [ ] **Step 2: Add variant toggle button to the title row**

Replace the title section (the `<div className="px-4 pt-4 pb-4 shrink-0">` block at line 118) with a row that includes both the title and toggle button:

```tsx
{/* Title row with variant toggle */}
<div className="flex items-center justify-between px-4 pt-4 pb-4 shrink-0">
  <h2 className="text-lg font-semibold leading-none text-foreground">{menuItem.name}</h2>
  <button
    onClick={() => setVariant((v) => (v === 'A' ? 'B' : 'A'))}
    className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
  >
    <ArrowLeftRight size={12} />
    Design {variant}
  </button>
</div>
```

- [ ] **Step 3: Add conditional panel rendering and special request textarea**

Replace the scrollable modifier groups section (the `<div className="flex-1 overflow-y-auto pb-32">` block at line 143) with conditional rendering:

```tsx
{/* Scrollable modifier groups */}
<div className="flex-1 overflow-y-auto pb-32">
  <div className="flex flex-col gap-4 px-4 pt-4">
    {variant === 'A' ? (
      <ForcedModifiersPanel
        modifierGroups={menuItem.modifierGroups}
        selections={selections}
        onSelect={handleSelect}
        errors={validationErrors}
        groupRefs={groupRefs}
      />
    ) : (
      <SliderModifiersPanel
        modifierGroups={menuItem.modifierGroups}
        selections={selections}
        onSelect={handleSelect}
        errors={validationErrors}
        groupRefs={groupRefs}
      />
    )}

    {/* Special request textarea — Design B only */}
    {variant === 'B' && (
      <div className="flex flex-col gap-2">
        <span className="text-base font-semibold leading-none text-card-foreground">
          หมายเหตุ
        </span>
        <textarea
          value={specialRequest}
          onChange={(e) => setSpecialRequest(e.target.value)}
          placeholder="Placeholder"
          className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-vertical focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 4: Wire specialRequest into handleConfirm**

In the `handleConfirm` function, update the `newItem` construction (around line 95) to use the `specialRequest` state instead of the hardcoded empty string:

Change this line:
```tsx
specialRequest: editingLineItem?.specialRequest ?? '',
```

To:
```tsx
specialRequest,
```

This ensures the textarea value is saved to the order line item regardless of variant (if variant A, `specialRequest` starts as `editingLineItem?.specialRequest ?? ''` and is unchanged since the textarea isn't shown).

- [ ] **Step 5: Verify the toggle works**

Run `npm run build` to confirm no type errors.

Run `npm run dev`, navigate to a table order, tap a ramen item to open the modifier sheet:
1. Confirm Design A renders (segmented tabs) — existing behavior unchanged
2. Tap the "Design A" toggle button — confirm it switches to "Design B" with sliders + chips
3. Make selections in Design B, switch back to A — confirm selections are preserved
4. Switch to B, type in the notes textarea, confirm the order — verify the line item in the ticket has the special request text
5. Edit an existing item — verify selections and special request pre-populate correctly

- [ ] **Step 6: Commit**

```bash
git add src/components/order/ModifierSheet.tsx
git commit -m "feat: add A/B variant toggle to modifier sheet with Design B support"
```

---

### Task 3: Pixel-perfect Figma review and adjustments

**Files:**
- Modify: `src/components/order/SliderModifiersPanel.tsx` (if adjustments needed)
- Modify: `src/app/globals.css` (if adjustments needed)

- [ ] **Step 1: Get fresh Figma screenshot for comparison**

Use Figma MCP `get_screenshot` on node `2756:4887` in file `ghdDNXA7Xtk46CgjNb5zTv` to get the reference design. Also use `get_design_context` on specific child nodes if needed to extract exact values for:
- Slider track exact height and color hex
- Thumb exact diameter, border width, border color
- Chip border-radius, padding, font size, font weight
- Selected chip border width and color
- Label font sizes, weights, colors
- Spacing between groups
- Textarea border-radius, padding, border color, placeholder color
- Notes label font size and weight

- [ ] **Step 2: Run dev server and compare side-by-side**

Run `npm run dev`. Open the modifier sheet in Design B mode. Compare every element against the Figma screenshot:
- [ ] Slider track color matches
- [ ] Slider thumb size and border matches
- [ ] Label positioning and typography matches
- [ ] Chip shape, padding, and border matches
- [ ] Chip selected state (border weight, fill color) matches
- [ ] Textarea styling matches
- [ ] Group spacing matches
- [ ] Overall vertical rhythm matches

- [ ] **Step 3: Apply adjustments**

Fix any discrepancies found in Step 2. This may include:
- Adjusting CSS custom properties in globals.css
- Tweaking Tailwind classes in SliderModifiersPanel.tsx
- Adjusting spacing, font sizes, or colors

After each fix, refresh the browser and re-compare.

- [ ] **Step 4: Verify build passes**

Run `npm run build` to confirm no type errors after adjustments.

- [ ] **Step 5: Commit adjustments**

```bash
git add src/components/order/SliderModifiersPanel.tsx src/app/globals.css
git commit -m "style: pixel-perfect adjustments to match Figma design for modifier sheet Design B"
```

---

### Task 4: Final integration test

- [ ] **Step 1: Test full order flow with Design A**

1. Open a table order
2. Tap a ramen item → modifier sheet opens in Design A (default)
3. Select modifiers using segmented tabs
4. Confirm → item added to ticket
5. Verify all modifiers show correctly in ticket

- [ ] **Step 2: Test full order flow with Design B**

1. Tap another ramen item → modifier sheet opens
2. Toggle to Design B
3. Use sliders to set noodle firmness, broth richness, spice level, garlic, broth oil
4. Use chips to select chashu and onion
5. Type a special request in the textarea
6. Confirm → item added to ticket
7. Verify all modifiers show correctly in ticket
8. Verify special request is on the line item

- [ ] **Step 3: Test variant switching preserves selections**

1. Open modifier sheet, select some modifiers in Design A
2. Toggle to Design B → verify same options are selected (slider positions + chip highlights match)
3. Change a selection in Design B
4. Toggle back to Design A → verify the changed selection shows in the segmented tab
5. Confirm → verify the final selections are saved correctly

- [ ] **Step 4: Test editing an existing item**

1. Add a ramen item with Design B modifiers + special request
2. Edit it from the ticket panel
3. Verify modifier sheet opens with pre-populated selections
4. Toggle between A and B — verify both show the correct pre-populated values
5. Update and verify changes save

- [ ] **Step 5: Test validation in Design B**

1. Open modifier sheet, toggle to Design B
2. Clear all selections (if possible) or use a fresh item
3. Tap confirm without selecting required groups
4. Verify error highlighting appears on the slider/chip controls
5. Verify scroll-to-first-error works

- [ ] **Step 6: Test items with no modifiers**

1. Tap a non-ramen item with no modifier groups (e.g. from appetizers)
2. Verify SimpleItemDialog still opens (not modifier sheet)
3. Confirm behavior is unchanged

- [ ] **Step 7: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: integration test fixes for modifier sheet A/B variant"
```

Only commit if changes were made during testing. Skip if all tests passed without fixes.
