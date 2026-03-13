---
phase: 15-order-tracking
plan: "03"
subsystem: ui
tags: [react, zustand, tailwind, table-map, order-tracking, kds]

# Dependency graph
requires:
  - phase: 15-02
    provides: order-tracking.ts pure utils (deriveRoundStage, isRoundEscalated, ESCALATION_THRESHOLD_MS), useSentTimer hook
  - phase: 15-01
    provides: design tokens for stage/escalation colors (--color-status-ordered/cooking/ready/escalated)
  - phase: 12-01
    provides: order.store (OrderRound, OrderLineItem, ActiveOrder types)
  - phase: 15-02
    provides: kds.store tickets used by deriveRoundStage
provides:
  - OrderTimeline component — round-grouped per-item status view with escalation row tint and summary banner
  - Two-tab bottom sheet (Actions | Timeline) for Occupied and CheckRequested table statuses
  - Tab reset behavior on table selection change
affects: [phase 16+, any future TableBottomSheet modifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sub-component per React-hooks-in-loop avoidance — RoundSection calls useSentTimer at component level, not inside a map callback
    - Conditional tab bar pattern — tab UI only for states that need it, other statuses untouched

key-files:
  created:
    - src/components/table-map/OrderTimeline.tsx
  modified:
    - src/components/table-map/TableBottomSheet.tsx

key-decisions:
  - "RoundSection sub-component isolates useSentTimer call to component scope — avoids hooks-in-loop violation without useRef workaround"
  - "Tab bar implemented as two plain <button> elements with underline indicator — simpler than shadcn Tabs, no new component import needed"
  - "Tab state (activeTab) resets to 'actions' on table?.id change — same useEffect pattern as existing localWaiter/localNote reset"
  - "Escalation banner shows delayed items inline from escalatedRounds.flatMap — flat list under one banner, not per-round"
  - "Empty state 'No order sent yet.' shown when no rounds have sentAt — covers unsent draft orders"

patterns-established:
  - "Sub-component for per-item hooks: when a hook must be called per list item, extract a sub-component (RoundSection) so the hook is called at top-level, not inside a loop"
  - "Tab bar with border-b-2 border-primary -mb-px underline pattern: standard inline tab implementation without importing new UI primitives"

requirements-completed:
  - TRACK-02
  - TRACK-03

# Metrics
duration: 25min
completed: "2026-03-13"
---

# Phase 15 Plan 03: Order Timeline Summary

**Round-grouped OrderTimeline component with per-item elapsed time and escalation row tint/banner wired into a two-tab TableBottomSheet for Occupied and CheckRequested tables**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-13 (prior session)
- **Completed:** 2026-03-13
- **Tasks:** 2 auto + 1 human-verify (all complete)
- **Files modified:** 2

## Accomplishments
- Created `OrderTimeline.tsx` — renders order rounds grouped by round number, each item showing stage dot, name, and elapsed minutes; escalated rows get red/pink background tint and red elapsed text; escalation summary banner at bottom
- Updated `TableBottomSheet.tsx` — Occupied and CheckRequested sections now have a two-tab bar (Actions / Timeline); tab resets to Actions when a different table is selected; all other status sections (Open, Reserved, Cleaning) unchanged
- Human verify approved: TRACK-01 stage badge, TRACK-02 timeline tab, and TRACK-03 escalation behavior all confirmed working

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OrderTimeline.tsx** - `535aef6` (feat)
2. **Task 2: Wire tab bar into TableBottomSheet.tsx** - `b72fc92` (feat)
3. **Task 3: Human-verify checkpoint** - approved by user (no commit)

## Files Created/Modified
- `src/components/table-map/OrderTimeline.tsx` - New component: round-grouped items, useSentTimer via RoundSection sub-component, escalation tint and summary banner
- `src/components/table-map/TableBottomSheet.tsx` - Added activeTab state, two-button tab bar for Occupied/CheckRequested, useEffect tab reset on table?.id, OrderTimeline render in timeline tab

## Decisions Made
- RoundSection sub-component pattern used to call useSentTimer once per round at component level — respects React hooks rules without hooks-in-loop.
- Tab bar uses two plain `<button>` elements with underline indicator (`border-b-2 border-primary -mb-px`) — no new shadcn/Base UI imports needed.
- Tab resets via `useEffect([table?.id])` matching the existing reset pattern for localWaiter and localNote in the same file.
- Escalation summary banner uses a single `flatMap` across escalated rounds — flat item list under one banner rather than per-round banners.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 Order Tracking is now complete (all 3 plans done, TRACK-01 through TRACK-03 satisfied)
- All floor plan table tiles show live stage badges and escalation overrides
- Staff can tap any occupied table and view per-round order status in the Timeline tab
- Ready for v1.2 milestone wrap-up or Phase 16 planning

---
*Phase: 15-order-tracking*
*Completed: 2026-03-13*
