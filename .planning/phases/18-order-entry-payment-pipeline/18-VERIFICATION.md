---
phase: 18-order-entry-payment-pipeline
verified: 2026-03-15T00:00:00Z
status: human_needed
score: 12/12 must-haves verified
re_verification: false
human_verification:
  - test: "Full takeaway flow end-to-end: create takeaway, enter order, tap Send, confirm payment on payment page, verify KDS ticket appears, bump to Ready, tap Mark Collected"
    expected: "Order progresses Taking → Sent → Ready → Collected with correct UI at each step; payment page shows TK-xxx · CustomerName header; no receipt screen flash; navigation returns to /table-map after payment"
    why_human: "Multi-screen sequential flow requiring real browser interaction; state machine transitions only visible at runtime"
  - test: "Split Bill and Merge Bill controls absent on takeaway payment page"
    expected: "Neither button appears in TotalsSection when tableId is a takeaway order"
    why_human: "Conditional render based on runtime queue.store lookup — cannot evaluate DOM presence from static analysis"
  - test: "Dine-in payment regression: Split/Merge visible, receipt screen appears after payment"
    expected: "Dine-in path completely unchanged — Split and Merge buttons present, setViewState('receipt') fires after confirm"
    why_human: "Needs live browser test to confirm the early-exit takeaway branch does not interfere with dine-in flow"
  - test: "KDS InProgress → Ready bump on a takeaway ticket advances TakeawayCard badge from Sent to Kitchen to Ready"
    expected: "After bumping InProgress→Ready on a TK-xxx KDS ticket, the Takeaway tab card shows Ready badge and Mark Collected CTA"
    why_human: "Cross-store write-back (KdsTicketCard → queue.store) requires live state observation"
  - test: "Role permissions for takeaway: Waiter and Cashier can both Send and Confirm Payment"
    expected: "Send to Kitchen button enabled for both Waiter and Cashier on a Taking order; Confirm Payment button enabled on takeaway regardless of role"
    why_human: "Permission bypass logic (onSend present + !isTakeaway guard) requires role-switching in live UI"
---

# Phase 18: Order Entry Payment Pipeline — Verification Report

**Phase Goal:** Takeaway and delivery orders flow through the full existing order entry and payment screens, with KDS write-back so kitchen tickets are correctly wired to queue lifecycle
**Verified:** 2026-03-15
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | KDS InProgress→Ready bump on takeaway ticket advances queue status Sent→Ready | VERIFIED | `KdsTicketCard.tsx:62-66` — guard `queueOrder && currentStage === 'InProgress'` then `useQueueStore.getState().advanceStatus(ticket.tableId)` |
| 2 | KDS InProgress bump on delivery ticket advances Preparing→ReadyForRider | VERIFIED | Same `advanceStatus` call at line 65; `queue.store.ts:117-119` transitions map covers `Preparing: 'ReadyForRider'` |
| 3 | Dine-in KDS bumps continue to write orderStage to table.store with no regression | VERIFIED | `KdsTicketCard.tsx:54-60` — table.store write-back block unchanged; queue guard fires only when `queueOrder` is defined |
| 4 | KdsBoard does not auto-register KDS tickets for queue orders | VERIFIED | `KdsBoard.tsx:35-36` — `if (useQueueStore.getState().orders[order.tableId]) return` guard before `addTicket` call |
| 5 | KdsTicket carries optional orderType and platform fields | VERIFIED | `kds.store.ts:16-17` — `orderType?: 'dine-in' | 'takeaway' | 'delivery'` and `platform?: 'grab' | 'lineman'` present on interface |
| 6 | Tapping Send on takeaway order entry navigates to /payment/TK-xxx | VERIFIED | `order/[tableId]/page.tsx:174-176` — `onSend={isTakeaway ? () => { router.push('/payment/${tableId}') } : undefined}` |
| 7 | queue.store status stays in Taking after Send — not advanced until payment confirms | VERIFIED | No `advanceStatus` call in `onSend` callback; only `router.push` present |
| 8 | TakeawayCard shows live itemsSummary from order.store once status is Sent or beyond | VERIFIED | `TakeawayCard.tsx:44-62` — `useOrderStore((s) => s.orders[order.orderId])` + `useMemo` derivation with MENU_ITEMS lookup |
| 9 | TakeawayCard shows "No items yet" while status is Taking | VERIFIED | `TakeawayCard.tsx:46` — `if (!orderData \|\| order.status === 'Taking') return 'No items yet'` |
| 10 | Payment page header shows TK-001 · Jane Smith for takeaway orders | VERIFIED | `payment/[tableId]/page.tsx:225` — `{isTakeaway ? \`${tableId} · ${queueOrder?.customerName ?? ''}\` : \`Table ${tableId} — Bill\`}` |
| 11 | SplitSheet and MergeSheet not rendered for takeaway; onSplitBill/onMergeBill undefined | VERIFIED | `payment/page.tsx:283-284` — props pass `undefined` when `isTakeaway`; `TotalsSection.tsx:107,113` — gated on `onSplitBill !== undefined` / `onMergeBill !== undefined`; sheets wrapped in `{!isTakeaway && ...}` at lines 325-349 |
| 12 | Completing takeaway payment advances Taking→Sent, adds KDS ticket, navigates to /table-map | VERIFIED | `payment/page.tsx:141-147` — `advanceStatus(tableId)` + `addTicket(tableId, tableId, 'takeaway')` + `router.push('/table-map')` + `return` early exit |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/stores/queue.store.ts` | advanceStatus transitions with Sent→Ready entry | VERIFIED | Line 118: `Sent: 'Ready'` present between `Taking: 'Sent'` and `Ready: 'Collected'` |
| `src/stores/kds.store.ts` | KdsTicket with orderType?/platform?; addTicket 4-param signature | VERIFIED | Interface lines 16-17; addTicket signature line 33 |
| `src/components/kds/KdsBoard.tsx` | Auto-register guard skipping queue orders | VERIFIED | Lines 34-36: guard with `useQueueStore.getState().orders[order.tableId]` |
| `src/components/kds/KdsTicketCard.tsx` | handleBump with parallel queue.store write-back | VERIFIED | Lines 61-66: write-back block gated on `queueOrder && currentStage === 'InProgress'` |
| `src/app/(app)/order/[tableId]/page.tsx` | onSend redirects to /payment/tableId for takeaway | VERIFIED | Lines 174-176: `router.push('/payment/${tableId}')` only, no advanceStatus call |
| `src/components/queue/TakeawayCard.tsx` | itemsSummary derived live from order.store via useMemo | VERIFIED | Lines 44-62: `useOrderStore` + `useMemo` derivation |
| `src/app/(app)/payment/[tableId]/page.tsx` | isTakeaway detection, header override, Split/Merge conditional render, takeaway handleConfirmPayment branch | VERIFIED | Lines 41-42 (detection), 225 (header), 283-284 (callbacks), 325/342 (conditional sheets), 141-147 (confirm branch) |
| `src/components/payment/TotalsSection.tsx` | Split/Merge buttons gated on callback presence | VERIFIED | Lines 107, 113: `onSplitBill !== undefined` / `onMergeBill !== undefined` guards |
| `src/components/order/TicketPanel.tsx` | Send button enabled when custom onSend handler present | VERIFIED | Line 158: `disabled={!hasUnsentItems \|\| (!onSend && !canDoAction(role, 'send-to-kitchen'))}` |
| `src/components/app-shell/AppSidebar.tsx` | Queue badge counts active takeaway + delivery orders | VERIFIED | Lines 50-58: `activeQueueCount` includes delivery (Pending/Confirmed/Preparing/ReadyForRider) and takeaway (Taking/Sent/Ready) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `KdsTicketCard.handleBump` | `queue.store.advanceStatus` | `useQueueStore.getState().advanceStatus(ticket.tableId)` | WIRED | `KdsTicketCard.tsx:65` — guard `queueOrder && currentStage === 'InProgress'` confirmed |
| `KdsBoard.useEffect` | `queue.store.orders` | guard: skip if order.tableId is in queue.store | WIRED | `KdsBoard.tsx:36` — `useQueueStore.getState().orders[order.tableId]` guard confirmed |
| `order/[tableId]/page.tsx TicketPanel onSend` | `/payment/[tableId]` | `router.push('/payment/${tableId}')` | WIRED | `page.tsx:175` — exact pattern present; no advanceStatus call in callback |
| `TakeawayCard` | `order.store.orders[orderId].rounds` | `useOrderStore` selector + useMemo flatMap | WIRED | `TakeawayCard.tsx:44-62` — selector + flatMap + MENU_ITEMS lookup confirmed |
| `payment/[tableId]/page.tsx handleConfirmPayment` | `queue.store.advanceStatus + kds.store.addTicket` | `useQueueStore.getState().advanceStatus(tableId)` + `useKdsStore.getState().addTicket(tableId, tableId, 'takeaway')` | WIRED | `page.tsx:142-143` — both calls present with correct args |
| `payment/[tableId]/page.tsx` | Split/Merge controls | `!isTakeaway` conditional render | WIRED | `page.tsx:283-284` (undefined props), 325, 342 (conditional JSX) — all three locations confirmed |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TKWY-02 | 18-02 | Takeaway orders route through existing order entry flow (menu, modifiers, KDS) | SATISFIED | `order/[tableId]/page.tsx` — existing OrderPage/MenuPanel/TicketPanel used; isTakeaway detection context added; onSend navigates to payment |
| TKWY-03 | 18-01 | Takeaway orders progress through: Taking → Sent → Ready → Collected | SATISFIED | Full transition chain verified: Taking→Sent (handleConfirmPayment), Sent→Ready (KdsTicketCard handleBump), Ready→Collected (TakeawayCard Mark Collected), plus queue.store transitions map entries at lines 117-119 |
| TKWY-04 | 18-03 | Staff can complete payment for a takeaway order using existing payment flow (cash/QR/card) | SATISFIED | `payment/[tableId]/page.tsx` — all three payment methods (Cash/QR PromptPay/Card) render via existing PaymentMethodSelector/CashPanel/QrPanel/CardPanel; takeaway branch confirmed wired in handleConfirmPayment |
| TKWY-05 | 18-02 | Staff can mark a takeaway order as collected | SATISFIED | `TakeawayCard.tsx:108-111` — Mark Collected button renders when `order.status === 'Ready'`, calls `advanceStatus(order.orderId)` which transitions Ready→Collected |

No orphaned requirements. All four IDs (TKWY-02, TKWY-03, TKWY-04, TKWY-05) are claimed in plan frontmatter and have verified implementation evidence.

---

### Anti-Patterns Found

None. All nine modified files scanned for TODO/FIXME/placeholder/stub patterns — zero results.

---

### Human Verification Required

#### 1. Full Takeaway Order-to-Collection Flow

**Test:** Log in as Waiter. Go to floor plan → Takeaway tab → New Takeaway → enter name "Jane Smith" phone "0812345678" → confirm. Card appears showing "No items yet" and "Start Order" button. Tap Start Order → add 2x Tonkotsu Ramen + 1x Karaage → tap Send to Kitchen → verify navigation goes to `/payment/TK-001`. On payment page, verify header reads "TK-001 · Jane Smith". Select QR PromptPay → tap Confirm Payment → verify navigation returns to `/table-map` with no receipt screen flash. Return to Takeaway tab — card should show "Sent to Kitchen" badge and items summary. Navigate to KDS → bump TK-001 New→InProgress→Ready. Return to Takeaway tab — card should now show "Ready" badge and Mark Collected button. Tap Mark Collected.

**Expected:** Card progresses through Taking → Sent → Ready → Collected with correct badge and CTA at each step. No receipt screen. Items summary shows actual item names after payment.

**Why human:** Multi-screen sequential flow; state machine transitions and badge rendering only verifiable at runtime in browser.

#### 2. Split Bill and Merge Bill Controls Hidden for Takeaway

**Test:** On the payment page for a TK-xxx order, verify the TotalsSection area does not show "Split Bill" or "Merge Bill" buttons.

**Expected:** Neither button appears anywhere on the payment screen when paying for a takeaway order.

**Why human:** Conditional render is based on a runtime `getState()` call — cannot evaluate DOM absence from static analysis alone.

#### 3. Dine-in Payment Regression Check

**Test:** Open any occupied dine-in table → navigate to payment page. Verify Split Bill and Merge Bill buttons ARE visible. Complete payment → verify receipt screen appears (not a redirect to /table-map). In KDS, bump a dine-in ticket New→InProgress→Ready → verify floor plan table tile badge updates to Cooking/Ready/Served.

**Expected:** Dine-in path completely unchanged from pre-Phase 18 behavior.

**Why human:** The early-exit takeaway branch in `handleConfirmPayment` must not affect the dine-in code path — requires live browser confirmation.

#### 4. Role Permission Bypass for Takeaway

**Test:** Log in as Waiter. Attempt to Send a takeaway order and Confirm Payment on the payment page.

**Expected:** Both Send to Kitchen button and Confirm Payment button are enabled for Waiter on a takeaway flow (permission bypass active). Waiter should still be blocked from confirming payment on dine-in tables.

**Why human:** Requires role-switching in the live UI to confirm the permission guard conditionals work correctly in both directions.

#### 5. KDS Write-back Visible in Takeaway Tab

**Test:** After confirming payment for TK-001 (status becomes Sent), go to KDS → bump the TK-001 ticket from New→InProgress, then InProgress→Ready. Return to floor plan Takeaway tab after each bump.

**Expected:** Badge updates: after New→InProgress bump — card still shows "Sent to Kitchen". After InProgress→Ready bump — card changes to "Ready" badge with Mark Collected CTA.

**Why human:** Cross-store write-back (KdsTicketCard → queue.store) requires live Zustand state observation in the browser.

---

### Build Status

`npm run build`: PASSED — zero TypeScript errors, all 11 routes compiled successfully. All 9 commits documented in summaries verified present in git log.

---

_Verified: 2026-03-15_
_Verifier: Claude (gsd-verifier)_
