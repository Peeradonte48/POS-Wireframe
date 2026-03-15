---
phase: 18-order-entry-payment-pipeline
plan: 02
subsystem: ui
tags: [zustand, order-entry, takeaway, queue, payment-navigation, useMemo]

# Dependency graph
requires:
  - phase: 17-queue-store-floor-plan-tabs
    provides: queue.store with TakeawayCard and order entry takeaway context
  - phase: 18-order-entry-payment-pipeline
    provides: Plan 01 — queue.store Sent/Ready transitions + kds.store orderType extension
provides:
  - onSend for takeaway routes to /payment/tableId (not /table-map); no queue status advancement
  - TakeawayCard live itemsSummary derived from order.store via useMemo
affects: [18-03-payment-page-takeaway-confirmation, 19-kds-differentiation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useMemo itemsSummary derivation: select raw order object from store, derive display string in useMemo — avoids Zustand selector infinite loop"
    - "onSend for takeaway: router.push to payment page only; queue status must not advance until payment confirms"

key-files:
  created: []
  modified:
    - src/app/(app)/order/[tableId]/page.tsx
    - src/components/queue/TakeawayCard.tsx

key-decisions:
  - "[18-02] onSend for takeaway navigates to /payment/tableId only — advanceStatus removed from this callback; queue status stays in Taking until Plan 03 payment confirmation"
  - "[18-02] TakeawayCard useOrderStore selector on raw orders[orderId] object — stable reference; useMemo derives itemsSummary string; safe per CLAUDE.md Zustand selector guidance"
  - "[18-02] itemsSummary shows 'No items yet' when status is Taking (before order entry) or when order has zero non-voided items"
  - "[18-02] itemsSummary truncates at 3 item groups with '+N more' for longer orders"

patterns-established:
  - "Takeaway order flow: Taking (order entry) → /payment/tableId (onSend) → payment confirmation (Plan 03 marks Sent)"
  - "Live card summary: select raw store slice, useMemo derive display string — never call derived-list store selectors directly"

requirements-completed: [TKWY-02, TKWY-05]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 18 Plan 02: Order Entry Payment Navigation + TakeawayCard Live Summary

**Takeaway onSend now routes to /payment/TK-xxx (not /table-map), and TakeawayCard shows live item counts derived from order.store instead of a static string field.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T09:56:58Z
- **Completed:** 2026-03-15T09:58:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `onSend` callback for takeaway orders now calls `router.push('/payment/${tableId}')` only — `advanceStatus` removed; queue status stays in Taking until payment is confirmed in Plan 03
- `TakeawayCard` imports `useMemo`, `useOrderStore`, `MENU_ITEMS` and derives a live `itemsSummary` from order.store rounds
- "No items yet" shown when status is Taking or when order has no non-voided items; truncates at 3 groups with "+N more"

## Task Commits

Each task was committed atomically:

1. **Task 1: Order entry onSend — navigate to payment page for takeaway** - `e97452d` (fix)
2. **Task 2: TakeawayCard dynamic itemsSummary from order.store** - `eccf2ff` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/(app)/order/[tableId]/page.tsx` - Replaced onSend callback: removed advanceStatus call, changed router.push target to /payment/tableId
- `src/components/queue/TakeawayCard.tsx` - Added useMemo + useOrderStore + MENU_ITEMS imports; derived itemsSummary from order.store; replaced static order.itemsSummary in JSX

## Decisions Made

- `advanceStatus` must NOT be called from `onSend` — queue status advances only after payment is confirmed (Plan 03). This enforces the pay-at-ordering model (TKWY-02).
- `useOrderStore((s) => s.orders[order.orderId])` selects the raw order object (stable reference on no-mutation). `useMemo` then derives the display string. This avoids the Zustand selector infinite-loop anti-pattern documented in CLAUDE.md.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing lint errors (10 errors, 7 warnings) exist in the codebase unrelated to these changes — confirmed by running lint before and after with identical results. Out of scope per deviation rule boundary.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Takeaway order entry flow is wired: create order (queue) → order entry → onSend → /payment/TK-xxx
- Plan 03 can now implement payment page confirmation that calls `advanceStatus` to move queue status from Taking to Sent
- TakeawayCard will display real item names once orders are entered and payment attempted

---
*Phase: 18-order-entry-payment-pipeline*
*Completed: 2026-03-15*
