# Domain Pitfalls: Split Bill, Merge Bill, and Digital Order Tracking

**Domain:** Adding bill management and order tracking to an existing restaurant POS wireframe
**Researched:** 2026-03-12
**Confidence:** HIGH (based on direct codebase analysis of all five stores + payment page + table tile component)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or broken flows across the existing system.

### Pitfall 1: ActiveOrder keyed solely by tableId becomes invalid on merge

**What goes wrong:** The entire `order.store` is `Record<string, ActiveOrder>` where the key is `tableId`. Every action (`addItem`, `sendRound`, `voidItem`, `editItem`, `removeItem`) takes `tableId` as the primary key. The payment page resolves its order via `useParams<{ tableId: string }>()` then `getOrder(tableId)`. When two tables merge their bills, you need a single order that spans two tableIds. Naively copying items from table B into table A's order loses the association -- table B's tile still shows "Occupied" with an `orderStage` but its order data now lives under table A. Worse, navigating to `/payment/B` returns "No order data found" because `orders[B]` was deleted or emptied.

**Why it happens:** The 1:1 relationship between `tableId` and `ActiveOrder` is the foundational assumption of the store. It was correct for v1.0/v1.1 where every table has exactly one order. Merge breaks this assumption at every layer.

**Consequences:**
- Payment page for merged table B shows empty state
- `handleConfirmPayment` only calls `markCleaning(tableId)` for one table, leaving merged tables in incorrect status
- KDS tickets reference a single `tableId` -- kitchen sees two separate tickets for what staff considers one party
- If you duplicate the order under both keys to "fix" routing, confirming payment on one does not settle the other

**Prevention:**
- Introduce an `orderId` as the primary key, decoupled from `tableId`. `ActiveOrder` gains `tableIds: string[]`. The `orders` record becomes `Record<orderId, ActiveOrder>`. A lookup index `tableToOrder: Record<tableId, orderId>` provides O(1) access from the table-centric UI.
- The payment route should resolve via the lookup index: `tableId -> orderId -> order`.
- All existing store actions remain `tableId`-first for the UI layer but internally resolve to `orderId`. This preserves backward compatibility.
- **This is the single most important data model change. Do it before building any merge/split UI.**

**Detection:** If your merge implementation copies items between two `orders[tableId]` entries rather than linking them to a shared order, you have this bug.

**Phase:** Must be addressed in the very first implementation phase, before any UI work.

---

### Pitfall 2: Split bill without a persistent "sub-bill" entity creates rounding errors and lost partial payments

**What goes wrong:** Splitting a bill by doing `grandTotal / N` in the payment component (local React state, no store representation) causes multiple failures:
1. **Rounding:** 350 / 3 = 116.667. `Math.round` gives 117 * 3 = 351. Who absorbs the extra baht? `Math.floor` gives 116 * 3 = 348, losing 2 baht.
2. **Partial payment loss:** If guest 1 pays their split and the staff navigates away (route change destroys React state), the payment status is lost -- Zustand has no split data, and the `persist` middleware cannot save what was never in the store.
3. **Per-seat split with no seat field:** `OrderLineItem` has no `seatNumber`. Items cannot be assigned to guests.
4. **VAT ambiguity:** Splitting before or after VAT calculation produces different numbers.

**Why it happens:** The current payment page computes `subtotal`, `vatAmount`, `grandTotal` entirely in `useMemo` with local `useState` for `couponAmount`, `cashReceived`, etc. There is zero store-level concept of partial payment or bill portions.

**Consequences:**
- Cannot resume a partially-paid split bill after navigating away
- Staff cannot see which splits are settled and which are outstanding
- Per-seat assignment is a UI-only illusion with no data backing
- Receipt for each split guest requires ad-hoc math

**Prevention:**
- Create a `BillSplit` type in the store:
  ```typescript
  interface SplitPortion {
    portionId: string
    guestLabel: string       // "Guest 1", "Guest 2", or seat name
    lineIds: string[] | null // null = equal split, string[] = per-seat
    amount: number
    vatAmount: number
    status: 'unpaid' | 'paid'
    paymentMethod: PaymentMethod | null
  }
  interface BillSplit {
    splitId: string
    orderId: string
    type: 'equal' | 'per-seat'
    portions: SplitPortion[]
  }
  ```
- Equal split rounding: use `Math.floor(grandTotal / N)` for all portions except the last, which gets `grandTotal - (floor * (N-1))`. This is the standard POS pattern -- the last guest absorbs the rounding difference (always 0 to N-1 satang).
- Persist `BillSplit` in the order store so partial payment survives navigation.

**Detection:** If your split logic lives entirely in the payment page component state (`useState`), you have this bug.

**Phase:** Must be designed alongside the orderId refactor. UI can come later, but the data model must be settled first.

---

### Pitfall 3: Order tracking status desync between table.store and kds.store

**What goes wrong:** The app has two independent sources of truth for order progress:
- `table.store` has `orderStage: OrderStage | null` per table (Ordered / Cooking / Ready / Served / Billed)
- `kds.store` has `KdsTicket.stage` per ticket (New / InProgress / Ready)

These are **never automatically synchronized**. `orderStage` is set manually via `updateTable()` and `markServed()`. KDS stage advances via `bumpTicket()`. Adding "digital order tracking" that shows live stage badges on table tiles requires these to agree -- but they are structurally independent stores with no event bridge.

**Why it happens:** The KDS store was intentionally designed without `persist` (to avoid polluting floor data with demo tickets). The table store's `orderStage` was designed as a manual staff-set field. There is no pub/sub or event system connecting the two.

**Consequences:**
- Kitchen bumps a ticket to "Ready" but the table tile still shows "Cooking" until staff manually calls `updateTable`
- Per-item timeline requires knowing when each item changed stage, but neither store tracks stage transition timestamps
- Multi-round orders (ramen + add-on rounds) mean one table can have items at different stages simultaneously, but `orderStage` is a **single value** per table -- which stage does it show?

**Prevention:**
- **Sync on action:** When `bumpTicket()` is called, also dispatch `updateTable(tableId, { orderStage: mappedStage })`. Map KDS stages: New -> Ordered, InProgress -> Cooking, Ready -> Ready. This is pragmatic for a wireframe -- no event bus needed, just call both stores in the component's click handler.
- **Multi-item resolution:** When a table has items at different stages, the tile badge should show the "furthest behind" stage. If 3 items are Ready but 1 is Cooking, the table shows "Cooking." This is the standard restaurant POS convention (the table is not ready until everything is ready).
- **Per-item history:** Add `stageHistory: Array<{ stage: string; at: number }>` to `OrderLineItem`. Append an entry each time the item's stage changes. Keep entries minimal (2 fields per transition) to avoid localStorage bloat.
- **Do NOT try to derive table stage from KDS state at render time** -- KDS tickets get removed when bumped past Ready, so the historical data is lost.

**Detection:** If bumping a ticket on KDS does not change anything on the table map, you have this desync.

**Phase:** Order tracking phase. Must decide the sync mechanism before building the table tile badge UI.

---

### Pitfall 4: Merge bill without provenance tracking makes unmerge impossible

**What goes wrong:** Once orders from table A and B are merged into a single order, there is no clean way to unmerge if the staff made a mistake. Items from table B are now mixed into table A's rounds. Which items were originally from B? Without provenance tracking, unmerge requires the staff to void the merged order and re-enter everything manually.

**Why it happens:** Merge is conceptually simple (combine two item lists). But the `OrderRound` structure groups items by send-time, not by origin table. After merge, the round boundaries reflect chronological order across both tables, not table identity.

**Consequences:**
- Staff error on merge (wrong table) requires full manual re-entry during active service
- Manager void + re-entry creates orphaned records in payment/table history
- Customer frustration from the delay

**Prevention:**
- Every `OrderRound` should retain an `originTableId` field. When merging, rounds from table B keep `originTableId: 'B'`. Unmerge = filter rounds by `originTableId`, create a new order for the departing table, move matching rounds, update the lookup index.
- Alternatively, tag at the `OrderLineItem` level with `originTableId`. This is more granular but also more complex. Round-level is sufficient for v1.2.
- Do NOT allow merge of tables that are in different payment states (e.g., one already has a partially-paid split).

**Detection:** If your merge implementation flattens all items into new rounds without preserving origin, unmerge will require a rewrite.

**Phase:** Same phase as merge bill. Design the data model to support both directions from day one.

---

## Moderate Pitfalls

### Pitfall 5: Payment page hardcoded to single-table, single-payer flow

**What goes wrong:** The current `PaymentPage` at `/payment/[tableId]/page.tsx` is built around one flow: one table, one total, one payment method, one confirmation. Split bill requires multiple totals, multiple payment selections (one per portion), multiple confirm actions, and a "partially paid" intermediate state. Merge bill requires the page to work for orders spanning multiple tables. Bolting these onto the existing 228-line component creates an unmanageable state machine.

**Specific code issues:**
- `billItems` is derived from `order.rounds.flatMap(r => r.items)` -- no concept of portions
- `handleConfirmPayment` calls `markCleaning(tableId)` for a single table
- `paymentMethod` is a single `useState` -- split needs one per portion
- `viewState` is binary (`'payment' | 'receipt'`) -- split needs a per-portion flow

**Prevention:**
- Refactor the payment page to be order-driven (resolve orderId from tableId).
- Extract bill calculation into a shared utility: `calculateBill(items) -> { subtotal, vat, total }`. Both full-bill and split-portion views need this.
- Build split as a separate mode/sub-route within the payment flow, not as conditional branches in the existing component.
- Keep the "full bill" path working unchanged. Split is opt-in, activated from the existing placeholder button.

**Phase:** Payment refactoring should happen after the data model phase but before split UI.

---

### Pitfall 6: Per-seat split requires seat identity that does not exist in the data model

**What goes wrong:** "Split by seat" implies each guest has a seat number and items are assigned to seats. But `OrderLineItem` has no `seatNumber` field. The `guestCount` on `TableRecord` is just a number (captured at table open), not a list of seat identifiers.

**Prevention:**
- Add optional `seatNumber: number | null` to `OrderLineItem`. Items without a seat are "shared" and split equally across all seats in per-seat mode.
- Seat assignment happens at the split screen (drag/tap items to seat columns), not during order entry. This avoids changing the ordering workflow.
- Define seats as `1..guestCount` derived from the table's `guestCount`. No need for a separate seat entity.
- If `guestCount` was not set (legacy tables opened before v1.1), prompt for guest count before allowing per-seat split.

**Phase:** Split bill UI phase. The `seatNumber` field can be added to the type early, with assignment UI built later.

---

### Pitfall 7: Zustand persist with growing order data risks localStorage bloat and serialization bugs

**What goes wrong:** The order store uses `persist` middleware with `localStorage`. Adding `stageHistory`, `originTableId`, `seatNumber`, and `BillSplit` structures increases the serialized payload per order. A busy service with 20 tables and multi-round orders could accumulate significant data. Additionally, `kds.store` uses `Set<string>` for `checkedItems`, which does not serialize to JSON natively (`JSON.stringify(new Set(['a'])) === '{}' `).

**Prevention:**
- Keep `stageHistory` arrays short (2-3 fields per entry, typically 3-5 transitions per item).
- Clear completed orders from the store after payment confirmation + a short grace period for receipt reprint. Currently, orders are never cleaned up.
- The KDS store correctly avoids `persist` already -- do not add persist to it for tracking purposes.
- If adding persist to any new structure, use Zustand's `partialize` option to exclude transient computed fields.
- Test serialization by calling `JSON.parse(JSON.stringify(state))` on any new data structure that will be persisted.

**Phase:** Ongoing concern. Set cleanup policy in the data model phase.

---

### Pitfall 8: Table tile badge shows stale orderStage after merge

**What goes wrong:** When table B merges into table A, table B's `orderStage` field might still show "Cooking" even though its items are now tracked under table A's order. The `TableTile` component renders `table.orderStage` unconditionally (line 67-70 of `TableTile.tsx`). It does not check whether the table still has an active order.

**Prevention:**
- When merging, explicitly set the secondary table's `orderStage` to `null` and decide its table status:
  - Option A: Set status back to "Open" (table is physically vacated because guests moved).
  - Option B: Keep "Occupied" but add a visual "Merged into T3" indicator.
- The table tile should conditionally show the stage badge only when the table has an active order in the lookup index.

**Phase:** Merge bill implementation phase.

---

### Pitfall 9: KDS ticket labels become misleading after merge

**What goes wrong:** `KdsTicket` has `tableId` and `tableLabel` fields. After merge, the kitchen still sees "Table B" on tickets that the front-of-house considers part of table A's order. The kitchen prepares the food, calls out "Table B ready!" but the food should go to table A's service hatch.

**Prevention:**
- When merging, update existing KDS tickets for the secondary table to show the primary table label (e.g., "T5 (was T3)") or add a note field.
- New tickets created after merge should use the primary table's label.
- Add `orderId` to `KdsTicket` so the kitchen can track by order rather than by table alone.

**Phase:** Merge bill phase, concurrent with KDS linkage work.

---

## Minor Pitfalls

### Pitfall 10: Coupon applied to full bill then split -- discount distribution unclear

**What goes wrong:** If a coupon discount is applied to the full bill and then the bill is split, which portion gets the discount? Equal split can divide it proportionally, but per-seat split creates ambiguity if only one guest's items benefited from the coupon.

**Prevention:** Apply coupon to the full bill total before splitting. Each portion reflects a proportional share of the discount. Document this as a business rule. Do not allow coupons to be applied to individual split portions in v1.2. This matches how most POS systems handle the edge case.

**Phase:** Split bill UI phase. Business rule decision, not technical complexity.

---

### Pitfall 11: "Unsplit" after partial payment is a state machine trap

**What goes wrong:** If 2 of 4 split portions are paid and staff wants to unsplit (recombine into a single bill), the system must handle the already-paid portions. Refund them? Keep them as credits? This edge case has no clean answer and real POS systems handle it differently.

**Prevention:** For v1.2 wireframe: **disable unsplit once any portion has been paid.** Show a message: "Cannot unsplit -- 2 of 4 portions already paid. Complete remaining payments or void split." This is the simplest correct behavior. Production POS can add refund-and-recombine later.

**Phase:** Split bill UI phase. Constraint decision, not complex implementation.

---

### Pitfall 12: Order tracking timeline assumes linear stage progression but real orders are not linear

**What goes wrong:** The stage sequence Ordered -> Cooking -> Ready -> Served assumes each item moves forward in a straight line. But items can be recalled (Ready -> back to InProgress in the KDS), voided mid-cooking, or partially served (3 of 4 bowls delivered). A linear timeline UI breaks when stages go backwards or skip.

**Prevention:**
- The `stageHistory` array naturally handles non-linear progression (it is append-only, so a recall just adds a new entry with the earlier stage).
- The timeline UI should render all entries chronologically, not assume forward-only movement.
- For the wireframe, a recall is visually shown as a step backward in the timeline -- no special handling needed if the data model is append-only.

**Phase:** Order tracking UI phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model refactor (orderId decoupling) | Breaking every existing store action that takes `tableId` as the order key | Create the `tableToOrder` lookup index first. Update actions to resolve through it. Keep `tableId` as the access pattern in the UI layer. Run existing payment flow end-to-end after refactor to verify no regressions. |
| Split bill (equal) | Rounding errors in division, partial payment lost on navigation | Use floor division + remainder-on-last pattern. Persist `BillSplit` in store, not in component state. |
| Split bill (per-seat) | No seat identity on existing items, retroactive assignment awkward | Add optional `seatNumber` to `OrderLineItem`. Assign at split-time, not order-time. |
| Merge bill | Losing item provenance (originTableId), secondary table stuck in wrong status | Tag rounds with `originTableId` on merge. Clean up secondary table status immediately. |
| Unsplit / Unmerge | No undo path if provenance was not tracked | Design merge data model to support both directions from day one. Block unsplit after partial payment. |
| Order tracking badges | Desync between KDS stage and table orderStage | Sync on KDS bump action. Use "worst item stage" as table-level badge. |
| Per-item timeline | No stage transition timestamps in current OrderLineItem | Add `stageHistory` array. Keep entries minimal (stage + timestamp only) to avoid localStorage bloat. |
| Payment page refactor | Sprawling state machine trying to handle full/split/merged in one component | Separate into modes/views. Extract bill calculation into shared utility. Keep full-bill path working unchanged. |

---

## Sources

- Direct codebase analysis: `order.store.ts` (196 lines), `table.store.ts` (149 lines), `kds.store.ts` (155 lines), `payment/[tableId]/page.tsx` (228 lines), `TotalsSection.tsx` (109 lines), `TableTile.tsx` (75 lines)
- Established POS domain patterns for split/merge bill handling (industry standard rounding, provenance tracking, stage synchronization)
- Zustand persist middleware serialization behavior with complex types (Set, Map)

---

*Pitfalls research for: split bill, merge bill, and digital order tracking on existing POS wireframe*
*Researched: 2026-03-12*
