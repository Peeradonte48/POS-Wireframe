---
phase: 16-integration-fix
plan: 01
subsystem: ui
tags: [zustand, kds, payment, table-store, bill-store, order-tracking]

requires:
  - phase: 15-order-tracking
    provides: orderStage field on TableRecord, escalation badge system in TableTile
  - phase: 14-merge-bill
    provides: bill.store dissolveAll API, merge map (merges Record), TableBottomSheet markClean button
  - phase: 12-split-bill
    provides: SplitSheet onAllPaid callback, payment/[tableId]/page.tsx structure

provides:
  - KdsTicketCard.handleBump writes Cooking/Ready/Served to table.store on each KDS stage transition
  - payment/[tableId]/page.tsx onAllPaid sets orderStage 'Billed' before receipt view
  - TableBottomSheet markClean button calls dissolveAll to clear merge map entries

affects: [kds, table-map, payment, order-tracking]

tech-stack:
  added: []
  patterns:
    - "Pre-bump stage capture: read ticket.stage into const BEFORE calling bumpTicket() — stage advances synchronously in Zustand"
    - "Cross-store write at callsite: getState().updateTable() in KdsTicketCard — keeps kds.store decoupled from table.store"

key-files:
  created: []
  modified:
    - src/components/kds/KdsTicketCard.tsx
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/table-map/TableBottomSheet.tsx

key-decisions:
  - "Write-back lives in KdsTicketCard (presenter callsite), not kds.store — avoids coupling stores at definition time"
  - "Pre-bump currentStage captured before bumpTicket() call because Zustand set is applied before function returns"
  - "dissolveAll called before markClean in TableBottomSheet — primary table cleanup removes all secondary merge references"
  - "orderStage 'Billed' set as first statement in onAllPaid — before markCleaning secondaries and dissolveAll"

patterns-established:
  - "Pre-bump stage read: const currentStage = ticket.stage before bumpTicket()"
  - "Cleanup ordering in markClean: cancelSplit → dissolveAll → markClean → onClose"

requirements-completed: [TRACK-01, TRACK-03, SPLIT-03, MERGE-01, MERGE-02]

duration: 30min
completed: 2026-03-13
---

# Phase 16 Plan 01: Integration Fix Summary

**Three surgical getState() callsite insertions wire KDS stage transitions into table.store orderStage, set Billed on split-bill completion, and dissolve merge map on markClean — closing all five v1.2 audit gaps: TRACK-01, TRACK-03, SPLIT-03, MERGE-01, MERGE-02.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-13T11:11:09Z
- **Completed:** 2026-03-13
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify, approved)
- **Files modified:** 4

## Accomplishments

- KdsTicketCard now writes Cooking/Ready/Served to table.store on each KDS bump, enabling live order-stage badges on table tiles
- payment/[tableId]/page.tsx onAllPaid callback now sets orderStage 'Billed' before transitioning to receipt view
- TableBottomSheet markClean button now calls dissolveAll to clear stale merge badges from secondary table tiles
- MERGE-02 "Revert to Single Bill" verified in browser — guard blocks revert after first paid seat, unblocked revert restores all items unassigned; REQUIREMENTS.md checkbox updated to [x]

## Task Commits

1. **Task 1: KdsTicketCard bumpTicket orderStage write-back (TRACK-01, TRACK-03)** - `bcaee96` (feat)
2. **Task 2: onAllPaid Billed stage + markClean dissolveAll (SPLIT-03, MERGE-01)** - `94ca01e` (feat)
3. **Task 3: Browser verification — TRACK-01/03, SPLIT-03, MERGE-01, MERGE-02** - human-verify checkpoint (approved by user)

## Files Created/Modified

- `src/components/kds/KdsTicketCard.tsx` - Added useTableStore import; extracted handleBump with pre-bump stage capture and three-way conditional write-back
- `src/app/(app)/payment/[tableId]/page.tsx` - Added updateTable(tableId, { orderStage: 'Billed' }) as first line of onAllPaid callback
- `src/components/table-map/TableBottomSheet.tsx` - Added useBillStore.getState().dissolveAll(table.id) between cancelSplit and markClean in the Cleaning-status button handler
- `.planning/REQUIREMENTS.md` - MERGE-02 checkbox updated to [x]; traceability row updated from Pending to Complete

## Decisions Made

- Write-back placed in KdsTicketCard presenter (not kds.store) to avoid coupling stores at definition time — consistent with getState() callsite pattern in CLAUDE.md
- Pre-bump `const currentStage = ticket.stage` captured before `bumpTicket()` call because Zustand's `set()` applies synchronously before the function returns
- `orderStage: 'Billed'` set as the very first statement in onAllPaid — primary table must have terminal stage before secondary cleanup and dissolveAll run

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All v1.2 requirements fully complete. Phase 16 is the final integration fix phase — no successor phases planned. The v1.2 milestone (Split Bill, Polish, Merge Bill, Order Tracking, Integration Fix) is now complete with all 11 requirements verified [x] in REQUIREMENTS.md. No blockers or deferred items.

## Self-Check: PASSED

- FOUND: src/components/kds/KdsTicketCard.tsx
- FOUND: src/app/(app)/payment/[tableId]/page.tsx
- FOUND: src/components/table-map/TableBottomSheet.tsx
- FOUND: .planning/REQUIREMENTS.md (MERGE-02 [x], traceability Complete)
- FOUND: .planning/phases/16-integration-fix/16-01-SUMMARY.md
- FOUND: bcaee96 (Task 1 commit)
- FOUND: 94ca01e (Task 2 commit)

---
*Phase: 16-integration-fix*
*Completed: 2026-03-13*
