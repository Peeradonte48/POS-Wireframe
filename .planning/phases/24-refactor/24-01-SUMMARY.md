---
phase: 24-refactor
plan: 01
subsystem: ui
tags: [react-hooks, refactor, deduplication, dialog-reset, timer-hooks]

requires:
  - phase: 22-codebase-audit
    provides: "Audit report identifying duplicate timer hooks, queue badge helpers, and dialog-reset useEffect patterns"
  - phase: 23-typescript-dead-code
    provides: "ESLint suppressions that this plan removes (react-hooks/purity, set-state-in-effect)"

provides:
  - src/lib/hooks/useNowTimer.ts — shared timer hook replacing 3 duplicate timer hooks
  - src/lib/queue-display.ts — shared queue status badge/label helpers replacing local copies in TakeawayCard and DeliveryCard
  - Key-based remount pattern in 8 dialog/modal/sheet components (no more useEffect/prevOpen resets)

affects: [25-tech-debt, any future component using timer hooks or queue status display]

tech-stack:
  added: []
  patterns:
    - "useNowTimer(intervalMs, active) shared hook — active param replaces conditional setInterval guards"
    - "Key-based remount pattern — outer component holds open/close; inner component gets key={trigger} so React unmounts/remounts on state changes"
    - "Pure function modules in src/lib/ — queue-display.ts follows order-tracking.ts pattern (no 'use client', pure functions)"

key-files:
  created:
    - src/lib/hooks/useNowTimer.ts
    - src/lib/queue-display.ts
  modified:
    - src/components/table-map/useDwellTimer.ts
    - src/components/table-map/useSentTimer.ts
    - src/components/kds/useKdsTimer.ts
    - src/components/queue/TakeawayCard.tsx
    - src/components/queue/DeliveryCard.tsx
    - src/components/order/SimpleItemDialog.tsx
    - src/components/payment/CashDialog.tsx
    - src/components/payment/ValueSplitSheet.tsx
    - src/components/payment/CrmLookupDialog.tsx
    - src/components/queue/EditCustomerModal.tsx
    - src/components/queue/NewDeliveryModal.tsx
    - src/components/table-map/OpenTableModal.tsx
    - src/components/table-map/TableBottomSheet.tsx

key-decisions:
  - "useNowTimer uses useState(Date.now) function reference (not Date.now()) to avoid react-hooks/purity lint error — enables removing all eslint-disable suppressions from timer hooks"
  - "queue-display.ts omits 'Completed' status (not in QueueOrderStatus type) and adds 'cooking' to return union to match DeliveryCard's Preparing variant"
  - "CrmLookupDialog was already using manual reset in callbacks (not useEffect); key-based remount still applied for consistency and to eliminate all local state reset logic"
  - "TableBottomSheet: mergeSheetOpen stays in outer component since MergeDialog is rendered outside Sheet — inner component only holds tab/waiter/note state"
  - "SimpleItemDialog: body scroll lock useEffect kept in outer component since it needs to respond to open prop, not be in inner"

patterns-established:
  - "Outer/inner component split: outer renders primitive wrapper (Dialog/Sheet/null) with open prop, inner receives key={trigger} and owns all useState with default values"
  - "Shared pure-function lib modules: src/lib/ for domain helpers with no React dependencies"

requirements-completed: [REF-02]

duration: 7min
completed: 2026-03-31
---

# Phase 24 Plan 01: Duplicate Pattern Consolidation Summary

**Shared useNowTimer hook (replaces 3 duplicate timer hooks), queue-display.ts module (merges badge helpers from TakeawayCard/DeliveryCard), and key-based remount pattern in 8 dialog/modal/sheet components — all Phase 23 eslint-disable suppressions for these patterns removed**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-31T09:46:25Z
- **Completed:** 2026-03-31T09:53:25Z
- **Tasks:** 2
- **Files modified:** 13 (2 created, 11 modified)

## Accomplishments

- Created `src/lib/hooks/useNowTimer.ts` — single shared timer hook with `active` parameter, replaces duplicate `useState`+`setInterval` boilerplate in 3 timer hooks
- Created `src/lib/queue-display.ts` — merged `getQueueStatusBadgeVariant` and `getQueueStatusLabel` from TakeawayCard and DeliveryCard into one pure-function module
- Rewrote useDwellTimer, useSentTimer, and useKdsTimer to delegate to useNowTimer — removed all `eslint-disable react-hooks/purity` comments
- Converted 8 dialog/modal/sheet components to key-based remount — removed all `eslint-disable set-state-in-effect` comments and the `prevOpen` pattern in ValueSplitSheet
- Zero TypeScript build errors throughout

## Task Commits

1. **Task 1: Create shared useNowTimer hook and queue-display module** - `e2d010c` (feat)
2. **Task 2: Convert dialog-reset useEffect to key-based remount in 8 components** - `17d880c` (refactor)

## Files Created/Modified

- `src/lib/hooks/useNowTimer.ts` — shared ticking Date.now() hook, intervalMs + active params
- `src/lib/queue-display.ts` — getQueueStatusBadgeVariant + getQueueStatusLabel pure functions
- `src/components/table-map/useDwellTimer.ts` — delegates to useNowTimer(1000, openedAt !== null)
- `src/components/table-map/useSentTimer.ts` — delegates to useNowTimer(60_000, sentAt !== null)
- `src/components/kds/useKdsTimer.ts` — delegates to useNowTimer(1000) (always active)
- `src/components/queue/TakeawayCard.tsx` — imports from queue-display instead of local helpers
- `src/components/queue/DeliveryCard.tsx` — imports getQueueStatusLabel from queue-display
- `src/components/order/SimpleItemDialog.tsx` — outer/inner split, key="dialog-content"
- `src/components/payment/CashDialog.tsx` — outer/inner split, key={String(open)}
- `src/components/payment/ValueSplitSheet.tsx` — prevOpen removed, outer/inner split, key={String(open)}
- `src/components/payment/CrmLookupDialog.tsx` — outer/inner split, key={String(open)}
- `src/components/queue/EditCustomerModal.tsx` — outer/inner split, key={open ? orderId : 'closed'}
- `src/components/queue/NewDeliveryModal.tsx` — outer/inner split, key={String(open)}
- `src/components/table-map/OpenTableModal.tsx` — outer/inner split, key={tableId}
- `src/components/table-map/TableBottomSheet.tsx` — outer/inner split, key={table.id}

## Decisions Made

- `useNowTimer` uses `useState(Date.now)` (function reference) rather than `useState(Date.now())` (call result) — this is how React hook purity lint is satisfied: initial state factory is called only once
- `queue-display.ts` return type includes `'cooking'` for the `Preparing` delivery status — this differs from TakeawayCard's original `'ordered'` choice for `Sent`, but is semantically more accurate for Preparing stage
- `CrmLookupDialog` previously had manual reset in `handleSearch`/`handleClose` callbacks (not a useEffect pattern), but key-based remount was applied anyway per plan spec for consistency
- `mergeSheetOpen` state kept in outer `TableBottomSheet` because `MergeDialog` is rendered outside the `Sheet` component — the inner component only controls tab/waiter/note

## Deviations from Plan

None — plan executed exactly as written. One minor adaptation: `queue-display.ts` omits the `'Completed'` status referenced in the plan spec (it does not exist in `QueueOrderStatus` type). The `default` case handles any unmatched values cleanly without TypeScript error.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — all changes are pure refactors, no data stubs introduced.

## Next Phase Readiness

- Timer hooks, queue display helpers, and dialog-reset patterns consolidated — codebase is cleaner
- Plan 02 (SplitSheet decomposition) proceeds with this foundation; SplitSheet dialog-reset deferred to Plan 02 as documented
- All Phase 23 eslint-disable suppressions for these patterns are removed

## Self-Check: PASSED

All 15 source files and SUMMARY.md confirmed present. Both task commits (e2d010c, 17d880c) confirmed in git log.

---
*Phase: 24-refactor*
*Completed: 2026-03-31*
