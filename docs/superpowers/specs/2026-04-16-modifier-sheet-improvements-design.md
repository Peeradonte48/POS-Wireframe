# Modifier Sheet Improvements Design

**Date:** 2026-04-16
**Status:** Approved

## Summary

Three small improvements to the modifier sheet (both Design A and B):

1. Move special request textarea to both variants + add bottom spacing
2. Change onion modifier group from multi-select to single-select
3. Add drag-to-select touch interaction on Design A segmented tabs

## Changes

### 1. Textarea in both variants + bottom spacing

The special request textarea (หมายเหตุ) currently only renders in Design B. Move it outside the `variant === 'B'` conditional so it renders for both A and B. Add `mb-4` spacing after the textarea section so it doesn't visually bump into the sticky footer buttons.

**File:** `src/components/order/ModifierSheet.tsx`
- Move the textarea `{variant === 'B' && (...)}` block to render unconditionally (remove the variant guard)
- Add bottom margin after the textarea for breathing room above the footer

### 2. Onion group → single select

Change the onion modifier group from multi-select to single-select. Staff should pick one option (none / white / green / both), not toggle multiple independently.

**File:** `src/lib/mock-data/menu.ts`
- Change `type: 'multi'` to `type: 'single'` on the `onion` group (id: `'onion'`)

### 3. Drag-to-select on Design A tabs

Add touch event handling to the segmented tab bar in `ForcedModifiersPanel.tsx` so staff can drag/swipe across options to select them — like a physical slider feel.

**File:** `src/components/order/ForcedModifiersPanel.tsx`

**Behavior:**
- On `touchstart` on the tab bar container: begin tracking
- On `touchmove`: calculate which option button the finger is over based on touch X position, call `onSelect` for that option
- On `touchend`: stop tracking
- Only applies to `single`-select groups (dragging multi-select is ambiguous)
- Click/tap behavior unchanged — this is additive
- Visual feedback is immediate — the selected tab follows the finger in real-time via the existing selected state styling

**Implementation approach:**
- Use a `ref` on the tab bar container to get bounding rect
- On `touchmove`, use `document.elementFromPoint(touch.clientX, touch.clientY)` to find which button the finger is over
- Each option button needs a `data-option-id` attribute so the handler can identify it
- Call `onSelect(groupId, optionId, 'single')` when the finger moves to a new option

## Testing

- Verify textarea appears in both Design A and Design B
- Verify textarea has spacing before the footer buttons
- Verify onion group is now single-select (tapping one option deselects previous)
- Verify drag across tab bar selects options in real-time (single-select groups only)
- Verify tap still works on tabs
- Verify multi-select groups (if any remain) are not affected by drag
