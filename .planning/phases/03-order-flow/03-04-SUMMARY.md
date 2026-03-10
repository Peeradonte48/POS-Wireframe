---
phase: 03-order-flow
plan: 04
subsystem: ui
tags: [react, zustand, sonner, tailwind, next-navigation]

# Dependency graph
requires:
  - phase: 03-order-flow
    provides: order.store (addItem/editItem/removeItem/sendRound/voidItem), ModifierSheet, MenuPanel, ManagerPinModal, TableBottomSheet
  - phase: 02-table-map
    provides: useTableStore.updateTable, TableRecord.orderStage, TableBottomSheet View Order entry point
provides:
  - TicketLineItem: unsent/sent/voided row rendering with qty controls and void tap
  - TicketPanel: full ticket panel with Send to Kitchen, Add Items, Manager PIN void flow
  - OrderPage: fully wired — ModifierSheet + TicketPanel connected, Toaster added
  - TableBottomSheet: View Order button navigates to /order/[tableId]
affects: [04-kds, 05-payment]

# Tech tracking
tech-stack:
  added: [sonner (Toaster + toast)]
  patterns: [inline useOrderStore.getState() for imperative reads inside event handlers, store selector scoped to single table to avoid re-renders]

key-files:
  created:
    - src/components/order/TicketLineItem.tsx
    - src/components/order/TicketPanel.tsx
  modified:
    - src/app/(app)/order/[tableId]/page.tsx
    - src/components/table-map/TableBottomSheet.tsx

key-decisions:
  - "buildModifierSummary defined inline in TicketLineItem — single-file locality, not shared util"
  - "computeTotal in TicketPanel skips topping priceAdj since ModifierSelection doesn't store priceAdj — basePrice × qty only for wireframe accuracy"
  - "handleQtyChange reads from useOrderStore.getState() imperatively to avoid stale closure over order state"
  - "Add Items button is cosmetic only — next item tap via ModifierSheet/addItem auto-creates new unsent round in store"

patterns-established:
  - "Ticket layout: flex flex-col h-full with scrollable body and fixed h-16 footer"
  - "Void flow: local voidingLineId state → ManagerPinModal open → onAuthorize calls store imperatively"
  - "Status-gated controls: unsent shows qty+trash, sent shows outlined trash only, voided shows nothing"

requirements-completed: [ORDER-03, ORDER-04, ORDER-05, ORDER-06, ORDER-07]

# Metrics
duration: 6min
completed: 2026-03-10
---

# Phase 3 Plan 04: Order Flow Wiring Summary

**Interactive ticket panel with Send to Kitchen, Manager PIN void, and multi-round add-on — all wired end-to-end from TableBottomSheet through ModifierSheet to order store**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-10T17:39:09Z
- **Completed:** 2026-03-10T17:45:00Z
- **Tasks:** 2 of 2 (Task 2 human-verify checkpoint — approved)
- **Files modified:** 4

## Accomplishments
- TicketLineItem renders all 3 statuses with correct visual differentiation (qty controls, void trash, voided badge + strikethrough)
- TicketPanel reads from order store, fires Sonner toast on send, calls updateTable({ orderStage: 'Ordered' }), exposes Add Items after send
- OrderPage fully wired: ModifierSheet open/close/edit lifecycle, TicketPanel in right panel, Toaster at top-center
- TableBottomSheet View Order button now navigates to /order/[tableId] via router.push

## Task Commits

1. **Task 1: Build TicketLineItem, TicketPanel, wire OrderPage, activate TableBottomSheet** - `e4d3154` (feat)
2. **Task 2: Human verification checkpoint** - approved by human (no code commit)

## Files Created/Modified
- `src/components/order/TicketLineItem.tsx` — Single ticket row with status-gated controls and modifier summary string
- `src/components/order/TicketPanel.tsx` — Right panel with rounds list, running total, Send/Add Items footer, void PIN modal
- `src/app/(app)/order/[tableId]/page.tsx` — OrderPage fully wired: ModifierSheet + TicketPanel + Toaster
- `src/components/table-map/TableBottomSheet.tsx` — View Order button activated with useRouter

## Decisions Made
- `buildModifierSummary` lives inline in TicketLineItem — not exported to a separate utils file, keeping the component self-contained
- `computeTotal` in TicketPanel uses basePrice × qty only — ModifierSelection doesn't carry `priceAdj`, which is a MenuItem-level field; for this wireframe this is sufficient
- `handleQtyChange` inside TicketPanel reads `useOrderStore.getState()` imperatively to avoid stale closure issues with Zustand state in event handlers
- Add Items button is cosmetic; the actual new-round creation happens automatically in `addItem` when all rounds are sent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — TypeScript compiled clean on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All ORDER requirements (01–07) are complete and browser-verified by human reviewer (all 5 success criteria passed)
- Phase 3 is complete — Phase 4 (KDS) and Phase 5 (Payment) are both unblocked
- KDS will read from order.store rounds to display kitchen tickets grouped by round

---
*Phase: 03-order-flow*
*Completed: 2026-03-10*
