---
phase: 12-split-bill
plan: "03"
subsystem: ui
tags: [zustand, tailwind, solar-icons, split-bill, table-map]

# Dependency graph
requires:
  - phase: 12-01
    provides: "bill.store.ts with BillSplit interface, getSplit selector, amber color tokens (bg-status-split-bg, text-status-split)"
provides:
  - "TableTile with conditional split progress badge showing '{paidCount}/{seatCount} paid'"
  - "SPLIT-04: floor staff can see active split status at a glance on the table map"
affects:
  - 13-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-store selector in UI component: useBillStore selector called inside component that already reads table.store data — lightweight, no subscription duplication"
    - "Ternary badge slot: single absolute-positioned slot renders either split badge, stage badge, or null depending on state priority"

key-files:
  created: []
  modified:
    - src/components/table-map/TableTile.tsx

key-decisions:
  - "showSplitBadge guards split! non-null assertion — TypeScript safety without runtime overhead"
  - "Split badge only shows when status === CheckRequested — payment-phase overlay, not a new table status (confirmed decision from 12-01 context)"

patterns-established:
  - "Badge slot priority: split progress > orderStage > null — split state overrides stage badge during payment phase"

requirements-completed:
  - SPLIT-04

# Metrics
duration: 1min
completed: "2026-03-12"
---

# Phase 12 Plan 03: Split Bill — TableTile Split Progress Badge Summary

**TableTile conditionally renders an amber scissors badge showing '{paidCount}/{seatCount} paid' when a BillSplit is active for that table and its status is CheckRequested**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-12T07:38:29Z
- **Completed:** 2026-03-12T07:39:25Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `useBillStore` and `ScissorsLinear` imports to TableTile
- Derived `showSplitBadge` flag (split exists AND status is CheckRequested) inside component body
- Replaced single badge slot with ternary: amber split badge OR outline stage badge OR null
- `npm run build` passes with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add split progress badge to TableTile** - `c165410` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/table-map/TableTile.tsx` - Added split progress badge with amber color tokens; preserves existing orderStage badge in else branch

## Decisions Made

None — followed plan as specified. The `split!` non-null assertion with `showSplitBadge` guard was explicitly called out in the plan and applied as written.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- SPLIT-04 complete: the floor map now surfaces active split state without navigation
- Phase 12 (Split Bill) is now fully complete — all four plans (01 store, 02 sheets, 03 table badge, and the implicit 04 wiring) delivered
- Phase 13 (Polish) can proceed; TableTile uses the same token/CVA conventions that Polish will refine

---
*Phase: 12-split-bill*
*Completed: 2026-03-12*
