# Feature Landscape

**Domain:** Restaurant POS - Split Bill, Merge Bill, Digital Order Tracking (v1.2)
**Researched:** 2026-03-12
**Confidence:** HIGH (patterns well-established across Lightspeed, Square, Toast, MobiPOS)

---

## Table Stakes

Features staff and stakeholders expect. Missing any of these makes the bill management feel incomplete.

### Split Bill

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Equal split (divide by N) | Most common split request; fast for groups of friends. Every major POS supports this. | Low | Payment screen, `guestCount` from `TableRecord` | Pre-fill N from `guestCount`; allow manual override. Display per-person amount prominently. Maximum 99 splits (Lightspeed pattern). |
| Per-seat / per-item assignment | Expected in any dine-in POS. Lightspeed, Square, Toast all offer it. Staff assigns each item to a guest number. | Med | `OrderLineItem` needs `seatNumber` field, split state structure | Tap-to-assign UI: tap item, then tap guest number. Each assigned group becomes an independent "check." Show running subtotal per guest in real time. |
| Independent payment per split | Each sub-bill must accept its own payment method (Cash/QR/Card). Cannot force all splits to same method. | Med | Existing `PaymentMethodSelector`, `CashPanel`, `QrPanel`, `CardPanel` | Track payment status per split: unpaid / paid. Block table close until ALL splits are paid. Reuse existing payment components -- render once per active split. |
| VAT proportional to split | Tax must distribute correctly per sub-bill, not recalculate on the full total. Rounding errors are the #1 accounting issue with split bills. | Low | `TotalsSection` logic | Calculate VAT on each sub-bill subtotal independently. Rounding strategy: assign remainder satang to the last split so sum always equals original total. Use integer math (satang) throughout. |
| Coupon applies before split | Staff applies coupon to the whole bill, THEN splits. This is the 90% case for casual dining. | Low | Coupon flow already built | Apply coupon BEFORE split reduces total, then divide. This avoids the question of "whose coupon is it?" Default and recommended behavior. |

### Merge Bill

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Merge two tables into one bill | Party seated across tables (overflow, large group) needs single check. Standard in Lightspeed K-Series, Odoo, MobiPOS. | Med | `order.store` (combine rounds from two `ActiveOrder`s), `table.store` | Select source table, confirm merge into target. Source items append as new rounds on target order. Source table resets to Open/Cleaning. |
| Unsplit (recombine splits back to one bill) | Staff error correction: splits created by mistake need reversal. Lightspeed and MobiPOS both support this. | Low | Split state structure | Collapse all sub-bills back into single bill. ONLY allowed if NO sub-bill has been paid yet. Once any split is paid, unsplit is blocked -- this is the universal constraint. |

### Digital Order Tracking

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Order stage badge on table tile | Staff needs at-a-glance status without opening each table. Industry standard on Toast, Square, Lightspeed floor plans. | Low | `TableRecord.orderStage` already exists (Ordered/Cooking/Ready/Served/Billed) | Badge already renders in `TableTile.tsx` as `variant="outline"`. Upgrade to filled color-coded badge: Ordered=blue, Cooking=amber, Ready=green, Served=gray, Billed=muted. |
| Auto-sync stage from KDS bumps | When kitchen bumps New->InProgress->Ready on KDS, the table tile must reflect it automatically. Without this, tracking badges are stale. | Med | `kds.store` bump actions, `table.store.updateTable` | KDS `bumpTicket` must cross-store update `table.store.orderStage`. Stage mapping: KDS New = Ordered, InProgress = Cooking, Ready = Ready. Zustand cross-store call (no WebSocket needed -- same process). |

---

## Differentiators

Features that elevate the wireframe beyond basic expectations. High demo impact for stakeholders.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Per-item timeline detail view | Tap a table tile to see each item's journey: Ordered 12:01 -> Cooking 12:05 -> Ready 12:11 -> Served 12:14. Visually impressive, shows operational intelligence. | Med | New `timestamps[]` on `OrderLineItem` or parallel tracking structure | Store timestamp per stage transition per item. Render as vertical timeline with stage icons and elapsed deltas. Strongest demo feature for stakeholders. |
| Visual split assignment UI with color coding | Items color-coded by guest assignment (Guest 1 = blue, Guest 2 = green, etc). Running subtotal per guest updates live. | Med | Split state, color token mapping per guest | More intuitive than dropdown-based assignment. Tap item -> cycles through guest colors. Clear visual grouping. |
| Split progress indicator | "2 of 3 splits paid" with checkmarks on payment screen | Low | Split payment tracking state | Prevents "did guest 2 already pay?" confusion. Simple counter + checkmark list. |
| Merge confirmation preview | Before merging, show combined bill preview with items from both tables side by side | Low | Read-only access to both orders | Prevents "merged wrong table" errors. Show item count + total from each source before confirming. |
| Elapsed time color escalation on stage badge | Badge color shifts green -> amber -> red based on time-in-stage thresholds (e.g., >15min cooking = red alert) | Low | `useDwellTimer`-like hook on order stage timestamps | Already have `useDwellTimer` pattern in codebase. Apply same concept to order stage duration. Configurable thresholds per stage. |

---

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Customer-facing order tracker (public URL/QR) | Out of scope per PROJECT.md ("Customer POS / receipt tracker -- separate deliverable"). Adds authentication, public routes, mobile responsive concerns that blow up scope. | Keep tracking staff-only on POS tablets. Note as future FIP module. |
| Percentage-based split (e.g., 60/40) | Rarely used in ramen/casual dining. Adds UI complexity for a niche scenario. Even Lightspeed buries this option. | Equal split and per-seat split cover 95%+ of real cases. |
| Custom arbitrary amount split | Creates reconciliation problems: what if amounts don't sum to total? Requires overage/underage handling, partial payment logic. | Per-seat item assignment handles "I only want to pay for mine" cleanly without math ambiguity. |
| Automatic seat detection during order entry | Would require rearchitecting order entry flow to assign seat numbers when items are added. Too invasive for v1.2 -- touches the entire order entry UX. | Allow seat assignment at split time only (retroactive). Seat numbers assigned when cashier initiates split, not when waiter takes order. |
| Real-time push (WebSocket/SSE) for order tracking | This is a wireframe with Zustand stores, not a live backend. Over-engineering for a demo artifact. | Use Zustand cross-store subscription. KDS bump synchronously updates table store. Same JS process, zero network overhead. |
| Split shared item across multiple guests (fractional) | "Split this one ramen across 3 people" creates fraction math, confusing UI, and cent-rounding nightmares. Major POS systems handle this poorly or not at all. | If an item is shared, assign it to one guest and use equal split for the whole bill instead. Keep it simple. |
| Transfer individual items between tables (without full merge) | Distinct from merge -- requires partial order moves with void/re-add semantics. Complex state for rare edge case. | Use full table merge, or void item on source and re-enter on target. |
| Split bill after partial payment | If someone already paid part of the bill, then splitting the remainder adds complex partial-payment tracking. | Require split decision BEFORE any payment. Once split, each sub-bill pays independently. No "split the leftovers" flow. |

---

## Feature Dependencies

```
guestCount on TableRecord -----------> Equal split (pre-fill N)
                                         |
OrderLineItem[] per table ------------> Per-seat split (assign items to guests)
                                         |
Per-seat split -----------------------> Independent payment per split
                                         |
Independent payment per split --------> Split progress indicator
                                         |
Coupon flow (existing) ---------------> Coupon pre-split application

ActiveOrder from two tables ----------> Merge bill
Split state structure ----------------> Unsplit (recombine)
Unsplit blocked if any split paid ----> depends on payment tracking per split

KDS bumpTicket -----------------------> Auto-sync stage to table.store
TableRecord.orderStage ---------------> Order stage badge (partially exists)
New per-item timestamp tracking ------> Per-item timeline detail view
useDwellTimer pattern ----------------> Elapsed time color escalation
```

### Critical Path

1. **Split state structure** must be designed first -- it underpins equal split, per-seat split, payment tracking, and unsplit. This is the foundational data model decision.
2. **KDS-to-table sync** must exist before order tracking badges show meaningful data. Without it, badges remain static/manual.
3. **Per-item timestamps** are additive and can be built independently of split bill work.

---

## MVP Recommendation

### Must ship (table stakes):

1. **Equal split** -- Low complexity, highest frequency use case. Pre-fill from guestCount. Build first as simplest split mode.
2. **Per-seat item assignment** -- Medium complexity but expected. Tap-to-assign UI. Each `OrderLineItem` gets optional `seatNumber`.
3. **Independent payment per split** -- Reuse existing payment components per sub-bill. New: paid/unpaid tracking per split.
4. **VAT per split with rounding** -- Integer math (satang). Remainder to last split. Non-negotiable for accounting correctness.
5. **Merge bill (two tables)** -- Append source rounds to target order. Reset source table state.
6. **Unsplit** -- Guard rail. Only when no splits paid. Low effort.
7. **KDS-to-table stage sync** -- Cross-store side-effect in `bumpTicket`.
8. **Color-coded order stage badge** -- Upgrade existing outline badge to filled semantic colors on `TableTile`.

### Should ship (demo differentiators):

9. **Per-item timeline view** -- Strongest stakeholder demo feature. Requires new timestamp tracking on items.
10. **Split progress indicator** -- "2/3 paid" display. Minimal effort, high clarity for cashier workflow.
11. **Elapsed time color escalation** -- Reuse `useDwellTimer` pattern with stage-aware thresholds.

### Defer to polish pass:

- **Merge confirmation preview** -- Nice but not blocking functionality.
- **Visual color-coded split assignment** -- Tap-toggle with text labels is sufficient. Color coding can layer on top later.
- **Coupon-to-specific-split** -- Pre-split application covers 90%+ of real scenarios.

---

## Existing Code Touchpoints

| Existing Asset | How It's Affected | What Changes |
|---------------|-------------------|--------------|
| `order.store.ts` (`ActiveOrder`, `OrderLineItem`) | Add `seatNumber?: number` to `OrderLineItem`. Add `mergeOrder(sourceTableId, targetTableId)` action. | New fields, new actions, existing interface shape preserved. |
| `table.store.ts` (`TableRecord`, `orderStage`) | `orderStage` already exists with 5 stages. Add optional `linkedTableId` for merge tracking. | KDS sync writes to `orderStage` via existing `updateTable`. |
| `kds.store.ts` (`bumpTicket`) | Must trigger `table.store.updateTable({ orderStage })` on stage transitions. | Add cross-store call inside `bumpTicket` or via Zustand `subscribe`. |
| `TableTile.tsx` | Upgrade `orderStage` badge from `variant="outline"` to filled semantic with color-per-stage. | Styling + optional elapsed-time color escalation hook. |
| `payment/[tableId]/page.tsx` | Major changes: split mode selector, per-split payment flow, split progress tracking. This is the largest UI change. | New split state, conditional rendering per mode, multi-payment orchestration. |
| `PaymentMethodSelector`, `CashPanel`, `QrPanel`, `CardPanel` | Reused per sub-bill. No internal changes needed to these components. | Rendered N times (once per active split), each with independent state. |
| `TotalsSection` | Must accept filtered item set (split portion) instead of full bill. | Props change: receives items for one split, not all items. |
| `BillLineItem` | Show seat/guest indicator when in split mode. | Conditional badge rendering when split is active. |

---

## Complexity Budget

| Feature Group | Estimated Complexity | Rationale |
|--------------|---------------------|-----------|
| Split Bill (equal + per-seat + payment) | **High** (collectively) | New state structure, assignment UI, multi-payment orchestration, rounding math. Largest effort in milestone. |
| Merge Bill + Unsplit | **Medium** | State manipulation is straightforward (append rounds, reset source). UI is table picker + confirmation. Guard rails for unsplit. |
| Digital Order Tracking (badges + sync + timeline) | **Low-Medium** | Badge color upgrade is trivial. KDS cross-store sync is one subscriber. Timeline view is medium only if per-item timestamps are added. |

**Total milestone: Medium-High.** Split bill is the dominant effort (~60% of work). Recommend building split first (foundational state model), then tracking (demos independently on table map), then merge last (least visible in demo, simplest state changes).

---

## Sources

- [Lightspeed L-Series: Splitting a bill](https://resto-support.lightspeedhq.com/hc/en-us/articles/226405708-Splitting-a-bill) -- split modes, equal parts, max 99 splits
- [Lightspeed L-Series: Assigning items to seats](https://resto-support.lightspeedhq.com/hc/en-us/articles/226306227-Assigning-order-items-to-seats) -- seat-based ordering and splitting
- [Lightspeed K-Series: Check splitting](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089493-Check-splitting) -- seat vs cover split distinction
- [Lightspeed K-Series: Merging split checks](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804445869-Merging-split-checks-together) -- merge workflow, error correction
- [Square: Split a bill by item or seat](https://squareup.com/help/gb/en/article/8165-split-a-payment-and-check-with-square-for-restaurants) -- per-seat and per-item modes
- [MobiPOS: Split Merge Bill](https://www.mobi-pos.com/web/guide/settings/split-merge-bill) -- unsplit/void workflow
- [ConnectPOS: Merge Checks](https://www.connectpos.com/glossary/merge-checks/) -- merge use cases, cross-area limitations
- [Clover: Restaurant split check policy](https://blog.clover.com/creating-your-own-restaurant-split-check-policy/) -- policy considerations
- [Bright Inventions: Decimals in POS bill splitting](https://brightinventions.pl/blog/decimals-pos-bill-splitting-restaurants/) -- rounding strategies, BigDecimal recommendation
- [Davo Sales Tax: POS rounding differences](https://www.davosalestax.com/why-does-my-point-of-sale-report-two-different-sales-tax-amounts/) -- per-transaction rounding edge cases
- [Splitability: POS Split Bills](https://www.splitability.com/pos-split-bills/) -- shared item division patterns
- [Menumium: Restaurant Order Tracking System](https://menumium.com/blog/restaurant-order-tracking-system/) -- order stage lifecycle
- [Menumium: Restaurant Order Workflow](https://menumium.com/blog/restaurant-order-workflow/) -- end-to-end order flow stages
- [WaiterOne: Order Status Board](https://www.waiterone.net/blog/2024/11/04/order-status-board/) -- real-time status display patterns
- [Quantic: 44 Restaurant POS Features 2026](https://getquantic.com/restaurant-pos-system-features/) -- feature expectations landscape
- [Eats365: Split/Share table](https://support.eats365pos.com/order-handling/split-a-table-for-different-party-groups) -- table split vs share distinction
- [Odoo: POS Split & Merge module](https://apps.odoo.com/apps/modules/17.0/pos_split_merge) -- combined split/merge functionality

---

*Feature research for: A Ramen POS v1.2 -- Split Bill, Merge Bill, Digital Order Tracking*
*Researched: 2026-03-12*
