---
phase: 04-kds
plan: "03"
subsystem: ui
tags: [zustand, demo-mode, setTimeout, kds, typescript, next.js]

# Dependency graph
requires:
  - phase: 04-kds plan 01
    provides: kds.store.ts with addTicket action, KdsTicket/KdsStage types, demoActive toggle
  - phase: 04-kds plan 02
    provides: KdsBoard, KdsTicketCard, KdsItemRow, KdsRecallTray components
  - phase: 03-order-flow
    provides: MENU_ITEMS fixture used by demo ticket factory
provides:
  - Demo mode: setTimeout re-schedule loop injects mock KdsTicket every 8–12s when demoActive
  - kds-demo.ts: buildMockDemoTicket() factory using MENU_ITEMS; getDemoOrderItems() fallback for KdsBoard
  - KdsBoard: getDemoOrderItems fallback so demo tickets render item rows without polluting order.store
  - Checkbox gate: item checkboxes active only when ticket is InProgress; BUMP blocked until all items checked
  - All four KDS success criteria (KDS-01 through KDS-04) browser-verified by human
affects:
  - Phase 5 (Payment) — KDS now browser-verified; order.store not mutated by demo so payment flow unaffected

# Tech tracking
tech-stack:
  added: []
  patterns:
    - setTimeout re-schedule loop (vs setInterval) for randomized cadence without drift
    - Module-level Map (demoItemsMap) to store demo ticket line items without polluting order.store
    - getDemoOrderItems fallback pattern in KdsBoard: order.store lookup first, demo map as fallback
    - Checkbox gate: UI element enabled/disabled based on ticket stage, not just presence
    - BUMP guard: action disabled until completion precondition (all items checked) is satisfied

key-files:
  created:
    - src/lib/mock-data/kds-demo.ts
  modified:
    - src/app/(kds)/kds/page.tsx
    - src/components/kds/KdsBoard.tsx
    - src/components/kds/KdsTicketCard.tsx

key-decisions:
  - "Demo tickets injected into kds.store only (not order.store) — avoids polluting floor map table states"
  - "setTimeout re-schedule pattern preferred over setInterval — better randomness, no drift"
  - "Module-level demoItemsMap in kds-demo.ts holds demo line items — self-contained, no store coupling"
  - "addTicket call moved from render body to useEffect — fixes illegal render-phase state mutation (deviation auto-fix)"
  - "Item checkboxes active only when ticket.stage === InProgress — prevents accidental checks in New stage"
  - "BUMP action blocked from InProgress until all items in checkedItems — enforces cook confirmation workflow"

patterns-established:
  - "Fallback data pattern: component checks primary store, falls back to demo map for mock tickets"
  - "Re-schedule loop: scheduleNext() calls itself inside setTimeout for randomized recurring behavior"

requirements-completed: [KDS-04]

# Metrics
duration: ~20min (across initial task + post-checkpoint fixes)
completed: 2026-03-11
---

# Phase 4 Plan 03: KDS Demo Mode Summary

**setTimeout-based demo ticket injection at 8–12s cadence using MENU_ITEMS fixture, with checkbox-gate and BUMP-guard UX polish, completing all four KDS success criteria via human browser verification.**

## Performance

- **Duration:** ~20 min (Task 1 + post-checkpoint fixes applied during verification)
- **Started:** 2026-03-11
- **Completed:** 2026-03-11
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 4

## Accomplishments

- Demo mode injects realistic mock KDS tickets every 8–12 seconds using MENU_ITEMS as source data, with no order.store pollution
- KdsBoard uses getDemoOrderItems fallback so demo tickets render full item rows with modifier summaries
- All four KDS success criteria (KDS-01 through KDS-04) browser-verified by human stakeholder
- Post-verification UX polish: checkboxes only active during InProgress stage; BUMP blocked until all items checked

## Task Commits

Each task was committed atomically:

1. **Task 1: Demo ticket factory + inject demo tickets into KDS page** - `3ccb259` (feat)
2. **Task 2 (checkpoint): browser verification of all four KDS success criteria** - checkpoint approved

Additional commits applied during/after checkpoint verification:

3. **fix: move addTicket call into useEffect** - `5b6d672` (fix — Rule 1, render-phase state mutation)
4. **feat: checkboxes active only when ticket is InProgress** - `19f3c1f` (feat — UX polish)
5. **feat: block BUMP from InProgress until all items checked** - `f5c0aa4` (feat — UX polish)

## Files Created/Modified

- `src/lib/mock-data/kds-demo.ts` — buildMockDemoTicket() factory; getDemoOrderItems() fallback; module-level demoItemsMap
- `src/app/(kds)/kds/page.tsx` — demo injection useEffect with setTimeout re-schedule loop; addTicket wired into deps
- `src/components/kds/KdsBoard.tsx` — getDemoOrderItems fallback when order.store has no order for tableId
- `src/components/kds/KdsTicketCard.tsx` — checkbox active-only-in-InProgress gate; BUMP blocked until all items checked

## Decisions Made

- Demo tickets go only into kds.store (addTicket), never into order.store — keeps floor map table statuses clean during stakeholder demos
- setTimeout re-schedule loop preferred over setInterval to achieve true random 8–12s cadence without accumulating drift
- demoItemsMap stored at module level in kds-demo.ts so getDemoOrderItems lookup is O(1) with no React context or store coupling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Render-phase state mutation: addTicket called directly in render body**
- **Found during:** Task 1 — discovered during post-checkpoint browser testing
- **Issue:** The initial implementation called addTicket in a location that triggered during render, causing React's "Cannot update a component while rendering a different component" warning and intermittent state corruption
- **Fix:** Moved addTicket call strictly inside the setTimeout callback within the useEffect, ensuring it only fires asynchronously after render completes
- **Files modified:** `src/app/(kds)/kds/page.tsx`
- **Verification:** Warning eliminated; demo tickets inject cleanly without React errors in console
- **Committed in:** `5b6d672`

**2. [Rule 2 - Missing Critical] Checkboxes active only when ticket is InProgress**
- **Found during:** Checkpoint verification — human tester noted checkboxes were interactive in New stage unexpectedly
- **Issue:** Item checkboxes were enabled regardless of ticket stage, allowing cooks to pre-check items before the ticket was even acknowledged (moved to InProgress)
- **Fix:** Added `disabled={ticket.stage !== 'InProgress'}` guard on checkboxes in KdsTicketCard
- **Files modified:** `src/components/kds/KdsTicketCard.tsx`
- **Verification:** Checkboxes are greyed-out/inert in New and Ready stages; become active on BUMP to InProgress
- **Committed in:** `19f3c1f`

**3. [Rule 2 - Missing Critical] Block BUMP from InProgress until all items are checked**
- **Found during:** Checkpoint verification — plan implied but did not explicitly specify this precondition
- **Issue:** Cook could BUMP a ticket from InProgress to Ready without checking all items, defeating the purpose of the checkbox workflow
- **Fix:** Added guard to BUMP handler: if `ticket.stage === 'InProgress'` and `checkedItems.size < orderItems.length`, BUMP is disabled
- **Files modified:** `src/components/kds/KdsTicketCard.tsx`
- **Verification:** BUMP button in InProgress column stays disabled until all item checkboxes are checked; enables immediately on last check
- **Committed in:** `f5c0aa4`

---

**Total deviations:** 3 auto-fixed (1 Rule 1 bug, 2 Rule 2 missing critical)
**Impact on plan:** All three fixes necessary for correctness and intended cook workflow. No scope creep — all changes are within KDS component boundary.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 (KDS) is fully complete — all four requirements KDS-01 through KDS-04 browser-verified
- KDS-04 (demo mode) confirmed working: amber DEMO badge, 8–12s ticket injection, tickets survive toggle-off, bump/recall works on demo tickets
- Phase 5 (Payment) can begin immediately — no dependencies on KDS internals; shares order.store from Phase 3
- Phase 6 (Manager Layer) is also unblocked; KDS is independent of manager/shift flows

---
*Phase: 04-kds*
*Completed: 2026-03-11*
