# Split by Value — Design Spec

**Date:** 2026-03-20
**Status:** Approved

## Overview

Replace the existing "Equal Split" payment mode with a "Split by Value" mode where each payer specifies a custom amount. The last payer's amount is automatically locked to the exact remainder, ensuring totals always match. Each payer independently chooses their own payment method (Cash / QR PromptPay / Card).

## Goals

- Allow customers to split a bill by arbitrary custom amounts (e.g., ฿400 + ฿242 out of ฿642 total)
- Each payer pays with their own preferred method
- Totals must add up exactly — no rounding tolerance, no remainder absorption
- Minimal code change: only `bill.store.ts` and `SplitSheet.tsx`

## Data Model

### SplitMode

```ts
type SplitMode = 'custom' | 'per-seat'
// 'equal' is removed — 'custom' is a strict superset
```

### BillSplit

```ts
interface BillSplit {
  tableId: string
  mode: SplitMode
  seatCount: number          // number of payers (2–20)
  customAmounts: number[]    // replaces equalAmounts; length === seatCount; initialized to 0s
  assignments: SeatAssignment[]   // per-seat mode only; unused in custom mode
  payments: Record<number, SeatPaymentRecord>  // keyed by payerIndex; undefined = unpaid
}
```

### New Store Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `initCustomSplit` | `(tableId, payerCount) => void` | Creates a BillSplit with mode `'custom'`, `customAmounts` as array of zeros |
| `setCustomAmount` | `(tableId, payerIndex, amount) => void` | Updates a single payer's amount in `customAmounts` |

### Removed Store Actions

- `initEqualSplit` — removed entirely

## UI Flow

### ViewState machine (SplitSheet)

```
mode-select → custom-config → custom-pay → onAllPaid()
mode-select → per-seat-assign → per-seat-pay → onAllPaid()
```

Views `equal-config` and `equal-seats` are removed and replaced by `custom-config` and `custom-pay`.

### mode-select (updated)

Two options displayed in a 2-column grid:
- **Split by Value** — "Each person pays a custom amount"
- **Per Seat** — "Assign each item to a seat" (unchanged)

### custom-config (new view)

- Heading: "Split by Value"
- Payer count stepper (min 2, max 20), default = table guest count
- Shows total: `฿{grandTotal}`
- "Continue — N payers" button → calls `initCustomSplit(tableId, N)` → navigates to `custom-pay`

### custom-pay (new view)

Displays one card per payer:

**For payers 1 to N−1:**
- Amount input field (numeric, ≥ 1, ≤ remaining balance)
- "Pay" button — enabled only when amount > 0 and amount ≤ remaining balance
- On "Pay": expands `SeatPaymentPanel` for method selection + confirmation

**For the last payer (index N−1):**
- Amount field is read-only, auto-set to `grandTotal − sum(customAmounts[0..N−2])`
- Label: "฿X — remainder"
- "Pay" button enabled as soon as all previous payers have paid

**Footer:**
- Remaining balance tracker: `฿{grandTotal − sum of confirmed amounts}`
- Shows "฿0 — all covered" in green when complete

**After last payer pays:** `onAllPaid()` fires → receipt screen.

### Amount input validation

| Condition | Result |
|-----------|--------|
| Amount = 0 | Pay button disabled |
| Amount > remaining balance | Pay button disabled + hint "Amount exceeds ฿X remaining" |
| Amount valid | Pay button enabled |

## Edge Cases

| Case | Handling |
|------|----------|
| Resume mid-split | `customAmounts[]` is persisted in `bill.store` (Zustand persist); page auto-reopens SplitSheet if split exists. `grandTotal` on resume is re-derived from the payment page's order + discount state (same as initial load) — it is NOT stored in `BillSplit`. |
| Cancel with partial payments | Existing warning dialog — no change |
| Revert to Single Bill | Disabled once ≥ 1 payer has paid — no change |
| Coupon/discount | Applied before split; `grandTotal` passed to SplitSheet is already post-discount |
| Merged tables | SplitSheet hidden when merge is active — no change |
| Takeaway orders | SplitSheet never shown for takeaway — no change |

## Files Changed

| File | Change |
|------|--------|
| `src/stores/bill.store.ts` | Add `'custom'` to `SplitMode`; rename `equalAmounts` → `customAmounts` in **both** `BillSplit` interface and `initPerSeatSplit` (which initialises it as `[]`); add `initCustomSplit`, `setCustomAmount`; remove `initEqualSplit` |
| `src/components/payment/SplitSheet.tsx` | Update `ViewState` type; replace `equal-config`/`equal-seats` render functions with `custom-config`/`custom-pay`; update mode-select card |

## Files Not Changed

- `src/components/payment/SeatPaymentPanel.tsx` — reused as-is
- `src/app/(app)/payment/[tableId]/page.tsx` — no changes needed
- `src/components/payment/TotalsSection.tsx` — no changes needed
- `src/stores/order.store.ts`, `table.store.ts`, `kds.store.ts` — no changes needed
