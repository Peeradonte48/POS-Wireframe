---
phase: 07-polish
plan: 04
subsystem: ui
tags: [touch-targets, accessibility, skeleton, empty-state, tailwind, react]

requires:
  - phase: 07-03
    provides: void gating, toast integration, Solar icon migration complete

provides:
  - 44px touch targets on all 9 identified violations (TicketLineItem, KdsItemRow, EightySixTab, PaymentPage, AppSidebar)
  - 300ms loading skeletons on TableGrid and MenuPanel
  - Dashed-border "No tickets" empty state per KDS column
  - Empty state guards on EodSummaryTab, SalesSnapshotTab, OpenTicketsTab

affects: [07-05-browser-checkpoint]

tech-stack:
  added: []
  patterns:
    - "Negative margin trick (-m-2 p-2) expands hit area to ~44px without changing visual size"
    - "label wrapper with p-3 padding around checkboxes for 44px tap area"
    - "min-h-[44px] min-w-[44px] on icon-only buttons"
    - "useState(true)/useEffect 300ms pattern for simulated loading skeletons"
    - "grossRevenue === 0 guard for empty shift state in manager tabs"

key-files:
  created: []
  modified:
    - src/components/order/TicketLineItem.tsx
    - src/components/kds/KdsItemRow.tsx
    - src/components/manager/EightySixTab.tsx
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/app-shell/AppSidebar.tsx
    - src/components/table-map/TableGrid.tsx
    - src/components/order/MenuPanel.tsx
    - src/components/kds/KdsBoard.tsx
    - src/components/manager/EodSummaryTab.tsx
    - src/components/manager/SalesSnapshotTab.tsx
    - src/components/manager/OpenTicketsTab.tsx

key-decisions:
  - "Negative margin trick (-m-2 p-2) used for qty buttons — preserves visual 24px size while expanding hit area to ~44px"
  - "label wrapper with -m-3 p-3 used for KdsItemRow/EightySixTab checkboxes — wrapping label is correct semantic pattern for checkbox tap targets"
  - "KdsBoard already had 'No tickets' empty state — updated styling to dashed-border card matching plan spec"
  - "OpenTicketsTab 'No open tables' text updated to 'No open tickets' per plan spec"
  - "EodSummaryTab and SalesSnapshotTab empty state keyed on grossRevenue === 0 — simplest truthful signal for no-orders shift"

patterns-established:
  - "Negative margin trick: w-6 h-6 -m-2 p-2 pattern for small visual buttons needing 44px hit area"
  - "Label wrapper pattern: label.flex.items-center.justify-center.p-3.-m-3 for checkboxes"
  - "Skeleton loading: useState(true) + useEffect 300ms timer, renders N skeleton components during load"
  - "Empty state: flex.items-center.justify-center.h-32.text-muted-foreground for data-absent screens"

requirements-completed: [POLISH-02, POLISH-04]

duration: 2min
completed: 2026-03-11
---

# Phase 7 Plan 04: Touch Targets + Loading Skeletons + Empty States Summary

**9 touch target violations fixed via negative-margin/label-wrapper/min-h patterns; 300ms skeleton loading on TableGrid and MenuPanel; empty states on 4 screens**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T09:13:03Z
- **Completed:** 2026-03-11T09:15:53Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- All 9 identified touch target violations resolved: qty buttons (-m-2 p-2), trash/void/back buttons (min-h-[44px]), checkboxes (label wrapper p-3), nav items (py-3)
- TableGrid and MenuPanel show shimmer skeleton tiles/rows for 300ms on mount before real data renders
- KdsBoard "No tickets" empty state upgraded to dashed-border card style per plan spec
- Manager tabs (EodSummaryTab, SalesSnapshotTab, OpenTicketsTab) all have empty state messages for zero-data shifts

## Task Commits

Each task was committed atomically:

1. **Task 1: Touch target fixes** - `81d8959` (fix)
2. **Task 2: Loading skeletons + empty states** - `3b9970e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/order/TicketLineItem.tsx` - qty buttons: -m-2 p-2; trash/void buttons: min-h-[44px] min-w-[44px]
- `src/components/kds/KdsItemRow.tsx` - checkbox wrapped in label with p-3 -m-3
- `src/components/manager/EightySixTab.tsx` - checkbox wrapped in label with p-3 -m-3
- `src/app/(app)/payment/[tableId]/page.tsx` - back button: w-8 h-8 → min-h-[44px] min-w-[44px]
- `src/components/app-shell/AppSidebar.tsx` - nav items: py-2.5 → py-3
- `src/components/table-map/TableGrid.tsx` - TableTileSkeleton component; 300ms isLoading state; "No tables configured" empty state
- `src/components/order/MenuPanel.tsx` - MenuItemSkeleton component; 300ms isLoading state
- `src/components/kds/KdsBoard.tsx` - "No tickets" upgraded to dashed-border card style
- `src/components/manager/EodSummaryTab.tsx` - "No orders this shift" guard when grossRevenue === 0
- `src/components/manager/SalesSnapshotTab.tsx` - "No sales data for this shift" guard when grossRevenue === 0
- `src/components/manager/OpenTicketsTab.tsx` - updated empty state text to "No open tickets"

## Decisions Made

- Negative margin trick (-m-2 p-2) chosen for qty buttons — preserves exact visual layout while expanding hit area to ~44px, no layout shift
- Label wrapper (-m-3 p-3) for checkboxes — correct semantic HTML pattern, click still propagates to input
- KdsBoard empty state already existed in a simpler form; upgraded to dashed-border card per plan spec rather than replacing
- Empty state trigger for manager tabs keyed on `grossRevenue === 0` — simplest unambiguous signal for a shift with no completed orders

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All POLISH-02 and POLISH-04 requirements satisfied
- Ready for 07-05 browser checkpoint — touch targets, skeletons, and empty states are all testable in browser
- No blockers

---
*Phase: 07-polish*
*Completed: 2026-03-11*
