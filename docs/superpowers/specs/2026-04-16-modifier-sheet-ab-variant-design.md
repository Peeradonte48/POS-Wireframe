# Modifier Sheet A/B Variant Design

**Date:** 2026-04-16
**Status:** Approved
**Figma source:** https://www.figma.com/design/ghdDNXA7Xtk46CgjNb5zTv/POS---UI-Design?node-id=2756-4887

## Summary

Add a Design B variant for the modifier sheet (bottom sheet for customizing ramen orders) to support usability testing. Design A (current segmented tabs) remains untouched. A simple toggle button inside the sheet switches between variants — same pattern as the existing KDS A/B toggle.

## Scope

- **In scope:** New `SliderModifiersPanel` component, variant toggle in `ModifierSheet`, special request textarea
- **Out of scope:** Experiment framework, analytics, persistence of variant choice, changes to Design A

## Implementation Rule

All visual implementation must follow the `implement-figma-design.md` rule:
- Use Figma MCP tools (`get_design_context`, `get_screenshot`) to extract exact values
- Pixel-perfect match: colors, spacing, border-radius, font sizes, weights, track heights, thumb sizes
- Review against Figma after implementation to verify 100% match
- If any element is unclear, ask for clarification before guessing

## Architecture

### Approach: Swap at ForcedModifiersPanel level

```
ModifierSheet
  └─ ModifierSheetContent
      ├─ Title + Qty stepper (shared, no change)
      ├─ Variant toggle button (NEW — near title)
      ├─ if variant === 'A':
      │   └─ ForcedModifiersPanel (existing, untouched)
      ├─ if variant === 'B':
      │   ├─ SliderModifiersPanel (NEW)
      │   │   ├─ ModifierSlider × 5
      │   │   └─ ModifierChips × 2
      │   └─ Special request textarea (NEW)
      ├─ Validation (shared, same logic)
      └─ Footer buttons (shared, no change)
```

### Files changed

| File | Change |
|------|--------|
| `src/components/order/SliderModifiersPanel.tsx` | **NEW** — Design B modifier controls |
| `src/components/order/ModifierSheet.tsx` | Add variant state + toggle button + conditional render + textarea |
| `src/components/order/ForcedModifiersPanel.tsx` | No changes |

### No store changes

Both variants use the same state shape:
- `selections: Record<string, string[]>` — slider snaps to option index, maps to same option ID
- `specialRequest: string` — already exists on `OrderLineItem`, currently defaults to `''`
- Switching variant mid-edit preserves all selections

## Component Details

### Variant Toggle

- Small button positioned next to the item title row (top-right area of sheet)
- Label: "Design A" / "Design B" with a swap icon
- Local `useState<'A' | 'B'>('A')` — no persistence, resets per session
- Same pattern as `KdsTableBottomsheet.tsx` variant toggle

### ModifierSlider

- **Use case:** Level-based single-select groups with ordered options
- **Groups:** noodle-firmness (5 stops), broth-richness (3), spice-level (8), garlic (6), broth-oil (3)
- **Visual (from Figma):**
  - Red filled track from left edge to thumb position
  - Gray unfilled track for remainder
  - White circular thumb with red border
  - Label row above showing all stop names, selected label bold/dark
- **Behavior:**
  - Discrete stepped snapping (not continuous)
  - Each stop maps 1:1 to an option ID from the modifier group
  - Tap anywhere on track or drag thumb to select
  - Calls same `onSelect(groupId, optionId, 'single')` callback
- **Implementation:** Native `<input type="range">` with CSS custom styling to match Figma exactly
- **All exact dimensions, colors, spacing extracted from Figma at implementation time**

### ModifierChips

- **Use case:** Discrete unordered choices (single or multi-select)
- **Groups:** chashu (3 options, single), onion (4 options, multi)
- **Visual (from Figma):**
  - Rounded pill buttons (full border-radius)
  - Selected: dark border + gray background + bold text
  - Unselected: light border + white background + normal text
  - Wrap to next line if needed
- **Behavior:**
  - Single-select: one active at a time
  - Multi-select: toggle each independently
  - Calls same `onSelect(groupId, optionId, type)` callback
- **Touch target:** Minimum 44px height per design principles
- **All exact dimensions, colors, spacing extracted from Figma at implementation time**

### Group Classification

Hardcoded set determines which groups render as sliders vs chips:

```typescript
const SLIDER_GROUPS = new Set([
  'noodle-firmness',
  'broth-richness',
  'spice-level',
  'garlic',
  'broth-oil',
])
// Everything else → chips (chashu, onion, any future groups)
```

### Special Request Textarea

- Label: หมายเหตุ
- Only rendered in Design B
- Writes to `specialRequest` field on `OrderLineItem` (already exists in store)
- Pre-populated from `editingLineItem.specialRequest` when editing
- Visual styling extracted from Figma at implementation time

## Validation

Same validation logic for both variants:
- Required groups must have a selection
- Error state: scroll to first error group, highlight with red styling
- Slider error: red ring around the slider track area
- Chip error: red ring around the chip group area

## Error State Design

- Group header text turns red (same as Design A)
- Slider: red ring around the track container
- Chips: red ring around the chip container
- Scroll-to-error behavior unchanged

## Testing Plan

- Toggle between A and B — verify both render correctly
- Select modifiers in A, switch to B — verify selections preserved
- Select modifiers in B, switch to A — verify selections preserved
- Validate required groups in B — verify error highlighting on sliders and chips
- Add item with Design B modifiers — verify correct data in order store
- Edit existing item — verify pre-population works in Design B
- Check special request field saves to `specialRequest` on `OrderLineItem`
- Visual review against Figma design for 100% pixel-perfect match
