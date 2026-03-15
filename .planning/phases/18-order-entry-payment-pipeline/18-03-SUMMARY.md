---
phase: 18-order-entry-payment-pipeline
plan: "03"
subsystem: payment
tags: [takeaway, payment, queue, kds, dine-in-regression]
dependency_graph:
  requires: [18-01, 18-02]
  provides: [TKWY-04]
  affects: [payment/[tableId]/page.tsx, TotalsSection]
tech_stack:
  added: []
  patterns:
    - "Non-reactive getState() for stable isTakeaway boolean"
    - "Callback-presence gating for conditional UI sections (onSplitBill/onMergeBill)"
    - "Early-exit branch pattern in shared handler for channel-specific logic"
key_files:
  created: []
  modified:
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/payment/TotalsSection.tsx
decisions:
  - "isTakeaway detected via non-reactive getState() — stable boolean for page lifetime; no reactive selector needed"
  - "TotalsSection billing action buttons gated on callback presence (onSplitBill !== undefined) — cleaner than dedicated hideBillingActions prop"
  - "SplitSheet and MergeSheet conditionally rendered (!isTakeaway) rather than prop-disabled — DOM removal matches established pattern for hiding dine-in-only controls"
  - "handleConfirmPayment takeaway branch returns early before setReceiptData/setViewState — ensures no receipt flash for takeaway path"
metrics:
  duration: "35 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 5
---

# Phase 18 Plan 03: Payment Page Takeaway Integration Summary

**One-liner:** Payment page detects takeaway orders via non-reactive queue.store read, shows `TK-001 · Jane Smith` header, hides Split/Merge controls, confirms payment for any role on takeaway; queue badge counts all active takeaway + delivery orders.

---

## What Was Built

Wired the payment page (`/payment/[tableId]`) to handle takeaway orders as a distinct flow from dine-in, completing the full TKWY-04 pay-at-ordering model.

### Changes

**`src/app/(app)/payment/[tableId]/page.tsx`**
- Added `useQueueStore` and `useKdsStore` imports
- Added `isTakeaway` and `queueOrder` constants via non-reactive `getState()` reads — stable for page lifetime
- Guarded SplitSheet auto-open `useEffect` with `if (isTakeaway) return` early exit; added `isTakeaway` to dependency array
- Header label now shows `TK-001 · Jane Smith` for takeaway, `Table T01 — Bill` for dine-in
- `onSplitBill` and `onMergeBill` props on `TotalsSection` pass `undefined` when `isTakeaway`
- `SplitSheet` and `MergeSheet` wrapped in `{!isTakeaway && ...}` conditional render
- `handleConfirmPayment` has new early-exit takeaway branch: `advanceStatus(tableId)` → `addTicket(tableId, tableId, 'takeaway')` → `toast.success` → `router.push('/table-map')` → `return`
- Dine-in path below the takeaway block is completely unchanged

**`src/components/payment/TotalsSection.tsx`**
- Split Bill button now renders only when `onSplitBill !== undefined` (in addition to `!isMergeActive`)
- Merge Bill button now renders only when `onMergeBill !== undefined`
- Passing `undefined` for either callback hides the corresponding button rather than rendering a dead no-op button

---

## Tasks

| # | Name | Commit | Status |
|---|------|--------|--------|
| 1 | isTakeaway detection, header override, Split/Merge conditional render | f4b16c5 | Complete |
| 2 | handleConfirmPayment takeaway branch | a1dd12e | Complete |
| 3 | Post-checkpoint bug fixes (3 bugs) + checkpoint resolution | a1bec5c, 62369a9, df9d795 | Complete |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] TotalsSection billing buttons render even when callbacks are undefined**

- **Found during:** Task 1
- **Issue:** Plan instructed passing `undefined` for `onSplitBill`/`onMergeBill` when `isTakeaway`, but `TotalsSection` rendered the buttons regardless, creating dead no-op buttons visible to the user. Plan said "Split/Merge controls are NOT visible" — existing component behaviour contradicted this requirement.
- **Fix:** Updated `TotalsSection` to gate each billing action button on its callback being non-undefined (`onSplitBill !== undefined` / `onMergeBill !== undefined`)
- **Files modified:** `src/components/payment/TotalsSection.tsx`
- **Commit:** f4b16c5

### Post-Checkpoint Bug Fixes (human verification)

**2. [Rule 1 - Bug] Role permission blocked Cashier from sending takeaway order**
- **Found during:** Human verification checkpoint
- **Issue:** `send-to-kitchen` permission check in TicketPanel disabled the Send button for Cashier even when `onSend` (navigate-to-payment) was provided. Gate was semantically incorrect for navigation context.
- **Fix:** `disabled={!hasUnsentItems || (!onSend && !canDoAction(role, 'send-to-kitchen'))}` — bypass permission when custom handler is present
- **Files modified:** `src/components/order/TicketPanel.tsx`
- **Commit:** a1bec5c

**3. [Rule 1 - Bug] Role permission blocked Waiter from confirming takeaway payment**
- **Found during:** Human verification checkpoint
- **Issue:** `confirm-payment` gate in payment page was unconditional; Waiter lacks this permission so Confirm Payment button was always disabled for Waiter.
- **Fix:** `(!isTakeaway && !canDoAction(role, 'confirm-payment'))` — permission only enforced for dine-in path
- **Files modified:** `src/app/(app)/payment/[tableId]/page.tsx`
- **Commit:** 62369a9

**4. [Rule 1 - Bug] Queue badge only counted delivery Pending, missing active takeaway orders**
- **Found during:** Human verification checkpoint
- **Issue:** `pendingDeliveryCount` filtered `channel === 'delivery' && status === 'Pending'` only; all active takeaway orders (Taking/Sent/Ready) were excluded from the count.
- **Fix:** Renamed to `activeQueueCount`; expanded filter to delivery (Pending/Confirmed/Preparing/ReadyForRider) and takeaway (Taking/Sent/Ready)
- **Files modified:** `src/components/app-shell/AppSidebar.tsx`
- **Commit:** df9d795

---

**Total deviations:** 4 auto-fixed (1 Rule 2 missing critical from Task 1, 3 Rule 1 bugs from human verification)
**Impact on plan:** All fixes required for correctness. No scope creep.

---

## Self-Check: PASSED

- FOUND: src/app/(app)/payment/[tableId]/page.tsx
- FOUND: src/components/payment/TotalsSection.tsx
- FOUND: src/components/order/TicketPanel.tsx
- FOUND: src/components/app-shell/AppSidebar.tsx
- FOUND: .planning/phases/18-order-entry-payment-pipeline/18-03-SUMMARY.md
- FOUND commit f4b16c5 (Task 1)
- FOUND commit a1dd12e (Task 2)
- FOUND commit a1bec5c (bug fix 1)
- FOUND commit 62369a9 (bug fix 2)
- FOUND commit df9d795 (bug fix 3)
- npm run build: PASSED (zero TypeScript errors)
