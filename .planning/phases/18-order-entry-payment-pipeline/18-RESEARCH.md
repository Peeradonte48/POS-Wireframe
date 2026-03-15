# Phase 18: Order Entry + Payment Pipeline — Research

**Researched:** 2026-03-15
**Domain:** Zustand cross-store write-back, Next.js App Router conditional routing, payment page state machine
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Payment timing**
- Pay-at-ordering model: staff takes payment immediately after entering the order, before sending to kitchen
- The current `onSend` callback (which advances to `Sent` + navigates to `/table-map`) is REPLACED — for takeaway, `onSend` navigates to `/payment/TK-xxx` instead; queue.store stays in `Taking` until payment completes
- After successful payment, queue.store advances to `Sent` (kitchen gets the ticket) and navigates back to `/table-map` (Takeaway tab)
- No receipt screen for takeaway — payment completion routes directly to `/table-map`, not to the receipt view
- Coupon scan and code entry remain fully available for takeaway customers (no restrictions)
- Split Bill and Merge Bill hidden on the payment page for takeaway orders — these are dine-in concepts tied to table records
- Payment page header shows `TK-001 · Jane Smith` — consistent with order entry page header

**Delivery payment**
- Delivery orders are platform-handled — Grab/LINE MAN collect payment; staff POS never shows a payment screen for DL orders
- No payment route for delivery order IDs
- Delivery lifecycle is advanced entirely via DeliveryCard CTAs (not via payment page)

**KDS write-back scope**
- `orderType` written to KDS tickets in Phase 18: extend `addTicket` signature to accept optional `orderType: 'dine-in' | 'takeaway' | 'delivery'` and `platform?: DeliveryPlatform`; Phase 19 reads this for badges and filter tabs with zero store changes
- Takeaway KDS bump → queue.store: `handleBump` in `KdsTicketCard` checks if `ticket.tableId` is a queue order (`useQueueStore.getState().orders[tableId]`). If takeaway, calls `queue.store.advanceStatus(tableId)` (Sent→Ready on KDS Ready bump). If dine-in, falls through to existing `table.store.orderStage` write. No regression.
- Delivery KDS bump → queue.store: Same pattern — KDS Ready bump also calls `queue.store.advanceStatus` for delivery orders, advancing them to `ReadyForRider` automatically. Staff no longer needs to tap the DeliveryCard CTA for that transition.
- Implementation: parallel write at `KdsTicketCard.handleBump` callsite (not unified into kds.store) — consistent with Phase 16's pattern of writing to external stores from the callsite

**itemsSummary**
- Derived live from order.store when status is `Sent` or beyond: TakeawayCard reads `useOrderStore.getState().orders[orderId]` and computes a human-readable summary (e.g. `"2x Tonkotsu, 1x Karaage"`) — no queue.store write needed
- While status is `Taking` (order not yet sent), show `"No items yet"` as before
- Derive in a utility function or inline computation in TakeawayCard, using `useMemo` with `orders` state selected from order.store

### Claude's Discretion
- Exact itemsSummary formatting (max items to show, truncation strategy for long lists)
- How to detect takeaway vs dine-in on the payment page (isTakeaway flag using `useQueueStore.getState().orders[tableId]?.channel === 'takeaway'` pattern already established in order entry page)
- Exact position of Split/Merge controls hiding (conditional render, not disabled)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 18 scope. KDS visual order-type badges and filter tabs are Phase 19. Combo "pack to go" flag is also Phase 19.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TKWY-02 | Takeaway orders route through the existing order entry flow (menu, modifiers, KDS) | order entry page already has full takeaway context; only `onSend` redirect target changes |
| TKWY-03 | Takeaway orders progress through: Taking → Sent → Ready → Collected | queue.store `advanceStatus` is missing `Sent→Ready`; KDS bump write-back is the mechanism |
| TKWY-04 | Staff can complete payment for a takeaway order using the existing payment flow (cash/QR/card) | payment page conditionally branches on `isTakeaway`; `handleConfirmPayment` gains queue.store side-effect |
| TKWY-05 | Staff can mark a takeaway order as collected | TakeawayCard already has "Mark Collected" CTA for Ready status; no new work needed beyond TKWY-03 being in place |
</phase_requirements>

---

## Summary

Phase 18 is a wiring phase — all the UI screens exist. The work is connecting the dots: changing where `onSend` navigates for takeaway, teaching the payment page to behave differently for takeaway IDs, and adding KDS-to-queue-store write-back so kitchen bumps automatically advance the takeaway lifecycle.

The codebase is in good shape. The order entry page (`/order/[tableId]/page.tsx`) already detects `isTakeaway`, renders the correct header, guards the read-only state, and even calls `onSend`. The payment page (`/payment/[tableId]/page.tsx`) has a complete payment state machine but knows nothing about takeaway yet. `queue.store.advanceStatus` is missing the `Sent→Ready` transition that KDS bump write-back depends on. `kds.store.KdsTicket` and `addTicket` have no `orderType` field yet.

**Primary recommendation:** Four surgical edits across five files: (1) order entry `onSend` redirect, (2) payment page `isTakeaway` branch, (3) queue.store `Sent→Ready` transition, (4) kds.store `KdsTicket` type + `addTicket` signature, (5) `KdsTicketCard.handleBump` write-back logic. Plus one reactive improvement to `TakeawayCard.itemsSummary` derivation.

---

## Standard Stack

### Core (already in project — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand 5 | 5.x | Cross-store write-back, `getState()` non-reactive reads | Established project pattern; `getState()` at callsite avoids circular module imports |
| Next.js 16 App Router | 16.x | `useRouter().push()` for programmatic navigation | Established; no `<Link>` for imperative flows |
| React 19 | 19.x | `useMemo` for safe derived state from store selectors | Required to prevent infinite loop per CLAUDE.md |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure
No new files needed. All edits are in existing files:
```
src/
├── app/(app)/order/[tableId]/page.tsx      # Change onSend target
├── app/(app)/payment/[tableId]/page.tsx    # Add isTakeaway branch
├── stores/queue.store.ts                   # Add Sent→Ready transition
├── stores/kds.store.ts                     # Extend KdsTicket type + addTicket
└── components/
    ├── kds/KdsTicketCard.tsx               # Add queue write-back in handleBump
    └── queue/TakeawayCard.tsx              # Dynamic itemsSummary derivation
```

### Pattern 1: isTakeaway Detection (non-reactive)

**What:** One-time detection of whether a route param is a takeaway ID by reading queue.store state without subscribing.

**When to use:** At component init where the boolean is stable for the lifetime of the page (order and payment pages — the orderId never changes while viewing).

```typescript
// Established in order/[tableId]/page.tsx — replicate identically in payment/[tableId]/page.tsx
const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
```

This is the approved CLAUDE.md pattern for non-reactive store reads. Do NOT use `useQueueStore((s) => Boolean(s.orders[tableId]))` — the boolean never changes mid-page, so the subscription is wasteful.

### Pattern 2: Cross-Store Write-Back at Callsite

**What:** After performing a primary action (KDS bump), write side-effects to a second store using `getState()` — not by coupling stores at module definition time.

**When to use:** Any time one user action must update two stores. Established in Phase 16 for `handleBump` → `table.store.updateTable`.

```typescript
// KdsTicketCard.handleBump — existing pattern
function handleBump() {
  if (bumpBlocked) return
  const currentStage = ticket.stage  // capture BEFORE bump
  bumpTicket(ticket.ticketId)
  // Existing dine-in write-back:
  if (currentStage === 'InProgress') {
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Ready' })
  }
  // Phase 18 addition — parallel queue write-back:
  const queueOrder = useQueueStore.getState().orders[ticket.tableId]
  if (queueOrder && currentStage === 'InProgress') {
    useQueueStore.getState().advanceStatus(ticket.tableId)  // Sent → Ready
  }
}
```

Key insight: the `if (queueOrder)` guard means dine-in tables (not in queue.store) fall through untouched — zero regression risk.

### Pattern 3: useMemo with Raw Store State for Derived Values

**What:** Select raw primitive store state, compute derived values in `useMemo`. Never call derived-list functions inside Zustand selectors.

**When to use:** Always, for any computation over store data that returns a new reference (arrays, objects, strings computed from arrays).

```typescript
// TakeawayCard — itemsSummary derivation
const orderData = useOrderStore((s) => s.orders[order.orderId])
const itemsSummary = useMemo(() => {
  if (!orderData || order.status === 'Taking') return 'No items yet'
  const items = orderData.rounds
    .flatMap((r) => r.items)
    .filter((i) => i.status !== 'voided')
  if (items.length === 0) return 'No items yet'
  // Group by menuItemId, sum quantities
  const grouped = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.menuItemId] = (acc[item.menuItemId] ?? 0) + item.quantity
    return acc
  }, {})
  const MENU_ITEM_LABELS: Record<string, string> = /* from MENU_ITEMS */
  const parts = Object.entries(grouped)
    .map(([id, qty]) => `${qty}x ${MENU_ITEM_LABELS[id] ?? id}`)
  const MAX_ITEMS = 3
  if (parts.length <= MAX_ITEMS) return parts.join(', ')
  return `${parts.slice(0, MAX_ITEMS).join(', ')} +${parts.length - MAX_ITEMS} more`
}, [orderData, order.status])
```

### Pattern 4: Conditional Payment Page Branch

**What:** Single payment route handles both dine-in and takeaway via conditional logic, not separate routes. This was the locked decision from the research-phase open question documented in STATE.md.

**When to use:** When the payment flow is structurally identical (same cash/QR/card panels, same coupon scan) but post-confirmation routing and some UI elements differ.

```typescript
// payment/[tableId]/page.tsx — additions
const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
const queueCustomerName = isTakeaway
  ? useQueueStore.getState().orders[tableId]?.customerName
  : undefined

// Header label override
const headerLabel = isTakeaway
  ? `${tableId} · ${queueCustomerName ?? ''}`
  : `Table ${tableId} — Bill`

// handleConfirmPayment — takeaway branch
function handleConfirmPayment() {
  if (!paymentMethod) return
  if (isTakeaway) {
    // Advance queue status Taking→Sent (payment gates the send)
    useQueueStore.getState().advanceStatus(tableId)
    // Add KDS ticket now (payment confirmed = order goes to kitchen)
    useKdsStore.getState().addTicket(tableId, tableId, 'takeaway')
    toast.success('Payment confirmed')
    router.push('/table-map')
    return
  }
  // Existing dine-in path unchanged below
  const { markCleaning, updateTable } = useTableStore.getState()
  markCleaning(tableId)
  // ... rest of existing dine-in logic
}
```

### Anti-Patterns to Avoid

- **Calling `advanceStatus` inside a Zustand selector:** Never `useQueueStore((s) => s.advanceStatus(id))` — this executes on every render. Use `useQueueStore.getState().advanceStatus(id)` at the callsite.
- **Putting receipt screen in the takeaway path:** The locked decision skips receipt for takeaway. Don't call `setViewState('receipt')` in the takeaway branch of `handleConfirmPayment`.
- **Adding `Sent→Ready` as a named action:** The `advanceStatus` declarative-map pattern is the established contract — just add the entry to `transitions`.
- **Sending KDS ticket from `onSend` in order entry for takeaway:** For takeaway, `onSend` only navigates to `/payment/TK-xxx`. The KDS `addTicket` call happens in `handleConfirmPayment` (after payment succeeds), not at order send time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| itemsSummary truncation | Custom state machine | `useMemo` with array slice + `+N more` | Trivially simple; state machine is over-engineering |
| takeaway vs dine-in routing | New route `/payment/takeaway/[id]` | Conditional branch in existing `/payment/[tableId]` | Same payment UI; branch is < 20 lines; new route doubles maintenance surface |
| queue status advancement | Direct `set()` calls in components | `queue.store.advanceStatus(id)` | Declarative map in store enforces valid transitions, prevents invalid skips |

---

## Common Pitfalls

### Pitfall 1: Sending KDS ticket at wrong moment
**What goes wrong:** If `addTicket` is called from `onSend` in order entry (before payment), the kitchen starts cooking before payment is confirmed. Customer could cancel mid-payment and kitchen has already started.
**Why it happens:** Natural instinct — `sendRound` is called in `handleSend`, so the KDS ticket should also fire there.
**How to avoid:** For takeaway, `addTicket` must fire in `handleConfirmPayment` on the payment page, not in `onSend`. The `onSend` for takeaway only calls `sendRound` (locks item statuses to 'sent') and navigates to `/payment/TK-xxx`. Queue status stays `Taking` until payment is confirmed.
**Warning signs:** TakeawayCard shows `Sent to Kitchen` badge before payment screen is even opened.

### Pitfall 2: Missing `Sent→Ready` transition in queue.store
**What goes wrong:** KDS bump write-back calls `advanceStatus(tableId)` when stage is `InProgress`, but the transitions map in `advanceStatus` has no `Sent: 'Ready'` entry. The call is a no-op. TakeawayCard never shows "Ready" status. "Mark Collected" button never appears.
**Why it happens:** The transitions map was built before KDS write-back was designed. The gap was explicitly noted in CONTEXT.md.
**How to avoid:** Add `Sent: 'Ready'` to the transitions partial record in `queue.store.ts` `advanceStatus`. Verify by checking the complete transitions map has: `Taking→Sent` (takeaway payment confirm), `Sent→Ready` (KDS InProgress bump), `Ready→Collected` (Mark Collected CTA).
**Warning signs:** Queue status stuck on `Sent` after bumping a KDS ticket to Ready.

### Pitfall 3: dine-in regression in KdsTicketCard
**What goes wrong:** Adding `useQueueStore.getState().advanceStatus(ticket.tableId)` without the `if (queueOrder)` guard causes it to attempt an advanceStatus on dine-in table IDs (e.g. "T1"). queue.store.advanceStatus guards on `if (!order) return` so it's a no-op — but the call still happens on every dine-in bump unnecessarily.
**Why it happens:** Copy-paste without the null guard.
**How to avoid:** Always gate the queue write-back: `const queueOrder = useQueueStore.getState().orders[ticket.tableId]; if (queueOrder) { ... }`.
**Warning signs:** No behavioral regression but linting/review flags the unconditional call.

### Pitfall 4: Receipt screen shown for takeaway
**What goes wrong:** The existing `handleConfirmPayment` for dine-in calls `setViewState('receipt')` and `setReceiptData(...)`. If the takeaway branch doesn't return early, it falls through and shows the receipt screen before navigating to `/table-map`.
**Why it happens:** The takeaway branch must `return` immediately after `router.push('/table-map')`.
**How to avoid:** The takeaway branch in `handleConfirmPayment` must be a complete early-exit: advance queue status, add KDS ticket, toast, `router.push('/table-map')`, `return`. No `setReceiptData`, no `setViewState`.
**Warning signs:** A flash of the receipt screen before the table map renders.

### Pitfall 5: Split/Merge visibility — conditional render vs disabled
**What goes wrong:** Using `disabled` prop on Split Bill / Merge Bill controls for takeaway rather than conditional render. CLAUDE.md `bill.store` warning: `getMergedSecondaries` as a selector causes infinite loops. The MergeSheet auto-open `useEffect` runs regardless of `isTakeaway`.
**Why it happens:** Disabling looks like the quick fix.
**How to avoid:** Wrap both `SplitSheet` and `MergeSheet` render blocks and the `onSplitBill`/`onMergeBill` props in `!isTakeaway` conditional renders. The `setSplitSheetOpen` auto-open `useEffect` should also be guarded by `!isTakeaway`.
**Warning signs:** Split sheet auto-opens on payment page for TK-001 (empty split state triggers auto-open).

### Pitfall 6: KdsBoard auto-register fires for takeaway tickets before payment
**What goes wrong:** `KdsBoard.tsx` auto-registers KDS tickets for any `tableId` that has sent rounds in order.store. If `sendRound` is called in order entry (which marks items 'sent'), the board auto-registers TK-001 before payment is confirmed — bypassing the pay-at-ordering model.
**Why it happens:** `KdsBoard`'s `useEffect` watches `allOrders` and fires `addTicket` for any sent round, not just dine-in tables.
**How to avoid:** In `handleConfirmPayment` on the payment page (takeaway branch), call `addTicket` explicitly. In `KdsBoard.useEffect`, add a guard: skip auto-registration if `ticket.tableId` is already in queue.store (i.e., `useQueueStore.getState().orders[order.tableId]` exists). The manual explicit `addTicket` in the payment confirmation is the single source of truth for takeaway.
**Warning signs:** Kitchen sees TK-001 ticket before cashier has confirmed payment.

---

## Code Examples

### queue.store.ts — add Sent→Ready transition
```typescript
// Source: existing advanceStatus in src/stores/queue.store.ts, line 111
const transitions: Partial<Record<QueueOrderStatus, QueueOrderStatus>> = {
  // Delivery transitions
  Confirmed: 'Preparing',
  Preparing: 'ReadyForRider',
  ReadyForRider: 'PickedUp',
  // Takeaway transitions
  Taking: 'Sent',
  Sent: 'Ready',      // ← ADD THIS (was missing — needed for KDS bump write-back)
  Ready: 'Collected',
}
```

### kds.store.ts — extend KdsTicket type and addTicket signature
```typescript
// Extend KdsTicket interface
export interface KdsTicket {
  ticketId: string
  tableId: string
  tableLabel: string
  addedAt: number
  stage: KdsStage
  checkedItems: Set<string>
  orderType?: 'dine-in' | 'takeaway' | 'delivery'   // ← ADD (optional; Phase 19 reads)
  platform?: 'grab' | 'lineman'                      // ← ADD (optional; delivery only)
}

// Extend addTicket signature
addTicket: (tableId: string, tableLabel: string, orderType?: 'dine-in' | 'takeaway' | 'delivery', platform?: 'grab' | 'lineman') => void
```

### KdsTicketCard.handleBump — add queue write-back
```typescript
// Source: src/components/kds/KdsTicketCard.tsx, handleBump function
function handleBump() {
  if (bumpBlocked) return
  const currentStage = ticket.stage  // capture BEFORE bump
  bumpTicket(ticket.ticketId)

  // Existing dine-in write-back (unchanged)
  if (currentStage === 'New') {
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Cooking' })
  } else if (currentStage === 'InProgress') {
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Ready' })
  } else if (currentStage === 'Ready') {
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Served' })
  }

  // Phase 18: parallel queue write-back for non-dine-in orders
  const queueOrder = useQueueStore.getState().orders[ticket.tableId]
  if (queueOrder && currentStage === 'InProgress') {
    // Sent→Ready for takeaway; Preparing→ReadyForRider for delivery
    useQueueStore.getState().advanceStatus(ticket.tableId)
  }
}
```

### payment/[tableId]/page.tsx — isTakeaway detection and header
```typescript
// At top of PaymentPage component, alongside existing store reads
const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
const queueOrder = isTakeaway ? useQueueStore.getState().orders[tableId] : undefined

// Header label (replaces hardcoded "Table {tableId} — Bill")
const headerLabel = isTakeaway
  ? `${tableId} · ${queueOrder?.customerName ?? ''}`
  : `Table ${tableId} — Bill`
```

### payment/[tableId]/page.tsx — handleConfirmPayment takeaway branch
```typescript
function handleConfirmPayment() {
  if (!paymentMethod) return

  if (isTakeaway) {
    // Advance queue: Taking → Sent (payment gates the send to kitchen)
    useQueueStore.getState().advanceStatus(tableId)
    // Now register KDS ticket (order goes to kitchen after payment confirmed)
    useKdsStore.getState().addTicket(tableId, tableId, 'takeaway')
    toast.success('Payment confirmed')
    router.push('/table-map')
    return  // Early exit — no receipt screen for takeaway
  }

  // Existing dine-in path — unchanged
  const { markCleaning, updateTable } = useTableStore.getState()
  markCleaning(tableId)
  mergedSecondaryIds.forEach((id) => markCleaning(id))
  dissolveAll(tableId)
  updateTable(tableId, { orderStage: 'Billed' })
  updateTable(tableId, { paidAmount: grandTotal, paymentMethod, discountApplied: discountAmount })
  toast.success('Payment confirmed')
  setReceiptData({ grandTotal, paymentMethod, paidAt: new Date() })
  setViewState('receipt')
}
```

### order/[tableId]/page.tsx — change onSend for takeaway
```typescript
// Current (line 174-177): advances queue + navigates to /table-map
// Change to: navigate to payment page; queue stays in Taking until payment
onSend={isTakeaway ? () => {
  router.push(`/payment/${tableId}`)  // ← CHANGED: was advanceStatus(tableId) + router.push('/table-map')
} : undefined}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| onSend advances queue directly to Sent | onSend navigates to payment; payment confirms advance to Sent | Phase 18 | Pay-at-ordering model; kitchen never gets ticket before payment |
| addTicket from KdsBoard auto-register only | addTicket from payment page for takeaway; KdsBoard skips queue orders | Phase 18 | Correct ordering: KDS ticket created only after payment confirmed |
| queue.store transitions: Taking→Sent, Ready→Collected | + Sent→Ready added | Phase 18 | Enables KDS bump to drive lifecycle automatically |
| KdsTicket has no orderType | KdsTicket.orderType?: 'dine-in' \| 'takeaway' \| 'delivery' | Phase 18 | Phase 19 can add badges/filters with zero store changes |

---

## Open Questions

1. **KdsBoard auto-register guard scope**
   - What we know: `KdsBoard.useEffect` auto-registers any tableId with sent rounds. For takeaway, we want KDS registration to happen only after payment (from the payment page), not from KdsBoard.
   - What's unclear: The exact guard condition. Option A: check `useQueueStore.getState().orders[order.tableId]` in the KdsBoard effect. Option B: queue status check (`status !== 'Taking'` means payment already happened, auto-register is safe).
   - Recommendation: Option A is cleaner — if the tableId is in queue.store at all (Taking or any status), skip auto-register from KdsBoard. The explicit `addTicket` in `handleConfirmPayment` is the authoritative registration for all queue orders.

2. **Delivery KDS bump depth**
   - What we know: STATE.md documents this as an open concern: "One post-Ready bump (Ready → PickedUp, removes from board) or two (Ready → ReadyForRider → PickedUp)?"
   - What's clarified in CONTEXT.md: KDS InProgress bump calls `advanceStatus` → `Preparing→ReadyForRider`. The Ready→PickedUp bump is outside Phase 18 scope (delivery lifecycle is driven by DeliveryCard CTAs). The KDS ticket removes from board on the Ready→done bump regardless.
   - Recommendation: For Phase 18, only wire the `InProgress` bump write-back (`Preparing→ReadyForRider`). The Ready→done bump on KDS already removes the ticket from board — that is sufficient. DeliveryCard CTA handles PickedUp.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured — `npm run build` (TypeScript) is the validation mechanism per CLAUDE.md |
| Config file | N/A |
| Quick run command | `npm run build` |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TKWY-02 | onSend navigates to `/payment/TK-xxx` instead of `/table-map` | manual smoke | `npm run build` (type-checks props) | N/A — no test files |
| TKWY-03 | `Sent→Ready` transition fires on KDS InProgress bump | manual smoke | `npm run build` | N/A |
| TKWY-04 | Payment page shows TK-001 header, hides Split/Merge, routes back to Takeaway tab | manual smoke | `npm run build` | N/A |
| TKWY-05 | "Mark Collected" CTA visible and functional when status is Ready | manual smoke | `npm run build` | N/A |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run build && npm run lint` green before `/gsd:verify-work`

### Wave 0 Gaps
None — no test framework is configured in this project. `npm run build` (TypeScript strict mode) is the validation gate. All behavioral verification is manual smoke testing.

---

## Sources

### Primary (HIGH confidence)
- Direct source code reads: `src/app/(app)/order/[tableId]/page.tsx` — complete takeaway context implementation
- Direct source code reads: `src/app/(app)/payment/[tableId]/page.tsx` — full payment page (328 lines)
- Direct source code reads: `src/stores/queue.store.ts` — transitions map, advanceStatus implementation
- Direct source code reads: `src/stores/kds.store.ts` — KdsTicket type, addTicket signature
- Direct source code reads: `src/components/kds/KdsTicketCard.tsx` — handleBump, existing write-back pattern
- Direct source code reads: `src/components/kds/KdsBoard.tsx` — auto-register useEffect
- Direct source code reads: `src/components/order/TicketPanel.tsx` — onSend/hideSend props, handleSend flow
- Direct source code reads: `src/components/queue/TakeawayCard.tsx` — Mark Collected CTA, itemsSummary field
- `.planning/phases/18-order-entry-payment-pipeline/18-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md` — TKWY-02 through TKWY-05
- `.planning/STATE.md` — accumulated architecture decisions, open blockers

### Secondary (MEDIUM confidence)
- CLAUDE.md project instructions — Zustand selector safety rules, shadow token patterns, getState() non-reactive pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code read directly from source; no external research needed
- Architecture: HIGH — patterns verified in existing code; CONTEXT.md decisions are locked
- Pitfalls: HIGH — derived from direct code inspection of integration points (gaps are explicit and verifiable)

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable internal codebase; no external dependency changes)
