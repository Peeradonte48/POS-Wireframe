---
phase: 02-table-map
plan: 02
subsystem: ui
tags: [react, zustand, tailwind, lucide-react, table-map]

requires:
  - phase: 02-table-map plan 01
    provides: useTableStore (tables Record), TableRecord/TableStatus types, useDwellTimer hook, INITIAL_TABLES mock data

provides:
  - TableTile component with status visuals (colored border, icon, label) and live dwell timer
  - TableGrid component with responsive 3/4-column layout and available-count header
  - /table-map page wired with TableGrid and selectedTable state

affects:
  - 02-03 (bottom sheet + OpenTableModal will attach to selectedTable state)
  - Any phase that reads table status UI conventions

tech-stack:
  added: []
  patterns:
    - STATUS_CONFIG record maps each TableStatus to border/text/icon — single source of truth for status visuals
    - useDwellTimer called unconditionally at top of component; conditional render happens below
    - TableGrid reads store directly; TableTile receives TableRecord as prop (store-to-prop boundary)

key-files:
  created:
    - src/components/table-map/TableTile.tsx
    - src/components/table-map/TableGrid.tsx
  modified:
    - src/app/(app)/table-map/page.tsx

key-decisions:
  - "STATUS_CONFIG defined inline in TableTile — no external file needed for 5-status mapping"
  - "selectedTable state held in page.tsx not the store — ephemeral UI selection, not domain state"

patterns-established:
  - "STATUS_CONFIG pattern: Record<StatusType, { borderClass, textClass, label, Icon }> — reuse for future status-driven components"
  - "Hook-then-render: always call hooks unconditionally, guard rendering separately"

requirements-completed:
  - FLOOR-01
  - FLOOR-04

duration: 5min
completed: 2026-03-10
---

# Phase 2 Plan 02: Table Map Grid Summary

**Responsive floor plan grid with 12 TableTile components using STATUS_CONFIG-driven status visuals, live dwell timers, and available-count header**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T11:12:00Z
- **Completed:** 2026-03-10T11:17:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- TableTile component renders table label, colored left border, status icon + text, and (Occupied only) guest count + live dwell timer
- TableGrid reads from useTableStore, computes available count, renders responsive 3/4-col grid with header
- /table-map page replaced placeholder div with TableGrid and manages selectedTable state for Plan 03

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TableTile component** - `89e19fa` (feat)
2. **Task 2: Create TableGrid + wire table-map page** - `a136aa6` (feat)

## Files Created/Modified

- `src/components/table-map/TableTile.tsx` - Individual table button: STATUS_CONFIG, status visuals, dwell timer, orderStage badge
- `src/components/table-map/TableGrid.tsx` - Responsive grid container with header count, reads useTableStore
- `src/app/(app)/table-map/page.tsx` - Replaced placeholder with TableGrid, holds selectedTable state

## Decisions Made

- STATUS_CONFIG defined inline in TableTile — 5 statuses is small enough that an external file adds unnecessary indirection
- selectedTable state held at page level (not in store) — it is ephemeral UI selection, not domain state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TableTile and TableGrid are complete; Plan 03 can import TableGrid and attach TableBottomSheet + OpenTableModal using the selectedTable state already wired in page.tsx
- No blockers

---
*Phase: 02-table-map*
*Completed: 2026-03-10*

## Self-Check: PASSED

- TableTile.tsx: FOUND
- TableGrid.tsx: FOUND
- page.tsx: FOUND
- 02-02-SUMMARY.md: FOUND
- Commit 89e19fa: FOUND
- Commit a136aa6: FOUND
