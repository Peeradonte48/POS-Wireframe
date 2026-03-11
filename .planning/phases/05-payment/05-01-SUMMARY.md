---
phase: 05-payment
plan: 01
subsystem: payment
tags: [payment, bill, coupon, vat, qr, cash, card]
dependency_graph:
  requires: [src/stores/order.store.ts, src/stores/table.store.ts, src/components/order/TicketLineItem.tsx]
  provides: [PaymentPage, BillLineItem, TotalsSection, PaymentMethodSelector, CashPanel, QrPanel, CardPanel]
  affects: [table.store (markCleaning, orderStage Billed on confirm)]
tech_stack:
  added: []
  patterns: [useMemo for bill assembly, getState() inside handler for table store, inline SVG QR mock]
key_files:
  created:
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/payment/BillLineItem.tsx
    - src/components/payment/TotalsSection.tsx
    - src/components/payment/PaymentMethodSelector.tsx
    - src/components/payment/CashPanel.tsx
    - src/components/payment/QrPanel.tsx
    - src/components/payment/CardPanel.tsx
  modified: []
decisions:
  - "OrderLineItem uses lineId (not id) and menuItemName (not name) — plan interfaces were simplified for readability; actual store fields used in code"
  - "LineItemStatus is 'unsent'|'sent'|'voided' — filter for voided items uses item.status !== 'voided'"
  - "updateTable patch is typed as Partial<Pick<TableRecord, 'waiterName'|'note'|'orderStage'>> — confirmed orderStage:'Billed' is valid; no guestCount update needed on confirm"
  - "Receipt view in viewState==='receipt' is a stub — Plan 02 builds the full receipt screen"
  - "Confirm disabled: null method OR Cash-entered-but-insufficient; cash===0 (untouched) does not block"
  - "VAT applied to (subtotal - discountAmount) before adding back to get grandTotal — coupon reduces tax base"
metrics:
  duration: 2min
  completed: 2026-03-11
  tasks: 2
  files_created: 7
  files_modified: 0
---

# Phase 5 Plan 01: Payment Screen Core Summary

**One-liner:** Payment screen with itemized bill, coupon/VAT/totals, and Cash/QR/Card sub-panels using bill assembly from order store.

---

## What Was Built

### Task 1: Payment sub-components (dc5e52d)

Six focused components created in `src/components/payment/`:

- **BillLineItem** — Renders `item.menuItemName`, modifier summary (via imported `buildModifierSummary`), and `qty × ฿price`. Voided items filtered upstream.
- **TotalsSection** — Coupon code + discount amount inputs with Apply button; when applied shows "Coupon {code}" row in green with "−฿N" value. Rows: Subtotal → Coupon (if applied) → VAT 7% → Total. Includes disabled Split Bill placeholder button with annotation (PAY-05).
- **PaymentMethodSelector** — `grid grid-cols-3` of three buttons; active method uses `variant="default"`, others `variant="outline"`.
- **CashPanel** — Controlled number input for cash received; change due row turns `text-destructive` when `cashReceived > 0 && cashReceived < grandTotal`.
- **QrPanel** — Static inline SVG 200×200 with three finder patterns (7×7 with inner white 5×5 and black 3×3) and data grid of 4×4 rects. Centered total above, PromptPay label below.
- **CardPanel** — Grand total in `text-2xl font-bold text-center` + "Customer taps or swipes at card reader" instructional copy.

### Task 2: PaymentPage dynamic route (c10f8f4)

`src/app/(app)/payment/[tableId]/page.tsx`:

- Dynamic route using `useParams<{ tableId: string }>()`
- Bill assembly: `order.rounds.flatMap(r => r.items).filter(item => item.status !== 'voided')`
- **VAT formula:** `Math.round((subtotal - discountAmount) * 0.07)` — coupon applied before tax
- `handleConfirmPayment` calls `useTableStore.getState()` inside handler (avoids stale closure), calls `markCleaning(tableId)` + `updateTable(tableId, { orderStage: 'Billed' })`
- Empty order guard: renders "No order data found" + Back button
- Receipt view stub renders "Payment Received" + amount + method (Plan 02 builds full receipt)
- Sticky bottom bar with disabled `Confirm Payment — ฿{N}` button

---

## Key Technical Decisions

### buildModifierSummary import path confirmed
```
import { buildModifierSummary } from '@/components/order/TicketLineItem'
```
Named export, not moved or duplicated. Function returns bullet-separated string: `Tonkotsu • Spice 3 • Katame • +Extra Chashu`.

### VAT calculation pattern
```typescript
const discountAmount = couponApplied ? couponAmount : 0
const discountedSubtotal = subtotal - discountAmount
const vatAmount = Math.round(discountedSubtotal * 0.07)
const grandTotal = discountedSubtotal + vatAmount
```
VAT computed on post-discount subtotal per Thai tax convention.

### Actual vs plan interface field names
The plan's `<interfaces>` block used simplified field names (`id`, `name`). The actual `OrderLineItem` shape uses `lineId` and `menuItemName`. The `key` prop on BillLineItem uses `item.lineId`.

### TypeScript gotchas resolved
- `updateTable` patch type is `Partial<Pick<TableRecord, 'waiterName' | 'note' | 'orderStage'>>` — only these three fields accepted. Confirmed `orderStage: 'Billed'` is a valid `OrderStage` value.
- No TypeScript errors encountered; both tasks compiled clean on first attempt.

---

## Deviations from Plan

None — plan executed exactly as written, aside from using actual store field names (`lineId`, `menuItemName`) which differ from the simplified interface documentation in the plan.

---

## Requirements Coverage

- **PAY-01:** Itemized bill with modifier details visible via BillLineItem + buildModifierSummary
- **PAY-02:** Three payment method panels working — Cash change calc, QR SVG mock, Card copy
- **PAY-05:** Split Bill disabled placeholder with annotation in TotalsSection

---

## Self-Check: PASSED

All 7 files confirmed present on disk. Both commits (dc5e52d, c10f8f4) verified in git log. `npx tsc --noEmit` exits 0 after each task.
