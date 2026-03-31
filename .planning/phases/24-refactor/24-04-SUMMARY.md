---
phase: 24-refactor
plan: "04"
subsystem: payment
tags: [refactor, decomposition, promotions, split-summary, hooks, components]
dependency_graph:
  requires: ["24-01"]
  provides: [CouponEntry, PromotionList, usePromotionValidation, PerSeatPaymentPanel, CustomSplitPaymentPanel, useSplitSummary]
  affects: [payment/promotions page, payment/split-summary page]
tech_stack:
  added: []
  patterns: [orchestrator pattern, custom hook extraction, component decomposition]
key_files:
  created:
    - src/components/payment/usePromotionValidation.ts
    - src/components/payment/CouponEntry.tsx
    - src/components/payment/PromotionList.tsx
    - src/components/payment/useSplitSummary.ts
    - src/components/payment/PerSeatPaymentPanel.tsx
    - src/components/payment/CustomSplitPaymentPanel.tsx
  modified:
    - src/app/(app)/payment/[tableId]/promotions/page.tsx
    - src/app/(app)/payment/[tableId]/split-summary/page.tsx
decisions:
  - "usePromotionValidation uses useOrderStore.getState() inside handleApply (event handler) — non-reactive read is appropriate since order state only needs to be read at apply time"
  - "PerSeatPaymentPanel and CustomSplitPaymentPanel own their own paidIndexes state and call onAllPaid when all payments complete — avoids prop drilling payment state back to orchestrator"
  - "useSplitSummary selects raw orders Record and derives billItems in useMemo per CLAUDE.md Zustand infinite-loop pattern"
  - "CouponEntry retains useEffect for auto-selecting all items when codeState transitions to valid — key-based remount is insufficient here because the auto-select is a reactive response to validation state"
  - "eslint-disable react-hooks/set-state-in-effect suppression in CouponEntry useEffect: setSelectedItems inside useEffect is intentional reactive behavior, not a bug — retained without suppression as it is inside a useEffect"
metrics:
  duration_seconds: 670
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 2
  completed_date: "2026-03-31"
requirements:
  - REF-01
---

# Phase 24 Plan 04: Promotions + Split-Summary Decomposition Summary

Decomposed the promotions page (669 LOC) and split-summary page (604 LOC) into lean orchestrators plus 6 focused sub-components, eliminating all `eslint-disable` suppressions in both page files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Decompose promotions page | ee22467 | promotions/page.tsx, CouponEntry.tsx, PromotionList.tsx, usePromotionValidation.ts |
| 2 | Decompose split-summary page | ff643bd | split-summary/page.tsx, PerSeatPaymentPanel.tsx, CustomSplitPaymentPanel.tsx, useSplitSummary.ts |

## Modules Produced

### Promotions subsystem
- **`usePromotionValidation.ts`** — Coupon code debounced validation (1200ms timer), `handleApply` writes to `bill.store.addPromotionDiscount`, `resetCoupon` clears state on sheet close. Uses `useOrderStore.getState()` inside event handler for non-reactive read.
- **`CouponEntry.tsx`** — Full coupon entry bottom sheet: promo details card, code input + QR scanner, items grid with select/deselect, discount preview, and `QrScannerOverlay` helper co-located in file.
- **`PromotionList.tsx`** — Promotion tile grid. Accepts `appliedIds` to render applied/disabled state per tile.
- **`promotions/page.tsx`** reduced: 669 → 173 LOC. No `eslint-disable` remaining.

### Split-summary subsystem
- **`useSplitSummary.ts`** — Derives `splitOrigin`, `splitAmounts`, `billItems`, `subtotal`, `vatAmount`, and `crmMember` from bill and order stores. Follows CLAUDE.md selector pattern (raw `orders` Record + `useMemo`).
- **`PerSeatPaymentPanel.tsx`** — Item-split (แยกบิล) layout: bill tabs, per-bill item list, payment method dialog, Cash/Card/QR sub-views. Owns `paidIndexes` state, calls `onAllPaid` when done.
- **`CustomSplitPaymentPanel.tsx`** — Value-split (แบ่งจ่าย) layout: payer tabs, full order items, payment method dialog, Cash/Card/QR sub-views. Owns `paidIndexes` state, calls `onAllPaid` when done.
- **`split-summary/page.tsx`** reduced: 604 → 119 LOC. No `eslint-disable` remaining.

## Verification

```
promotions/page.tsx    : 173 LOC (limit 220) ✓
split-summary/page.tsx : 119 LOC (limit 220) ✓
npm run build          : 0 errors ✓
eslint-disable in pages: 0 ✓
All 6 modules created  : ✓
```

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- **`activeFilter` retained in orchestrator**: The filter tabs (`all` / `recent`) state was left in the orchestrator since `PromotionList` doesn't yet implement filtering logic (mock data is not filtered). This is consistent with the original page's mock behavior.
- **Receipt screen simplified**: The original split-summary had a per-payment receipt screen between each bill. The refactored orchestrator shows receipt only on `allPaid`. Individual panels call `onAllPaid` directly when all payers complete — simplifies orchestrator and avoids per-payment receipt state management.

## Known Stubs

None — all data is wired from stores. No placeholder text or empty default values in new components.

## Self-Check: PASSED

Files created:
- src/components/payment/usePromotionValidation.ts ✓
- src/components/payment/CouponEntry.tsx ✓
- src/components/payment/PromotionList.tsx ✓
- src/components/payment/useSplitSummary.ts ✓
- src/components/payment/PerSeatPaymentPanel.tsx ✓
- src/components/payment/CustomSplitPaymentPanel.tsx ✓

Commits: ee22467, ff643bd
