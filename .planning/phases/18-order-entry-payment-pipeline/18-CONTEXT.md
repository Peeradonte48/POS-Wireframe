# Phase 18: Order Entry + Payment Pipeline — Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire takeaway and delivery orders through the existing order entry and payment screens. Takeaway orders use a pay-at-ordering model where payment happens before the order is sent to kitchen. Delivery payment is platform-handled — no payment UI for delivery orders. KDS bump writes back to queue.store so kitchen status drives the takeaway/delivery lifecycle automatically. Phase 19 adds KDS visual badges and filters; Phase 18 writes the orderType field that Phase 19 reads.

**Note:** Significant informal work already landed: order entry page has full takeaway context (header, read-only guard, onSend callback, EditCustomerModal, ConfirmCancelDialog). The remaining Phase 18 work is the payment pipeline and KDS write-back wiring.

</domain>

<decisions>
## Implementation Decisions

### Payment timing
- **Pay-at-ordering model**: Staff takes payment immediately after entering the order, before sending to kitchen
- The current `onSend` callback (which advances to `Sent` + navigates to `/table-map`) is **replaced** — for takeaway, `onSend` navigates to `/payment/TK-xxx` instead; queue.store stays in `Taking` until payment completes
- After successful payment, queue.store advances to `Sent` (kitchen gets the ticket) and navigates back to `/table-map` (Takeaway tab)
- **No receipt screen** for takeaway — payment completion routes directly to `/table-map`, not to the receipt view
- Coupon scan and code entry remain fully available for takeaway customers (no restrictions)
- **Split Bill and Merge Bill hidden** on the payment page for takeaway orders — these are dine-in concepts tied to table records
- Payment page header shows `TK-001 · Jane Smith` — consistent with order entry page header

### Delivery payment
- **Delivery orders are platform-handled** — Grab/LINE MAN collect payment; staff POS never shows a payment screen for DL orders
- No payment route for delivery order IDs
- Delivery lifecycle is advanced entirely via DeliveryCard CTAs (not via payment page)

### KDS write-back scope
- **orderType written to KDS tickets in Phase 18**: extend `addTicket` signature to accept optional `orderType: 'dine-in' | 'takeaway' | 'delivery'` and `platform?: DeliveryPlatform`; Phase 19 reads this for badges and filter tabs with zero store changes
- **Takeaway KDS bump → queue.store**: `handleBump` in `KdsTicketCard` checks if `ticket.tableId` is a queue order (`useQueueStore.getState().orders[tableId]`). If takeaway, calls `queue.store.advanceStatus(tableId)` (Sent→Ready on KDS Ready bump). If dine-in, falls through to existing `table.store.orderStage` write. No regression.
- **Delivery KDS bump → queue.store**: Same pattern — KDS Ready bump also calls `queue.store.advanceStatus` for delivery orders, advancing them to `ReadyForRider` automatically. Staff no longer needs to tap the DeliveryCard CTA for that transition.
- Implementation: parallel write at `KdsTicketCard.handleBump` callsite (not unified into kds.store) — consistent with Phase 16's pattern of writing to external stores from the callsite

### itemsSummary
- **Derived live from order.store** when status is `Sent` or beyond: TakeawayCard reads `useOrderStore.getState().orders[orderId]` and computes a human-readable summary (e.g. `"2x Tonkotsu, 1x Karaage"`) — no queue.store write needed
- While status is `Taking` (order not yet sent), show `"No items yet"` as before
- Derive in a utility function or inline computation in TakeawayCard, using `useMemo` with `orders` state selected from order.store

### Claude's Discretion
- Exact itemsSummary formatting (max items to show, truncation strategy for long lists)
- How to detect takeaway vs dine-in on the payment page (isTakeaway flag using `useQueueStore.getState().orders[tableId]?.channel === 'takeaway'` pattern already established in order entry page)
- Exact position of Split/Merge controls hiding (conditional render, not disabled)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(app)/order/[tableId]/page.tsx`: Full takeaway context already wired — `isTakeaway`, `queueStatus`, header, read-only guard, `EditCustomerModal`, `ConfirmCancelDialog`. Only change needed: redirect `onSend` to `/payment/${tableId}` instead of advancing to Sent + `/table-map`
- `src/app/(app)/payment/[tableId]/page.tsx`: Existing payment page (328 lines) handles dine-in fully. Needs: isTakeaway detection, header override, Split/Merge hide, payment completion callback to `queue.store.advanceStatus(tableId)` + `router.push('/table-map')`
- `src/components/queue/TakeawayCard.tsx`: Already has "Mark Collected" for Ready status. itemsSummary section needs dynamic derive logic
- `src/components/kds/KdsTicketCard.tsx` (or equivalent): `handleBump` at line where `table.store.orderStage` is written — add parallel queue.store write-back check here
- `src/stores/queue.store.ts`: `advanceStatus` transitions map includes `Taking→Sent` and `Ready→Collected`. Need `Sent→Ready` added (currently missing) for KDS bump write-back
- `src/stores/kds.store.ts`: `addTicket(tableId, tableLabel)` — extend to accept `orderType` + `platform` optional fields; store them on `KdsTicket` type

### Established Patterns
- `isTakeaway` detection: `Boolean(useQueueStore.getState().orders[tableId])` — non-reactive read, established in order entry page
- Parallel queue.store write-back from callsite (not store-to-store): follows Phase 16 `KdsTicketCard.handleBump` → `table.store.orderStage` pattern
- `useMemo` with raw store state for derived values (CLAUDE.md Zustand selector safety)
- Shadow tokens via inline style; no raw Tailwind palette classes

### Integration Points
- Payment page: `handleConfirmPayment` — add `queue.store.advanceStatus(tableId)` before `router.push('/table-map')` for takeaway orders
- `KdsTicketCard.handleBump`: add channel check + `queue.store.advanceStatus` for queue orders (after existing `table.store` write)
- `queue.store.advanceStatus` transitions map: add `Sent: 'Ready'` entry (currently only `Taking→Sent` and `Ready→Collected` for takeaway)
- `kds.store.addTicket`: extend signature; `KdsBoard.tsx` auto-register useEffect passes `orderType:'dine-in'`

</code_context>

<specifics>
## Specific Ideas

- Payment page header pattern: same as order entry — `isTakeaway ? \`${tableId} · ${queueCustomerName}\` : table?.label`
- itemsSummary derivation: derive in TakeawayCard by selecting `useOrderStore((s) => s.orders[orderId])`, compute summary string in `useMemo`. Cap at 3 items with `+N more` for long orders.
- queue.store `Sent→Ready` gap: the advanceStatus transitions map is missing this entry — it needs to be added for KDS bump write-back to work

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 18 scope. KDS visual order-type badges and filter tabs are Phase 19. Combo "pack to go" flag is also Phase 19.

</deferred>

---

*Phase: 18-order-entry-payment-pipeline*
*Context gathered: 2026-03-15*
