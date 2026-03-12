---
phase: 12-split-bill
verified: 2026-03-12T08:10:00Z
status: human_needed
score: 13/13 must-haves verified
re_verification: false
human_verification:
  - test: "Equal split: open table, add items, request check, navigate to payment, tap Split Bill, choose Equal Split, enter 3 seats, confirm. Verify the 3 seat-card amounts sum exactly to the grand total shown on-screen."
    expected: "Amounts sum correctly; last seat may differ by 1 satang from the others (floor + remainder-on-last algorithm)."
    why_human: "Math correctness with live VAT-adjusted grandTotal requires a running app; arithmetic is correct in code but VAT rounding compound edge cases cannot be trivially verified statically."
  - test: "Per-seat assignment: open table, add 2 different items (one with qty 2), request check, navigate to payment, tap Split Bill, choose Per Seat. Verify unassigned bucket shows both items. Tap the qty-2 item, set stepper to 1, assign to Seat 1. Assign remaining items. Verify Continue to Pay unlocks only when bucket is empty."
    expected: "Unassigned bucket depletes as items are assigned. Continue to Pay button is disabled while any item has unassigned qty > 0, and enables when all items are fully assigned."
    why_human: "Dynamic bucket state and button enable/disable logic depend on runtime Zustand state; requires browser interaction."
  - test: "Mid-split resume: start an equal split, pay Seat 1, navigate back to the floor map, then re-enter the payment page. Verify the split sheet auto-opens at the current state with Seat 1 already settled."
    expected: "Split sheet opens automatically on page mount; Seat 1 shows green Settled badge; remaining seats show Pay buttons."
    why_human: "Auto-open depends on persisted Zustand state across navigation; requires live app with persistence."
  - test: "Floor map split badge: while a split is in progress (at least one seat unpaid), navigate to the floor map. Verify the table tile shows an amber scissors badge with the correct 'X/N paid' count."
    expected: "Amber badge visible with scissors icon; count increments as seats are paid; badge disappears after split completes and table moves to Cleaning."
    why_human: "Visual token rendering and badge visibility require browser; dark mode variant of the amber token also needs visual confirmation."
  - test: "Cancel split with partial payments: start an equal split, pay one seat, then tap Cancel Split. Verify inline warning appears. Tap Confirm cancel. Verify toast 'Split cancelled' and sheet closes."
    expected: "Warning text 'Cancelling will clear all payment progress' appears; confirming cancel clears the split and shows toast."
    why_human: "Multi-step cancel flow with inline warning UI requires interaction."
  - test: "Stale state cleanup: complete a full split (all seats paid, table goes to Cleaning), then go to the floor map and tap Mark Clean. Open the same table again, add items, request check, navigate to payment. Verify the split sheet does NOT auto-open."
    expected: "Payment page loads normally with no split sheet open; the previous split state is not persisted."
    why_human: "Requires completing a full lifecycle to verify that cancelSplit in TableBottomSheet clears persisted localStorage state."
---

# Phase 12: Split Bill Verification Report

**Phase Goal:** Staff can split any table's bill by equal shares or per-seat item assignment, pay each portion independently, and see split progress at a glance.
**Verified:** 2026-03-12T08:10:00Z
**Status:** human_needed (all automated checks passed — 6 human flows remain)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `bill.store.ts` exports all required types and actions | ✓ VERIFIED | File exists at `src/stores/bill.store.ts` (160 lines); exports `SplitMode`, `SeatAssignment`, `SeatPaymentRecord`, `BillSplit`, `useBillStore`; all 7 actions implemented |
| 2 | Equal split: floor + remainder-on-last math guarantees sum === grandTotal | ✓ VERIFIED | Lines 48–51: `base = Math.floor(grandTotal / seatCount)`, `remainder = grandTotal - base * seatCount`, last seat receives `base + remainder` |
| 3 | Per-seat assignments track lineId + seatIndex + assignedQty; partial qty supported | ✓ VERIFIED | `SeatAssignment` interface lines 8–12; `assignItem` accumulates qty on existing seat entry (lines 86–93) |
| 4 | Per-seat payments keyed by seatIndex with method, paidAt, amount | ✓ VERIFIED | `SeatPaymentRecord` interface lines 14–18; `recordPayment` action lines 133–147; `payments: Record<number, SeatPaymentRecord>` in `BillSplit` |
| 5 | `cancelSplit` removes split entry for tableId without mutation | ✓ VERIFIED | Lines 149–153: destructuring rest pattern `const { [tableId]: _, ...rest } = state.splits` |
| 6 | Amber split token visible in both light and dark modes | ✓ VERIFIED | `globals.css` line 126–127 (`:root`): `oklch(0.62 0.18 60)` / `oklch(0.96 0.06 60)`; lines 182–183 (`.dark`): `oklch(0.78 0.16 60)` / `oklch(0.28 0.08 60)`; lines 77–78 (`@theme inline`): `var(--status-split)` / `var(--status-split-bg)` only — dark-mode-safe |
| 7 | SplitSheet renders bottom sheet with mode selector (Equal Split / Per Seat) | ✓ VERIFIED | `src/components/payment/SplitSheet.tsx` lines 215–243: two tappable mode cards with correct subtext; bottom-sheet pattern with z-40 backdrop, z-50 panel, `var(--shadow-floating)`, body scroll lock |
| 8 | SplitSheet 5-state internal view machine: mode-select, equal-config, equal-seats, per-seat-assign, per-seat-pay | ✓ VERIFIED | `ViewState` type lines 17–23; all 5 render functions implemented (renderModeSelect, renderEqualConfig, renderEqualSeats, renderPerSeatAssign, renderPerSeatPay); wired in render at lines 706–711 |
| 9 | Per-seat assign: unassigned bucket depletes; Continue to Pay unlocks only when all items assigned | ✓ VERIFIED | `allItemsAssigned()` lines 129–131; `disabled={!allItemsAssigned()}` on Continue button line 578; unassigned bucket filtered by `getUnassignedQty > 0` lines 387–389 |
| 10 | Last seat paid triggers: `markCleaning` → `cancelSplit` → `onClose` → `onAllPaid` | ✓ VERIFIED | `handleSeatPaid` lines 99–117: `markCleaning(tableId)` line 112, `cancelSplit(tableId)` line 113, `onClose()` line 114, `onAllPaid()` line 115 |
| 11 | SeatPaymentPanel renders PaymentMethodSelector + CashPanel/QrPanel/CardPanel using `seatTotal` as `grandTotal` | ✓ VERIFIED | Lines 61–73: all three sub-panels conditionally rendered with `grandTotal={seatTotal}` |
| 12 | TableTile shows amber scissors badge "X/N paid" when split active + status CheckRequested | ✓ VERIFIED | `TableTile.tsx` lines 41–43: `useBillStore` selector, `paidCount`, `showSplitBadge` guard; lines 73–84: ternary badge slot with `bg-status-split-bg text-status-split` and `ScissorsLinear` icon |
| 13 | Full integration: Split Bill button active in TotalsSection, SplitSheet mounted in payment page, auto-open on resume, cancelSplit in TableBottomSheet on Mark Clean | ✓ VERIFIED | `TotalsSection.tsx` line 103: active button with `onSplitBill` prop; `payment/[tableId]/page.tsx` lines 52–60: `splitSheetOpen` state + `useEffect` auto-open; lines 241–251: SplitSheet mounted with correct props; `TableBottomSheet.tsx` lines 207–210: `cancelSplit(table.id)` called before `markClean(table.id)` |

**Score: 13/13 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/stores/bill.store.ts` | BillSplit state + all store actions | ✓ VERIFIED — WIRED | 160 lines; 5 exports; 7 actions; imported in SplitSheet, TableTile, TableBottomSheet, payment page |
| `src/app/globals.css` | Amber split status tokens | ✓ VERIFIED — WIRED | Tokens in `:root`, `.dark`, `@theme inline`; referenced by TableTile Tailwind classes |
| `src/components/payment/SplitSheet.tsx` | Full split bottom sheet with all 5 view states | ✓ VERIFIED — WIRED | 718 lines; named export `SplitSheet`; mounted in `payment/[tableId]/page.tsx` |
| `src/components/payment/SeatPaymentPanel.tsx` | Inline seat payment with all 3 method sub-panels | ✓ VERIFIED — WIRED | 85 lines; named export `SeatPaymentPanel`; imported and rendered in SplitSheet |
| `src/components/table-map/TableTile.tsx` | Conditional split progress badge | ✓ VERIFIED — WIRED | Lines 41–84; `useBillStore` selector live; badge renders in the `absolute top-2 right-2` slot |
| `src/components/payment/TotalsSection.tsx` | Active Split Bill button wired to open sheet | ✓ VERIFIED — WIRED | Line 103: active `<Button onClick={onSplitBill}>`; `onSplitBill?: () => void` prop on line 24 |
| `src/app/(app)/payment/[tableId]/page.tsx` | SplitSheet mounted + auto-open useEffect | ✓ VERIFIED — WIRED | Lines 19–20: imports; line 52: state; lines 54–60: useEffect; lines 201: onSplitBill prop; lines 241–251: SplitSheet mount |
| `src/components/table-map/TableBottomSheet.tsx` | `cancelSplit` called before `markClean` | ✓ VERIFIED — WIRED | Lines 207–210: `useBillStore.getState().cancelSplit(table.id)` immediately before `markClean(table.id)` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SplitSheet.tsx` | `bill.store.ts` | `useBillStore()` hook | ✓ WIRED | Line 50–51: destructures all actions; line 53: live `getSplit(tableId)` selector |
| `SeatPaymentPanel.tsx` | `PaymentMethodSelector`, `CashPanel`, `QrPanel`, `CardPanel` | props with `seatTotal` as `grandTotal` | ✓ WIRED | Lines 61–73: all sub-panels receive `grandTotal={seatTotal}` |
| `SplitSheet.tsx` (last seat) | `useTableStore.markCleaning` | `useTableStore.getState().markCleaning(tableId)` | ✓ WIRED | Line 112 in `handleSeatPaid` |
| `payment/[tableId]/page.tsx` | `SplitSheet.tsx` | `splitSheetOpen` boolean + `onAllPaid` callback | ✓ WIRED | Lines 241–251: `open={splitSheetOpen}`, `onAllPaid` navigates to receipt |
| `payment/[tableId]/page.tsx` | `bill.store.ts` | `useEffect` on mount with `getSplit(tableId)` | ✓ WIRED | Lines 54–60: `useBillStore.getState().getSplit(tableId)` auto-opens sheet |
| `TableBottomSheet.tsx` | `bill.store.ts` | `useBillStore.getState().cancelSplit(tableId)` | ✓ WIRED | Line 207: called before `markClean` in the Cleaning status handler |
| `TableTile.tsx` | `bill.store.ts` | `useBillStore((s) => s.getSplit(table.id))` selector | ✓ WIRED | Lines 41–43: live reactive selector |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| SPLIT-01 | 12-01, 12-02, 12-04 | Staff can split bill equally by N guests — total / N with floor + remainder-on-last | ✓ SATISFIED | `initEqualSplit` in bill.store.ts; equal-config + equal-seats views in SplitSheet; end-to-end wired in payment page |
| SPLIT-02 | 12-01, 12-02, 12-04 | Staff can split bill per-seat by assigning items to individual seats; each seat sub-bill totals correctly with VAT | ✓ SATISFIED | `assignItem`/`unassignItem` in bill.store.ts; per-seat-assign + per-seat-pay views with `computeSeatTotal` (subtotal + Math.round(subtotal * 0.07)) |
| SPLIT-03 | 12-02, 12-04 | Each seat pays independently (Cash/QR/Card); settled seats show settled state; table closes only when all seats paid | ✓ SATISFIED | `SeatPaymentPanel` reuses all 3 payment sub-panels; green Settled badge on paid seats; `handleSeatPaid` checks all-paid before `markCleaning` |
| SPLIT-04 | 12-03, 12-04 | Table tile shows split progress badge ("X/N paid") when bill is partially settled | ✓ SATISFIED | `TableTile.tsx` amber scissors badge; only visible when `split !== undefined && table.status === 'CheckRequested'`; disappears when `cancelSplit` clears the split |

All 4 requirements have complete code coverage across all required artifacts. No orphaned requirements detected.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `TableBottomSheet.tsx` | 132, 145 | `placeholder=` on `<Input>` elements | ℹ Info | HTML input placeholder attributes — not content stubs. Pre-existing; not introduced by Phase 12. |
| `SplitSheet.tsx` | 319, 384, 592 | `if (!split) return null` | ℹ Info | Defensive null guards for state that may not yet exist (sheet open before store initialized). Correct pattern, not a stub. |

No blocker or warning anti-patterns found. All `return null` occurrences are properly guarded defensive checks, not empty implementations.

---

### Human Verification Required

All automated checks passed. The following flows require a running browser session to confirm correct behavior:

**1. Equal Split Math — End to End**

**Test:** Open a table with 2+ guests, add items, request check, navigate to payment, tap "Split Bill", choose "Equal Split", enter 3 seats, confirm.
**Expected:** 3 seat cards appear; amounts displayed sum exactly to the grand total shown in TotalsSection. Last seat may differ by 1 satang (floor+remainder algorithm).
**Why human:** VAT-adjusted grandTotal used as input to the split calculation; the compound rounding path (subtotal → discountedSubtotal → vatAmount → grandTotal → equalAmounts) needs live verification.

**2. Per-Seat Item Assignment Flow**

**Test:** Open a table, add 2 different items (one with qty 2), request check, navigate to payment, tap "Split Bill", choose "Per Seat". Tap the qty-2 item; verify stepper appears. Set qty to 1, assign to Seat 1. Assign remaining items. Check "Continue to Pay" button state.
**Expected:** Unassigned bucket shows all items initially. Stepper appears for qty > 1 items. Continue to Pay is disabled while any item has unassigned qty > 0. Button enables when bucket is empty.
**Why human:** Item assignment bucket state and button enable/disable logic are driven by reactive Zustand state that cannot be statically traced across multiple interaction steps.

**3. Mid-Split Resume (Auto-Open)**

**Test:** Start an equal split, pay Seat 1, navigate back to floor map, re-enter the payment page for the same table.
**Expected:** Split sheet auto-opens on page mount with Seat 1 showing "Settled" badge; remaining seats show "Pay" buttons.
**Why human:** Depends on Zustand persist middleware writing to localStorage and the `useEffect` on `[tableId]` re-reading it on mount — requires a live browser with actual persistence.

**4. Split Progress Badge on Floor Map**

**Test:** While a split is in progress (one seat paid, others unpaid), navigate to the floor map and find the table tile.
**Expected:** Amber scissors badge visible with text "1/N paid" (N = seat count). Badge increments as more seats are paid. Badge disappears after split completes and table moves to Cleaning status.
**Why human:** Visual token rendering (`bg-status-split-bg`, `text-status-split`) and badge visibility require browser; dark mode amber variant also needs visual confirmation.

**5. Cancel Split With Partial Payments**

**Test:** Start a split, pay one seat, then tap "Cancel split" in the sheet footer.
**Expected:** Inline warning text "Cancelling will clear all payment progress" appears with "Keep going" and "Confirm cancel" buttons. Tapping "Confirm cancel" closes the sheet and shows a sonner toast "Split cancelled".
**Why human:** Multi-step cancel flow with conditional inline warning UI (not a dialog) requires interaction to confirm the warning state renders and the toast fires.

**6. Stale State Cleanup After Table Reuse**

**Test:** Complete a full split (all seats paid, table transitions to Cleaning). Go to floor map, tap the table tile, tap "Mark Clean". Open the same table again with new guests, add items, request check, navigate to payment.
**Expected:** Payment page loads normally with no auto-opening split sheet. The Cleaning-state cancelSplit call cleared the persisted bill.store entry.
**Why human:** Full lifecycle test; requires completing a split, triggering markClean, and verifying bill.store is empty for that tableId on the next visit.

---

### Build Verification

`npm run build` output: all 11 routes compiled with zero TypeScript errors. Both dynamic routes (`/order/[tableId]`, `/payment/[tableId]`) confirmed present.

---

## Summary

All Phase 12 artifacts exist, are substantive (no stubs or empty implementations), and are fully wired into the application flow. The four requirements (SPLIT-01 through SPLIT-04) have complete code coverage:

- **SPLIT-01** (equal split): Floor + remainder-on-last math in `bill.store.ts`, equal-config and equal-seats views in `SplitSheet.tsx`, wired via `onSplitBill` prop chain.
- **SPLIT-02** (per-seat assignment): `assignItem`/`removeAssignment`/`unassignItem` in store; per-seat-assign view with unassigned bucket, seat picker, and qty stepper; per-seat-pay view with per-seat VAT computation.
- **SPLIT-03** (independent per-seat payments): `SeatPaymentPanel` reuses existing Cash/QR/Card sub-panels with `seatTotal` as `grandTotal`; `handleSeatPaid` triggers `markCleaning` only when all seats confirmed.
- **SPLIT-04** (floor plan progress badge): `TableTile` reads `useBillStore` selector live; amber scissors badge with `{paidCount}/{seatCount} paid` renders in the existing badge slot only during CheckRequested status.

No gaps. Six human flows required to confirm runtime behavior, visual rendering, and localStorage persistence.

---

_Verified: 2026-03-12T08:10:00Z_
_Verifier: Claude (gsd-verifier)_
