---
phase: 12-split-bill
plan: "02"
subsystem: split-bill-ui
tags: [react, components, payment, split-bill, bottom-sheet, typescript]
dependency_graph:
  requires: [bill.store.ts, split-status-css-tokens]
  provides: [SplitSheet.tsx, SeatPaymentPanel.tsx]
  affects: [payment-page-integration]
tech_stack:
  added: []
  patterns: [bottom-sheet-pattern, view-state-machine, inline-shadow-tokens, zustand-getState]
key_files:
  created:
    - src/components/payment/SeatPaymentPanel.tsx
    - src/components/payment/SplitSheet.tsx
  modified: []
decisions:
  - "SplitSheet internal view resets to mode-select on every open via useEffect([open])"
  - "handleSeatPaid reads fresh state via useBillStore.getState().getSplit() after recordPayment to check all-paid condition"
  - "renderCancelSection renders warning inline (not a dialog) to avoid extra component overhead"
  - "Per-seat assign re-assign flow: tapping assigned item sets assigningLineId to the item — assignItem then overwrites the existing assignment (bill.store removes prior assignments for the same lineId)"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_changed: 2
---

# Phase 12 Plan 02: Split Bill UI Components Summary

Full split bill bottom sheet (`SplitSheet.tsx`) and inline seat payment panel (`SeatPaymentPanel.tsx`) — complete interactive split flow from mode selection through final seat settlement, all within the payment page.

---

## What Was Built

### Task 1: SeatPaymentPanel.tsx

Created `src/components/payment/SeatPaymentPanel.tsx` — a self-contained inline panel rendered inside `SplitSheet` when staff tap "Pay" on a seat card.

**Key implementation details:**
- Props: `seatIndex` (0-based), `seatTotal`, `tableId`, `onPaid: (SeatPaymentRecord) => void`
- Local state: `paymentMethod: PaymentMethod | null`, `cashReceived: number`
- Renders `PaymentMethodSelector` + conditionally `CashPanel`, `QrPanel`, or `CardPanel`, all using `seatTotal` as `grandTotal`
- Confirm button disabled logic: `paymentMethod === null || (method === 'Cash' && cashReceived > 0 && cashReceived < seatTotal)`
- Seat total header: "Seat {N} — ฿{total}" with font-bold
- `SeatPaymentRecord` type imported from `@/stores/bill.store`

### Task 2: SplitSheet.tsx

Created `src/components/payment/SplitSheet.tsx` — the main split flow component with a 5-state internal view machine.

**View states:**

| State | Description |
|-------|-------------|
| `mode-select` | Two mode cards: Equal Split / Per Seat |
| `equal-config` | Seat count stepper (min 2, max 20) with per-seat amount preview |
| `equal-seats` | Seat cards using `equalAmounts` from bill.store, inline SeatPaymentPanel |
| `per-seat-assign` | Unassigned bucket, item tap → seat picker, qty stepper for qty>1 items |
| `per-seat-pay` | Per-seat computed totals (subtotal + VAT 7%), same payment flow as equal |

**Bottom sheet construction:** Exact pattern from `TableBottomSheet.tsx` — backdrop at z-40, panel at z-50, `style={{ boxShadow: 'var(--shadow-floating)' }}`, body scroll lock via `useEffect`.

**All-seats-paid sequence:** `markCleaning(tableId)` → `cancelSplit(tableId)` → `onClose()` → `onAllPaid()`

**Cancel flow:**
- No payments → cancel immediately with toast
- Partial payments exist → show inline warning with "Keep going" / "Confirm cancel" buttons
- In per-seat-pay after any payment → cancel section shows warning pattern

**Per-seat assign details:**
- Unassigned bucket shows items with `getUnassignedQty(lineId, qty) > 0`
- Item tap opens seat picker + qty stepper (if unassignedQty > 1)
- Assigned items show under seat sections; tapping re-opens picker (overwrites via `assignItem`)
- "Continue to Pay" enabled only when `allItemsAssigned()` returns true

---

## Verification

- `npm run build` passes with zero TypeScript errors for both files
- `SplitSheet` exports named `SplitSheet` with props: `open`, `onClose`, `tableId`, `grandTotal`, `billItems`, `onAllPaid`
- `SeatPaymentPanel` exports named `SeatPaymentPanel` with props: `seatIndex`, `seatTotal`, `tableId`, `onPaid`
- No direct imports from `order.store` in either component — `billItems: OrderLineItem[]` received as prop
- All shadow tokens use `style={{ boxShadow: 'var(--shadow-*)' }}` — zero Tailwind shadow classes

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `46af3d7` | feat(12-02): create SeatPaymentPanel.tsx — inline seat payment component |
| 2 | `d784287` | feat(12-02): create SplitSheet.tsx — full split bottom sheet with all 5 view states |

## Self-Check: PASSED

All files confirmed present on disk. All commits confirmed in git log.
