---
phase: 14-merge-bill
plan: 02
subsystem: ui
tags: [zustand, bottom-sheet, table-map, merge, multi-select, CVA]

# Dependency graph
requires:
  - phase: 14-01
    provides: bill.store initMerge/isMergedSecondary/getMergedSecondaries actions
provides:
  - MergeSheet bottom-sheet component with multi-select table picker for merge flow
affects:
  - 14-03 (wires MergeSheet into TotalsSection and TableBottomSheet)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bottom-sheet structural template: fixed backdrop + translate-y panel, drag handle, z-40/z-50 layering"
    - "Body scroll lock via useEffect([open]) with cleanup return — same as SplitSheet"
    - "View reset on open: useEffect resets selectedIds to new Set() when open becomes true"
    - "option-card multi-select with Set<string> state — no inline boxShadow needed (CVA handles it)"

key-files:
  created:
    - src/components/table-map/MergeSheet.tsx
  modified: []

key-decisions:
  - "MergeSheet placed in table-map/ directory (not payment/) — merge is initiated from floor plan context"
  - "eligibleTables filter uses isMergedSecondary from useBillStore — guards against double-assigning a secondary"
  - "Confirm button label is dynamic: 'Merge (N tables)' when N>0, plain 'Merge' when nothing selected"
  - "LinkLinear solar icon used on confirm button (GitMerge not in solar-icon-set)"

patterns-established:
  - "MergeSheet: same scroll-lock + reset pattern as SplitSheet — establishes consistency for all bottom sheets"

requirements-completed:
  - MERGE-01

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 14 Plan 02: MergeSheet Component Summary

**Multi-select bottom-sheet table picker that calls useBillStore.initMerge on confirm, filtering to Occupied/CheckRequested tables not already secondaries**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T20:12:28Z
- **Completed:** 2026-03-12T20:17:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created MergeSheet.tsx with full bottom-sheet structure (backdrop, panel, drag handle)
- Eligible table filter: Occupied | CheckRequested, not primaryTableId, not isMergedSecondary
- Multi-select via Set<string> state with option-card CVA variant and data-selected toggle
- Body scroll lock and selection reset on every open (matching SplitSheet pattern)
- Confirm calls initMerge → onMergeConfirmed → onClose; disabled when selection empty
- Empty state message when no eligible tables exist
- TypeScript build passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MergeSheet.tsx** - `db35e61` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/table-map/MergeSheet.tsx` - Multi-select table picker bottom sheet for merge flow

## Decisions Made
- MergeSheet placed in `table-map/` directory (not `payment/`) — merge is initiated from the floor plan context, not the payment flow
- `isMergedSecondary` called per-table during filter — guards against double-assigning a secondary to a second primary
- Confirm button label dynamically shows count: `Merge (2 tables)` vs plain `Merge` when empty
- Used `LinkLinear` solar icon (GitMerge not available in solar-icon-set)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MergeSheet is complete and ready to be wired in Plan 03
- Plan 03 will import MergeSheet into TotalsSection and TableBottomSheet, adding open/close state and passing primaryTableId

---
*Phase: 14-merge-bill*
*Completed: 2026-03-13*
