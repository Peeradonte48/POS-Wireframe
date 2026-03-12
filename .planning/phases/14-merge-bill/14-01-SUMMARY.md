---
phase: 14-merge-bill
plan: "01"
subsystem: payments
tags: [zustand, typescript, css-tokens, oklch, bill-store]

# Dependency graph
requires:
  - phase: 12-split-bill
    provides: bill.store.ts with splits map and persist setup
provides:
  - merges: Record<string, string> state in bill.store (persisted)
  - initMerge action with one-primary-per-secondary guard
  - dissolveAll action to clear a primary's secondaries
  - isMergedSecondary / getPrimaryTable / getMergedSecondaries selectors
  - --status-merged / --status-merged-bg CSS tokens (hue 270°, indigo/violet)
affects: [14-02, 14-03, 14-04, MergeSheet, TableTile, payment pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "merges map uses same immutable set() pattern as splits — Object.fromEntries(filter) for dissolve"
    - "Selector helpers use get() not reactive hooks (same as getSplit)"
    - "One-primary-per-secondary invariant enforced at initMerge call site via eligibleIds filter"
    - "CSS status tokens always added in 3 locations: :root, .dark, @theme inline (var() only in @theme)"

key-files:
  created: []
  modified:
    - src/stores/bill.store.ts
    - src/app/globals.css

key-decisions:
  - "[14-01] merges map uses secondary→primary direction: O(1) lookup for isMergedSecondary and getPrimaryTable"
  - "[14-01] One-primary-per-secondary guard in initMerge: filter out ids already in state.merges before inserting"
  - "[14-01] getMergedSecondaries does linear scan via Object.keys filter — acceptable for table counts (<20)"
  - "[14-01] --status-merged hue 270° (indigo/violet): distinct from amber split (~60°) and crimson primary (~27°)"

patterns-established:
  - "Status token registration pattern: add in :root, .dark, and @theme inline using var() aliases"
  - "Merge state follows same Zustand persist pattern as splits — no separate persist config needed"

requirements-completed: [MERGE-01]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 14 Plan 01: Merge Bill Foundation Summary

**Zustand merges map with 5 typed actions plus indigo/violet --status-merged CSS tokens, giving downstream merge UI compile-time-verified types and a distinct visual hue**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T09:28:12Z
- **Completed:** 2026-03-13T09:30:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extended bill.store.ts with `merges: Record<string, string>` persisted under existing 'bill-store' name
- Added initMerge (with one-primary-per-secondary guard), dissolveAll, isMergedSecondary, getPrimaryTable, getMergedSecondaries — all TypeScript-typed
- Added `--status-merged` / `--status-merged-bg` tokens at hue 270° in `:root`, `.dark`, and `@theme inline` — Tailwind classes `bg-status-merged-bg` and `text-status-merged` now available
- `npm run build` exits 0 with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend bill.store with merges map and actions** - `483d835` (feat)
2. **Task 2: Add --status-merged / --status-merged-bg tokens to globals.css** - `7ff24c9` (feat)

## Files Created/Modified

- `src/stores/bill.store.ts` — Added `merges` field + 5 merge actions to BillStore interface and implementation
- `src/app/globals.css` — Added `--status-merged` and `--status-merged-bg` tokens in `:root`, `.dark`, and `@theme inline`

## Decisions Made

- **merges map direction**: secondary → primary (key = secondaryTableId, value = primaryTableId) for O(1) isMergedSecondary and getPrimaryTable lookups
- **One-primary-per-secondary guard**: enforced at write-time in initMerge by filtering ids already present in state.merges — simpler than a runtime error
- **getMergedSecondaries uses linear scan**: Object.keys filter is acceptable at POS table counts (<20 tables)
- **Hue 270°**: indigo/violet — maximally distinct from amber split tokens (~60°) and crimson primary (~27°)
- **No @theme inline literal values**: only `var(--status-merged)` references to prevent silent dark mode breakage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 merge actions are TypeScript-typed and callable from any downstream component
- `--color-status-merged` and `--color-status-merged-bg` Tailwind classes are available for MergeSheet, TableTile badge, and any merge UI
- Plan 14-02 (MergeSheet UI) can proceed immediately using `useBillStore` and the new CSS tokens

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 14-merge-bill*
*Completed: 2026-03-13*
