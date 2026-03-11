# Project Research Summary

**Project:** A Ramen POS Wireframe -- v1.2 Bill Management + Order Tracking
**Domain:** Restaurant POS -- split bill, merge bill, digital order tracking
**Researched:** 2026-03-12
**Confidence:** HIGH

---

## Executive Summary

This milestone adds three feature groups to an existing, stable POS wireframe: split bill (equal and per-seat), merge bill (combine tables into one check), and digital order tracking (live stage badges and per-item timelines on the floor plan). The existing codebase already has the complete tech stack, five Zustand stores, a working payment page, KDS, and table map. The research conclusion is unanimous: **zero new npm packages are needed.** All three features are pure state modeling and UI composition on top of existing primitives (Zustand 5, shadcn/ui, Tailwind CSS 4, CVA).

The recommended approach is to introduce a single new `bill.store.ts` for split/merge concerns (keeping it separate from the order lifecycle), enhance the KDS ticket interface with item references for tracking, and derive order stages through pure functions rather than duplicating state across stores. The architecture and pitfalls research converge on the core design principle: **extend, do not rewrite.** Order data stays in `order.store`, table data stays in `table.store`, and payment-phase concerns (splits, merges, seat assignments) live in a new dedicated store. The existing five stores remain structurally unchanged except for one additive modification to `kds.store` (item refs on tickets).

The dominant risk is the payment page, which is currently hardcoded for single-table, single-payer flow. Split bill alone requires multi-total display, per-portion payment method selection, partial payment tracking, and rounding logic -- roughly 60% of the milestone effort. The mitigation is to build the data model (bill store) first, validate it against edge cases (rounding, partial payment persistence, unsplit-after-payment guards), and only then build UI on top of a solid foundation. A secondary risk is KDS-to-table stage desync: the two stores have no event bridge, so the tracking badge feature requires an explicit cross-store sync call when KDS bumps tickets.

---

## Key Findings

### Recommended Stack

No new dependencies. The existing stack (Next.js 16, React 19, Zustand 5, Tailwind CSS 4, shadcn/ui, CVA, tw-animate-css, Solar icons, sonner) covers every v1.2 requirement. Split bill is floor division + Zustand state. Order tracking is a pure derivation function. Timeline animations use `tw-animate-css`. No need for dinero.js, dnd-kit, framer-motion, date-fns, or immer.

**Core technique:**
- **New `bill.store.ts`**: Split configuration, merge groups, seat payment tracking (persisted via Zustand persist middleware with separate `bill-store` localStorage key)
- **Extended `kds.store.ts`**: Add `items: KdsLineRef[]` to `KdsTicket` for item-level tracking linkage
- **New `order-tracking.ts` utility**: Pure derivation function -- computes per-item stages from KDS + order data without duplicating state
- **Existing shadcn components**: `Dialog`, `Tabs`, `Badge`, `Button`, `Select` cover all new UI patterns -- no new shadcn components needed

### Expected Features

**Must have (table stakes):**
- Equal split (divide by N) -- most common request, pre-fill from guestCount
- Per-seat item assignment -- tap-to-assign UI, each item gets a guest number
- Independent payment per split -- each sub-bill accepts its own payment method
- VAT proportional to split with correct rounding (floor + remainder-on-last)
- Merge two tables into one bill -- aggregate at read time, not by moving data
- Unsplit (recombine) -- only allowed when no splits are paid yet
- KDS-to-table stage auto-sync -- explicit cross-store call on bump
- Color-coded order stage badge on table tiles (upgrade existing outline to filled semantic)

**Should have (differentiators):**
- Per-item timeline detail view -- strongest stakeholder demo feature
- Split progress indicator ("2 of 3 paid") -- minimal effort, high cashier clarity
- Elapsed time color escalation on stage badges (green to amber to red based on time-in-stage)

**Defer (polish pass / v2+):**
- Customer-facing order tracker (separate deliverable per PROJECT.md)
- Percentage-based split, custom arbitrary amounts, fractional shared items
- Merge confirmation preview, visual color-coded split assignment
- Real-time push (WebSocket/SSE) -- unnecessary for wireframe with Zustand
- Automatic seat detection during order entry
- Transfer individual items between tables without full merge
- Split bill after partial payment

### Architecture Approach

The architecture follows three core patterns: (1) separate store for separate lifecycle -- bill splits are payment-phase data, not ordering data; (2) derived selectors over duplicated state -- order tracking stages are computed from KDS + order stores via a pure function, never stored redundantly; (3) reference by ID, never copy data -- bill store points to line items by `lineId`, merge groups reference tables by `tableId`, and merged orders are aggregated at read time only.

**Major components:**
1. **`bill.store.ts`** (NEW) -- Split mode config (`full`/`equal`/`per-seat`), seat assignments as `lineId` mappings, merge groups with primary/secondary table tracking, paid-seat tracking per split
2. **`order-tracking.ts`** (NEW) -- Pure derivation function that maps KDS ticket stages to per-item tracking stages (`Queued`/`Cooking`/`Ready`/`Served`), with aggregate table-level stage for badge display
3. **`SplitBillSheet` + `SeatNavigator` + `SeatAssignmentView`** (NEW) -- Split bill UI layered onto payment page
4. **`MergeTablePicker`** (NEW) -- Table selection modal triggered from `TableBottomSheet` Occupied state
5. **`OrderTimeline`** (NEW) -- Per-item stage timeline in table bottom sheet with elapsed time display
6. **`payment/[tableId]/page.tsx`** (MODIFIED) -- Reads `bill.store` for split/merge mode, renders per-portion payment flow

**Key architectural decisions:**
- `order.store` is NOT modified -- seat assignments live in `bill.store` as a mapping layer
- `table.store` is NOT modified -- merge indicators are derived from `bill.store.tableMergeMap`
- `kds.store` gets ONE additive change -- `items: KdsLineRef[]` on `KdsTicket` interface

### Critical Pitfalls

1. **Payment page hardcoded for single-table flow** -- Current page has one total, one payment method, one confirmation. Split/merge require multi-total, multi-payment, partial-payment states. Prevention: extract bill calculation into shared utility, build split as a separate mode within payment, keep full-bill path unchanged as default.

2. **KDS-table stage desync** -- Two independent stores with no event bridge. Kitchen bumps do not update table badges. Prevention: explicit cross-store call in `bumpTicket` handler. Use "furthest behind item stage" as table-level badge for multi-round orders.

3. **Split without persistent sub-bill entity** -- If split state lives in React `useState`, partial payments are lost on navigation. Rounding errors accumulate. Prevention: persist `BillSplit` in `bill.store` with floor-division + remainder-on-last pattern (last guest absorbs 0 to N-1 satang difference).

4. **Merge without provenance tracking** -- Once items from table B are merged into table A, unmerge is impossible without knowing which items came from where. Prevention: keep orders in their original tables and aggregate at read time only. If data must be moved, tag rounds with `originTableId`.

5. **Stale badges on merged secondary tables** -- Table B still shows its old `orderStage` after merging into A. Prevention: clear secondary table's `orderStage` on merge, show "Merged into T[X]" indicator derived from `bill.store`.

---

## Implications for Roadmap

Based on combined research, four phases are recommended with strict ordering based on dependency analysis.

### Phase 1: Digital Order Tracking

**Rationale:** No dependency on the new bill store. Purely additive -- reads from existing stores, derives stage data via pure functions. Validates the cross-store derivation pattern before split/merge builds on similar principles. High visibility on the floor plan for early demo impact.
**Delivers:** Live color-coded stage badges on table tiles, per-item stage timeline in bottom sheet, KDS-to-table sync bridge, elapsed time escalation.
**Addresses:** KDS auto-sync (table stakes), order stage badge (table stakes), per-item timeline (differentiator), elapsed time escalation (differentiator).
**Avoids:** Pitfall 3 (KDS-table desync) by establishing the sync mechanism upfront.
**Key files:** New `src/lib/order-tracking.ts`, new `src/components/table-map/OrderTimeline.tsx`, modified `kds.store.ts` (add items to ticket), modified `TableTile.tsx` (derived badge), modified `TableBottomSheet.tsx` (timeline section).

### Phase 2: Bill Store + Equal Split

**Rationale:** Creates the foundational `bill.store.ts` that both split modes and merge depend on. Equal split is the simplest mode -- validates the store design, rounding logic, and multi-payment flow before tackling per-seat assignment. Replaces the existing "Split Bill -> v2" placeholder button in TotalsSection.
**Delivers:** `bill.store.ts` with split actions, equal split UI on payment page, per-share payment with independent method selection, split progress indicator ("2 of 3 paid").
**Addresses:** Equal split (table stakes), independent payment per split (table stakes), VAT rounding (table stakes), split progress (differentiator).
**Avoids:** Pitfall 2 (split without persistent entity) by building the store first. Pitfall 5 (payment page complexity) by starting with the simpler equal mode.
**Key files:** New `src/stores/bill.store.ts`, new `SplitBillSheet.tsx`, new `SeatNavigator.tsx`, modified `TotalsSection.tsx`, modified `payment/[tableId]/page.tsx`.

### Phase 3: Per-Seat Split

**Rationale:** Builds on the bill store and payment flow from Phase 2. Adds seat assignment UI and per-seat item filtering. More complex than equal split because it requires item-to-seat mapping, shared-item handling, and per-seat VAT calculation.
**Delivers:** `SeatAssignmentView` (tap-to-assign), per-seat subtotal/VAT calculation, unsplit action with paid-seat guard, coupon-before-split behavior.
**Addresses:** Per-seat item assignment (table stakes), unsplit (table stakes), coupon-before-split (table stakes).
**Avoids:** Pitfall 6 (no seat identity) by using `bill.store` seat assignments rather than modifying `OrderLineItem`. Pitfall 11 (unsplit after partial payment) by disabling unsplit once any portion is paid.
**Key files:** New `SeatAssignmentView.tsx`, modified `bill.store.ts` (seat assignment actions), modified `payment/[tableId]/page.tsx` (per-seat item filtering), modified `role-permissions.ts` (add `split-bill` ActionKey).

### Phase 4: Merge Bill

**Rationale:** Extends `bill.store` with merge groups. Least frequent operation in a ramen restaurant, simplest state changes, but requires careful secondary-table cleanup and KDS label handling. Depends on the stable bill store from Phases 2-3.
**Delivers:** `MergeTablePicker` modal, merged bill aggregation on payment page, unmerge support via merge group dissolution, secondary table status cleanup, KDS label updates for merged tickets.
**Addresses:** Merge two tables (table stakes), merge badge on table tile.
**Avoids:** Pitfall 4 (merge without provenance) by keeping orders in original tables and aggregating at read time. Pitfall 8 (stale badges on secondary tables) by clearing `orderStage` and deriving merge indicator from `bill.store`. Pitfall 9 (misleading KDS labels) by updating ticket labels on merge.
**Key files:** New `MergeTablePicker.tsx`, modified `bill.store.ts` (merge actions), modified `TableBottomSheet.tsx` ("Merge Tables" button), modified `payment/[tableId]/page.tsx` (multi-table item aggregation), modified `role-permissions.ts` (add `merge-tables` ActionKey).

### Phase Ordering Rationale

- **Tracking first** because it has zero dependency on split/merge, validates cross-store derivation patterns, and produces immediate visual results on the floor plan. No new store creation required.
- **Equal split before per-seat** because equal split is simpler (no item assignment), validates the bill store design and multi-payment flow, and exercises the `SeatNavigator` pattern that per-seat also needs.
- **Per-seat after equal** because it adds complexity incrementally -- the store, payment flow, and navigator patterns from equal split are reused directly.
- **Merge last** because it is the least common operation in a ramen restaurant, has the most edge cases (provenance, KDS labels, secondary table cleanup), and depends on the bill store being stable. It also benefits from the unsplit action implemented in Phase 3.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Equal Split):** Rounding edge cases with THB satang. The floor + remainder pattern is standard, but VAT-on-split vs split-of-VAT calculation order needs a business rule decision before implementation.
- **Phase 3 (Per-Seat Split):** Shared/unassigned item handling. The "seat 0 = shared, split equally" concept is defined but the UX for displaying and paying for shared items alongside assigned items needs design validation.
- **Phase 4 (Merge Bill):** Merge + split interaction. A merged bill that is then split creates a combined state. The architecture supports it (merged items expand the lineId pool), but this combination needs explicit testing matrix definition.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Order Tracking):** Well-documented pattern. Pure derivation from existing stores. KDS-to-order item mapping is straightforward. No new store needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages. Every capability verified against existing `package.json` and live source code. |
| Features | HIGH | Sourced from 16+ POS vendor docs (Lightspeed, Square, Toast, MobiPOS, Clover, Odoo). Clear consensus on table stakes vs differentiators. |
| Architecture | HIGH | All findings derived from direct line-by-line codebase analysis of all 5 stores, payment page, and table components with exact line numbers. |
| Pitfalls | HIGH | Every pitfall traced to specific file and line number. Prevention strategies validated against industry POS patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **Rounding business rule:** Floor + remainder-on-last is the technical recommendation, but the product owner should confirm whether the rounding difference (0 to N-1 satang) lands on the last guest or is absorbed by the restaurant. Policy decision, not technical.
- **Order cleanup policy:** Orders are never cleared from `order.store` after payment. Adding `stageHistory` and `BillSplit` data increases localStorage payload over a service day. A cleanup-on-payment-confirm policy should be defined in Phase 2.
- **KDS ticket-to-item linkage:** Current `addTicket` takes no item data. The Phase 1 modification (adding `items: KdsLineRef[]`) is additive, but the call site where `sendRound` triggers `addTicket` needs verification to confirm items are available and correctly shaped.
- **Merge + split composition:** The architecture supports it (merged items expand the lineId pool for per-seat assignment), but no research source explicitly validated this combination. Needs a testing matrix during Phase 4 planning.
- **Architecture disagreement on seat assignment storage:** STACK.md suggests adding `seatNumber` to `OrderLineItem`; ARCHITECTURE.md recommends keeping seat assignments only in `bill.store` as a mapping layer. The ARCHITECTURE.md approach is stronger -- seat assignment is a payment-phase concern and should not pollute the order data model. **Recommendation: follow ARCHITECTURE.md.**

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all stores (`order.store.ts`, `table.store.ts`, `kds.store.ts`, `session.store.ts`, `manager.store.ts`), payment page, TotalsSection, TableTile, TableBottomSheet, role-permissions -- every claim traceable to specific file and line number
- `.planning/PROJECT.md` -- v1.2 feature requirements and constraints

### Secondary (HIGH confidence)
- [Lightspeed L-Series / K-Series](https://resto-support.lightspeedhq.com/) -- split modes, seat assignment, check merging, max 99 splits
- [Square for Restaurants](https://squareup.com/help/) -- per-seat and per-item split patterns
- [MobiPOS](https://www.mobi-pos.com/) -- split/merge/unsplit workflows
- [ConnectPOS](https://www.connectpos.com/) -- merge check use cases and cross-area limitations
- [Bright Inventions](https://brightinventions.pl/blog/decimals-pos-bill-splitting-restaurants/) -- rounding strategies for bill splitting
- [Menumium](https://menumium.com/blog/) -- order stage lifecycle and tracking patterns
- [WaiterOne](https://www.waiterone.net/blog/) -- order status board display patterns
- [Quantic POS](https://getquantic.com/restaurant-pos-system-features/) -- 2026 restaurant POS feature expectations
- [Odoo POS Split/Merge module](https://apps.odoo.com/apps/modules/17.0/pos_split_merge) -- combined split/merge functionality
- Zustand 5 persist middleware -- existing pattern validated across 4 stores in this project

---

*Research completed: 2026-03-12*
*Ready for roadmap: yes*
