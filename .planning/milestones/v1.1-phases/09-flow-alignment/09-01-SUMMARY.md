---
phase: 09-flow-alignment
plan: "01"
subsystem: ui
tags: [react, typescript, zustand, table-map, bottom-sheet, modal]

# Dependency graph
requires:
  - phase: 08-bug-fixes
    provides: Zustand table.store with servedAt field and markServed() action
provides:
  - OpenTableModal with empty initial guest count and guarded confirm button (FLOW-01)
  - TableBottomSheet Occupied state showing "Served at HH:MM" in Thai locale (FLOW-02)
affects: [09-02, 09-03, phase-10, phase-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useState<number | ''> union for controlled numeric inputs that must start empty"
    - "servedAt !== null guard for conditional timestamp display inside status branches"
    - "toLocaleTimeString('th-TH') for Thai locale time formatting, matching ReceiptScreen pattern"

key-files:
  created: []
  modified:
    - src/components/table-map/OpenTableModal.tsx
    - src/components/table-map/TableBottomSheet.tsx

key-decisions:
  - "useState<number | ''> union is the correct sentinel for a numeric input that must start blank — empty string is not assignable to number, so TypeScript enforces the guard at usage sites"
  - "Served-at paragraph placed after orderStage badge (before action buttons) so it appears inline in the natural reading order of the Occupied sheet"
  - "Pre-existing lint errors in useDwellTimer.ts and kds.store.ts are out of scope — confirmed present before this plan's changes"

patterns-established:
  - "Empty-string sentinel pattern: useState<number | ''> + disabled={value === '' || value < 1} for forced-entry numeric inputs"
  - "Conditional timestamp display: {field !== null && <p>...</p>} using null guard on Zustand store field"

requirements-completed:
  - FLOW-01
  - FLOW-02

# Metrics
duration: 8min
completed: 2026-03-12
---

# Phase 9 Plan 01: Flow Alignment (FLOW-01 + FLOW-02) Summary

**OpenTableModal forced-entry guest count (empty start, disabled confirm) and Occupied bottom sheet "Served at HH:MM" Thai locale display via servedAt null guard**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-12T08:03:01Z
- **Completed:** 2026-03-12T08:11:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- FLOW-01: Guest count field in Open Table modal now starts empty; confirm button is disabled until staff types a number >= 1 — prevents accidental zero-guest table opens
- FLOW-02: "Served at HH:MM" paragraph appears inline in Occupied bottom sheet immediately after Served is tapped, using Thai locale time format matching the established ReceiptScreen pattern
- Build green (TypeScript zero errors) across both changes

## Task Commits

Each task was committed atomically:

1. **Task 1: FLOW-01 — Fix OpenTableModal guest count to start empty** - `7e56624` (fix) — applied by previous session as auto-fix Rule 1 during 09-03 execution
2. **Task 2: FLOW-02 — Show "Served at HH:MM" in Occupied bottom sheet** - `9372e10` (feat)

## Files Created/Modified

- `src/components/table-map/OpenTableModal.tsx` — state type changed to `useState<number | ''>('')`, reset to `''`, confirm disabled when empty or < 1, handleConfirm guard narrowed to typeof check
- `src/components/table-map/TableBottomSheet.tsx` — added `{table.servedAt !== null && <p>Served at ...</p>}` inside Occupied branch after orderStage badge

## Decisions Made

- `useState<number | ''>('')` is the correct union for a controlled numeric input that must start blank — empty string sentinel allows controlled mode while TypeScript enforces the guard at all usage sites
- Served-at paragraph placed after the orderStage badge and before action buttons — natural reading order in the Occupied sheet
- Pre-existing lint errors in `useDwellTimer.ts` (`Date.now` purity warning) and `kds.store.ts` (unused var) confirmed to be out of scope — both existed before this plan's changes

## Deviations from Plan

### Context Note: Task 1 Pre-Applied

**Task 1 (FLOW-01) was applied by a previous session** as an auto-fix (Rule 1) inside commit `7e56624` (feat(09-03)) during Phase 9 Plan 03 execution. The previous session noted it as: "Auto-fix (Rule 1): OpenTableModal disabled prop narrowed to guestCount === '' || (number && < 1) — TS type error from 09-01". The change was identical to this plan's specification. No re-work was needed.

Task 2 (FLOW-02) was not yet applied and was executed fresh in this session.

**Total deviations:** 0 auto-fixes in this session (Task 1 had been pre-applied correctly by prior session)
**Impact on plan:** No scope creep. Both FLOW-01 and FLOW-02 requirements are now met.

## Issues Encountered

- Stale `.next/lock` file from a previous interrupted build process — removed manually before build could proceed
- Pre-existing lint errors in unrelated files (`useDwellTimer.ts`, `kds.store.ts`) — confirmed pre-existing, deferred to appropriate phase per scope boundary rule

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- FLOW-01 and FLOW-02 requirements satisfied — Phase 9 Plan 01 complete
- TableBottomSheet and OpenTableModal patterns established for Phase 11 (component polish)
- No blockers for Phase 9 Plans 02 and 03 (already completed in prior session)

---
*Phase: 09-flow-alignment*
*Completed: 2026-03-12*

## Self-Check: PASSED

- FOUND: `src/components/table-map/OpenTableModal.tsx` — `useState<number | ''>('')` at line 23
- FOUND: `src/components/table-map/TableBottomSheet.tsx` — `table.servedAt !== null` guard at line 155
- FOUND: `.planning/phases/09-flow-alignment/09-01-SUMMARY.md`
- Commit `9372e10` verified (Task 2 — TableBottomSheet)
