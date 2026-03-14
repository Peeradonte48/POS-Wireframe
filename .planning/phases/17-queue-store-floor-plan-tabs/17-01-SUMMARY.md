---
phase: 17-queue-store-floor-plan-tabs
plan: 01
subsystem: state-management
tags: [zustand, persist, oklch, cva, tailwind, delivery, takeaway, queue]

# Dependency graph
requires:
  - phase: 16-kds-bump-order-tracking
    provides: useKdsStore with addTicket action for cross-store write-back
  - phase: 13-ui-polish-tokens
    provides: OKLCH token pattern and CVA badge variant system

provides:
  - useQueueStore — full delivery + takeaway order lifecycle state
  - QueueOrder, QueueOrderStatus, OrderChannel, DeliveryPlatform types
  - buildMockDeliveryOrder factory for delivery simulation
  - --platform-grab and --platform-lineman OKLCH tokens (light + dark)
  - grab and lineman badge CVA variants
  - queue NavSlug + new-takeaway ActionKey in role-permissions

affects:
  - 17-02 (QueueBoard component imports useQueueStore + badge variants)
  - 17-03 (floor plan tabs need queue NavSlug for sidebar nav)
  - 18-order-entry-payment-pipeline (QueueOrder type in order context)
  - 19-kds-differentiation (KDS ticket orderType derivation from queue.store)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Zustand persist with partialize to exclude runtime-only toggles (demoActive, autoAccept)
    - Cross-store write-back via useKdsStore.getState().addTicket() inside action body (not module-init)
    - Platform OKLCH tokens independently tuned for light and dark mode
    - CVA badge variants using Tailwind v4 arbitrary CSS variable syntax [var(--token)]

key-files:
  created:
    - src/stores/queue.store.ts
    - src/lib/mock-data/delivery-demo.ts
  modified:
    - src/app/globals.css
    - src/components/ui/badge.tsx
    - src/lib/role-permissions.ts

key-decisions:
  - "queue.store partialize excludes demoActive and autoAccept — these are runtime session toggles not needed across page refreshes"
  - "acceptOrder cross-store write-back via useKdsStore.getState() inside action body — avoids module-level circular dependency"
  - "advanceStatus is delivery-only; takeaway status advances via separate KDS bump write-back in Phase 19"
  - "createTakeaway uses set() closure for atomic counter+order creation — avoids race condition from two separate set() calls"
  - "Platform light-mode OKLCH uses darker foreground (0.46/0.40 L) vs dark mode (0.72/0.68 L) for readability on respective backgrounds"

patterns-established:
  - "delivery-demo.ts mirrors kds-demo.ts module-level counter pattern for stateful factory"
  - "QueueOrderStatus as distinct type — never merged with TableStatus or OrderStage to prevent semantic corruption"

requirements-completed: [NAV-02, DLVR-01, DLVR-02, DLVR-03, DLVR-04, DLVR-06, DLVR-08, TKWY-01]

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 17 Plan 01: Queue Store Foundation Summary

**Zustand queue.store with full delivery/takeaway lifecycle, OKLCH platform tokens for Grab green and LINE MAN blue, badge CVA variants, and role-permissions additions — the complete data layer for Phase 17 UI**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T00:00:00Z
- **Completed:** 2026-03-15T00:15:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- Created useQueueStore with 7 actions (simulateOrder, acceptOrder, rejectOrder, advanceStatus, createTakeaway, toggleDemoActive, toggleAutoAccept) persisted to localStorage via partialize
- Added cross-store write-back from acceptOrder to useKdsStore.getState().addTicket() synchronously inside the action
- Added --platform-grab and --platform-lineman OKLCH tokens in both :root (dark fg for light bg readability) and .dark (light fg for dark bg readability) with corresponding @theme inline aliases
- Extended badge.tsx CVA with grab and lineman variants using Tailwind v4 arbitrary CSS variable syntax
- Extended role-permissions.ts with 'queue' NavSlug for Waiter/Cashier/Manager and 'new-takeaway' ActionKey

## Task Commits

Each task was committed atomically:

1. **Task 1: queue.store.ts — full store implementation** - `fc89fab` (feat)
2. **Task 2: delivery-demo.ts + tokens + badge variants + role-permissions** - `cc339e4` (feat)

## Files Created/Modified

- `src/stores/queue.store.ts` — Full Zustand store for delivery and takeaway order lifecycle; persist key 'queue-store'; partialize: orders + takeawayCounter only
- `src/lib/mock-data/delivery-demo.ts` — Mock QueueOrder factory for delivery simulation; module-level counter for deterministic platform/name/items cycling
- `src/app/globals.css` — Added --platform-grab and --platform-lineman tokens to :root and .dark; @theme inline aliases for Tailwind class generation
- `src/components/ui/badge.tsx` — Added grab and lineman CVA variants with platform CSS variable references
- `src/lib/role-permissions.ts` — Added 'queue' to NavSlug and ROLE_NAV_ACCESS for Waiter/Cashier/Manager; added 'new-takeaway' ActionKey

## Decisions Made

- **partialize excludes demoActive/autoAccept:** These are runtime session toggles — resetting to false on page load is correct behavior. Persisting them would cause unexpected demo mode restoring across sessions.
- **Cross-store write-back pattern:** useKdsStore.getState() called inside acceptOrder body, not at module init — avoids circular dependency issues if module loading order varies.
- **createTakeaway uses single set() closure:** Atomic counter increment + order creation prevents any race where two rapid calls could generate the same orderId.
- **Light mode platform fg uses lower lightness:** oklch(0.46/0.40) vs dark mode oklch(0.72/0.68) — ensures contrast on their respective light/dark backgrounds, consistent with how all other status tokens are independently tuned.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing ESLint errors (9 errors, 7 warnings) existed before this plan and were not caused by these changes — verified via git stash check. All errors live in files not touched by this plan (payment page, useKdsTimer, ModifierSheet, MergeSheet, kds.store). Logged as pre-existing out-of-scope issues.

## Next Phase Readiness

- queue.store.ts exports all types and useQueueStore — Plan 02 (QueueBoard UI) can import immediately
- Platform badge variants ready for delivery order cards
- role-permissions.ts has 'queue' NavSlug — Plan 03 (floor plan tabs) can add queue to sidebar nav
- No blockers

---
*Phase: 17-queue-store-floor-plan-tabs*
*Completed: 2026-03-15*
