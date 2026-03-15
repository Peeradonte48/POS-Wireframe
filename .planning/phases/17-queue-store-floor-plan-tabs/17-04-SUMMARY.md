---
phase: 17-queue-store-floor-plan-tabs
plan: 04
subsystem: ui
tags: [tabs, queue, sidebar, badge, zustand, react]

# Dependency graph
requires:
  - phase: 17-queue-store-floor-plan-tabs
    provides: queue.store (QueueOrder, useQueueStore), DeliveryPanel, TakeawayPanel, platform tokens (17-01, 17-02, 17-03)
provides:
  - Three-tab floor plan page (Dine-in / Takeaway / Delivery) in table-map/page.tsx
  - Queue nav item with pending delivery badge in AppSidebar.tsx
  - Live badge counts on Takeaway and Delivery tabs derived from queue.store
affects: [18-order-entry-payment-pipeline, 19-kds-differentiation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand selector safety: select raw Record, derive counts in useMemo — never inside selector callbacks"
    - "Tab height passthrough: flex flex-col h-full on Tabs root, flex-1 min-h-0 on TabsContent"
    - "Collapsed sidebar dot indicator: absolute positioned span -top-0.5 -right-0.5 on relative li"

key-files:
  created: []
  modified:
    - src/app/(app)/table-map/page.tsx
    - src/components/app-shell/AppSidebar.tsx

key-decisions:
  - "Option C for dual-active nav: both table-map and queue items show active on /table-map — wireframe acceptable, documented with code comment"
  - "InboxLinear chosen as Queue icon (available in solar-icon-set, semantically appropriate for incoming orders)"
  - "Collapsed sidebar uses dot indicator (h-2 w-2 absolute) instead of count badge — no room for count in 64px collapsed width"

patterns-established:
  - "Tabs integration: Tabs root with flex flex-col h-full, TabsList shrink-0 self-start, TabsContent flex-1 min-h-0"
  - "Badge in TabsTrigger: inline span with rounded-full bg-destructive/primary, text-[10px] font-bold"
  - "Sidebar badge pattern: ml-auto for expanded count, absolute dot for collapsed state"

requirements-completed: [NAV-01, NAV-02]

# Metrics
duration: 12min
completed: 2026-03-15
---

# Phase 17 Plan 04: Floor Plan Tabs + AppSidebar Queue Badge Summary

**Three-tab floor plan (Dine-in/Takeaway/Delivery) with live badge counts and Queue sidebar nav item with pending delivery dot/count badge**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-15T00:00:00Z
- **Completed:** 2026-03-15T00:11:41Z
- **Tasks:** 2 auto (+ 1 checkpoint awaiting human verify)
- **Files modified:** 2

## Accomplishments
- Wrapped table-map/page.tsx in three-tab layout preserving existing Dine-in triplet unchanged
- Added reactive Takeaway and Delivery badge counts derived from raw queue.store orders Record via useMemo
- Added Queue nav item to AppSidebar with InboxLinear icon, pending delivery badge (expanded: count label; collapsed: dot indicator)
- Build passes (npm run build clean); all lint errors are pre-existing in unrelated files

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap table-map/page.tsx in three-tab layout** - `b875e9c` (feat)
2. **Task 2: AppSidebar — Queue nav item with pending delivery badge** - `c6d88a5` (feat)

**Plan metadata:** (pending — after human verify checkpoint)

## Files Created/Modified
- `src/app/(app)/table-map/page.tsx` - Replaced flat page with Tabs layout; Dine-in/Takeaway/Delivery tabs; badge counts via useMemo
- `src/components/app-shell/AppSidebar.tsx` - Added Queue nav item, InboxLinear icon, pendingDeliveryCount derivation, badge/dot render

## Decisions Made
- **Dual-active nav (Option C):** Both `table-map` and `queue` nav items show as active on `/table-map`. Wireframe acceptable — items are visually distinguishable by icon and badge. Code comment documents this.
- **InboxLinear for Queue icon:** Available in solar-icon-set, semantically appropriate for an incoming orders queue view.
- **Collapsed sidebar dot vs count:** At 64px collapsed width, a count badge would overflow. Used 8px absolute dot indicator positioned `-top-0.5 -right-0.5` on the relative `<li>` wrapper.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — both files compiled cleanly on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 17 fully complete pending human verification of all 7 steps
- Phase 18 (Order Entry + Payment Pipeline for takeaway/delivery) can start once checkpoint approved
- Blockers from STATE.md still open: delivery payment page scope and KDS bump depth for delivery — to be resolved in Phase 18 planning

---
*Phase: 17-queue-store-floor-plan-tabs*
*Completed: 2026-03-15*
