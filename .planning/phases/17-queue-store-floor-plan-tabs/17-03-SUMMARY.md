---
phase: 17-queue-store-floor-plan-tabs
plan: 03
subsystem: ui
tags: [zustand, queue, takeaway, modal, react]

# Dependency graph
requires:
  - phase: 17-01
    provides: useQueueStore with createTakeaway + advanceStatus + QueueOrder types

provides:
  - NewTakeawayModal — dialog for creating takeaway orders (name required, phone optional)
  - TakeawayCard — single takeaway order card with status badge and contextual CTA
  - TakeawayPanel — full takeaway tab content with FAB, active order list, and empty state

affects:
  - 17-04 (QueueBoard integration — TakeawayPanel slots into TabsContent)
  - 18 (Phase 18 will wire "Start Order" CTA to order entry navigation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Raw Record selector + useMemo derivation pattern (Zustand infinite loop prevention)
    - Shadow tokens via inline style={{ boxShadow: 'var(--shadow-*)' }}
    - FAB with absolute positioning + pb-20 list padding to prevent overlap

key-files:
  created:
    - src/components/queue/NewTakeawayModal.tsx
    - src/components/queue/TakeawayCard.tsx
    - src/components/queue/TakeawayPanel.tsx
  modified:
    - src/stores/queue.store.ts

key-decisions:
  - "advanceStatus in queue.store extended with Taking→Sent and Ready→Collected transitions (were missing for takeaway channel)"
  - "TakeawayCard 'Start Order' CTA advances status as Phase 17 placeholder; comment documents Phase 18 hook-in point"
  - "TakeawayPanel derives active order list in useMemo from raw orders Record — never in Zustand selector"

patterns-established:
  - "FAB pattern: absolute bottom-6 right-6, shadow-floating inline style, list pb-20"
  - "Status badge variant mapping: Taking=outline, Sent=ordered, Ready=ready, Collected=settled"

requirements-completed: [TKWY-01]

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 17 Plan 03: Takeaway Order Creation Flow Summary

**Three takeaway components (NewTakeawayModal, TakeawayCard, TakeawayPanel) ready to slot into QueueBoard TabsContent; queue.store advanceStatus patched with takeaway transitions**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T23:56:46Z
- **Completed:** 2026-03-15T00:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- NewTakeawayModal mirrors OpenTableModal pattern exactly: name (required) + phone (optional), resets state on close, Create Order disabled until name non-empty
- TakeawayCard renders all four takeaway statuses with correct badge variants and single contextual CTA per status
- TakeawayPanel provides FAB + active order list (useMemo from raw selector) + empty state; slots directly into Plan 04 TabsContent

## Task Commits

Each task was committed atomically:

1. **Task 1: NewTakeawayModal + TakeawayCard + advanceStatus fix** - `c17c24c` (feat)
2. **Task 2: TakeawayPanel** - `f2010d5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/queue/NewTakeawayModal.tsx` — Dialog to create takeaway order; name required, phone optional; calls createTakeaway on confirm
- `src/components/queue/TakeawayCard.tsx` — Single card with orderId, customerName, status badge, and contextual CTA (Start Order / Mark Collected)
- `src/components/queue/TakeawayPanel.tsx` — Full tab content: relative container, scrollable list with pb-20, absolute FAB, NewTakeawayModal mount
- `src/stores/queue.store.ts` — advanceStatus transitions table extended with Taking→Sent and Ready→Collected

## Decisions Made

- Extended `advanceStatus` rather than adding a new action: keeps the single-action pattern consistent with how delivery uses the same function; the transitions map makes the logic declarative and easy to audit
- "Start Order" CTA advances to Sent as a wireframe placeholder (Phase 18 will replace with navigation); documented with inline comment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added takeaway transitions to queue.store advanceStatus**
- **Found during:** Task 1 (TakeawayCard implementation)
- **Issue:** advanceStatus only handled delivery transitions (Confirmed→Preparing→ReadyForRider→PickedUp); Taking→Sent and Ready→Collected were absent, making TakeawayCard CTA calls no-ops
- **Fix:** Added `Taking: 'Sent'` and `Ready: 'Collected'` to the transitions Partial Record in advanceStatus
- **Files modified:** src/stores/queue.store.ts
- **Verification:** npm run build passes; TypeScript confirms no type errors on QueueOrderStatus keys
- **Committed in:** c17c24c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: missing transitions)
**Impact on plan:** Fix was explicitly anticipated in the plan's "Note on advanceStatus" section. No scope creep.

## Issues Encountered

None — build passed cleanly after the advanceStatus fix. Pre-existing lint warnings in bill.store.ts, kds.store.ts, order.store.ts, and DeliveryCard.tsx are out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three components export-ready: `NewTakeawayModal`, `TakeawayCard`, `TakeawayPanel`
- Plan 04 (QueueBoard UI) can import `TakeawayPanel` directly into `<TabsContent value="takeaway">`
- Phase 18 hook-in point documented in TakeawayCard "Start Order" CTA comment

---
*Phase: 17-queue-store-floor-plan-tabs*
*Completed: 2026-03-15*
