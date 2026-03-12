---
phase: 12-split-bill
plan: "01"
subsystem: bill-state
tags: [zustand, store, split-bill, css-tokens, typescript]
dependency_graph:
  requires: []
  provides: [bill.store.ts, split-status-css-tokens]
  affects: [plan-12-02, plan-12-03]
tech_stack:
  added: []
  patterns: [zustand-persist, floor-remainder-on-last, status-token-pattern]
key_files:
  created:
    - src/stores/bill.store.ts
  modified:
    - src/app/globals.css
decisions:
  - "Import useTableStore into bill.store.ts for canonical guestCount lookup in initPerSeatSplit"
  - "assignItem removes all existing assignments for a lineId before inserting new one (lineId is globally unique, not per-seat)"
  - "cancelSplit uses destructuring rest pattern ({ [tableId]: _, ...rest }) to avoid mutation"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_changed: 2
---

# Phase 12 Plan 01: Bill Store Foundation Summary

Zustand persist store for split-bill state with typed TypeScript interfaces, plus amber OKLCH status token for the split badge — both required by all subsequent Phase 12 plans.

---

## What Was Built

### Task 1: bill.store.ts

Created `src/stores/bill.store.ts` as a new Zustand persist store (`{ name: 'bill-store' }`). Follows the exact `create<T>()(persist(...))` pattern from `order.store.ts`.

**Types exported:**
- `SplitMode` — `'equal' | 'per-seat'`
- `SeatAssignment` — `{ lineId, seatIndex, assignedQty }`
- `SeatPaymentRecord` — `{ method, paidAt, amount }`
- `BillSplit` — full split state per table including equalAmounts, assignments, payments
- `useBillStore` — the Zustand hook

**Actions implemented:**
- `initEqualSplit` — floor + remainder-on-last integer math guarantees sum === grandTotal
- `initPerSeatSplit` — uses `useTableStore.getState().tables[tableId]?.guestCount ?? seatCount` for canonical seat count
- `assignItem` — upserts assignment, removing any prior assignment for the same lineId first
- `unassignItem` — removes all assignments matching lineId
- `recordPayment` — adds payment record at seatIndex key; no side effects on table status
- `cancelSplit` — deletes via destructuring rest pattern (no mutation)
- `getSplit` — returns `BillSplit | undefined`

Equal split verification: `grandTotal=100, seatCount=3` yields `[33, 33, 34]` (sum=100).

### Task 2: Amber split status token in globals.css

Added token at hue 60 (amber-gold) — visually distinct from `--status-check-requested` at hue 75.

- `:root` — `--status-split: oklch(0.62 0.18 60)` and `--status-split-bg: oklch(0.96 0.06 60)`
- `.dark` — `--status-split: oklch(0.78 0.16 60)` and `--status-split-bg: oklch(0.28 0.08 60)`
- `@theme inline` — mapped via `var(--status-split)` and `var(--status-split-bg)` only (no literal oklch)

---

## Verification

- `npm run build` passes with zero TypeScript errors (both tasks)
- All 5 required exports present in bill.store.ts
- `getSplit` on unknown tableId returns `undefined` (map lookup on missing key)
- Equal split math: floor(100/3)=33, remainder=100-99=1, last seat gets 34
- globals.css has split tokens in all 3 required locations (`:root`, `.dark`, `@theme inline`)
- `@theme inline` uses only `var()` references — dark mode safe

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `0de7bb4` | feat(12-01): create bill.store.ts with full TypeScript split interface |
| 2 | `e5ee7f1` | feat(12-01): add amber split status token to globals.css |

## Self-Check: PASSED

All files confirmed present on disk. All commits confirmed in git log.
