---
phase: 12-split-bill
plan: "04"
subsystem: payments
tags: [zustand, split-bill, react, typescript, next.js]

# Dependency graph
requires:
  - phase: 12-split-bill/12-01
    provides: bill.store.ts — Zustand persist store with equal split + per-seat assignment + payment records
  - phase: 12-split-bill/12-02
    provides: SplitSheet.tsx + SeatPaymentPanel.tsx — full split UI components
  - phase: 12-split-bill/12-03
    provides: TableTile split progress badge ("X/N paid")
provides:
  - Active Split Bill button in TotalsSection wired to open SplitSheet
  - SplitSheet mounted in payment page with auto-open resume on re-entry
  - cancelSplit cleanup in TableBottomSheet to prevent stale bill.store state
  - Complete end-to-end split bill flow: open → choose mode → pay seats → table Cleaning
  - Four bug fixes verified during human verification (stale order, per-seat assignment edge cases)
affects:
  - 13-polish (payment page layout, TotalsSection styling)
  - 14-merge-bill (bill.store interaction pattern, TableBottomSheet cleanup pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auto-open split sheet via useEffect + getSplit(tableId) on payment page mount"
    - "cancelSplit called in TableBottomSheet before markClean to prevent stale persisted state"
    - "onSplitBill as optional prop on TotalsSection — undefined click is a no-op in React"

key-files:
  created: []
  modified:
    - src/components/payment/TotalsSection.tsx
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/table-map/TableBottomSheet.tsx
    - src/components/payment/SplitSheet.tsx
    - src/stores/order.store.ts

key-decisions:
  - "onAllPaid uses 'Cash' as placeholder paymentMethod on receipt — wireframe doesn't track mixed per-seat payment methods at receipt level"
  - "assignItem accumulates quantity on existing seat assignment instead of replacing — allows splitting qty of same item across multiple seats"
  - "Per-seat assignment preserves partial assignments when switching between seats during picker flow"
  - "Stale order cleared on table open (order.store) — persisted sent rounds from previous session were disabling the send-to-kitchen button"

patterns-established:
  - "Payment page auto-resume pattern: useEffect checks bill.store on mount, opens sheet if split in progress"
  - "Store cleanup on table lifecycle: cancel/clear store state before table status transitions (markClean calls cancelSplit)"

requirements-completed: [SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04]

# Metrics
duration: ~60min (including human verification + bug fixes)
completed: 2026-03-12
---

# Phase 12 Plan 04: Split Bill Integration Summary

**Three integration points wired (TotalsSection button, payment page SplitSheet mount, TableBottomSheet cleanup) plus four bug fixes verified in end-to-end human testing across all 5 split flows**

## Performance

- **Duration:** ~60 min (including human verification session with bug fixes)
- **Started:** 2026-03-12
- **Completed:** 2026-03-12
- **Tasks:** 2 (T1 implementation + T2 human verification)
- **Files modified:** 5 (3 planned + 2 bug fixes during verification)

## Accomplishments

- Split Bill button in TotalsSection is now active with ScissorsLinear icon (replaced disabled v2 placeholder)
- SplitSheet mounted in payment page with correct props; auto-opens on re-entry if split is in progress
- TableBottomSheet calls cancelSplit before markClean to prevent stale bill.store state persisting across table reuse
- Four bugs surfaced and fixed during human verification: stale order blocking send-to-kitchen, per-seat assignment losing partial state between seats, re-assign/unassign picker not showing on assigned items, and qty accumulation replacing instead of adding on duplicate seat assignment
- All 5 verification flows passed: equal split, per-seat assignment, mid-split resume, cancel split, stale state cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Activate Split Bill button + wire payment page and TableBottomSheet** - `557f884` (feat)
2. **Task 2: Human verification (bug fixes applied during testing):**
   - `21d1082` — fix: clear stale order on table open
   - `7d9a3c9` — fix: per-seat assignment — preserve partial assignments across seats
   - `34c04b5` — fix: show re-assign picker and unassign button on assigned seat items
   - `7abc9bf` — fix: assignItem accumulates qty on existing seat assignment instead of replacing

## Files Created/Modified

- `src/components/payment/TotalsSection.tsx` — Replaced disabled "Split Bill → v2" placeholder with active button + ScissorsLinear icon; added `onSplitBill?: () => void` prop
- `src/app/(app)/payment/[tableId]/page.tsx` — Added SplitSheet import, splitSheetOpen state, useEffect auto-open, onSplitBill prop on TotalsSection, and SplitSheet mount with onAllPaid navigation
- `src/components/table-map/TableBottomSheet.tsx` — Added useBillStore import and cancelSplit call immediately before markClean
- `src/components/payment/SplitSheet.tsx` — Bug fixes for per-seat assignment: partial state preservation, re-assign/unassign picker visibility, qty accumulation behavior
- `src/stores/order.store.ts` — Clear stale sent rounds on table open to prevent disabled send-to-kitchen button

## Decisions Made

- `onAllPaid` uses `'Cash'` as placeholder `paymentMethod` on the receipt — the wireframe receipt shows full grand total regardless of per-seat payment method mix; tracking mixed methods at receipt level is out of scope
- `assignItem` accumulates quantity on an existing seat assignment (e.g. assigning 1 more of an item already on Seat 1 adds to existing qty) rather than replacing — supports splitting same-item quantities across seats
- Per-seat picker preserves partial assignments when the user navigates between seat views, preventing data loss mid-flow

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clear stale order on table open**
- **Found during:** Task 2 (human verification — Flow 1 Equal Split)
- **Issue:** Persisted sent rounds from a previous table session were disabling the send-to-kitchen button on a freshly opened table
- **Fix:** order.store clears sent rounds when table is opened
- **Files modified:** `src/stores/order.store.ts`
- **Verification:** New table open correctly enables send-to-kitchen
- **Committed in:** `21d1082`

**2. [Rule 1 - Bug] Per-seat assignment — preserve partial assignments across seats**
- **Found during:** Task 2 (human verification — Flow 2 Per-Seat Assignment)
- **Issue:** Switching between seat pickers was discarding previously assigned items
- **Fix:** Assignment state preserved across seat selection changes in SplitSheet
- **Files modified:** `src/components/payment/SplitSheet.tsx`
- **Verification:** Assigning items to multiple seats retains all assignments
- **Committed in:** `7d9a3c9`

**3. [Rule 1 - Bug] Show re-assign picker and unassign button on assigned seat items**
- **Found during:** Task 2 (human verification — Flow 2 Per-Seat Assignment)
- **Issue:** Once an item was assigned to a seat, the re-assign and unassign controls were not visible, trapping items
- **Fix:** Re-assign picker and unassign button now render correctly on assigned items
- **Files modified:** `src/components/payment/SplitSheet.tsx`
- **Verification:** Assigned items show re-assign and unassign options as expected
- **Committed in:** `34c04b5`

**4. [Rule 1 - Bug] assignItem accumulates qty instead of replacing**
- **Found during:** Task 2 (human verification — Flow 2 Per-Seat Assignment)
- **Issue:** Assigning a qty-2 item to a seat replaced existing assignment instead of accumulating, losing previously assigned quantity
- **Fix:** assignItem logic accumulates quantity on existing seat entry rather than overwriting
- **Files modified:** `src/components/payment/SplitSheet.tsx`
- **Verification:** Split qty of same item across seats works correctly
- **Committed in:** `7abc9bf`

---

**Total deviations:** 4 auto-fixed (all Rule 1 — bugs)
**Impact on plan:** All fixes required for correct per-seat assignment flow. No scope creep — all fixes within the split bill feature boundary.

## Issues Encountered

The per-seat assignment flow had three interconnected bugs that surfaced together during Flow 2 verification. Each was isolated and fixed independently — the fixes were additive and did not interfere with one another.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 12 (Split Bill) is complete: all 4 requirements met (SPLIT-01 through SPLIT-04)
- Phase 13 (Polish) can begin: CVA variants, elevation tokens, brand styling, responsive layout
- Phase 14 (Merge Bill) builds on bill.store — the cancelSplit/markClean cleanup pattern established here is the template for merge cleanup
- No blockers

---
*Phase: 12-split-bill*
*Completed: 2026-03-12*
