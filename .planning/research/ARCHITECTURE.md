# Architecture Patterns

**Domain:** POS bill management + digital order tracking (v1.2) / Delivery & Takeaway order types (v1.3)
**Researched:** 2026-03-15 (v1.3 section added; v1.2 section from 2026-03-12 preserved)
**Confidence:** HIGH — all findings from direct codebase inspection of all stores, pages, and key components

---

## v1.2 Architecture (Preserved — Bill Management + Order Tracking)

### Current Architecture Snapshot

#### Existing Stores

| Store | Persist | Key Data | Key Actions |
|-------|---------|----------|-------------|
| `order.store` | Yes | `orders: Record<tableId, ActiveOrder>` — rounds with items, modifiers, spiceLevel, status | addItem, editItem, removeItem, sendRound, voidItem |
| `table.store` | Yes | `tables: Record<tableId, TableRecord>` — status, guestCount, openedAt, orderStage, servedAt, paymentMethod | openTable, markServed, markCleaning, markClean, updateTable |
| `kds.store` | No | `tickets: Record<ticketId, KdsTicket>` — stage (New/InProgress/Ready), checkedItems Set | addTicket, bumpTicket, checkItem, recallTicket |
| `session.store` | No | role, staffName, staffId, branch, shiftOpen | login, openShift, logout |
| `manager.store` | Yes | eightySixedIds, shiftClosed | toggleEightySix, closeShift |
| `bill.store` | Yes | `splits: Record<tableId, BillSplit>`, `merges: Record<secondaryId, primaryId>` | initEqualSplit, initPerSeatSplit, assignItem, recordPayment, initMerge, dissolveAll |

#### Current Data Flow

```
Order Entry -> order.store (rounds/items)
                 | sendRound
              kds.store (ticket with table ref)
                 | bump to Ready
              table.store (orderStage updates)
                 | mark served
              table.store (orderStage: 'Served', servedAt)
                 | request check
              payment/[tableId] reads order.store
                 | confirm payment
              table.store (markCleaning, orderStage: 'Billed')
```

#### Critical Architectural Constraints

1. **order.store is keyed by tableId** — all items for a table live under one `ActiveOrder`
2. **Payment page reads order.store directly** — flattens all rounds into `billItems`, calculates subtotal/VAT/grandTotal inline
3. **No concept of "seat" exists anywhere** — guests are a count (`guestCount: number`), not individual entities
4. **KDS tickets are disconnected from order line items** — `addTicket(tableId, tableLabel)` takes no item data; `checkedItems` contains lineIds only when kitchen staff manually checks them
5. **table.store has a single `orderStage`** — one stage per table, not per-item tracking
6. **bill.store `merges` is a flat map** — `Record<secondaryTableId, primaryTableId>`; O(1) lookup via `isMergedSecondary`

---

### Component 1: Split Bill

#### Approach: `bill.store` with split configuration (implemented in v1.2)

`bill.store` holds `BillSplit` per tableId. Split mode is either `equal` (divide grand total N ways) or `per-seat` (assign line items to seats). Orders in `order.store` are never modified — split is a payment-phase view layer only.

Equal split: the payment page divides `grandTotal / seatCount` and tracks which share has been paid via `payments: Record<seatIndex, SeatPaymentRecord>`.

Per-seat split: staff assigns line items to seat indices via `SeatAssignment[]`. Each seat gets its own subtotal, VAT, and payment flow. When all seats are paid the table transitions to Cleaning.

---

### Component 2: Merge Bill

#### Approach: `merges: Record<secondaryTableId, primaryTableId>` in `bill.store`

Merge combines orders from multiple tables into one payment at the primary table's payment screen. Secondary table tiles navigate directly to `payment/[primaryTableId]` when tapped. `dissolveAll(primaryTableId)` clears all merge entries on payment or explicit dissolve. Order data stays in its original table records in `order.store` — aggregation happens at read time in the payment page.

---

### Component 3: Digital Order Tracking

#### Approach: Derive `kds.store` stages back to order items via pure function

`src/lib/order-tracking.ts` provides `deriveRoundStage` and `isRoundEscalated`. No new store. `table.store.orderStage` is written by `KdsTicketCard.handleBump()` as a side-effect write-back. `TableTile` shows an escalation badge when a sent round has been waiting longer than `ESCALATION_THRESHOLD_MS` (15 minutes).

---

## v1.3 Architecture: Delivery & Takeaway

### Core Decision: Shared Stores With Namespaced IDs

**Recommendation: share `order.store`, `kds.store`, and `bill.store`. Create one new store: `queue.store`.**

Rationale: `order.store`, `kds.store`, and `bill.store` are all keyed by an opaque string ID with no type coupling to dine-in tables. A takeaway order keyed as `TK-001` and a delivery order keyed as `DL-grab-7821` work identically in all existing stores. Creating parallel stores would duplicate all logic (addItem, sendRound, bumpTicket) and force KdsBoard to union two ticket sources. The correct architectural seam is a new `queue.store` that owns delivery/takeaway-specific metadata (customer name, phone, platform, estimated pickup time, status lifecycle), while all existing stores handle order lines and kitchen flow unchanged.

---

### New Type: OrderContext (extend order.store)

Add a discriminated union to describe what kind of entity an order ID refers to.

```typescript
// src/stores/order.store.ts — ADD

export type OrderContext =
  | { type: 'dine-in';  tableId: string }
  | { type: 'takeaway'; orderId: string; customerName: string; customerPhone: string }
  | { type: 'delivery'; orderId: string; platform: 'Grab' | 'LINE MAN'; externalRef: string }

// ActiveOrder — EXTEND (backward compatible: tableId is kept as primary key)
export interface ActiveOrder {
  tableId: string        // kept as primary key; for TK/DL orders equals orderId
  context?: OrderContext // NEW — absent means dine-in (migration safe; zero breakage)
  rounds: OrderRound[]
}
```

All existing code uses `order.tableId` as an opaque string key. Adding an optional `context` field means zero existing code breaks. New UI reads `context` to select the correct rendering path and back-navigation target.

---

### New Store: queue.store

```typescript
// src/stores/queue.store.ts — NEW FILE (persist: yes)

export type QueueOrderStatus =
  | 'Pending'     // received, not yet confirmed by staff
  | 'Confirmed'   // staff accepted, being prepared
  | 'Ready'       // food ready, awaiting pickup or rider
  | 'Completed'   // handed over
  | 'Cancelled'

export type QueueOrderType = 'takeaway' | 'delivery'
export type DeliveryPlatform = 'Grab' | 'LINE MAN'

export interface QueueOrder {
  orderId: string                    // e.g. 'TK-001', 'DL-grab-7821'
  type: QueueOrderType
  status: QueueOrderStatus
  customerName: string
  customerPhone: string
  platform: DeliveryPlatform | null  // null for takeaway
  externalRef: string | null         // platform order number; null for takeaway
  estimatedReadyAt: number | null    // Date.now() + estimated ms
  createdAt: number
  note: string | null
  staffId: string | null             // who confirmed the order
}

interface QueueStore {
  orders: Record<string, QueueOrder>
  addOrder: (order: QueueOrder) => void
  confirmOrder: (orderId: string, staffId: string) => void
  markReady: (orderId: string) => void
  markCompleted: (orderId: string) => void
  cancelOrder: (orderId: string) => void
  getOrder: (orderId: string) => QueueOrder | undefined
  injectSimulatedDelivery: (platform: DeliveryPlatform) => void  // demo/simulation
}
```

`queue.store` persists (same as `order.store`) so in-flight delivery orders survive route group navigation. It owns only queue-phase concerns — pre-entry through handoff. Once `confirmOrder` is called, entry flows into `order.store` via `/order/[orderId]`, the same page already used for tables.

---

### Route Changes

#### Reuse /order/[tableId] — No New Route Needed

`/order/[tableId]` already accepts an opaque string param. Navigate to `/order/TK-001` for a takeaway order. The page currently reads `table.store.tables[tableId]` for the header label — that lookup returns `undefined` for non-table IDs. Add a one-line fallback:

```typescript
// order/[tableId]/page.tsx — CHANGE header label derivation

const table = useTableStore((s) => s.tables[tableId])
const queueOrder = table ? null : useQueueStore.getState().getOrder(tableId)

const headerLabel = table
  ? `${table.label} · ${table.guestCount ?? 0} guests`
  : queueOrder
    ? `${queueOrder.orderId} · ${queueOrder.customerName}`
    : tableId
```

No structural change to the order entry flow. This is a null-safe label derivation only.

#### Reuse /payment/[tableId] — Back Button Conditional

`/payment/[tableId]` currently hardcodes back navigation to `/table-map`. For delivery/takeaway orders the correct destination is `/queue`. Add:

```typescript
// payment/[tableId]/page.tsx — CHANGE back button destination

const isQueueOrder = !!useQueueStore.getState().getOrder(tableId)
const backDestination = isQueueOrder ? '/queue' : '/table-map'
```

Also add `queue.store.markCompleted(tableId)` inside `handleConfirmPayment()` after the existing cleanup, guarded by `isQueueOrder`.

#### New Route: /queue (new page in (app) route group)

```
(app) /queue   — delivery/takeaway queue board
```

Shows pending delivery orders from simulated Grab/LINE MAN, active takeaway orders, and per-card actions: Confirm, Cancel, Mark Ready, Proceed to Payment.

Access: Waiter, Cashier, Manager (same scope as table-map). Add `'queue'` to the `NavSlug` union and `ROLE_NAV_ACCESS` entries accordingly.

---

### Floor Plan Tabbed View

#### Structure

Convert `table-map/page.tsx` from a single-panel view to a tabbed view:

```
/table-map
├── [Tab: Dine-in]   — existing TableGrid (default; unchanged)
├── [Tab: Takeaway]  — TakeawayPanel (active TK orders)
└── [Tab: Delivery]  — DeliveryPanel (pending + active DL orders)
```

Use the existing `shadcn/ui Tabs` component (`src/components/ui/tabs.tsx`). Tab state is `useState` local to `table-map/page.tsx`, defaulting to `'dine-in'`. No persistence needed; reopening the page always shows the floor plan.

Show active order counts as badge overlays on the Takeaway and Delivery tab triggers so staff can see pending work at a glance without switching tabs.

#### Component Hierarchy

```
table-map/page.tsx
├── <Tabs defaultValue="dine-in">
│   ├── TabsList
│   │   ├── TabsTrigger "dine-in"    "Dine-in"
│   │   ├── TabsTrigger "takeaway"   "Takeaway  [N]"  (count badge)
│   │   └── TabsTrigger "delivery"   "Delivery  [N]"  (count badge)
│   ├── TabsContent "dine-in"   → <TableGrid onTableTap={...} />  (unchanged)
│   ├── TabsContent "takeaway"  → <TakeawayPanel />
│   └── TabsContent "delivery"  → <DeliveryPanel />
```

**No changes to `TableGrid`, `TableTile`, `TableBottomSheet`, or `OpenTableModal`.** The tab wrapper is purely additive — all dine-in paths are untouched.

---

### KDS Integration

#### Extend KdsTicket With orderType

```typescript
// src/stores/kds.store.ts — EXTEND KdsTicket

export type KdsOrderType = 'dine-in' | 'takeaway' | 'delivery'

export interface KdsTicket {
  ticketId: string
  tableId: string
  tableLabel: string           // TK: 'TK-001 · John'   DL: 'Grab · #7821'
  orderType: KdsOrderType      // NEW
  platform?: DeliveryPlatform  // NEW — present only when orderType === 'delivery'
  addedAt: number
  stage: KdsStage
  checkedItems: Set<string>
}
```

`tableLabel` already renders on the KDS ticket card header — it becomes a natural differentiator (`Grab · #7821` vs `T04`). Add a small colored `Badge` pill next to the label showing order type. The existing `Badge` component variants are sufficient.

#### KdsBoard Auto-Registration — No Change Needed

`KdsBoard`'s `useEffect` already auto-registers any order in `order.store` that has a sent round and no existing ticket. This works for TK/DL orders unchanged. The one change at the call site: when `sendRound` triggers `addTicket`, pass `orderType` and optionally `platform`, derived from the order's `context` field.

#### KdsTicketCard Write-back to queue.store

`KdsTicketCard.handleBump()` currently writes back to `table.store` when advancing stages. For delivery/takeaway tickets, `ticket.tableId` is not in `table.store` — the write is a no-op (safe). Add a conditional:

```typescript
// KdsTicketCard.handleBump() — ADD after existing table.store writes

if (ticket.orderType !== 'dine-in' && currentStage === 'InProgress') {
  // Bumping InProgress → Ready means food is ready for pickup or rider
  useQueueStore.getState().markReady(ticket.tableId)
}
```

No changes to bump logic itself — only an additional side-effect for non-dine-in orders.

---

### Component Boundaries Summary

| Component | Change Type | What Changes |
|-----------|-------------|--------------|
| `table-map/page.tsx` | Modified | Wrap in Tabs; add TakeawayPanel + DeliveryPanel in new TabsContent slots |
| `TableGrid.tsx` | No change | Unchanged |
| `TableTile.tsx` | No change | Unchanged |
| `TableBottomSheet.tsx` | No change | Unchanged |
| `OpenTableModal.tsx` | No change | Unchanged |
| `order/[tableId]/page.tsx` | Modified | Null-safe header label fallback to queue.store |
| `payment/[tableId]/page.tsx` | Modified | Back button conditional + queue.store.markCompleted on confirm |
| `KdsTicketCard.tsx` | Modified | Write-back to queue.store on Ready bump for non-dine-in orders |
| `KdsBoard.tsx` | Modified | Pass orderType when calling addTicket (derive from order context) |
| `kds.store.ts` | Modified | Add `orderType` + `platform` fields to KdsTicket; update `addTicket` signature |
| `order.store.ts` | Modified | Add optional `context?: OrderContext` to `ActiveOrder` |
| `role-permissions.ts` | Modified | Add `'queue'` to NavSlug; add `'new-takeaway'` ActionKey |
| `queue.store.ts` | New file | Full queue lifecycle for delivery/takeaway |
| `TakeawayPanel.tsx` | New component | List of active TK orders with action buttons |
| `DeliveryPanel.tsx` | New component | Pending/active DL orders; simulated inbound |
| `QueueOrderCard.tsx` | New component | Single order card (shared by both panels) |
| `NewTakeawayModal.tsx` | New component | Modal to capture customer name + phone for walk-in TK |
| `/queue/page.tsx` | New page | Dedicated queue view in (app) route group |

---

### Data Flow: Delivery Order

```
Simulated Grab order arrives
  → queue.store.addOrder({ type: 'delivery', platform: 'Grab', status: 'Pending', ... })
  → DeliveryPanel shows new Pending card

Staff taps "Confirm" on DeliveryPanel
  → queue.store.confirmOrder(orderId, staffId)
  → router.push('/order/DL-grab-7821')

Staff enters items at /order/DL-grab-7821
  → order.store.addItem('DL-grab-7821', item)    [identical to dine-in]

Staff sends round
  → order.store.sendRound('DL-grab-7821')
  → kds.store.addTicket('DL-grab-7821', 'Grab · #7821', { orderType: 'delivery', platform: 'Grab' })
    [via KdsBoard useEffect — auto-registration unchanged]

Kitchen bumps InProgress → Ready
  → kds.store.bumpTicket(ticketId)
  → queue.store.markReady('DL-grab-7821')         [new KdsTicketCard write-back]

Staff processes payment at /payment/DL-grab-7821
  → order.store.clearOrder('DL-grab-7821')
  → queue.store.markCompleted('DL-grab-7821')
  → router.push('/queue')                          [back destination conditional]
```

### Data Flow: Takeaway Order

```
Staff taps "New Takeaway" on /table-map Takeaway tab
  → NewTakeawayModal: enter customer name + phone
  → queue.store.addOrder({ type: 'takeaway', status: 'Confirmed', orderId: 'TK-001', ... })
  → router.push('/order/TK-001')

Order entry, send round, KDS bump — identical to dine-in flow above

Payment at /payment/TK-001 — identical to dine-in
  → queue.store.markCompleted('TK-001')
  → router.push('/queue')
```

---

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Parallel queue-order.store

**What it is:** Creating a separate store that mirrors `order.store` logic but for TK/DL orders.
**Why bad:** Doubles all order line item logic. KdsBoard would need to union two ticket sources. bill.store split logic would need to be duplicated. All future features (e.g., discount engine) would need to be applied twice.
**Instead:** Use `order.store` with string-prefixed keys (`TK-001`, `DL-grab-7821`). The key space is already free-form.

#### Anti-Pattern 2: Storing orderType in table.store

**What it is:** Adding `orderType: 'dine-in' | 'takeaway' | 'delivery'` to `TableRecord`.
**Why bad:** `table.store` is organized around physical tables. Delivery/takeaway orders have no table. Forcing non-table orders into `table.store` creates phantom records with a meaningless status lifecycle — what does `TableStatus: Cleaning` mean for a delivery order?
**Instead:** Keep `table.store` dine-in only. `queue.store` owns delivery/takeaway records.

#### Anti-Pattern 3: Selector returning new array from queue.store

**What it is:** `useQueueStore((s) => s.getOrdersByType('delivery'))` — a function returning a new array inside a Zustand selector.
**Why bad:** Causes `useSyncExternalStore` infinite loop (documented in CLAUDE.md).
**Instead:** Select the raw `orders` record, derive filtered list in `useMemo`.

```typescript
// ✗ infinite loop
const deliveryOrders = useQueueStore((s) => s.getOrdersByType('delivery'))

// ✓ stable
const allQueueOrders = useQueueStore((s) => s.orders)
const deliveryOrders = useMemo(
  () => Object.values(allQueueOrders).filter((o) => o.type === 'delivery'),
  [allQueueOrders],
)
```

#### Anti-Pattern 4: Separate KDS board for delivery/takeaway

**What it is:** A second KDS view at `/kds/delivery` showing only delivery tickets.
**Why bad:** Kitchen staff sees a fragmented board. Timing and priority context is lost when orders are siloed by type.
**Instead:** Single KDS board showing all ticket types. Visual `orderType` tag badge on `KdsTicketCard` provides context without splitting the board. If density becomes an issue, add filter pills (All / Dine-in / Delivery) in the KDS header — not a second route.

---

### Build Order (Phase Dependency Graph)

```
Phase A: queue.store + types  (no UI — foundation only)
  Deliverables:
    - src/stores/queue.store.ts  (QueueOrder, QueueOrderStatus, all actions)
    - OrderContext type added to order.store.ActiveOrder  (optional field — zero regression)
    - KdsTicket extended with orderType + platform  (addTicket signature updated)
    - role-permissions.ts: add 'queue' NavSlug, 'new-takeaway' ActionKey
  Dependency: none
  Risk: LOW — purely additive; zero existing code paths change behavior

Phase B: Floor plan tabbed view + queue entry UI
  Deliverables:
    - table-map/page.tsx wrapped in Tabs  (Dine-in tab unchanged)
    - src/components/queue/TakeawayPanel.tsx
    - src/components/queue/DeliveryPanel.tsx
    - src/components/queue/QueueOrderCard.tsx
    - src/components/queue/NewTakeawayModal.tsx
    - src/app/(app)/queue/page.tsx  (dedicated queue view)
    - Simulated delivery injection button in DeliveryPanel (mirrors KDS demo mode)
  Dependency: Phase A  (queue.store must exist)
  Risk: LOW-MEDIUM — table-map change is additive; all dine-in components untouched

Phase C: Order entry + payment context awareness
  Deliverables:
    - order/[tableId]/page.tsx: null-safe header label fallback to queue.store
    - payment/[tableId]/page.tsx: back button conditional + queue.store.markCompleted
    - KdsTicketCard.tsx: write-back to queue.store on Ready bump
    - KdsBoard.tsx: pass orderType to addTicket (derived from order context)
  Dependency: Phase B  (need TK/DL orders flowing into order entry to verify end-to-end)
  Risk: LOW — targeted changes to two pages and two components

Phase D: KDS order type tags  (visual polish)
  Deliverables:
    - KdsTicketCard.tsx: orderType tag Badge in ticket header
  Dependency: Phase A (KdsTicket type) + Phase C (full stack working end-to-end)
  Risk: LOW — display-only; no data model changes
```

**Rationale for this order:**
- Phase A first because all other phases import from `queue.store` and the new type definitions
- Phase B before Phase C because Phase B generates the orderId that Phase C handles in URL params
- Phase C before Phase D because visual tags are only meaningful once orders flow through the full stack
- Each phase produces an independently verifiable deliverable

---

## Scalability Considerations

| Concern | In wireframe | At production scale |
|---------|--------------|---------------------|
| Order ID collisions | Prefix + counter (`TK-001`, `DL-grab-7821`) | UUID or platform-provided canonical ID |
| Simulated delivery inbound | `injectSimulatedDelivery()` triggered by button press | Webhook or platform SDK (Grab Food API, LINE MAN API) |
| Multi-platform delivery | `platform` field on `QueueOrder` is sufficient | Platform-specific SLA timers, auto-dispatch |
| Queue density | localStorage; fine for wireframe | Pagination, archival, real-time sync across terminals |
| KDS ticket count | All order types on one board | Filter pills (All / Dine-in / Delivery) in KDS header |
| Payment flow for TK/DL | Reuse existing `/payment/[tableId]` | May need separate counter-side payment UX at scale |

---

## New vs Modified: Explicit Summary

### New Files (v1.3)

| File | Type | Purpose |
|------|------|---------|
| `src/stores/queue.store.ts` | Zustand store (persist) | Delivery/takeaway queue lifecycle |
| `src/app/(app)/queue/page.tsx` | Route page | Dedicated queue view |
| `src/components/queue/TakeawayPanel.tsx` | Component | TK order list with action buttons |
| `src/components/queue/DeliveryPanel.tsx` | Component | DL order list with simulated inbound |
| `src/components/queue/QueueOrderCard.tsx` | Component | Single queue order card (shared) |
| `src/components/queue/NewTakeawayModal.tsx` | Component | Walk-in takeaway creation modal |

### Modified Files (v1.3)

| File | Change | Scope |
|------|--------|-------|
| `src/stores/order.store.ts` | Add optional `context?: OrderContext` to `ActiveOrder` | Tiny — one optional field |
| `src/stores/kds.store.ts` | Add `orderType` + `platform` to `KdsTicket`; update `addTicket` signature | Small — two fields, one param |
| `src/app/(app)/table-map/page.tsx` | Wrap in Tabs; add new TabsContent panels | Small — additive wrapper |
| `src/app/(app)/order/[tableId]/page.tsx` | Null-safe header label fallback to queue.store | Tiny — 3-line conditional |
| `src/app/(app)/payment/[tableId]/page.tsx` | Back button conditional + queue.store.markCompleted | Small — two conditionals |
| `src/components/kds/KdsTicketCard.tsx` | Write-back to queue.store on Ready bump | Small — one conditional block |
| `src/components/kds/KdsBoard.tsx` | Pass orderType when calling addTicket | Small — derive from order context |
| `src/lib/role-permissions.ts` | Add `'queue'` NavSlug; add `'new-takeaway'` ActionKey | Tiny — 4 line additions |

### Files NOT Modified (v1.3)

| File | Why Unchanged |
|------|---------------|
| `src/stores/table.store.ts` | Dine-in only; delivery/takeaway does not create table records |
| `src/stores/bill.store.ts` | Works with any string ID; no changes needed for TK/DL |
| `src/stores/session.store.ts` | No auth changes |
| `src/stores/manager.store.ts` | No manager data changes |
| `src/components/table-map/TableGrid.tsx` | Inside the Dine-in tab — untouched |
| `src/components/table-map/TableTile.tsx` | Dine-in only component |
| `src/components/table-map/TableBottomSheet.tsx` | Dine-in only component |
| `src/components/table-map/OpenTableModal.tsx` | Dine-in only component |
| `src/components/order/*` | Menu panel, modifier sheet, ticket panel — untouched |
| `src/components/payment/*` | All payment components — untouched |

---

## Sources

- Direct inspection of `src/stores/order.store.ts` — `ActiveOrder` keyed by opaque string; store is ID-agnostic (HIGH confidence)
- Direct inspection of `src/stores/kds.store.ts` — `KdsTicket.tableId` is a string; `addTicket` is location-agnostic (HIGH confidence)
- Direct inspection of `src/components/kds/KdsBoard.tsx` — `useEffect` auto-registration loop iterates all `order.store` entries by string key; confirmed ID-agnostic (HIGH confidence)
- Direct inspection of `src/components/kds/KdsTicketCard.tsx` — `handleBump()` calls `useTableStore.getState().updateTable(ticket.tableId, ...)`; non-existent tableId write is a no-op (HIGH confidence)
- Direct inspection of `src/components/table-map/TableGrid.tsx` — reads only from `table.store`; no coupling to queue domain (HIGH confidence)
- Direct inspection of `src/app/(app)/order/[tableId]/page.tsx` — header label reads `table.store.tables[tableId]`; returns undefined for non-table IDs (HIGH confidence)
- Direct inspection of `src/app/(app)/payment/[tableId]/page.tsx` — back button hardcoded to `/table-map`; conditional needed for queue orders (HIGH confidence)
- Direct inspection of `src/lib/role-permissions.ts` — `NavSlug` union and `ROLE_NAV_ACCESS` map; `'queue'` slug needs to be added (HIGH confidence)
- Direct inspection of `src/components/ui/tabs.tsx` — Tabs component exists and uses Base UI; safe to use for floor plan tab switcher (HIGH confidence)
- CLAUDE.md — Zustand selector infinite loop pattern documented; applied to anti-patterns section (HIGH confidence)
- CLAUDE.md — `useXStore.getState()` non-reactive read pattern for static values (HIGH confidence)

---
*v1.2 architecture researched: 2026-03-12*
*v1.3 delivery/takeaway section researched: 2026-03-15*
