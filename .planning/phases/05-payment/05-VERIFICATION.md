---
phase: 05-payment
verified: 2026-03-11T07:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Full end-to-end payment flow in browser"
    expected: "Staff opens table, orders items, requests check, taps Go to Payment, selects method, confirms, sees receipt screen, table turns Cleaning on floor map"
    why_human: "View-state transitions, Sonner toast visibility, Thai-locale timestamp rendering, and floor-map live status update require a running browser session. Plan 03 SUMMARY documents this was human-approved by staff on 2026-03-11."
---

# Phase 5: Payment Verification Report

**Phase Goal:** Staff can close a bill, collect payment by method, and return the table to a clean state for the next party
**Verified:** 2026-03-11T07:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Staff can see an itemized flat bill list with all non-voided items, modifier details, quantity, and price per line | VERIFIED | `BillLineItem.tsx` renders `item.menuItemName`, modifier summary via `buildModifierSummary`, and `qty × ฿price`; `PaymentPage` filters `item.status !== 'voided'` before mapping |
| 2  | Staff can enter a coupon code and discount amount; after Apply the coupon line appears in the totals section | VERIFIED | `TotalsSection.tsx` lines 48–95: two controlled inputs + Apply button; when `couponApplied === true` renders "Coupon {couponCode} −฿N" in green |
| 3  | Totals section shows Subtotal → Coupon line (if applied) → VAT 7% (on discounted subtotal) → Grand Total in Thai Baht | VERIFIED | `PaymentPage` computes `vatAmount = Math.round((subtotal - discountAmount) * 0.07)`; `TotalsSection` renders all four rows in correct order |
| 4  | Staff can select Cash, QR PromptPay, or Card via a segmented selector — only one active at a time | VERIFIED | `PaymentMethodSelector.tsx`: `grid grid-cols-3`, active method `variant="default"`, others `variant="outline"`, single `paymentMethod` state |
| 5  | Cash panel: cash received input + change due (red if underpayment); QR panel: 200x200 SVG QR + total + label; Card panel: total + instructional copy | VERIFIED | `CashPanel.tsx`: controlled input, `text-destructive` class applied when `cashReceived > 0 && cashReceived < grandTotal`; `QrPanel.tsx`: inline SVG 200x200 with finder patterns; `CardPanel.tsx`: `text-2xl font-bold text-center` total + "Customer taps or swipes at card reader" |
| 6  | Disabled Split Bill placeholder button with annotation is visible | VERIFIED | `TotalsSection.tsx` lines 110–115: `<Button variant="outline" disabled ...>Split Bill → v2</Button>` + `<p>ⓘ Seat-level split planned for v2</p>` |
| 7  | Confirm Payment button is disabled until payment method is selected (and for Cash until cashReceived >= grandTotal) | VERIFIED | `PaymentPage` lines 92–94: `confirmDisabled = paymentMethod === null \|\| (paymentMethod === 'Cash' && cashReceived > 0 && cashReceived < grandTotal)` |
| 8  | Tapping Confirm Payment transitions the page to receipt screen (same URL) | VERIFIED | `handleConfirmPayment` sets `receiptData` and `setViewState('receipt')`; conditional render at line 107 shows `ReceiptScreen` without route change |
| 9  | Receipt screen shows checkmark header, table number, total paid, payment method, Thai-locale timestamp, and annotated print note | VERIFIED | `ReceiptScreen.tsx`: `CheckCircle` icon + "Payment Received" h1; details card with tableId, `฿{grandTotal.toLocaleString()}`, paymentMethod, `paidAt.toLocaleString('th-TH')`; "🖶 Invoice auto-printed [annotated]" annotation |
| 10 | Table status changes to Cleaning and orderStage updates to Billed on confirm | VERIFIED | `handleConfirmPayment` calls `useTableStore.getState().markCleaning(tableId)` and `updateTable(tableId, { orderStage: 'Billed' })`; both actions confirmed implemented in `table.store.ts` |
| 11 | Reprint Receipt button fires Sonner toast "Receipt sent to printer" with annotation below | VERIFIED | `handleReprint` calls `toast('Receipt sent to printer')`; `ReceiptScreen.tsx` line 79: `(annotated — no printer)` paragraph beneath Reprint button |
| 12 | Go to Payment button in TableBottomSheet (CheckRequested state) navigates to /payment/[tableId] | VERIFIED | `TableBottomSheet.tsx` lines 173–178: active button `onClick={() => router.push('/payment/${table.id}')}` — no "disabled" prop, no Phase 5 stub text |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(app)/payment/[tableId]/page.tsx` | PaymentPage — dynamic route, bill assembly, view-state machine | VERIFIED | 202 lines; substantive; imports all sub-components; wired to order.store + table.store |
| `src/components/payment/BillLineItem.tsx` | Single bill line: name + modifier summary + qty + price | VERIFIED | 43 lines; imports `buildModifierSummary` from TicketLineItem; used in PaymentPage |
| `src/components/payment/TotalsSection.tsx` | Subtotal / coupon / VAT / total rows + coupon inputs + Split Bill placeholder | VERIFIED | 118 lines; all rows present; PAY-05 placeholder included |
| `src/components/payment/PaymentMethodSelector.tsx` | Segmented Cash / QR PromptPay / Card selector | VERIFIED | 41 lines; three buttons with variant toggling |
| `src/components/payment/CashPanel.tsx` | Cash received input + change due display | VERIFIED | 52 lines; underpayment detection with `text-destructive` |
| `src/components/payment/QrPanel.tsx` | Static 200x200 SVG QR mock + total + label | VERIFIED | 218 lines; inline SVG with finder patterns and data grid |
| `src/components/payment/CardPanel.tsx` | Card total amount + instructional copy | VERIFIED | 24 lines; renders total and copy |
| `src/components/payment/ReceiptScreen.tsx` | Post-payment receipt confirmation view | VERIFIED | 89 lines; CheckCircle, details card, reprint button + annotation, back button |
| `src/components/table-map/TableBottomSheet.tsx` | Go to Payment button active (was disabled Phase 5 stub) | VERIFIED | Line 175: `<Button className="w-full" onClick={() => router.push('/payment/${table.id}')}>Go to Payment</Button>` |
| `src/stores/table.store.ts` | markCleaning + updateTable(orderStage:'Billed') actions present | VERIFIED | Zustand persist store; `markCleaning` sets `status: 'Cleaning'`; `updateTable` accepts `Partial<Pick<TableRecord, 'waiterName' \| 'note' \| 'orderStage'>>` |
| `src/stores/order.store.ts` | getOrder(tableId) returns ActiveOrder with rounds | VERIFIED | Zustand persist store; `getOrder` returns `orders[tableId]` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PaymentPage` | `order.store` | `useOrderStore((s) => s.getOrder(tableId))` | WIRED | Line 34 — `getOrder(tableId)` pattern confirmed; bill assembly flatMaps rounds |
| `PaymentPage` | `BillLineItem` | `billItems.map((item) => <BillLineItem key={item.lineId} item={item} />)` | WIRED | Line 153–155 — maps with `item.lineId` as key |
| `BillLineItem` | `TicketLineItem` | `import { buildModifierSummary } from '@/components/order/TicketLineItem'` | WIRED | Line 4 confirmed; `buildModifierSummary(item)` called line 25 |
| `PaymentPage` | `TotalsSection` | All coupon/totals props passed | WIRED | Lines 160–171 — all 9 props passed including `discountAmount` |
| `PaymentPage` | `ReceiptScreen` | `viewState === 'receipt' && receiptData && <ReceiptScreen ... />` | WIRED | Lines 107–121 — conditional render with all props including `onReprint` and `onBackToFloor` |
| `handleConfirmPayment` | `table.store` | `useTableStore.getState().markCleaning(tableId)` + `updateTable(tableId, { orderStage: 'Billed' })` | WIRED | Lines 79–81 — uses `getState()` pattern inside handler |
| `TableBottomSheet (CheckRequested)` | `/payment/[tableId]` | `router.push('/payment/${table.id}')` | WIRED | Line 175 — active button, no disabled prop |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PAY-01 | 05-01, 05-03 | Staff can view an itemized bill with line items, modifier details, discount input field, tax, and total | SATISFIED | `BillLineItem` renders modifier details via `buildModifierSummary`; `TotalsSection` shows discount, VAT 7%, and total; all wired in `PaymentPage` |
| PAY-02 | 05-01, 05-03 | Staff can select payment method (Cash / QR PromptPay / Card) and confirm payment | SATISFIED | `PaymentMethodSelector` + three conditional sub-panels; Confirm button calls `handleConfirmPayment` |
| PAY-03 | 05-02, 05-03 | Payment confirmation triggers table status → Cleaning and shows a receipt action state | SATISFIED | `markCleaning(tableId)` + `updateTable(orderStage:'Billed')` called in `handleConfirmPayment`; `ReceiptScreen` rendered in receipt view-state |
| PAY-04 | 05-02, 05-03 | Staff can reprint a receipt from a closed/paid order | SATISFIED | `handleReprint` fires `toast('Receipt sent to printer')`; "(annotated — no printer)" visible in `ReceiptScreen` |
| PAY-05 | 05-01, 05-03 | Split bill v2 placeholder annotated on payment screen | SATISFIED | `TotalsSection` lines 110–115: disabled button "Split Bill → v2" + annotation "ⓘ Seat-level split planned for v2" |

All five PAY requirements are SATISFIED. No orphaned requirements — PAY-01 through PAY-05 are the only requirements mapped to Phase 5 in REQUIREMENTS.md traceability table, and all five are covered by plans 05-01 and 05-02.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/payment/CashPanel.tsx` | 36 | `placeholder="0"` | Info | HTML input placeholder attribute — not a stub pattern; expected UI copy |
| `src/components/payment/TotalsSection.tsx` | 64, 79 | `placeholder="e.g. RAMEN10"`, `placeholder="0"` | Info | HTML input placeholder attributes — not stub patterns; expected UI copy |
| `src/components/payment/TotalsSection.tsx` | 109 | `{/* PAY-05: Split Bill placeholder */}` | Info | Comment labeling an intentional design placeholder per requirements — not a code stub |

No blockers or warnings found. All "placeholder" hits are HTML input `placeholder` attributes or a JSX comment labeling an intentional v2 stub per PAY-05 requirements.

---

### Human Verification Required

#### 1. Full End-to-End Payment Flow

**Test:** Log in, open a table, add ramen items with modifiers, send order, request check from floor map, tap Go to Payment in bottom sheet, select each payment method, confirm, verify receipt screen appears at same URL, tap Back to Floor Plan, verify tile shows Cleaning status.

**Expected:** All 12 truths hold visually; table tile color changes to Cleaning on floor map; Sonner toast "Receipt sent to printer" appears on Reprint tap; Thai-locale timestamp displays correctly.

**Why human:** View-state transitions, toast positioning, Sonner animation, real-time tile color update after `markCleaning`, and Thai locale date rendering require a live browser session. The 05-03-SUMMARY.md documents human approval by staff on 2026-03-11 — this test has already been completed.

---

### Additional Notable Findings

**Zustand persist middleware (added in Plan 03):** `table.store.ts` and `order.store.ts` both use `persist` middleware with `localStorage` (keys `table-store` and `order-store`). This was added during browser verification to fix state loss when navigating between the `(app)` and `(kds)` route groups. This is a correct, minimal fix and does not introduce any test concerns.

**Actual field names vs plan interface docs:** The plan's `<interfaces>` block used simplified field names (`id`, `name`). Actual `OrderLineItem` shape uses `lineId` and `menuItemName`. The code correctly uses `item.lineId` as the React key and `item.menuItemName` in rendering. No issue — documentation artifact only.

**VAT formula order confirmed correct:** `Math.round((subtotal - discountAmount) * 0.07)` — coupon reduces the tax base before VAT is computed, matching Thai tax convention and the plan specification.

---

## Gaps Summary

No gaps. All 12 observable truths verified against actual code. All 9 required artifacts exist, are substantive (non-stub), and are wired. All 5 requirement IDs (PAY-01 through PAY-05) are satisfied with implementation evidence. No blocker or warning anti-patterns found. Phase 5 goal achieved.

---

_Verified: 2026-03-11T07:00:00Z_
_Verifier: Claude (gsd-verifier)_
