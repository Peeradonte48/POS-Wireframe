# Technology Stack

**Project:** A Ramen POS Wireframe — v1.2 Bill Management + Order Tracking
**Researched:** 2026-03-12
**Confidence:** HIGH

> **Scope note:** The production stack (Next.js 16, React 19, Tailwind CSS 4, shadcn/ui,
> Zustand 5, Solar icons, sonner, next-themes, CVA, tw-animate-css) is locked from v1.0/v1.1.
> This document covers ONLY what v1.2 needs for split bill, merge bill, and digital order
> tracking. The answer is: **zero new npm packages**. All three features are pure state
> management + UI composition using the existing stack.

---

## What Is Already Installed (Do Not Re-research or Re-add)

| Package | Version | Role |
|---------|---------|------|
| next | ^16.1.6 | App framework, routing, layouts |
| react | ^19.x | UI rendering |
| zustand | ^5.x | State management with `persist` middleware (localStorage) |
| tailwindcss | ^4 | CSS-first utility framework |
| shadcn | ^4.0.2 | Owned UI components (Button, Badge, Dialog, Tabs, Select) |
| @base-ui/react | ^1.2.0 | Underlying primitives for shadcn components |
| class-variance-authority | ^0.7.1 | Variant engine for component styles |
| tailwind-merge | ^3.5.0 | Class conflict resolution via `cn()` |
| tw-animate-css | ^1.4.0 | Enter/exit animation utilities |
| solar-icon-set | installed | Full icon vocabulary |
| sonner | installed | Toast notifications |
| next-themes | installed | Dark mode toggle |

---

## Recommended Stack: Zero New Packages

### Why No New Dependencies Are Needed

Each v1.2 feature maps cleanly to existing capabilities:

| Feature | What It Needs | Existing Stack Coverage |
|---------|---------------|------------------------|
| **Split bill (equal)** | Division math, UI for guest count selector | `Math.ceil(total / N)` + existing `Select` component |
| **Split bill (per-seat)** | Item-to-seat assignment state, checkbox UI | Zustand store + existing `Badge`, `Button` components |
| **Merge bill** | Cross-table order linking, table picker UI | Zustand store joins + existing `Dialog`, `TableGrid` |
| **Unsplit bill** | Reversal of split state | Zustand action to clear seat assignments |
| **Order tracking badges** | Stage badge on `TableTile` | Already exists: `table.orderStage` field + `Badge` component (line 68-71 of TableTile.tsx) |
| **Order tracking timeline** | Per-item stage history, timestamp display | New Zustand slice + existing UI primitives |

### Core Technique: Zustand Store Extensions

The entire v1.2 feature set is state modeling. Here is what each store needs:

#### 1. New Store: `bill.store.ts` — Split/Merge Bill State

```typescript
// New store — manages bill splitting and merging independent of order.store
interface BillSplit {
  mode: 'none' | 'equal' | 'per-seat'
  splitCount: number                    // N for equal division
  seatAssignments: Record<string, number> // lineId → seatNumber (1-indexed)
}

interface BillMerge {
  primaryTableId: string                // The table that "owns" the merged bill
  mergedTableIds: string[]              // Tables whose orders are pulled into this bill
}

interface BillStore {
  splits: Record<string, BillSplit>     // keyed by tableId
  merges: Record<string, BillMerge>     // keyed by primaryTableId

  // Split actions
  splitEqual: (tableId: string, count: number) => void
  splitPerSeat: (tableId: string) => void
  assignItemToSeat: (tableId: string, lineId: string, seat: number) => void
  unsplit: (tableId: string) => void

  // Merge actions
  mergeTables: (primaryTableId: string, secondaryTableIds: string[]) => void
  unmergeTables: (primaryTableId: string) => void
}
```

**Why a separate store (not extending `order.store`):**
- `order.store` manages what was ordered (items, rounds, send status). Bill splitting is a payment-layer concern — it decides how to divide the check, not what was ordered.
- Merge state references multiple tables — cross-cutting concern that does not belong inside a single order record.
- Keeps `order.store` stable (no migration of persisted localStorage shape).
- Split/merge state is ephemeral per session — it can use `persist` with a separate `bill-store` key, or skip persistence entirely since splits are created at checkout time.

**Why Zustand (not React state):**
- Merge state must be visible across components: `TableTile` needs to show a "merged" indicator, `PaymentPage` needs to pull items from multiple tables, `TableBottomSheet` needs merge/unmerge actions.
- `persist` middleware keeps split state alive if staff navigates away from payment and comes back.

#### 2. Extended Store: `table.store.ts` — Merge Indicator

The existing `TableRecord` already has `orderStage: OrderStage | null`. For merge visibility:

```typescript
// Add to TableRecord interface
mergedWith: string[] | null  // IDs of tables merged into this bill
```

This is a single field addition. No structural change to the store.

#### 3. Extended Store: `order.store.ts` or `kds.store.ts` — Item-Level Tracking

The existing `OrderLineItem` has `status: 'unsent' | 'sent' | 'voided'`. For order tracking:

```typescript
// Add to OrderLineItem interface
trackingStage: 'Queued' | 'Cooking' | 'Ready' | 'Served' | null
stageUpdatedAt: number | null  // timestamp of last stage change
```

**Why extend `OrderLineItem` (not a separate tracking store):**
- Tracking is per-item state — it belongs on the item.
- The KDS `bumpTicket` action already progresses stages (New → InProgress → Ready). The bridge is: when KDS bumps, also update the corresponding `OrderLineItem.trackingStage`.
- Two fields is minimal. No structural migration needed — Zustand persist merges new fields as `undefined` on existing records, which the UI handles with `?? null` fallback.

### UI Components: What to Build With Existing Primitives

| New Component | Built From | Notes |
|---------------|-----------|-------|
| `SplitBillSheet` | `Dialog` + `Tabs` (equal / per-seat) + `Button` | Bottom sheet with two tabs. Equal tab: number stepper. Per-seat tab: item list with seat assignment selectors. |
| `SeatBillView` | `BillLineItem` (existing) + grouping logic | Groups items by seat number, shows per-seat subtotal. Reuses `BillLineItem` component directly. |
| `MergeTablePicker` | `Dialog` + `TableGrid` pattern | Shows occupied tables as selectable chips. Confirm merges selected tables into current bill. |
| `OrderTimeline` | `Badge` (stages) + timestamp formatting | Vertical timeline showing item progression. Each step: icon + stage label + relative time. |
| `TrackingBadge` | `Badge` (existing) with new CVA variants | Colored dot badge on `TableTile` showing aggregate order stage. Already partially exists (line 68-71 of TableTile.tsx). |

### Existing shadcn Components to Leverage

| Component | v1.2 Usage |
|-----------|-----------|
| `Dialog` | Split bill sheet, merge table picker, order detail modal |
| `Tabs` | Equal vs. per-seat split mode switcher |
| `Badge` | Order stage indicators (extend CVA variants for Queued/Cooking/Ready/Served) |
| `Button` | Split/merge action triggers, seat assignment controls |
| `Select` | Guest count / split count selector |

No new shadcn components need to be added via `npx shadcn@latest add`.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Split bill state | New `bill.store.ts` Zustand store | React `useState` in PaymentPage | Split state needs cross-component visibility (table tiles show split indicator, payment page shows split view). Local state breaks when navigating away. |
| Item tracking | Extend `OrderLineItem` with 2 fields | Separate `tracking.store.ts` | Tracking is intrinsic to the item. A separate store creates a join problem (must look up tracking by lineId). Two fields on the item is simpler. |
| Merge bill | Store-level table linking | URL query params (`?merge=T1,T2`) | Merge state is persistent across navigation. Query params are fragile and lost on page change. |
| Split amount calculation | Pure functions (no library) | Currency/money library (dinero.js) | This is a wireframe — `Math.ceil(total / N)` is sufficient. Rounding edge cases are acceptable for demo purposes. No need for arbitrary-precision math. |
| Timeline animation | tw-animate-css `animate-in` | Framer Motion `AnimatePresence` | Wireframe does not need spring physics or layout animations. `animate-in fade-in` on timeline steps is sufficient. |
| Drag to assign seats | Click/tap to assign | dnd-kit drag items to seat columns | Drag-and-drop adds 30KB+ dependency and significant complexity. Tap-to-assign (select seat number per item) is faster for a 4-8 item ramen bill. |

---

## Installation

```bash
# Nothing to install — all capabilities exist in current dependency tree.
# Verify existing versions:
npm list zustand tailwindcss class-variance-authority
```

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `dinero.js` or `currency.js` | Money formatting library — overkill for wireframe bill math. Adds bundle weight for `÷ N` division. | `Math.ceil(total / N)` + `toLocaleString()` — already used throughout PaymentPage |
| `dnd-kit` | Drag-and-drop for seat assignment — massive complexity for a wireframe. Real POS would use tap-to-assign. | Tap/click interaction: select an item, tap a seat number to assign |
| `framer-motion` | Still not needed (same rationale as v1.1). Timeline and tracking animations are simple enters. | `tw-animate-css` `animate-in fade-in` for timeline step reveals |
| `date-fns` or `dayjs` | Timestamp formatting for order timeline — one helper function handles relative time. | Inline `formatRelativeTime()` utility: `const mins = Math.floor((now - ts) / 60000)` — 5 lines of code vs 20KB library |
| `react-beautiful-dnd` | Deprecated library. Even if drag was needed, this is the wrong choice. | Not applicable — no drag needed |
| `immer` middleware for Zustand | Zustand's spread-based immutable updates are working fine across 5 stores. Adding immer changes the update pattern for one store while others stay spread-based. | Continue spread-based updates in `bill.store.ts` — consistent with existing codebase pattern |
| New shadcn components (`Accordion`, `Popover`, etc.) | No UI pattern in v1.2 requires them. Split uses `Dialog` + `Tabs`. Timeline is a custom list. | Existing `Dialog`, `Tabs`, `Badge`, `Button`, `Select` cover all v1.2 UI needs |
| `@radix-ui/*` primitives | Project uses `@base-ui/react`. Do not mix primitive libraries. | Stay on `@base-ui/react` — shadcn components already use it |

---

## Integration Points

### How v1.2 Features Connect to Existing Code

```
PaymentPage ([tableId]/page.tsx)
  ├── Currently: reads order.store → billItems → subtotal → grandTotal
  ├── v1.2 add: reads bill.store for split/merge state
  ├── v1.2 add: if merged, pull items from multiple tableIds
  ├── v1.2 add: if split, show SplitBillSheet / SeatBillView
  └── v1.2 add: replace "Split Bill → v2" placeholder button (TotalsSection.tsx line 101)

TableTile (TableTile.tsx)
  ├── Currently: shows orderStage badge (line 68-71)
  ├── v1.2 add: enhance badge with color-coded tracking stage
  └── v1.2 add: show merge indicator when table.mergedWith is set

TableBottomSheet (TableBottomSheet.tsx)
  ├── Currently: Open Table, View Order, Go to Payment actions
  └── v1.2 add: "Merge Tables" action (opens MergeTablePicker dialog)

KDS bump flow (kds.store.ts → order.store.ts bridge)
  ├── Currently: KDS bumpTicket changes ticket stage independently
  └── v1.2 add: when KDS bumps, also update OrderLineItem.trackingStage
      (cross-store sync via Zustand subscribe or explicit action call)
```

### Cross-Store Sync Pattern

The KDS-to-order tracking bridge is the only cross-store concern:

```typescript
// In the component or a shared action module:
// When KDS bumps a ticket, update order items' tracking stage
const kdsStageToTracking: Record<KdsStage, OrderLineItem['trackingStage']> = {
  'New': 'Queued',
  'InProgress': 'Cooking',
  'Ready': 'Ready',
}

// Option A: Subscribe pattern (reactive)
useKdsStore.subscribe((state, prev) => {
  // Diff tickets, find stage changes, update order.store
})

// Option B: Explicit call in KDS bump handler (simpler for wireframe)
// After bumpTicket(), call useOrderStore.getState().updateItemTracking(...)
```

**Recommendation:** Option B (explicit call) — simpler, debuggable, appropriate for wireframe complexity level.

---

## Version Compatibility

All existing packages remain compatible. No version bumps needed.

| Concern | Status |
|---------|--------|
| Zustand persist — new store key `bill-store` | Compatible. Each store gets its own localStorage key. No collision with existing `order-store`, `table-store`, `session-store`. |
| TypeScript — extended interfaces | Compatible. Adding optional fields (`trackingStage?: ...`) to existing interfaces is non-breaking. |
| Tailwind CSS 4 — new CVA badge variants | Compatible. Adding entries to existing `badgeVariants` CVA call. Same pattern as v1.1. |

---

## Sources

- Project source files inspected: `src/stores/order.store.ts`, `src/stores/table.store.ts`, `src/stores/kds.store.ts`, `src/app/(app)/payment/[tableId]/page.tsx`, `src/components/payment/TotalsSection.tsx`, `src/components/table-map/TableTile.tsx` — HIGH confidence (direct code inspection)
- Zustand persist middleware — existing pattern validated across 4 stores in this project — HIGH confidence
- `.planning/PROJECT.md` — v1.2 feature requirements and constraints — HIGH confidence (project spec)

---

*Stack research for: A Ramen POS Wireframe — v1.2 Bill Management + Order Tracking*
*Researched: 2026-03-12*
