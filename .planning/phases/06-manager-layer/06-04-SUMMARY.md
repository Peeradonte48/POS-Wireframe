---
phase: 06-manager-layer
plan: "04"
subsystem: ui
tags: [next.js, react, typescript, zustand, tailwind, manager-dashboard]

# Dependency graph
requires:
  - phase: 06-03
    provides: EightySixTab full implementation and OpenTicketsTab with staff list
  - phase: 06-02
    provides: Manager page shell, EodSummaryTab, SalesSnapshotTab
  - phase: 06-01
    provides: manager.store with 86'd state and shiftClosed persisted via Zustand
provides:
  - "Phase 6 manager layer fully verified: all 4 SHIFT requirements confirmed in browser"
  - "Build verification: tsc --noEmit and next build pass with zero errors"
  - "/payment index redirect page for graceful deep-link handling"
affects: [07-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Human checkpoint pattern: tsc + next build passes before browser verification gate"
    - "Resume-signal pattern: user types 'approved' after verifying all criteria groups"

key-files:
  created:
    - src/app/(app)/payment/page.tsx
  modified:
    - src/lib/mock-data/tables.ts

key-decisions:
  - "AppSidebar hides manager item with early null return (not greyed-out div) for non-Manager roles"
  - "Cross-store reset on logout: session.store imports manager.store and calls getState().resetShift()"
  - "Payment capture fields initialized as null in openTable and markClean to prevent stale data on re-seat"
  - "Estimated total computed inline in OpenTicketsTab rather than helper function to avoid complex ReturnType annotation"
  - "Variance formula uses cashTotal from paidTables only — only Cash method affects physical drawer balance"
  - "/payment index page added (Rule 3 fix) to handle direct navigation without tableId gracefully"

patterns-established:
  - "Build-then-verify: run tsc --noEmit + next build before any browser checkpoint"
  - "Checkpoint gate: human-verify with 'approved' keyword before marking phase complete"

requirements-completed: [SHIFT-01, SHIFT-02, SHIFT-03, SHIFT-04]

# Metrics
duration: 10min
completed: 2026-03-11
---

# Phase 6 Plan 04: Manager Layer — Build Verification and Browser Checkpoint Summary

**4-tab manager dashboard (EOD summary, sales snapshot, 86'd items, open tickets) fully verified in browser with zero build errors and all 4 SHIFT requirements confirmed by human reviewer**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-11
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 2 (fix + browser verification)

## Accomplishments
- TypeScript strict check (`tsc --noEmit`) passed with zero errors across entire codebase
- `next build` completed successfully with zero errors
- All 5 browser verification groups approved by human reviewer:
  1. Manager nav hidden for Waiter (PIN 1234), visible for Manager (PIN 9999)
  2. EOD Summary shows live revenue/VAT/payment breakdown; closing cash field triggers reactive Over/Short variance; Close Shift dialog transitions to read-only banner
  3. Sales Snapshot shows 4 stat cards (Net Sales, VAT, Gross Revenue, Covers) and top items list with no chart elements
  4. 86'd Items: toggle persists across navigation; toggled items appear greyed with badge in MenuPanel and are not tappable
  5. Open Tickets: occupied table row navigates to /order/[tableId]; Staff List shows all 4 mock staff with role badges

## Task Commits

Each task was committed atomically:

1. **Task 1: Build verification** - `68a99a0` (fix: add /payment index page that redirects to table-map)
2. **Task 2: Browser verification — all 4 SHIFT criteria** - human-approved checkpoint, no code commit needed

**Prior phase commits included in this plan:**
- `14b4168` docs(06-02): complete manager dashboard plan
- `5f99aa7` docs(06-03): complete 86'd tab and open tickets tab plan
- `09d8b37` feat(06-02): SalesSnapshotTab — numbers-only sales dashboard
- `c1575a9` feat(06-02): manager page shell + EodSummaryTab + stub tabs
- `5236089` feat(06-03): implement OpenTicketsTab with open tickets list and staff list
- `fe393dc` feat(06-03): implement EightySixTab and MenuPanel 86'd integration
- `ad24dc9` docs(06-01): complete manager store foundation plan

## Files Created/Modified
- `src/app/(app)/payment/page.tsx` - Index redirect page for /payment (no tableId) — redirects to /table-map
- `src/lib/mock-data/tables.ts` - Added `paidAmount: null, paymentMethod: null, discountApplied: null` to all INITIAL_TABLES entries

## Decisions Made
- Added `/payment` index page (Rule 3 auto-fix) because `next build` caught that `/payment` had no `page.tsx`, causing a 404 on direct navigation without a tableId segment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added /payment index page to fix missing route**
- **Found during:** Task 1 (Build verification)
- **Issue:** `next build` reported that `/payment` lacked a `page.tsx` — navigating to `/payment` without a `[tableId]` param produced a 404
- **Fix:** Created `src/app/(app)/payment/page.tsx` with a simple redirect to `/table-map` so direct links resolve cleanly
- **Files modified:** `src/app/(app)/payment/page.tsx`
- **Verification:** `next build` passes; navigating to /payment redirects to /table-map
- **Committed in:** `68a99a0`

---

**Total deviations:** 1 auto-fixed (1 blocking — missing route page)
**Impact on plan:** Essential fix for build success. No scope creep.

## Issues Encountered
None beyond the auto-fixed /payment missing page.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Phase 6 complete. All 4 SHIFT requirements verified in browser.
- Phase 7 (Polish) can begin: POLISH-01–04 cover loading states, error boundaries, responsive tuning, and final stakeholder demo readiness.
- No blockers.

---
*Phase: 06-manager-layer*
*Completed: 2026-03-11*
