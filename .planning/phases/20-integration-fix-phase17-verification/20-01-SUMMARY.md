---
phase: 20-integration-fix-phase17-verification
plan: 01
subsystem: ui
tags: [zustand, kds, queue, delivery, floor-plan]

# Dependency graph
requires:
  - phase: 19-kds-differentiation-+-combo-flag
    provides: KDS ticket orderType/platform fields and channelCounts filter tab infrastructure
  - phase: 17-queue-store-+-floor-plan-tabs
    provides: queue.store acceptOrder action and table-map Delivery tab badge
provides:
  - Delivery KDS tickets correctly tagged with orderType:'delivery' and platform value
  - Floor plan Delivery tab badge persists through all active delivery states (not just Pending)
affects: [kds, queue, floor-plan, DLVR-02, KDS-01, KDS-02, NAV-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "addTicket 4-arg pattern: always pass orderType and platform for non-dine-in tickets"
    - "activeCount useMemo: include all staff-attention-requiring statuses, not just entry state"

key-files:
  created: []
  modified:
    - src/stores/queue.store.ts
    - src/app/(app)/table-map/page.tsx

key-decisions:
  - "[20-01] acceptOrder passes 'delivery' and order.platform as 3rd/4th args to addTicket — explicit channel metadata required at write-time; KDS reads it from ticket fields"
  - "[20-01] activeDeliveryCount replaces pendingDeliveryCount — delivery badge counts Pending+Confirmed+Preparing+ReadyForRider, matching AppSidebar activeQueueCount delivery branch exactly"

patterns-established:
  - "Non-dine-in addTicket calls must always include orderType and platform: addTicket(id, label, 'delivery', platform)"
  - "Active count useMemos for delivery must span all pre-completion states: ['Pending','Confirmed','Preparing','ReadyForRider']"

requirements-completed: [DLVR-02, KDS-01, KDS-02, NAV-02]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 20 Plan 01: Integration Fix Phase 17 Verification Summary

**Two surgical one-line fixes closing DLVR-02/KDS-01/KDS-02/NAV-02: delivery KDS tickets now carry correct orderType+platform metadata, and the Delivery tab badge persists through all active delivery lifecycle states**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T15:30:55Z
- **Completed:** 2026-03-15T15:32:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `acceptOrder` in queue.store.ts now passes `'delivery'` and `order.platform` to `addTicket`, so every accepted delivery order produces a KDS ticket with correct `orderType` and `platform` fields
- KDS Delivery filter tab (`channelCounts.delivery`) now increments correctly for accepted delivery orders
- Floor plan Delivery tab badge changed from `pendingDeliveryCount` (Pending-only) to `activeDeliveryCount` (Pending+Confirmed+Preparing+ReadyForRider), matching the AppSidebar sidebar badge logic exactly

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix acceptOrder — pass channel metadata to addTicket** - `7d39c18` (fix)
2. **Task 2: Fix activeDeliveryCount — widen status filter for Delivery tab badge** - `64038e7` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/stores/queue.store.ts` - `acceptOrder`: `addTicket` call extended from 2 args to 4, adding `'delivery'` and `order.platform`
- `src/app/(app)/table-map/page.tsx` - `pendingDeliveryCount` useMemo renamed to `activeDeliveryCount`, status filter widened from `=== 'Pending'` to `.includes([...4 states])`

## Decisions Made

- No architectural decisions required — both fixes are single-callsite surgical edits with no structural impact
- `activeDeliveryCount` status list matches `AppSidebar.tsx activeQueueCount` delivery branch exactly (consistency reference confirmed in plan context)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing lint warnings in `kds.store.ts` and `order.store.ts` (unused vars) are out of scope and not introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four requirements (DLVR-02, KDS-01, KDS-02, NAV-02) closed
- Phase 20 milestone audit gaps resolved
- No blockers

---
*Phase: 20-integration-fix-phase17-verification*
*Completed: 2026-03-15*

## Self-Check: PASSED

- `src/stores/queue.store.ts` — FOUND
- `src/app/(app)/table-map/page.tsx` — FOUND
- `.planning/phases/20-integration-fix-phase17-verification/20-01-SUMMARY.md` — FOUND
- Commit `7d39c18` — FOUND
- Commit `64038e7` — FOUND
