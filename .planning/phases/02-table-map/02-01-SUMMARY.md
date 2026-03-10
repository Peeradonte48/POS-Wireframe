---
phase: 02-table-map
plan: 01
subsystem: ui
tags: [zustand, typescript, react, state-machine, mock-data]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Zustand 5 installed, TypeScript strict mode configured, project scaffolded"
provides:
  - "useTableStore Zustand state machine with TableStatus/OrderStage/TableRecord types"
  - "INITIAL_TABLES fixture — 12 tables, T10+T11 pre-seeded as Reserved"
  - "useDwellTimer custom hook — interval-based elapsed time formatter"
affects:
  - 02-table-map (plans 02–04 render from useTableStore)
  - 03-order-flow (reads table status to attach orders)
  - 05-payment (reads table state for billing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand create<T> with no persist — client-side only, resets on page load"
    - "State machine actions mutate only relevant fields; markClean resets all fields"
    - "Fixture file imports type-only from store to avoid circular value dependency"

key-files:
  created:
    - src/stores/table.store.ts
    - src/lib/mock-data/tables.ts
    - src/components/table-map/useDwellTimer.ts
  modified: []

key-decisions:
  - "INITIAL_TABLES fixture uses type-only import from table.store.ts to avoid circular dependency"
  - "useDwellTimer uses useState(Date.now()) so initial render is non-zero for mounted timers"
  - "markClean resets all 9 nullable fields to null/Open — total reset semantics"

patterns-established:
  - "Store pattern: create<Interface>((set) => ({ ...state, action: (args) => set((state) => ({...})) }))"
  - "Fixture pattern: makeTable helper + Array.from + Object.fromEntries for typed Record"
  - "Timer hook pattern: useState(now) + setInterval in useEffect returning clearInterval"

requirements-completed: [FLOOR-01, FLOOR-04, FLOOR-05]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 2 Plan 01: Table Map Data Layer Summary

**Zustand 5 table state machine with 7 actions (open/reserve/clean/serve/etc.), 12-table mock fixture with T10+T11 Reserved, and interval-based dwell timer hook**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T11:13:23Z
- **Completed:** 2026-03-10T11:14:20Z
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments
- Zustand 5 store with full TypeScript types (TableStatus union, OrderStage union, TableRecord interface) and 7 state machine actions
- 12-table INITIAL_TABLES fixture with T10/T11 pre-seeded as Reserved, all others Open
- useDwellTimer custom hook with setInterval-based elapsed time formatting (M:SS and Xh YYm formats)
- npx tsc --noEmit passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create table.store.ts and tables.ts** - `f623c99` (feat)
2. **Task 2: Add useDwellTimer hook** - `04895b3` (feat)

## Files Created/Modified
- `src/stores/table.store.ts` - Zustand state machine; exports TableStatus, OrderStage, TableRecord, useTableStore
- `src/lib/mock-data/tables.ts` - INITIAL_TABLES fixture; 12 tables, T10+T11 Reserved
- `src/components/table-map/useDwellTimer.ts` - Custom hook; returns '' for null, formatted string for timestamp

## Decisions Made
- `tables.ts` uses `import type { TableRecord }` (type-only import) from `table.store.ts` to avoid a circular value dependency while `table.store.ts` imports the INITIAL_TABLES value from `tables.ts`
- `useDwellTimer` initializes `now` with `Date.now()` so any already-open table displays correct elapsed time immediately on mount without waiting for the first interval tick

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three data layer files are in place; Plan 02 can immediately render TableTile components by reading from `useTableStore`
- No blockers. TypeScript strict mode passes cleanly.

---
*Phase: 02-table-map*
*Completed: 2026-03-10*
