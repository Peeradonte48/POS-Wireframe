# Architecture Patterns

**Domain:** POS bill management + digital order tracking (v1.2 features)
**Researched:** 2026-03-12
**Confidence:** HIGH (all findings derived from direct source code inspection of existing stores, pages, and components)

---

## Current Architecture Snapshot

### Existing Stores

| Store | Persist | Key Data | Key Actions |
|-------|---------|----------|-------------|
| `order.store` | Yes | `orders: Record<tableId, ActiveOrder>` -- rounds with items, modifiers, spiceLevel, status | addItem, editItem, removeItem, sendRound, voidItem |
| `table.store` | Yes | `tables: Record<tableId, TableRecord>` -- status, guestCount, openedAt, orderStage, servedAt, paymentMethod | openTable, markServed, markCleaning, markClean, updateTable |
| `kds.store` | No | `tickets: Record<ticketId, KdsTicket>` -- stage (New/InProgress/Ready), checkedItems Set | addTicket, bumpTicket, checkItem, recallTicket |
| `session.store` | No | role, staffName, staffId, branch, shiftOpen | login, openShift, logout |
| `manager.store` | Yes | eightySixedIds, shiftClosed | toggleEightySix, closeShift |

### Current Data Flow

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

### Critical Architectural Constraints

1. **order.store is keyed by tableId** -- all items for a table live under one `ActiveOrder`
2. **Payment page reads order.store directly** -- flattens all rounds into `billItems`, calculates subtotal/VAT/grandTotal inline
3. **No concept of "seat" exists anywhere** -- guests are a count (`guestCount: number`), not individual entities
4. **KDS tickets are disconnected from order line items** -- `addTicket(tableId, tableLabel)` takes no item data; `checkedItems` contains lineIds only when kitchen staff manually checks them
5. **table.store has a single `orderStage`** -- one stage per table, not per-item tracking
6. **TotalsSection has a disabled "Split Bill -> v2" placeholder** -- explicit insertion point for split bill feature

---

## Recommended Architecture for v1.2

### Design Principle: Extend, Don't Rewrite

The existing stores work well for their current scope. The v1.2 features layer on top without restructuring the core data model. This is a wireframe -- add just enough structure to demonstrate the UX, not build a production billing engine.

---

### Component 1: Split Bill

#### Approach: New `bill.store` with split configuration

**Do NOT modify `order.store`.** Order data (rounds, items, modifiers) stays untouched. Split bill is a *view layer* on top of order data -- it determines how existing line items are grouped for payment.

#### New Store: `bill.store.ts` (persist: yes)

```typescript
type SplitMode = 'full' | 'equal' | 'per-seat'

interface SeatAssignment {
  seatNumber: number       // 1-based seat index
  lineIds: string[]        // order line item IDs assigned to this seat
}

interface BillSplit {
  tableId: string
  mode: SplitMode
  equalParts: number                // used when mode === 'equal' (defaults to guestCount)
  seats: SeatAssignment[]           // used when mode === 'per-seat'
  paidSeats: number[]               // seat numbers that have completed payment
}

interface MergeGroup {
  mergeId: string
  tableIds: string[]                // all participating tables
  primaryTableId: string            // the table where payment happens
}

interface BillStore {
  splits: Record<string, BillSplit>        // keyed by tableId
  mergeGroups: Record<string, MergeGroup>  // keyed by mergeId
  tableMergeMap: Record<string, string>    // tableId -> mergeId (reverse lookup)

  // Split actions
  initSplit: (tableId: string, mode: SplitMode, guestCount: number) => void
  setEqualParts: (tableId: string, parts: number) => void
  assignItemToSeat: (tableId: string, lineId: string, seatNumber: number) => void
  unassignItem: (tableId: string, lineId: string) => void
  markSeatPaid: (tableId: string, seatNumber: number) => void
  unsplit: (tableId: string) => void
  clearSplit: (tableId: string) => void

  // Merge actions
  createMerge: (primaryTableId: string, secondaryTableIds: string[]) => void
  addTableToMerge: (mergeId: string, tableId: string) => void
  removeTableFromMerge: (mergeId: string, tableId: string) => void
  dissolveMerge: (mergeId: string) => void
}
```

**Why a separate store instead of extending order.store:**
- Split bill is a payment-phase concern, not an ordering concern. Mixing them couples two distinct lifecycle phases.
- `order.store` updates are frequent during ordering; bill splits are infrequent and only during checkout.
- Keeps the existing `sendRound` / `addItem` flow untouched -- zero regression risk.
- Unsplit/resplit operations only touch `bill.store`, never order data.

#### How Equal Split Works

No seat assignments needed. The payment page divides `grandTotal / equalParts` and tracks which "share" has been paid. `paidSeats` tracks completion (seats 1..N where N = equalParts). Staff pays one share at a time, each with independent payment method selection.

#### How Per-Seat Split Works

1. Staff taps "Split Bill" on payment screen
2. Staff selects "By Seat" mode
3. UI shows all line items (from `order.store`) in a tap-to-assign view
4. Staff taps items, then taps a seat number to assign
5. Unassigned items remain in a "shared" bucket (seat 0) -- split equally among seats at payment time
6. Each seat gets its own subtotal, VAT calculation, and payment flow
7. `paidSeats` tracks completion; when all seats paid, table transitions to Cleaning

#### Integration with Existing Payment Page

The existing `payment/[tableId]/page.tsx` calculates `billItems` by flattening all rounds. This stays the same for `mode: 'full'`. For split modes:

- **Equal:** Same billItems list displayed once as reference, but grandTotal shown as `grandTotal / equalParts`. Add a "Paying share X of Y" header and a seat navigator component.
- **Per-seat:** Filter `billItems` by `seats[currentSeat].lineIds`. Display only that seat's items with seat-specific subtotal/VAT/total.

The payment page gains a `currentSeat` local state (useState) and reads `bill.store` to determine rendering mode.

---

### Component 2: Merge Bill

#### Approach: `mergeGroups` in the same `bill.store`

Merge bill combines orders from multiple tables into one payment. Common for party seating where a group spans 2-3 adjacent tables.

#### How It Works

1. Staff selects "Merge Tables" from the table bottom sheet (Occupied state) or from the payment screen header
2. A table picker modal shows other Occupied tables
3. Staff selects tables to merge; system creates a `MergeGroup` with the initiating table as primary
4. Payment page for `primaryTableId` aggregates `order.store` items from ALL `tableIds` in the group
5. When payment confirmed, ALL tables in the merge group transition to Cleaning/Billed
6. `bill.store` merge data is cleaned up

#### Integration with Existing Stores

**table.store: No changes.** Each table keeps its own `TableRecord`. Merge-related visual indicators (e.g., "T01 + T02" badge) are derived from `bill.store.tableMergeMap` using a selector -- no new fields on `TableRecord`.

**order.store: No changes.** Each table keeps its own `ActiveOrder`. The merge is a payment-time read aggregation:

```typescript
// In payment page:
const mergeId = useBillStore(s => s.tableMergeMap[tableId])
const mergeGroup = useBillStore(s => mergeId ? s.mergeGroups[mergeId] : null)
const allTableIds = mergeGroup ? mergeGroup.tableIds : [tableId]
const billItems = allTableIds.flatMap(id => {
  const order = useOrderStore.getState().getOrder(id)
  return order ? order.rounds.flatMap(r => r.items).filter(i => i.status !== 'voided') : []
})
```

#### Unsplit (Dissolve Previously Split Bill)

"Unsplit" means reverting a split back to full-table billing. This is `bill.store.unsplit(tableId)` which resets mode to `'full'` and clears seat assignments / paidSeats. If any seats were already paid, the unsplit should warn the user (handled in UI, not store logic).

#### Merge + Split Interaction

A merged bill CAN be split. The `BillSplit` for the primary table operates over the aggregated item set from all merged tables. This naturally composes because split works on lineIds, and merged items just expand the pool of available lineIds.

---

### Component 3: Digital Order Tracking

#### Approach: Bridge `kds.store` stages back to order items via derivation

Currently, KDS tickets are disconnected from order line items. Digital order tracking needs per-item stage visibility on the floor plan.

#### Strategy: Derive item stages from existing stores

Rather than adding a `stage` field to `OrderLineItem` (which would require keeping it in sync with KDS), use a **pure derivation function**:

```typescript
// New file: src/lib/order-tracking.ts

type ItemTrackingStage = 'Queued' | 'Cooking' | 'Ready' | 'Served'

interface TrackedItem {
  lineId: string
  menuItemName: string
  quantity: number
  stage: ItemTrackingStage
  sentAt: number | null
}

function deriveItemStages(
  tableId: string,
  order: ActiveOrder,
  kdsTickets: Record<string, KdsTicket>,
  servedAt: number | null
): TrackedItem[]
```

**Why derive instead of duplicate state:**
- KDS is the source of truth for cooking stages. Duplicating into order.store creates sync bugs.
- `kds.store` is non-persisted (ephemeral), which is correct for a wireframe. Derivation respects this.
- The derivation function gracefully handles missing KDS data (items show as "Queued" by default).

#### The Derivation Logic

For each sent line item in the order:
1. If `item.status === 'unsent'` -> `Queued`
2. Find KDS ticket(s) for this table by scanning `kdsTickets` for matching `tableId`
3. If no ticket found -> `Queued` (sent to kitchen but KDS cleared)
4. If ticket `stage === 'New'` -> `Queued`
5. If ticket `stage === 'InProgress'` and item lineId is in `checkedItems` -> `Cooking`
6. If ticket `stage === 'InProgress'` and item NOT in checkedItems -> `Queued`
7. If ticket `stage === 'Ready'` -> `Ready`
8. If `servedAt !== null` (from table.store) -> `Served`

#### Required KDS Store Enhancement

The one structural gap: `kds.store.addTicket` currently takes only `(tableId, tableLabel)` with no item references. The `checkedItems` Set uses lineIds, but these are only populated by kitchen staff interaction.

For digital tracking to map items to tickets, add item references to KDS tickets:

```typescript
// Add to KdsTicket interface
interface KdsLineRef {
  lineId: string
  menuItemName: string
  quantity: number
}

export interface KdsTicket {
  // ... existing fields ...
  items: KdsLineRef[]        // NEW: references to order line items
}
```

**Modified `addTicket` signature:**
```typescript
addTicket: (tableId: string, tableLabel: string, items: KdsLineRef[]) => void
```

This is the ONE modification to an existing store interface. The call site where `sendRound` triggers `addTicket` passes the round's items array.

#### Enhanced Table Tile Badge

Currently `TableTile` shows `table.orderStage` as a simple outline badge. For digital tracking, derive the aggregate stage from all items:

```typescript
// Derive aggregate stage for table tile badge
function getTableAggregateStage(trackedItems: TrackedItem[]): string | null {
  if (trackedItems.length === 0) return null
  if (trackedItems.every(i => i.stage === 'Served')) return 'Served'
  if (trackedItems.every(i => i.stage === 'Ready' || i.stage === 'Served')) return 'Ready'
  if (trackedItems.some(i => i.stage === 'Cooking')) return 'Cooking'
  return 'Ordered'
}
```

The `TableTile` badge changes from reading `table.orderStage` directly to calling this derivation. No `table.store` modification needed -- the badge becomes a computed view.

#### Per-Item Timeline View

New component accessible from the table bottom sheet (Occupied state). Replaces or supplements the existing "View Order" button:

- Shows each item with its current stage as a colored icon
- Stage progression: Queued (gray) -> Cooking (amber) -> Ready (green) -> Served (muted)
- Timestamp shown from `round.sentAt` (when the order was sent to kitchen)
- Elapsed time since sent, computed live

For the wireframe, full timestamp history per stage transition would require an event log store -- that is overkill. Use `sentAt` as the base timestamp and show elapsed time. Stage transitions happen via KDS bump, which is real-time in the demo.

---

## Component Boundaries

| Component | Responsibility | Reads From | Writes To |
|-----------|---------------|------------|-----------|
| `bill.store` (NEW) | Split config, merge groups, seat payment tracking | -- | localStorage (persist) |
| `order-tracking.ts` (NEW) | Derive per-item stages from kds + order data | kds.store, order.store, table.store | -- (pure function) |
| `order.store` (UNCHANGED) | Order rounds, line items, modifiers | localStorage | localStorage |
| `table.store` (UNCHANGED) | Table status, guest count, order stage | localStorage | localStorage |
| `kds.store` (MODIFIED: items added to ticket) | Kitchen tickets with item refs | -- | memory |
| `session.store` (UNCHANGED) | Auth, shift state | -- | memory |
| `manager.store` (UNCHANGED) | 86'd items, shift close | localStorage | localStorage |

### New UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SplitBillSheet` | `src/components/payment/SplitBillSheet.tsx` | Bottom sheet for choosing split mode (equal/per-seat) |
| `SeatNavigator` | `src/components/payment/SeatNavigator.tsx` | Tab/pill bar for switching between seats during split payment |
| `SeatAssignmentView` | `src/components/payment/SeatAssignmentView.tsx` | Tap-to-assign UI for per-seat item allocation |
| `MergeTablePicker` | `src/components/payment/MergeTablePicker.tsx` | Modal showing occupied tables available for merge |
| `OrderTimeline` | `src/components/table-map/OrderTimeline.tsx` | Per-item stage timeline in table bottom sheet |

### Modified UI Components

| Component | Change | Scope |
|-----------|--------|-------|
| `payment/[tableId]/page.tsx` | Read bill.store for split/merge mode, seat navigation, merged item aggregation | Medium |
| `TotalsSection.tsx` | Remove "Split Bill -> v2" placeholder, add split mode trigger button | Small |
| `TableTile.tsx` | Replace static `orderStage` badge with derived stage badge from order-tracking.ts | Small |
| `TableBottomSheet.tsx` | Add "Merge Tables" button (Occupied state), add OrderTimeline panel | Medium |
| `role-permissions.ts` | Add `'split-bill'` and `'merge-tables'` ActionKey entries | Small |

---

## Data Flow Diagrams

### Split Bill Flow

```
Payment Page loads
  |
Read bill.store.splits[tableId]
  |
No split (mode === 'full')? -> Show full bill (current behavior, unchanged)
  |
mode === 'equal'?
  -> Display grandTotal / equalParts
  -> SeatNavigator shows "Share 1 of N"
  -> Each share has independent payment method
  -> markSeatPaid on confirm
  |
mode === 'per-seat'?
  -> Filter billItems by seats[currentSeat].lineIds
  -> Display seat-specific subtotal/VAT/total
  -> SeatNavigator shows "Seat 1 of N"
  -> markSeatPaid on confirm
  |
All seats paid?
  YES -> table.store.markCleaning + orderStage: 'Billed' (existing flow)
  NO  -> Advance to next unpaid seat
```

### Merge Bill Flow

```
TableBottomSheet (Occupied) -> "Merge Tables" button
  |
MergeTablePicker modal -> staff selects other occupied tables
  |
bill.store.createMerge(primaryTableId, [secondary1, secondary2])
  |
Navigate to payment/[primaryTableId]
  |
Payment page detects merge via bill.store.tableMergeMap[tableId]
  |
Aggregates billItems from ALL tableIds in merge group
  |
Calculates combined subtotal/VAT/grandTotal
  |
Confirm payment -> ALL tables in group -> Cleaning/Billed
  |
bill.store.dissolveMerge + clearSplit for all tables
```

### Digital Order Tracking Flow

```
Staff sends order:
  order.store.sendRound(tableId) marks items as 'sent'
  |
  kds.store.addTicket(tableId, label, items)   <- items array is NEW
  |
Kitchen works the ticket:
  bumpTicket: New -> InProgress
  checkItem: marks individual lineIds as checked
  bumpTicket: InProgress -> Ready
  |
Floor plan reads derived state:
  deriveItemStages() reads kds.store tickets + order.store items
  |
  TableTile: shows aggregated badge ("Cooking", "Ready", etc.)
  TableBottomSheet OrderTimeline: shows per-item stage list
```

---

## New vs Modified: Explicit Summary

### New Files to Create

| File | Type | Persist | Purpose |
|------|------|---------|---------|
| `src/stores/bill.store.ts` | Zustand store | Yes | Split config, merge groups, seat payment tracking |
| `src/lib/order-tracking.ts` | Pure utility | N/A | Derive per-item stages from kds + order stores |
| `src/components/payment/SplitBillSheet.tsx` | Component | N/A | Split mode selection bottom sheet |
| `src/components/payment/SeatNavigator.tsx` | Component | N/A | Seat/share tab bar during split payment |
| `src/components/payment/SeatAssignmentView.tsx` | Component | N/A | Tap-to-assign items to seats |
| `src/components/payment/MergeTablePicker.tsx` | Component | N/A | Modal for selecting tables to merge |
| `src/components/table-map/OrderTimeline.tsx` | Component | N/A | Per-item stage timeline view |

### Existing Files to Modify

| File | Change | Scope of Change |
|------|--------|-----------------|
| `src/stores/kds.store.ts` | Add `items: KdsLineRef[]` to `KdsTicket` interface, update `addTicket` to accept items param | Small -- one interface field, one function param |
| `src/app/(app)/payment/[tableId]/page.tsx` | Read `bill.store` for split/merge, add seat navigation, aggregate merged table items | Medium -- conditional rendering paths for 3 bill modes |
| `src/components/payment/TotalsSection.tsx` | Remove disabled "Split Bill -> v2" placeholder, add working split trigger button | Small -- swap one button |
| `src/components/table-map/TableTile.tsx` | Replace static `table.orderStage` badge with derived tracking stage | Small -- swap badge data source |
| `src/components/table-map/TableBottomSheet.tsx` | Add "Merge Tables" button in Occupied state, add OrderTimeline section | Medium -- two new sections |
| `src/lib/role-permissions.ts` | Add `'split-bill'` and `'merge-tables'` to ActionKey union and ACTION_PERMISSIONS | Small -- 4 line additions |
| Call site for `kds.store.addTicket` | Pass items array from the round being sent | Small -- one call site, pass extra arg |

### Files NOT Modified

| File | Why Unchanged |
|------|---------------|
| `src/stores/order.store.ts` | Split/merge are payment-phase views, not order-phase mutations. Seat assignments live in bill.store. |
| `src/stores/table.store.ts` | orderStage badge is now derived; no new fields needed on TableRecord. |
| `src/stores/session.store.ts` | No auth changes for v1.2. |
| `src/stores/manager.store.ts` | No manager data changes. |
| `src/app/(app)/order/[tableId]/page.tsx` | Order entry flow is entirely unchanged. |
| `src/components/order/*` | Menu panel, modifier sheet, ticket panel -- all untouched. |

---

## Patterns to Follow

### Pattern 1: Derived Selectors Over Duplicated State

**What:** Compute values from existing stores rather than syncing duplicate fields across stores.

**When:** One store's data can be computed from another's (e.g., item tracking stages from KDS + order data).

**Example:**
```typescript
// GOOD: derive in a utility function
function getTableTrackingStage(tableId: string): OrderStage | null {
  const items = deriveItemStages(tableId, ...)
  if (items.length === 0) return null
  if (items.every(i => i.stage === 'Served')) return 'Served'
  if (items.every(i => i.stage === 'Ready')) return 'Ready'
  if (items.some(i => i.stage === 'Cooking')) return 'Cooking'
  return 'Ordered'
}

// BAD: write stage to both kds.store AND table.store and keep in sync
```

### Pattern 2: Separate Store for Separate Lifecycle

**What:** Payment-phase data (splits, merges) lives in its own store, not in order or table stores.

**When:** Data has a different creation/deletion lifecycle than existing store data. Orders are created during dining; splits during checkout.

**Why:** Coupling means order mutations could corrupt split state and vice versa. The bill store can be cleared independently when payment completes.

### Pattern 3: Cleanup on Table Close

**What:** When table transitions to Cleaning or Open, clear all associated bill data.

**When:** Always, as part of the existing `handleConfirmPayment` flow.

**Example:**
```typescript
function handleConfirmPayment() {
  // ... existing payment logic ...
  markCleaning(tableId)
  updateTable(tableId, { orderStage: 'Billed' })

  // NEW: cleanup bill data for this table and any merge group
  const { clearSplit, dissolveMerge, tableMergeMap } = useBillStore.getState()
  const mergeId = tableMergeMap[tableId]
  if (mergeId) {
    // Clean all tables in the merge group
    const group = useBillStore.getState().mergeGroups[mergeId]
    group.tableIds.forEach(id => {
      if (id !== tableId) {
        markCleaning(id)
        updateTable(id, { orderStage: 'Billed' })
      }
      clearSplit(id)
    })
    dissolveMerge(mergeId)
  }
  clearSplit(tableId)
}
```

### Pattern 4: Reference by ID, Don't Copy Data

**What:** Bill store references order items by `lineId`, never copies item data. Merge group references tables by `tableId`, never copies order data.

**When:** Always. The source of truth for items is `order.store`; the source of truth for tables is `table.store`.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Seat Assignments in order.store

**What:** Adding a `seatNumber` field to `OrderLineItem`.

**Why bad:** Couples ordering and billing. Items are ordered before seats are assigned. If staff reorders mid-meal, the seat assignment is irrelevant. Creates nullable fields that complicate every order operation.

**Instead:** Keep seat assignments in `bill.store` as a mapping layer referencing lineIds.

### Anti-Pattern 2: Duplicating Order Items for Each Seat

**What:** Creating separate copies of `OrderLineItem` per seat in the split.

**Why bad:** Two sources of truth for the same item. If an item is voided after splitting, both copies must be updated.

**Instead:** Reference items by `lineId` in `SeatAssignment`. Bill store points to items in order store.

### Anti-Pattern 3: Moving Order Data During Merge

**What:** Moving `OrderLineItem`s from secondary tables into the primary table's `ActiveOrder`.

**Why bad:** Destructive operation. If the merge is dissolved, items cannot be cleanly returned to their original tables. Table-to-order mapping breaks.

**Instead:** Keep orders in their original tables. Merge group aggregates at read time only.

### Anti-Pattern 4: Per-Item Stage in table.store

**What:** Adding an `itemStages` map to `TableRecord`.

**Why bad:** `table.store` persists to localStorage; KDS data is ephemeral (no persist). Mixing persisted and ephemeral lifecycle data causes stale stages after page reload.

**Instead:** Derive stages from live `kds.store` state via utility function. Stages are always fresh.

### Anti-Pattern 5: Creating a Separate Tracking Store

**What:** Making a new `tracking.store` that mirrors KDS state with per-item granularity.

**Why bad:** Duplicates KDS as source of truth. Every `bumpTicket` and `checkItem` would need to also update the tracking store. Two stores to keep in sync for no benefit.

**Instead:** Pure derivation function reads from existing stores. Zero sync overhead.

---

## Suggested Build Order

Build order is driven by the dependency graph and incremental testability.

### Phase 1: Digital Order Tracking (build first -- no new store dependency)

**Tasks in order:**
1. Create `src/lib/order-tracking.ts` -- pure derivation function, testable with mock data
2. Modify `kds.store.ts` -- add `items: KdsLineRef[]` to `KdsTicket`, update `addTicket` signature
3. Wire `sendRound` call site to pass items to `addTicket`
4. Create `OrderTimeline` component -- per-item stage list with colored stage indicators
5. Modify `TableTile` -- replace static `orderStage` badge with derived tracking badge
6. Modify `TableBottomSheet` -- add OrderTimeline section in Occupied state

**Rationale:** Order tracking is read-only over existing data. The only store change is additive (new field on KdsTicket). Low risk, high visibility on the floor plan. Validates the derivation pattern before split/merge builds on similar principles.

### Phase 2: Split Bill (depends on new bill.store)

**Tasks in order:**
1. Create `src/stores/bill.store.ts` -- split-related actions only (initSplit, assignItemToSeat, markSeatPaid, unsplit, clearSplit)
2. Add `'split-bill'` to `role-permissions.ts`
3. Create `SplitBillSheet` -- mode selection UI (equal vs per-seat)
4. Create `SeatNavigator` -- seat/share tab bar
5. Modify `TotalsSection` -- remove "Split Bill -> v2" placeholder, add working trigger
6. Implement equal split in `PaymentPage` -- divide total, navigate shares
7. Create `SeatAssignmentView` -- tap items to assign to seats
8. Implement per-seat payment flow -- pay one seat at a time, track completion via paidSeats

**Rationale:** Split bill is the most complex new feature. Building the store first, then UI components, then wiring into payment page ensures each piece is testable independently.

### Phase 3: Merge Bill (extends bill.store from Phase 2)

**Tasks in order:**
1. Add merge actions to `bill.store` -- createMerge, addTableToMerge, removeTableFromMerge, dissolveMerge
2. Add `'merge-tables'` to `role-permissions.ts`
3. Create `MergeTablePicker` -- modal showing occupied tables for selection
4. Modify `TableBottomSheet` -- add "Merge Tables" button in Occupied state
5. Modify `PaymentPage` -- detect merge via tableMergeMap, aggregate items from all merged tables
6. Add merge badge indicator to `TableTile` (derived from bill.store)
7. Implement cleanup -- dissolve merge and clear splits for all tables on payment confirm

**Rationale:** Merge builds on the same `bill.store` created in Phase 2. Doing it after split means the store structure is stable. Merge also needs the unsplit action (from Phase 2) available for the "unsplit previously separated seats" requirement.

---

## Scalability Considerations

| Concern | Wireframe (now) | Production (future) |
|---------|-----------------|---------------------|
| Seat identity | Anonymous numbers (seat 1, 2, 3...) | Named seats, linked to CRM/loyalty profiles |
| Split persistence | localStorage via Zustand persist | Server-side bill records with audit trail |
| Merge scope | Same-branch tables (all in one store) | Cross-terminal merge via real-time API |
| Order tracking | Derived from ephemeral KDS store | Event-sourced timeline with hardware timestamps |
| Partial payments | All-or-nothing per seat | Partial amounts, split across payment methods per seat |
| Bill history | Cleared on table close | Archived for analytics, EOD reports |

---

## Sources

- Direct codebase analysis: `src/stores/order.store.ts` (lines 1-197) -- ActiveOrder, OrderRound, OrderLineItem interfaces and all actions
- Direct codebase analysis: `src/stores/table.store.ts` (lines 1-150) -- TableRecord, TableStatus, OrderStage types and all actions
- Direct codebase analysis: `src/stores/kds.store.ts` (lines 1-156) -- KdsTicket, KdsStage types, addTicket/bumpTicket/checkItem actions
- Direct codebase analysis: `src/app/(app)/payment/[tableId]/page.tsx` (lines 1-229) -- billItems flattening, total calculation, payment confirmation flow
- Direct codebase analysis: `src/components/payment/TotalsSection.tsx` (lines 100-107) -- "Split Bill -> v2" disabled placeholder
- Direct codebase analysis: `src/components/table-map/TableTile.tsx` (lines 67-72) -- orderStage badge rendering
- Direct codebase analysis: `src/components/table-map/TableBottomSheet.tsx` (lines 109-191) -- Occupied state with View Order and Served buttons
- Direct codebase analysis: `src/lib/role-permissions.ts` (lines 1-49) -- ActionKey union, ACTION_PERMISSIONS, canDoAction
- Direct codebase analysis: `src/lib/mock-data/tables.ts` -- 12-table initial dataset
- Confidence: HIGH for all findings -- every claim traceable to specific file and line number in the codebase

---
*Architecture research for: POS Wireframe v1.2 -- Split Bill, Merge Bill, Digital Order Tracking*
*Researched: 2026-03-12*
