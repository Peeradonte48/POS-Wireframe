---
phase: 06-manager-layer
plan: 01
subsystem: ui
tags: [zustand, persist, manager, store, payment-capture]

# Dependency graph
requires:
  - phase: 05-payment
    provides: PaymentPage with grandTotal/discountAmount/paymentMethod computed values
  - phase: 01-foundation
    provides: session.store logout action and AppSidebar NAV_ITEMS render loop
provides:
  - manager.store.ts with eightySixedIds, shiftClosed state and persist
  - TableRecord extended with paidAmount, paymentMethod, discountApplied payment capture fields
  - PaymentPage writes payment capture fields to table record on confirm
  - AppSidebar hides manager nav item entirely for non-Manager roles
  - session.store logout resets manager shift state on logout
affects:
  - 06-manager-layer/06-02 (86 management tab — reads eightySixedIds from manager.store)
  - 06-manager-layer/06-03 (EOD summary — reads paidAmount, paymentMethod, discountApplied from table records)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-store call pattern: session.store imports manager.store and calls getState().resetShift() inside logout action — no circular dependency since it's a one-way runtime call"
    - "Early-return guard in NAV_ITEMS.map() for role-based item hiding — returns null before isAccessible check"

key-files:
  created:
    - src/stores/manager.store.ts
  modified:
    - src/stores/table.store.ts
    - src/stores/session.store.ts
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/app-shell/AppSidebar.tsx
    - src/lib/mock-data/tables.ts

key-decisions:
  - "AppSidebar hides manager item with early null return (not greyed-out div) for non-Manager roles — clean UI, not a disabled affordance"
  - "session.store does not get 'use client' directive even after importing manager.store — getState() is called at runtime only, not during module init"
  - "Payment capture fields initialized as null in both openTable (re-seat clears them) and markClean (full reset) to avoid stale data across sessions"

patterns-established:
  - "Cross-store reset on logout: import target store, call getState().resetAction() inside the set() callback"

requirements-completed: [SHIFT-01, SHIFT-03]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 6 Plan 01: Manager Store Foundation Summary

**Zustand manager.store with persist for 86'd items and shift-closed state, TableRecord extended with payment capture fields, PaymentPage wired to write them on confirm, and AppSidebar updated to fully hide the manager nav for non-Manager roles.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-11T07:14:49Z
- **Completed:** 2026-03-11T07:16:49Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created src/stores/manager.store.ts with persist middleware, eightySixedIds array, shiftClosed boolean, and all 4 actions (toggleEightySix, isEightySixed, closeShift, resetShift)
- Extended TableRecord with 3 nullable payment capture fields (paidAmount, paymentMethod, discountApplied); initialized in openTable and markClean; updateTable signature updated
- Wired PaymentPage.handleConfirmPayment to write all 3 fields to the table record on confirm — EOD plans can now read realistic payment totals
- Updated session.store logout to call useManagerStore.getState().resetShift() — shift and 86 state cleared on role switch
- AppSidebar returns null for manager slug when role !== 'Manager' — item fully absent, not greyed

## Task Commits

1. **Task 1: Create manager.store + extend TableRecord + wire PaymentPage** - `777a040` (feat)
2. **Task 2: Hide manager nav item for non-Manager roles in AppSidebar** - `8c5f5f0` (feat)

## Files Created/Modified
- `src/stores/manager.store.ts` - New store: eightySixedIds + shiftClosed with Zustand persist
- `src/stores/table.store.ts` - TableRecord extended with paidAmount/paymentMethod/discountApplied; openTable and markClean reset them; updateTable signature updated
- `src/stores/session.store.ts` - Imports manager.store, calls resetShift() in logout action
- `src/app/(app)/payment/[tableId]/page.tsx` - handleConfirmPayment writes payment capture fields to table record
- `src/components/app-shell/AppSidebar.tsx` - Early null return for manager slug when role !== 'Manager'
- `src/lib/mock-data/tables.ts` - makeTable() includes paidAmount/paymentMethod/discountApplied as null to satisfy TableRecord type

## Decisions Made
- AppSidebar uses early null return (not greyed div) for manager nav item when role is not Manager — plan specifies "hides entirely (not greyed)"
- session.store does not receive 'use client' directive after importing manager.store — only getState() is called at runtime, no module-level evaluation issue
- Payment capture fields initialized in both openTable and markClean so re-seating a table always clears prior payment data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added payment capture fields to tables.ts mock data**
- **Found during:** Task 1 (tsc --noEmit verification)
- **Issue:** `makeTable()` in `src/lib/mock-data/tables.ts` returned an object missing the three new TableRecord fields, causing TS2739 error
- **Fix:** Added `paidAmount: null`, `paymentMethod: null`, `discountApplied: null` to the return object in `makeTable()`
- **Files modified:** src/lib/mock-data/tables.ts
- **Verification:** npx tsc --noEmit passes with zero errors
- **Committed in:** 777a040 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - missing required fields in mock data causing TS error)
**Impact on plan:** Necessary correctness fix; no scope creep.

## Issues Encountered
None beyond the TypeScript error in tables.ts resolved inline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- manager.store.ts is ready for Phase 6 Plan 02 (86 management tab) — eightySixedIds and toggleEightySix are in place
- TableRecord payment capture fields are ready for Phase 6 Plan 03 (EOD summary) — paidAmount/paymentMethod/discountApplied written on every confirmed payment
- AppSidebar correctly hides manager nav for Waiter/Cashier/Kitchen roles

---
*Phase: 06-manager-layer*
*Completed: 2026-03-11*
