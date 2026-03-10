---
phase: 02-table-map
plan: 03
subsystem: ui
tags: [react, zustand, base-ui, tailwind, bottom-sheet, dialog]

# Dependency graph
requires:
  - phase: 02-table-map plan 01
    provides: table.store.ts with full TableRecord/TableStatus types and all actions
  - phase: 02-table-map plan 02
    provides: TableGrid, TableTile, useDwellTimer — interactive grid with tap handler

provides:
  - TableBottomSheet: status-aware slide-up panel with backdrop, covers all 5 TableStatus values
  - OpenTableModal: Base UI Dialog for guest count entry calling openTable on confirm
  - Fully wired table-map page: complete floor plan lifecycle interactive

affects:
  - 03-order-flow (TableBottomSheet View Order button is a Phase 3 entry point)
  - 05-payment (Go to Payment button in CheckRequested sheet is a Phase 5 entry point)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS-only slide-up bottom sheet (no library) using translate-y-full / translate-y-0 transitions
    - Body scroll lock via useEffect on open state
    - Inline editable fields with onBlur store write (not per-keystroke) to prevent tile re-render churn
    - Local state (localWaiter, localNote) synced from store via useEffect on table.id change

key-files:
  created:
    - src/components/table-map/TableBottomSheet.tsx
    - src/components/table-map/OpenTableModal.tsx
  modified:
    - src/app/(app)/table-map/page.tsx

key-decisions:
  - "Bottom sheet implemented as CSS-only slide-up (no library) — translate-y-full/translate-y-0 with fixed positioning is sufficient for mobile POS"
  - "Local state (localWaiter, localNote) synced from store on table.id change — prevents stale edits when switching between tables"
  - "OpenTableModal closes bottom sheet before opening (setSelectedTable(null)) to avoid z-index stacking issues"
  - "View Order and Go to Payment rendered as disabled annotated placeholders for Phase 3/5 handoff clarity"

patterns-established:
  - "Bottom sheet pattern: fixed inset-0 backdrop (z-40) + fixed bottom panel (z-50), both driven by single open boolean"
  - "Blur-update pattern: local controlled input, onBlur writes to Zustand store — avoids reactive cascade on every keystroke"

requirements-completed: [FLOOR-02, FLOOR-03, FLOOR-05]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 2 Plan 03: Table Map Interaction Layer Summary

**Status-aware TableBottomSheet with slide-up animation and OpenTableModal for guest count entry, completing the full floor plan state machine lifecycle**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T11:19:07Z
- **Completed:** 2026-03-10T11:27:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- TableBottomSheet renders correct UI for all 5 statuses: Open (Open Table / Mark Reserved), Occupied (guest count, dwell timer, waiter, note, order stage badge, action buttons), CheckRequested (Go to Payment placeholder), Cleaning (Mark Clean), Reserved (read-only label)
- OpenTableModal uses Base UI Dialog with disablePointerDismissal, resets guest count to 1 on each new table open
- table-map page fully wired: tap a tile -> bottom sheet -> modal flow works end-to-end with correct state handoff

## Task Commits

1. **Task 1: Create TableBottomSheet component** - `18d9176` (feat)
2. **Task 2: Create OpenTableModal and wire table-map page** - `15f0248` (feat)

## Files Created/Modified

- `src/components/table-map/TableBottomSheet.tsx` - Status-aware slide-up bottom sheet with backdrop overlay, inline editing, and all store action wiring
- `src/components/table-map/OpenTableModal.tsx` - Base UI Dialog modal for guest count entry, calls openTable on confirm
- `src/app/(app)/table-map/page.tsx` - Wired page managing selectedTable and openModalTableId state, renders all three components

## Decisions Made

- Bottom sheet is CSS-only (no library) — translate-y-full/translate-y-0 with fixed positioning is sufficient for a mobile POS wireframe
- Local state (localWaiter, localNote) synced from store on table.id change via useEffect — prevents stale data when user switches between occupied tables without closing the sheet
- Bottom sheet closes before OpenTableModal opens (setSelectedTable(null)) to avoid z-index stacking ambiguity
- View Order (Phase 3) and Go to Payment (Phase 5) rendered as disabled buttons with phase annotation for clear handoff context during demos

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 state machine fully interactive: Open -> Occupied -> CheckRequested -> (Payment Phase 5) and Occupied -> Served, and Cleaning -> Open
- TableBottomSheet View Order button is the natural entry point for Phase 3 order flow
- FLOOR-01 through FLOOR-05 requirements are complete
- Ready for Phase 3: Order Flow

---
*Phase: 02-table-map*
*Completed: 2026-03-10*
