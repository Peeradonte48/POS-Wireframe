# Domain Pitfalls: Adding Delivery and Takeaway to an Existing Dine-In POS

**Domain:** Adding delivery/takeaway order types to an existing table-centric restaurant POS wireframe
**Researched:** 2026-03-15
**Confidence:** HIGH (based on direct codebase analysis of all six stores + CLAUDE.md architecture documentation + industry pattern analysis)

---

## Critical Pitfalls

Mistakes that cause rewrites, state corruption, or broken flows across the existing system.

---

### Pitfall 1: Forcing delivery/takeaway into table.store — corrupts the dine-in floor plan

**What goes wrong:** The easiest path is to add delivery orders as pseudo-tables in `table.store` — create a fake table record like `{ id: 'delivery-001', label: 'Delivery #1', status: 'Occupied', ... }`. This immediately contaminates the floor plan: fake "tables" appear on the floor map, `INITIAL_TABLES` must be patched, and every component that renders a table list (floor plan grid, manager open tickets, merge bill picker) now has to filter out non-dine-in records.

**Why it happens:** `order.store` is already keyed by `tableId: string` — delivery orders need an order too, so the path of least resistance is to give them a fake table ID. The `table.store` actions (`openTable`, `markCleaning`, `markClean`) already represent the lifecycle a takeaway order needs.

**Consequences:**
- Floor plan renders delivery orders as floor tiles with occupancy status
- `guestCount`, `openedAt`, `waiterId`, `servedAt`, `paidAmount` fields on `TableRecord` are semantically wrong for delivery (no guests, no table dwell time)
- `isMergedSecondary` in `bill.store` iterates all table keys — fake table IDs will appear as merge candidates
- `INITIAL_TABLES` mock data becomes untrustworthy because some "tables" are synthetic delivery orders
- Manager EOD and open tickets views show delivery orders as floor tables, breaking the presentation narrative

**Prevention:**
- Introduce a separate `DeliveryOrder` / `TakeawayOrder` type that is **not** a `TableRecord`. Do not store them in `table.store`.
- Create a dedicated `queue.store` (or `offPremiseOrder.store`) for delivery/takeaway orders. Key: `orderId` (not `tableId`). Fields match the new domain: `customerName`, `customerPhone`, `orderNumber`, `estimatedPickupAt`, `riderName`, `riderPhone`, `status: DeliveryStatus`.
- Keep `order.store` orders keyed by a generic `entityId` that can be either a `tableId` (dine-in) or a `deliveryOrderId` / `takeawayOrderId`. The key is: `table.store` stays clean — it only tracks physical tables.

**Detection:** If any store action or component must filter records with `id.startsWith('delivery-')`, delivery has leaked into the wrong store.

**Phase:** Data model phase — must be decided before any UI work for delivery/takeaway.

---

### Pitfall 2: Delivery order lifecycle is not a subset of the dine-in table lifecycle

**What goes wrong:** The existing `TableStatus` type (`Open | Occupied | Reserved | CheckRequested | Cleaning`) and `OrderStage` type (`Ordered | Cooking | Ready | Served | Billed`) map to the physical table lifecycle. Delivery and takeaway orders have a fundamentally different lifecycle:

```
Delivery:   Pending (accept/reject) → Accepted → Cooking → Ready → Rider Dispatched → Delivered
Takeaway:   Received → Cooking → Ready for Collection → Collected → Paid
```

Reusing `TableStatus` and `OrderStage` for these flows requires squeezing delivery concepts into ill-fitting states — "Reserved" means "order accepted," "Cleaning" means "rider dispatched." Every engineer reading the code later (and every stakeholder seeing stage labels) will be confused.

**Why it happens:** Reusing existing enums is faster than defining new ones. The v1.2 `OrderStage` already had `Billed` added specifically for payment tracking — it is tempting to just append `ReadyForRider` to this enum.

**Consequences:**
- KDS ticket stage labels (`New | InProgress | Ready`) have no concept of "ready for rider vs. ready for dine-in service" — bumping past Ready removes the ticket, but delivery needs a "Ready, awaiting rider" holding state
- `TableRecord.orderStage` drives the table tile badge UI — reusing it for delivery orders either requires branching logic in the badge renderer or leaves delivery orders without stage badges
- `markCleaning` and `markClean` semantics ("table is dirty, being cleaned") are nonsensical for a delivery order that was just picked up

**Prevention:**
- Define `DeliveryStatus` as its own type: `'Pending' | 'Accepted' | 'Rejected' | 'Cooking' | 'ReadyForRider' | 'RiderDispatched' | 'Delivered'`
- Define `TakeawayStatus` as its own type: `'Received' | 'Cooking' | 'ReadyForCollection' | 'Collected' | 'Paid'`
- These types live on the new `queue.store` records, completely separate from `TableStatus` and `OrderStage`
- The KDS must gain a `orderType: 'DineIn' | 'Takeaway' | 'Delivery'` field on `KdsTicket` to support different post-Ready behavior (bump = remove for dine-in; bump = ReadyForRider for delivery)

**Detection:** If you find yourself adding `ReadyForRider` to the existing `OrderStage` enum, stop and define a separate type instead.

**Phase:** Data model phase. Lifecycle definitions must be settled before KDS and queue UI.

---

### Pitfall 3: KDS bump behavior diverges by order type — single bumpTicket action is no longer correct

**What goes wrong:** Current `bumpTicket` in `kds.store` has a hard-coded 3-stage progression: `New → InProgress → Ready → [removed from board]`. When a dine-in ticket reaches Ready and is bumped, it disappears (the waiter serves it, table gets `markServed`). For a delivery order, bumping past Ready should NOT remove the ticket — it should transition to `ReadyForRider` and stay visible on the KDS until the rider confirms pickup.

**Why it happens:** `bumpTicket` was designed for a single order type. The final bump (removing the ticket) is correct behavior for dine-in but wrong for delivery.

**Consequences:**
- Kitchen bumps a delivery ticket past Ready, ticket disappears from KDS board, rider arrives and kitchen has no record of the order
- `orderStage` write-back to `table.store` (added in v1.2) would need to be skipped for delivery tickets — but `bumpTicket` currently always fires the write-back
- If `bumpTicket` is patched with `if (orderType === 'delivery')` conditionals, the function accumulates branching logic that breaks future order type additions

**Prevention:**
- Add `orderType: 'DineIn' | 'Takeaway' | 'Delivery'` to `KdsTicket` (already required for Pitfall 2 fix)
- Extract bump state machines per order type. Simplest approach: a `getNextStage(current: KdsStage, orderType: OrderType)` pure function that returns the next stage and whether to remove the ticket. The `bumpTicket` action calls this function.
- For delivery: `Ready → ReadyForRider → [removed]` (two more bumps; last one after rider confirms pickup)
- For takeaway: `Ready → ReadyForCollection → [removed]` (waiter calls number, customer collects)
- The KDS card UI uses `orderType` to render a different label on the bump button: "Mark Ready" vs. "Rider Ready" vs. "Collected"

**Detection:** If `bumpTicket` contains `if/else` branches checking `ticket.tableId.startsWith('delivery')`, the architecture is wrong.

**Phase:** KDS phase. Must be implemented alongside the new `orderType` field on tickets.

---

### Pitfall 4: Floor plan "tabs" — delivery queue mixed with table grid causes navigation confusion

**What goes wrong:** Adding delivery/takeaway as a tab on the floor plan page (`/floor`) is the obvious UI pattern. But the floor plan component currently renders `Object.values(tables)` as a responsive grid of `TableTile` components. If delivery orders are tabs within the same route, the entire floor plan page state (selected table, open dialog, filter state) must either be shared or duplicated — creating a UI where clicking a delivery order tab accidentally clears a selected dine-in table.

A worse anti-pattern: rendering delivery orders as a second grid of "tiles" on the same page using the same `TableTile` component. `TableTile` renders `table.status`, `table.guestCount`, `table.orderStage` — fields that do not exist on delivery orders. Feeding it a `DeliveryOrder` as if it were a `TableRecord` requires type-casting or optional fields everywhere.

**Why it happens:** Tab navigation feels natural in UI design. Reusing `TableTile` avoids building a new component. Both paths are shortcuts that create structural damage.

**Consequences:**
- `TableTile` receives `undefined` for `guestCount`, `orderStage`, `openedAt` — renders blank or crashes
- Floor plan page `useState` tracking selected table ID (`selectedTableId`) becomes ambiguous — is it a table ID or a delivery order ID?
- Sidebar badge counts (occupied tables, open orders) will be wrong if they count delivery orders alongside dine-in tables
- Mobile layout: a full-page floor plan grid plus a delivery queue does not fit on a tablet in service without tabs — but tab state must be managed carefully to avoid layout thrash

**Prevention:**
- Implement tabs as top-level navigation within the floor plan view, but maintain **separate state** for each tab. The delivery queue tab has its own selected-order state, its own list rendering, its own action sheet. No shared `selectedTableId` across tabs.
- Build a `DeliveryQueueCard` component (not `TableTile`). It takes `DeliveryOrder` props and renders: order number, customer name, delivery status badge, elapsed time, action button (Accept / Reject / Mark Ready). Do not make `TableTile` accept optional delivery fields.
- Route: keep everything at `/floor` with `?tab=dine-in` and `?tab=delivery` query params. Tabs do not change the route, so the layout does not re-mount.

**Detection:** If `TableTile` gains an optional `isDelivery?: boolean` prop, you are using the wrong component for delivery orders.

**Phase:** Floor plan tab phase. Component boundary decisions must be made before building the queue UI.

---

### Pitfall 5: bill.store split and merge logic assumes tableId — delivery orders break both

**What goes wrong:** `bill.store` has `splits: Record<tableId, BillSplit>` and `merges: Record<secondaryTableId, primaryTableId>`. Both are keyed by `tableId`. Delivery and takeaway orders do not have a `tableId` — they have an `orderId`. If delivery orders participate in the split/merge system (even just for payment), accessing `splits['delivery-001']` works coincidentally (JavaScript allows any string key) but leaves the `merges` map with delivery IDs that could match against real table IDs if naming collides.

More importantly: delivery orders do not need split bill or merge functionality. But the payment path for delivery must still record payment somewhere — or it must bypass `bill.store` entirely, requiring a second payment recording mechanism.

**Why it happens:** `bill.store.recordPayment` is currently the only store-level mechanism for persisting payment records. Delivery payment naturally reaches for the same mechanism.

**Consequences:**
- `isMergedSecondary('delivery-001')` returns `false` correctly, but `getMergedSecondaries` iterates all keys — delivery IDs could appear in merge candidate lists
- `initPerSeatSplit` calls `useTableStore.getState().tables[tableId]?.guestCount` — for a delivery order ID, this returns `undefined`, silently setting `seatCount` to whatever fallback is passed
- If a delivery order ID collides with a real table ID string (e.g., both use `'T5'`), `splits['T5']` is ambiguous

**Prevention:**
- Delivery payment is a single-payer, single-total flow. Do not route delivery payments through `bill.store`. Record payment directly on the `DeliveryOrder` record in `queue.store` as a `paymentRecord: { method, paidAt, amount }` field.
- `bill.store` remains exclusively for table-based dine-in split/merge. Its key domain remains `tableId`.
- Payment utilities (VAT calculation, `calculateBill(items)`) should live in a shared utility function, not inside `bill.store` — both delivery and dine-in payment pages call the same utility without sharing store state.

**Detection:** If `bill.store` actions accept delivery order IDs as `tableId`, payment concerns have leaked into the wrong store.

**Phase:** Payment flow phase for delivery. Keep stores separate; share only utility functions.

---

### Pitfall 6: Delivery "accept/reject" simulation requires a new concept — the pending queue

**What goes wrong:** The existing POS flow has no concept of a queue of incoming orders awaiting staff decision. All orders are staff-initiated (staff opens a table, staff enters items). Delivery orders arrive externally (simulated in this wireframe) and must be accepted or rejected before cooking starts. This requires a UI pattern the app does not have: a notification/inbox area for pending orders, plus a time-sensitive decision (reject after N minutes of no response).

Bolting this onto the floor plan tab as a passive list is the most common mistake. If a delivery order arrives while the staff is on the dine-in tab, there is no visual alert. The order expires silently.

**Why it happens:** The wireframe has no real-time event system (no websockets, no server-sent events). Simulating "incoming delivery order" requires polling, interval-triggered fake arrivals, or a manual "simulate new order" button. The reject-timeout behavior has to be faked.

**Consequences:**
- New delivery orders are invisible if staff is on the dine-in tab
- Simulated order arrivals conflict with demo mode in `kds.store` — both are injecting fake data
- If the delivery tab badge count is not rendered in the sidebar, staff never sees pending orders
- Order numbers for delivery (`#0042`, `#0043`) have no generation mechanism in the existing codebase — no order counter exists

**Prevention:**
- Add a sidebar badge to the delivery queue nav item that shows pending count (unaccepted orders). This requires `queue.store` to be subscribed to from the sidebar, similar to how table occupancy drives existing sidebar state.
- Simulate new delivery arrivals with a manual "New Order" button in the delivery queue tab. Do not auto-inject on a timer (creates unpredictable demo behavior and conflicts with kds `demoActive` mode).
- Add a sequential `orderNumber` counter to `queue.store`: `nextOrderNumber: number`, incremented on each new delivery/takeaway order. This gives human-readable order numbers (#0001, #0002).
- Pending orders should be visually distinct (pulsing border, different background) compared to accepted orders in the queue list.

**Detection:** If the delivery queue has no sidebar badge and no visual differentiation between pending and accepted orders, incoming orders will be missed during demos.

**Phase:** Delivery queue phase. Pending queue badge must be in the sidebar from day one.

---

### Pitfall 7: Takeaway order "name/number" field is not the same as guestCount — do not reuse guestCount

**What goes wrong:** Takeaway orders are identified by a customer name and/or pickup number. The existing `TableRecord` has `guestCount: number | null`. It is tempting to store the takeaway order number in `guestCount` (it is a number after all) and the customer name in `waiterName` or `note`. This produces readable UI output by accident but corrupts the semantics of both fields.

**Why it happens:** `note: string | null` is already on `TableRecord` and is used for free-form table notes. Storing `"Peeradonte - 1 person"` in `note` works for display but makes it impossible to filter by customer name or look up orders by number.

**Consequences:**
- Manager "open tickets" view shows customer names as waiter names or table notes
- Filtering the takeaway queue by customer name requires `note.includes(searchTerm)` string parsing — brittle
- If takeaway is ever integrated with CRM or loyalty, the customer identity field must be a dedicated typed field, not a repurposed `note`
- `guestCount: 1` for a single-person takeaway creates a false table occupancy metric

**Prevention:**
- `TakeawayOrder` type in `queue.store` has explicit fields: `customerName: string`, `pickupNumber: number`, `customerPhone: string | null`. These are first-class fields, not repurposed from `TableRecord`.
- The order entry screen for takeaway shows a customer name/number input at the top (analogous to guest count input for dine-in). The form is a 2-field modal: name + phone (phone optional).

**Detection:** If customer name for takeaway is stored in `note`, `waiterName`, or any field originally designed for dine-in table metadata, the data model is wrong.

**Phase:** Takeaway order creation phase. Customer identity fields must be in the type definition from the start.

---

## Moderate Pitfalls

### Pitfall 8: KDS ticket header loses meaning when order type is not shown

**What goes wrong:** The current `KdsTicket` has `tableLabel: string` (e.g., "T5", "T12"). Kitchen staff glance at the header to know where the food goes. For takeaway, the destination is a pickup number or customer name. For delivery, it is a delivery order number and rider. If all three order types use the same `tableLabel` field, kitchen staff see "DEL-042" on a ticket and must remember what that prefix means.

**Why it happens:** `tableLabel` is currently the only identifying label on a KDS ticket. Adding new order types requires either overloading this field or adding new display fields.

**Consequences:**
- Kitchen staff confusion during high-volume service when tickets from three order types appear on the same board
- Bump behavior differs by type (see Pitfall 3) but the ticket card UI gives no visual cue of which type it is
- Recall tray shows a mix of table labels and delivery order numbers with no visual distinction

**Prevention:**
- Add `orderType: 'DineIn' | 'Takeaway' | 'Delivery'` to `KdsTicket` (already recommended in Pitfall 3)
- `KdsTicketCard` renders a colored type badge in the header: "DINE-IN" (neutral), "TAKEAWAY" (amber), "DELIVERY" (blue). Uses the existing badge component.
- `tableLabel` becomes `originLabel` to reflect its generalized meaning — for dine-in it is "T5", for takeaway it is "#042 Peeradonte", for delivery it is "DEL-007 · GrabFood"

**Phase:** KDS phase. One-time type field addition; badge render is cheap.

---

### Pitfall 9: Payment path for delivery bypasses the coupon scan flow

**What goes wrong:** The existing payment flow for dine-in includes a camera coupon scan step. Delivery platforms (GrabFood, Foodpanda) have their own discount mechanisms. A delivery order arriving "pre-discounted" from the platform means the POS never scans a coupon — the discounted total is the order total. But the payment page was built with a coupon scan step as part of the standard flow. If delivery orders reach the same payment page, staff will see a coupon scan option that is semantically wrong (there is no coupon to scan, the platform already deducted it).

**Why it happens:** The payment route is `/payment/[tableId]/page.tsx` — tightly bound to the table paradigm. Adapting it for delivery requires either a separate route or order-type-aware conditional rendering.

**Consequences:**
- Staff scans a coupon for a delivery order (no coupon exists), system either errors or applies an unexpected discount
- Dynamic QR for customer payment (Scan to Pay) is irrelevant for delivery orders where the customer pays the delivery platform, not the restaurant directly
- The "receipt" state on the payment page refers to a printed receipt for a dine-in guest — for delivery, the receipt concept is different (platform generates the customer receipt)

**Prevention:**
- Delivery orders have their own simple payment screen: show the order total (already net of platform discount), confirm payment method as "Platform Settlement" (a new payment method type for the wireframe), confirm. No coupon scan, no QR.
- Takeaway orders DO use the standard payment flow (customer pays at counter). Coupon scan is valid for takeaway.
- Route delivery payment to `/payment/delivery/[orderId]` — a separate page that uses the `calculateBill` utility but does not render the coupon scan or QR payment sections.

**Detection:** If the delivery payment page renders a `CouponScanSection` component, the UI does not reflect delivery payment reality.

**Phase:** Delivery payment phase.

---

### Pitfall 10: "Ready for Rider" stage must not trigger the same table markServed flow

**What goes wrong:** When a dine-in order reaches `Ready` on KDS, the waiter taps "Served" on the table tile, calling `markServed(tableId)` which sets `orderStage: 'Served'` and records `servedAt: Date.now()`. This was designed to track "when did the customer actually receive their food" for KPI reporting. For delivery, `servedAt` means nothing — the food leaves the kitchen and enters a rider bag. If `markServed` is called for delivery orders, the manager EOD report will have `servedAt` timestamps for delivery orders mixed into the dine-in service time KPI.

**Why it happens:** `markServed` is the natural "order is complete from kitchen's perspective" action. It is tempting to call it for all order types.

**Consequences:**
- Average service time KPI is contaminated by delivery order "served" times (which include rider wait time, not just kitchen time)
- Delivery orders appear in the "served orders" count on the manager dashboard alongside dine-in served tables
- If delivery orders use `table.store` pseudo-tables (Pitfall 1 consequence), calling `markServed` sets a `servedAt` timestamp on a fake table record

**Prevention:**
- `markServed` remains exclusively for dine-in table records. Never call it for delivery/takeaway.
- Delivery order stage transitions happen via `queue.store` actions: `acceptOrder`, `startCooking`, `markReadyForRider`, `dispatchRider`, `markDelivered`.
- Manager KPI views that aggregate service times must filter by `orderType === 'DineIn'` when computing dine-in-specific metrics.

**Phase:** Delivery lifecycle phase. Make the constraint explicit in code comments on `markServed`.

---

### Pitfall 11: localStorage persist key collision if delivery store reuses an existing store name

**What goes wrong:** All persisted stores have `name` keys: `'order-store'`, `'table-store'`, `'bill-store'`, `'manager-store'`. If a new `queue.store` is created with `persist({ name: 'order-store' })` by mistake (copy-paste), it overwrites the existing dine-in order store data in localStorage without warning.

**Why it happens:** Copy-paste-driven store creation. The persist name is a string that is never type-checked.

**Consequences:**
- All existing dine-in orders are wiped when the delivery queue first hydrates
- Data loss is silent — no error, just an empty order store
- In development, this causes "ghost" behavior where the floor plan appears to have all tables open but no orders

**Prevention:**
- New store: `persist({ name: 'queue-store' })`. Never reuse an existing persist key.
- Audit all `persist` names before shipping. Add a comment above each persist call listing the key.
- Consider a centralized `PERSIST_KEYS` constant object to make key collisions impossible.

**Phase:** Queue store creation phase. Single step, high consequence.

---

### Pitfall 12: Sidebar navigation needs role-gating for delivery features

**What goes wrong:** The existing permission system in `role-permissions.ts` gates navigation items via `canAccess(role, navSlug)`. If delivery/takeaway features are added to the sidebar without adding corresponding permission entries, they will be visible to Kitchen role (which should only see `/kds`) and potentially to Waiter role in ways the stakeholder does not want.

Separately: if `canAccess` checks use a hard-coded string like `'delivery-queue'` and that slug is never registered in the permission map, `canAccess` returns `false` by default, silently hiding the feature from all roles — a bug that looks like the feature is not implemented.

**Why it happens:** The permission system's default-deny behavior is safe but invisible. Adding a new nav slug without adding permission entries means the feature is inaccessible without an error.

**Consequences:**
- Delivery queue is invisible to all roles after launch because the slug was never added to permissions
- Kitchen role sees the delivery queue tab (if permissions were open by mistake) and can accidentally accept/reject orders
- Manager role cannot access the delivery overview because it was only granted to Cashier

**Prevention:**
- Add explicit permission entries for `'delivery-queue'` and `'takeaway-queue'` nav slugs before building the UI
- Roles that should access delivery management: `Cashier`, `Manager`. `Waiter` and `Kitchen` should not see the acceptance queue.
- Add a test scenario in the wireframe demo script: switch to each role and verify delivery queue visibility matches business intent.

**Phase:** Floor plan tab / queue phase. Permission entries must be added when the nav item is added.

---

## Minor Pitfalls

### Pitfall 13: Delivery order numbers vs. table numbers cause verbal confusion during demos

**What goes wrong:** In stakeholder demos, demonstrators will verbally say "Table 5" for dine-in and "Order 42" for delivery. But the UI must make this distinction obvious. If delivery orders display as just "#42" next to table tiles showing "T5", stakeholders will ask "is that a table or an order?" repeatedly.

**Prevention:** Delivery orders use a visually distinct prefix in all labels: `DEL-042` (delivery), `TKW-007` (takeaway). Never use a bare number. The prefix makes the order type scannable at a glance in the KDS, payment screen, and manager view.

**Phase:** Queue UI phase. Naming convention, no implementation complexity.

---

### Pitfall 14: Elapsed timer in KDS shows wrong urgency for delivery vs. dine-in

**What goes wrong:** Current KDS uses `addedAt: number` to compute elapsed time on each ticket. The elapsed time drives visual urgency (ticket turns red after N minutes). For dine-in, a 25-minute ticket is critical. For delivery, the platform SLA might be 45 minutes total — a 25-minute ticket is still on track. Applying the same urgency thresholds to both order types creates false alarms in the kitchen for delivery orders.

**Prevention:** Urgency thresholds should be configurable per order type. For the wireframe, hardcode different thresholds: dine-in warning at 15 min / critical at 25 min; delivery warning at 25 min / critical at 40 min. Store thresholds as constants, not magic numbers in the component.

**Phase:** KDS phase. Constant definitions, no store changes needed.

---

### Pitfall 15: "Cleaning" status after delivery order is complete has no physical analog

**What goes wrong:** After a dine-in payment, `markCleaning` is called and the table tile shows the "Cleaning" status (with its dedicated OKLCH token). For a takeaway order marked as "Collected" or a delivery order marked as "Delivered," calling `markCleaning` makes no sense — there is no physical table to clean. But if cleanup logic blindly calls `markCleaning` for all paid orders, the floor plan will show phantom "Cleaning" tiles for non-existent tables.

**Prevention:** Post-payment cleanup for delivery/takeaway orders calls `queue.store.archiveOrder(orderId)` — removing the order from the active queue — not any `table.store` action. The floor plan is never touched by delivery/takeaway lifecycle events.

**Phase:** Payment/completion phase. Enforce this as an architectural rule: `table.store` actions are called by dine-in flows only.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model — queue.store creation | Persist key collision with existing stores | Use `'queue-store'` key; audit all persist names before first run |
| Data model — order type field | Adding delivery ID to existing table-keyed stores | Keep `table.store` clean; all delivery/takeaway state lives in `queue.store` |
| Delivery lifecycle state machine | Reusing `OrderStage` / `TableStatus` enums | Define `DeliveryStatus` and `TakeawayStatus` as separate types from day one |
| KDS order type disambiguation | `bumpTicket` behavior diverges by order type | Add `orderType` to `KdsTicket`; extract bump state machine per type |
| KDS ticket header | Order type invisible to kitchen staff | Add type badge (`DELIVERY` / `TAKEAWAY` / `DINE-IN`) to `KdsTicketCard` header |
| Floor plan tabs | Delivery queue mixed with table grid; shared selection state | Separate tab state; build `DeliveryQueueCard` component, not `TableTile` variant |
| Delivery accept/reject queue | No sidebar badge; pending orders missed | Add pending count badge to sidebar nav item from day one |
| Takeaway customer identity | Customer name stored in `note` or `waiterName` | Add explicit `customerName` and `pickupNumber` fields to `TakeawayOrder` type |
| Payment — delivery | Coupon scan and QR shown for delivery | Separate delivery payment page at `/payment/delivery/[orderId]`; no coupon/QR section |
| Payment — takeaway | Takeaway hits delivery payment path by mistake | Takeaway uses standard dine-in payment page; delivery uses its own page |
| Manager KPIs | Delivery `servedAt` polluting dine-in service time stats | Never call `markServed` for delivery; filter by order type in KPI aggregations |
| Post-payment cleanup | `markCleaning` called for delivery orders | Post-delivery completion calls `queue.store.archiveOrder`; never touches `table.store` |
| Permission system | New nav slugs not registered; feature silently hidden | Add `delivery-queue` and `takeaway-queue` to `role-permissions.ts` before building nav items |

---

## Sources

- Direct codebase analysis: `order.store.ts`, `table.store.ts`, `bill.store.ts`, `kds.store.ts`, `session.store.ts`, `manager.store.ts`, `CLAUDE.md` architecture documentation
- Industry patterns: KDS order type routing (lsretail.com, getquantic.com, [loman.ai/blog/best-kitchen-display-systems-order-routing](https://loman.ai/blog/best-kitchen-display-systems-order-routing))
- POS delivery integration challenges ([bimpos.com/blog](https://bimpos.com/blog/how-can-pos-systems-help-restaurants-manage-delivery-and-dine-in-orders-seamlessly), [therestauranthq.com/technology/delivery-pos-system](https://www.therestauranthq.com/technology/delivery-pos-system/))
- Zustand multi-store architecture ([pmndrs/zustand discussions #2486](https://github.com/pmndrs/zustand/discussions/2486), [#2496](https://github.com/pmndrs/zustand/discussions/2496))
- Restaurant order management consolidation patterns (chownow.com/blog, salesplay.com)

---

*Pitfalls research for: adding delivery and takeaway order types to existing dine-in POS wireframe*
*Researched: 2026-03-15*
