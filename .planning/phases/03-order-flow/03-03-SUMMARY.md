---
phase: 03-order-flow
plan: 03
subsystem: ui
tags: [zustand, tailwind, typescript, react, shadcn, bottom-sheet, modifiers, order]

# Dependency graph
requires:
  - phase: 03-01
    provides: order.store.ts with OrderLineItem, addItem, editItem store actions
  - phase: 03-01
    provides: menu.ts with MenuItem, MenuModifierGroup, RAMEN_MODIFIER_GROUPS
  - phase: 02-table-map
    provides: TableBottomSheet.tsx slide-up CSS pattern and body scroll lock pattern
provides:
  - ModifierSheet.tsx — slide-up bottom sheet for ramen modifier configuration
  - ModifierSheetProps interface (open, onClose, menuItem, tableId, editingLineId, editingLineItem)
  - Full modifier group rendering: broth (single), noodle firmness (single), toppings (multi), spice level (icon), special request (text)
  - Required field validation with red highlight + scroll-to-error behavior
  - Add/edit modes: calls store.addItem or store.editItem on confirm
affects:
  - 03-04 (OrderPage will import and wire ModifierSheet)
  - 03-05 (TicketPanel reads from same order store that ModifierSheet writes to)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - slide-up bottom sheet (CSS translate-y-full/translate-y-0) reused from Phase 2
    - body scroll lock via useEffect with overflow hidden/empty
    - useRef groupRefs map for scroll-to-error on validation
    - useOrderStore.getState() for write actions (avoids stale closure)
    - native checkbox with accent-primary instead of @radix-ui/react-checkbox

key-files:
  created:
    - src/components/order/ModifierSheet.tsx
  modified: []

key-decisions:
  - "Native <input type=checkbox> with accent-primary used instead of shadcn Checkbox — @radix-ui/react-checkbox not installed and project uses @base-ui/react, avoiding new dependency"
  - "Sticky footer for Add/Update button uses fixed positioning with z-[51] (one above panel z-50) to stay visible while panel content scrolls"
  - "Spice level rendered as Lucide Flame icons (not emoji chili) for consistent icon system"

patterns-established:
  - "groupRefs pattern: useRef<Record<string, HTMLDivElement | null>>({}) for scroll-to-error across dynamic section list"
  - "Modifier label resolution via inline getOptionLabel helper — looks up menuItem.modifierGroups at build time"

requirements-completed: [ORDER-02, ORDER-03]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 3 Plan 03: ModifierSheet Summary

**Slide-up bottom sheet for ramen modifier configuration — broth/firmness/toppings/spice/special-request with required-field validation and add/edit store integration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T16:31:06Z
- **Completed:** 2026-03-10T16:33:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- ModifierSheet.tsx built with all 5 modifier sections: broth (single-select buttons), noodle firmness (single-select buttons), toppings (multi-select checkboxes), spice level (Flame icon 1–5), special request (textarea)
- Required field validation fires on missing broth or spice level — labels turn red, options section gets destructive border, sheet auto-scrolls to first error
- Add/edit dual mode: pre-fills from editingLineItem when editingLineId set, calls store.addItem or store.editItem on confirm
- TypeScript strict mode passes clean with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ModifierSheet slide-up with all modifier groups, validation, and store integration** - `666add9` (feat)

**Plan metadata:** (pending — docs commit below)

## Files Created/Modified

- `src/components/order/ModifierSheet.tsx` — Slide-up bottom sheet component with ModifierSheetProps interface, all modifier groups, required validation, store integration

## Decisions Made

- Used native `<input type="checkbox">` with `accent-primary` Tailwind class instead of shadcn `<Checkbox>` — the project uses `@base-ui/react` (not Radix), and `@radix-ui/react-checkbox` is not installed. Native checkbox avoids a new dependency while achieving the same visual result.
- Sticky footer uses `fixed` positioning at `z-[51]` (one z-level above the panel at z-50) to stay visible while modifier content scrolls within the 70vh constrained panel.
- Spice level implemented with Lucide `Flame` icon rather than emoji chili — consistent with rest of project's Lucide icon system.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Used native checkbox instead of unavailable shadcn Checkbox**
- **Found during:** Task 1 (building modifier toppings multi-select)
- **Issue:** Plan specified shadcn `<Checkbox>` but neither `@radix-ui/react-checkbox` nor a `src/components/ui/checkbox.tsx` file exists — project uses `@base-ui/react` throughout
- **Fix:** Implemented toppings list using native `<input type="checkbox">` with `accent-primary` styling inside a `<label>` wrapper — identical UX, zero new dependencies
- **Files modified:** src/components/order/ModifierSheet.tsx (inline solution, no new file)
- **Verification:** TypeScript passes, visual parity with plan description
- **Committed in:** 666add9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical dependency)
**Impact on plan:** Necessary substitution — identical UX outcome, no scope change.

## Issues Encountered

None — the checkbox substitution was identified immediately before writing and handled inline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ModifierSheet.tsx is self-contained and exports correct props interface
- Ready for 03-04 (OrderPage) to import and wire `<ModifierSheet>` with item selection state
- Store actions `addItem` and `editItem` called correctly — TicketPanel in 03-05 can read the resulting order data

---
*Phase: 03-order-flow*
*Completed: 2026-03-10*
