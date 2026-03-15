---
phase: 17-queue-store-floor-plan-tabs
plan: 02
subsystem: ui
tags: [queue, delivery, zustand, react, tailwind, cva, shadcn]

# Dependency graph
requires:
  - phase: 17-01
    provides: useQueueStore with orders Record, simulateOrder, acceptOrder, rejectOrder, advanceStatus, toggleDemoActive, toggleAutoAccept; grab/lineman badge CVA variants

provides:
  - DeliveryCard component with pending (Accept/Reject + countdown ring) and active (status badge + CTA) states
  - RejectReasonDialog component with 4 preset reasons and one-tap UX
  - DeliveryPanel component with full delivery tab layout, demo controls, and simulation loop
  - src/components/queue/ directory established as queue UI home

affects: [17-04, plan-04-tabs-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand raw Record selector + useMemo derivation for filtered lists (infinite loop prevention)"
    - "requestAnimationFrame loop for smooth countdown ring via conic-gradient drain"
    - "scheduleNext setTimeout pattern for demo simulation (mirroring kds/page.tsx)"
    - "Shadow tokens via inline style={{ boxShadow: 'var(--shadow-card)' }} (CLAUDE.md mandatory)"
    - "Individual Zustand action selectors (s => s.acceptOrder) for referential stability"

key-files:
  created:
    - src/components/queue/DeliveryCard.tsx
    - src/components/queue/RejectReasonDialog.tsx
    - src/components/queue/DeliveryPanel.tsx
  modified: []

key-decisions:
  - "CountdownRing seconds display derived from progress state (not Date.now() in JSX render) to satisfy react-hooks/purity lint rule"
  - "Simulate Order button fires one immediate simulateOrder() AND starts loop in single click — improves stakeholder demo flow"
  - "Active orders section label 'Active Orders' only shows when both pending and active orders coexist to avoid redundant headers"

patterns-established:
  - "queue components live in src/components/queue/ — one file per component, named by component"
  - "Delivery card CTA progression: Confirmed→Mark Preparing, Preparing→Mark Ready for Rider, ReadyForRider→Confirm Picked Up"
  - "getCtaLabel / getStatusVariant / getStatusLabel helper functions co-located in DeliveryCard.tsx"

requirements-completed: [DLVR-01, DLVR-02, DLVR-03, DLVR-04, DLVR-05, DLVR-06, DLVR-07, DLVR-08, DLVR-09]

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 17 Plan 02: Delivery Queue UI Summary

**Three delivery queue components: DeliveryCard with countdown ring + RejectReasonDialog preset picker + DeliveryPanel with demo loop, pending/active sections, and auto-accept chip.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-15T00:20:00Z
- **Completed:** 2026-03-15T00:35:00Z
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments

- DeliveryCard renders both pending state (inline Accept/Reject buttons + animated conic-gradient countdown ring) and active state (status badge + single contextual CTA)
- RejectReasonDialog presents 4 preset rejection reasons with one-tap UX — tapping a reason auto-confirms with no secondary confirm button
- DeliveryPanel provides full delivery tab content: header controls with auto-accept toggle chip + simulate button, pending orders section (highlighted), active orders section, and empty state

## Task Commits

Each task was committed atomically:

1. **Task 1: DeliveryCard.tsx + RejectReasonDialog.tsx** - `67dfdfd` (feat)
2. **Task 2: DeliveryPanel.tsx — full delivery tab content** - `d087efa` (feat)

## Files Created/Modified

- `src/components/queue/DeliveryCard.tsx` — Single delivery order card with CountdownRing sub-component; handles pending and active render modes
- `src/components/queue/RejectReasonDialog.tsx` — Reject reason picker dialog with 4 presets and Cancel button
- `src/components/queue/DeliveryPanel.tsx` — Full delivery tab: demo controls header, pending section, active orders section, empty state

## Decisions Made

- **CountdownRing seconds display via progress state:** The `Date.now()` call in JSX render triggered the `react-hooks/purity` ESLint rule. Fixed by computing remaining seconds from the existing `progress` state value (`Math.round(PENDING_WINDOW_MS * (1 - progress) / 1000)`) which is already updated by the RAF loop — semantically identical but lint-compliant.
- **Single-click demo start:** Clicking "Simulate Order" when demo is not active fires both `simulateOrder()` (immediate) and `toggleDemoActive()` (starts loop). This ensures the demo panel immediately shows a card rather than waiting 10-15s for the first tick.
- **Active Orders section label conditional:** The "Active Orders" heading only renders when there are both pending and active orders simultaneously — avoids redundant labeling when there's only one section visible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Date.now() in JSX render causing lint error**
- **Found during:** Task 2 (lint verification run)
- **Issue:** `Date.now()` inside JSX render is flagged by `react-hooks/purity` as an impure function call that produces unstable results on re-render
- **Fix:** Changed countdown display to use the existing `progress` state variable: `Math.round(PENDING_WINDOW_MS * (1 - progress) / 1000)` — functionally equivalent since progress is driven by the RAF loop
- **Files modified:** src/components/queue/DeliveryCard.tsx
- **Verification:** `npm run lint` shows no errors in queue/ directory
- **Committed in:** `d087efa` (included in Task 2 amend during same commit, but fix was in DeliveryCard)

---

**Total deviations:** 1 auto-fixed (Rule 1 - lint/purity bug)
**Impact on plan:** Necessary fix for lint compliance. No semantic change to behavior.

## Issues Encountered

None — plan executed cleanly once the Date.now() purity issue was fixed inline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three delivery queue components are complete and ready to slot into the `TabsContent` in Plan 04 (QueueBoard page integration)
- `DeliveryPanel` is a drop-in component — `<DeliveryPanel />` with no required props
- Pre-existing lint warnings in bill.store, kds.store, order.store are out of scope (pre-existing, not caused by this plan)

---
*Phase: 17-queue-store-floor-plan-tabs*
*Completed: 2026-03-15*
