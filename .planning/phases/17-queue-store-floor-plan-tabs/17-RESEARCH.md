# Phase 17: Queue Store + Floor Plan Tabs — Research

**Researched:** 2026-03-15
**Domain:** Zustand store design, tab navigation, countdown ring animation, delivery queue UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Delivery Queue Layout**
- Vertical card list layout (not Kanban, not compact rows) — cards stacked top-to-bottom, newest at top
- Each delivery card shows: platform badge + order ID, customer name, items summary, elapsed timer
- Status shown as: colored status badge (e.g. "Accepted") + single action CTA that changes per stage ("Mark Ready for Rider", "Confirm Picked Up")
- Pending orders appear in a separate highlighted section at the top ("Waiting for response"); accepted/active orders below in the main list

**Accept / Reject Flow**
- Accept and Reject buttons are inline on the pending card — no extra tap needed (fast, matches Grab operator app pattern)
- On Accept: card animates from "Waiting for response" section down into the active queue; status badge updates to "Accepted"
- On Reject: a small reason picker dialog appears with preset reasons (Sold out / Too busy / Can't fulfil / Other) — one tap to select, then confirms

**New Takeaway Order**
- Staff starts a takeaway order via a FAB (+) button in the Takeaway tab — opens a small dialog (same pattern as existing `OpenTableModal`)
- Customer name is required; phone is optional — order number auto-assigned (TK-001, TK-002...)
- Takeaway cards use the same visual language as delivery cards: order number, customer name, status badge, single action CTA ("Mark Ready", "Mark Collected")

**Demo Controls Placement**
- "Simulate Order" button lives in the Delivery tab header (top area of the DeliveryPanel) — immediately visible when on Delivery tab; mirrors KDS demo mode button placement
- Auto-accept toggle chip lives in the same Delivery tab header row alongside Simulate Order — all queue controls in one place
- Countdown timer: rendered as a circular ring animation draining around the elapsed timer or platform badge on each pending card — high visual impact for stakeholder demos

### Claude's Discretion
- Exact card padding, spacing, and typography within the established design token system
- Exact ring animation implementation (CSS `conic-gradient` or SVG `stroke-dashoffset`)
- Empty state illustration / text for each tab when no active orders
- Transition/animation specifics for card moving from pending to active section
- Sidebar badge count implementation detail (reactive vs polling)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 17 scope. Order entry and payment pipeline for takeaway/delivery are Phase 18 by design.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-01 | Staff can switch between Dine-in, Takeaway, and Delivery views via tabs on the floor plan | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `src/components/ui/tabs.tsx` already in project; wrap existing `TableGrid` in Dine-in TabsContent |
| NAV-02 | Takeaway and Delivery tabs show a live badge count of active orders | Select raw `orders` record from queue.store, derive counts in `useMemo` inside TabsTrigger or badge overlay; sidebar count uses same derived value |
| DLVR-01 | Staff can view incoming delivery orders from Grab/LINE MAN in a queue (simulated) | DeliveryPanel component reads from queue.store; `simulateIncoming()` action injects mock QueueOrder with `Pending` status |
| DLVR-02 | Staff can accept an incoming delivery order (auto-routes to KDS) | `acceptOrder(orderId)` action on queue.store: status → Confirmed, then calls `useKdsStore.getState().addTicket(orderId, orderLabel)` |
| DLVR-03 | Staff can reject an incoming delivery order with a reason | `rejectOrder(orderId, reason)` action removes from queue; RejectReasonDialog (Base UI Dialog) shows preset reasons |
| DLVR-04 | Accepted delivery orders progress through: Accepted → Preparing → Ready for Rider → Picked Up | `QueueOrderStatus` type + `advanceStatus(orderId)` action on queue.store; status machine in store, CTA label derived from current status |
| DLVR-05 | Staff can mark a delivery order "Ready for Rider" when kitchen completes | Single "Mark Ready for Rider" CTA on active delivery card, calls `advanceStatus(orderId)` |
| DLVR-06 | Staff can trigger simulated incoming delivery orders for demo | `simulateOrder()` action + `demoActive` boolean on queue.store, mirrors KDS `toggleDemoActive`/`injectDemoTicket` pattern |
| DLVR-07 | Delivery order cards show platform badge (Grab / LINE MAN), customer name, items summary, and elapsed timer | DeliveryCard component; platform badge uses new CVA variants `grab` / `lineman` on badge.tsx; elapsed timer via `useQueueTimer` hook |
| DLVR-08 | Staff can enable auto-accept to skip the manual accept tap during rush | `autoAccept: boolean` field on queue.store; toggle chip in DeliveryPanel header; when true, `simulateOrder` immediately calls `acceptOrder` after injection |
| DLVR-09 | Incoming delivery orders show a countdown timer ring before auto-reject | Ring SVG or `conic-gradient` overlay on pending card; driven by `pendingAt` timestamp + configurable window (e.g. 30 s); CSS animation drains clockwise |
| TKWY-01 | Staff can create a takeaway order with customer name, phone, and auto-assigned order number (TK-001…) | FAB (+) button → NewTakeawayModal (mirrors OpenTableModal); `createTakeaway(name, phone)` on queue.store auto-assigns next TK-NNN id; card appears in Takeaway tab |
</phase_requirements>

---

## Summary

Phase 17 introduces `queue.store` — the single source of truth for all non-dine-in order lifecycle state. This store owns `QueueOrder` records for both delivery and takeaway channels, and is strictly isolated from `table.store` to prevent floor tile contamination. The phase also adds a three-tab floor plan UI (Dine-in / Takeaway / Delivery) wrapping the existing `TableGrid` in a `TabsContent` slot and adding two new panel components.

The entire implementation uses zero new npm packages. The delivery simulation mirrors the KDS demo mode pattern exactly (`setInterval`/`setTimeout` factory, `demoActive` boolean, `simulate*` action). The countdown ring for pending orders uses either CSS `conic-gradient` or an SVG `stroke-dashoffset` approach — both are achievable with existing browser APIs and Tailwind v4 utilities.

The critical integration point is that `acceptOrder()` must call `useKdsStore.getState().addTicket()` synchronously to route the delivery order to the kitchen display — the same cross-store write-back pattern established in v1.2 for `KdsTicketCard.handleBump`.

**Primary recommendation:** Build queue.store first, verify its type safety and selector patterns, then build DeliveryPanel, then TakeawayPanel, then wrap table-map page in Tabs last (lowest risk to existing dine-in flow).

---

## Standard Stack

### Core (all already in project — zero new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.x | queue.store state | Established pattern for all stores; persist middleware reused |
| zustand/middleware `persist` | 5.x | Survive route-group React tree destroy | All non-kds stores use this; queue.store must too |
| Base UI `@base-ui/react/tabs` | current | Tab switcher | Already imported in `src/components/ui/tabs.tsx`; no new dep |
| Base UI `@base-ui/react` dialog | current | Reject reason picker + NewTakeawayModal | Existing OpenTableModal and all dialogs use this |
| CVA (class-variance-authority) | current | Platform badge variants | badge.tsx already uses CVA; extend in-place |
| Solar icon set | current | FAB icon, platform icons if available | All icons sourced from solar-icon-set |
| sonner (via ThemedToaster) | current | Toast on accept/reject/create | Already mounted in (app) layout |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React `useEffect` + `setTimeout` | React 19 | Delivery simulation loop | Same pattern as KDS demo injection in `kds/page.tsx` |
| React `useMemo` | React 19 | Derive filtered order lists from raw `orders` record | MANDATORY — never call derived functions in Zustand selectors |
| CSS `conic-gradient` | Browser native | Countdown ring fill animation | Simpler than SVG for a single-element ring; use `@keyframes` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `conic-gradient` ring | SVG `stroke-dashoffset` | SVG gives finer control over stroke cap; conic-gradient requires `mask` trick for donut shape; either works — Claude's discretion |
| `setInterval` simulation | fake-timers / MSW | Zero npm cost for setInterval; fake-timers adds test infrastructure not needed for wireframe |
| Inline `useEffect` simulation in page | Separate `useDemoSimulation` hook | Hook extraction is cleaner for >30 LOC; mirror KDS which keeps simulation in the page component |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── stores/
│   └── queue.store.ts           # New — owns all delivery + takeaway order state
├── lib/mock-data/
│   └── delivery-demo.ts         # New — mock QueueOrder factory (mirrors kds-demo.ts)
├── components/
│   └── queue/
│       ├── DeliveryPanel.tsx    # New — delivery tab content: header controls + card list
│       ├── DeliveryCard.tsx     # New — single delivery order card with countdown ring
│       ├── TakeawayPanel.tsx    # New — takeaway tab content: FAB + card list
│       ├── TakeawayCard.tsx     # New — single takeaway order card
│       ├── RejectReasonDialog.tsx  # New — preset reason picker dialog
│       └── NewTakeawayModal.tsx    # New — mirrors OpenTableModal
└── app/(app)/table-map/
    └── page.tsx                 # Modified — wrap in <Tabs>, add two new TabsContent slots
```

### Pattern 1: queue.store Type Design

**What:** Discriminated union with a single `QueueOrderStatus` type owned entirely by queue.store — never extending `OrderStage` or `TableStatus`.

**When to use:** Any time a new order channel needs lifecycle tracking that is NOT a physical table seat.

```typescript
// src/stores/queue.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrderChannel = 'delivery' | 'takeaway'
export type DeliveryPlatform = 'grab' | 'lineman'

// Status progression:
// Delivery:  Pending → Confirmed → Preparing → ReadyForRider → PickedUp | Rejected
// Takeaway:  Taking  → Sent      → Ready     → Collected
export type QueueOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'ReadyForRider'
  | 'PickedUp'
  | 'Rejected'
  | 'Taking'
  | 'Sent'
  | 'Ready'
  | 'Collected'

export interface QueueOrder {
  orderId: string           // 'DL-grab-7821' or 'TK-001'
  channel: OrderChannel
  platform?: DeliveryPlatform  // delivery only
  customerName: string
  customerPhone?: string        // takeaway only, optional
  itemsSummary: string          // e.g. "2x Tonkotsu, 1x Karaage"
  status: QueueOrderStatus
  createdAt: number
  pendingAt?: number            // timestamp when Pending — drives countdown ring
  rejectionReason?: string
}

interface QueueStore {
  orders: Record<string, QueueOrder>
  demoActive: boolean
  autoAccept: boolean
  takeawayCounter: number  // drives TK-001, TK-002...

  // Actions
  simulateOrder: () => void
  acceptOrder: (orderId: string) => void
  rejectOrder: (orderId: string, reason: string) => void
  advanceStatus: (orderId: string) => void
  createTakeaway: (customerName: string, customerPhone?: string) => void
  toggleDemoActive: () => void
  toggleAutoAccept: () => void
}
```

### Pattern 2: Zustand Selector Safety (CLAUDE.md MANDATORY)

**What:** Select raw `orders` record; derive filtered lists in `useMemo`. Never call any function that returns a new array inside a Zustand selector.

**When to use:** Every component that reads from queue.store.

```typescript
// CORRECT — stable selector + useMemo derivation
const orders = useQueueStore((s) => s.orders)

const pendingOrders = useMemo(
  () => Object.values(orders).filter((o) => o.status === 'Pending'),
  [orders]
)

const activeDeliveryOrders = useMemo(
  () => Object.values(orders).filter(
    (o) => o.channel === 'delivery' && o.status !== 'Pending' && o.status !== 'Rejected'
  ),
  [orders]
)

// WRONG — causes infinite loop (new array reference every render)
// const pendingOrders = useQueueStore((s) => Object.values(s.orders).filter(...))
```

### Pattern 3: Demo Simulation Loop (mirrors KDS page.tsx)

**What:** `setInterval`/`setTimeout` loop in `useEffect`, enabled by `demoActive` boolean.

**When to use:** DeliveryPanel — inject simulated incoming orders at random intervals.

```typescript
// Inside DeliveryPanel or a useDemoSimulation hook
useEffect(() => {
  if (!demoActive) return

  let timeoutId: ReturnType<typeof setTimeout>

  function scheduleNext() {
    const delay = 10000 + Math.random() * 5000  // 10–15 seconds
    timeoutId = setTimeout(() => {
      simulateOrder()  // queue.store action
      scheduleNext()
    }, delay)
  }

  scheduleNext()
  return () => clearTimeout(timeoutId)
}, [demoActive, simulateOrder])
```

### Pattern 4: Cross-Store Write-back on Accept

**What:** `acceptOrder` in queue.store calls `useKdsStore.getState().addTicket()` to route delivery to kitchen. Non-reactive `getState()` call — same pattern as KdsTicketCard.handleBump → table.store.

**When to use:** Only when status transitions need to trigger effects in another store.

```typescript
// Inside acceptOrder action (queue.store.ts)
acceptOrder: (orderId) =>
  set((state) => {
    const order = state.orders[orderId]
    if (!order || order.status !== 'Pending') return state
    // Cross-store write-back — non-reactive, does not create subscription
    useKdsStore.getState().addTicket(orderId, order.orderId)
    return {
      orders: {
        ...state.orders,
        [orderId]: { ...order, status: 'Confirmed' },
      },
    }
  }),
```

### Pattern 5: Countdown Ring Animation

**What:** CSS `conic-gradient` mask technique for a draining ring on pending delivery cards.

**When to use:** DLVR-09 — each pending card shows a ring that drains over the auto-reject window (e.g. 30 s).

```tsx
// Inline style required — multi-value CSS incompatible with Tailwind v4 @theme inline
// Use CSS animation on a wrapper div
const PENDING_WINDOW_MS = 30_000  // 30 seconds

function CountdownRing({ pendingAt }: { pendingAt: number }) {
  const elapsed = Date.now() - pendingAt
  const progress = Math.min(elapsed / PENDING_WINDOW_MS, 1)  // 0→1
  // conic-gradient from full to empty — clockwise drain
  const ringStyle = {
    background: `conic-gradient(
      var(--color-status-escalated) ${progress * 360}deg,
      var(--border) ${progress * 360}deg
    )`,
    // Use a mask to create donut
  }
  // OR drive with CSS @keyframes animation keyed to the window duration
  // Simpler: use animationDuration = remaining time, start from current progress
}
```

**Recommendation (Claude's discretion):** For stakeholder demos, a CSS animation with `animation-duration` set to remaining time on mount is simpler than `requestAnimationFrame` polling. Set `animationFillMode: 'forwards'` so it holds at empty.

### Pattern 6: Tab Badge Count

**What:** Overlay a small count badge on `TabsTrigger` or next to its label, driven by derived `useMemo` counts.

```tsx
// In table-map/page.tsx
const orders = useQueueStore((s) => s.orders)
const pendingDeliveryCount = useMemo(
  () => Object.values(orders).filter((o) => o.channel === 'delivery' && o.status === 'Pending').length,
  [orders]
)
const activeTakeawayCount = useMemo(
  () => Object.values(orders).filter((o) => o.channel === 'takeaway' && o.status !== 'Collected').length,
  [orders]
)

// In TabsTrigger
<TabsTrigger value="delivery">
  Delivery
  {pendingDeliveryCount > 0 && (
    <span className="ml-1 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
      {pendingDeliveryCount}
    </span>
  )}
</TabsTrigger>
```

### Pattern 7: Sidebar Queue Badge (NAV-02)

**What:** AppSidebar must show pending delivery count. The sidebar reads from queue.store directly. The badge is reactive — `useQueueStore` selector for pending count.

**When to use:** When the queue nav item is added to `NAV_ITEMS` in AppSidebar.

Note: The sidebar currently does NOT have a 'queue' slug. This phase adds it. The nav item will navigate to `/table-map` (with delivery tab pre-selected via URL param or store-driven default) OR be a separate `/queue` route. Based on CONTEXT.md, the floor plan page hosts the tabs — so the existing `table-map` nav item may simply show the badge, OR a new `queue` nav slug is added. See Open Questions.

### Pattern 8: persist Middleware with Unique Key

**What:** queue.store uses `persist` middleware with key `'queue-store'` to survive route-group React tree destroys.

```typescript
export const useQueueStore = create<QueueStore>()(
  persist(
    (set, get) => ({
      // ...
    }),
    { name: 'queue-store' }  // No collision with: table-store, order-store, bill-store, manager-store
  )
)
```

**Note:** `demoActive` and `autoAccept` should probably NOT be persisted (reset on page load). Use `partialize` to exclude them:

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'queue-store',
    partialize: (state) => ({
      orders: state.orders,
      takeawayCounter: state.takeawayCounter,
    }),
  }
)
```

### Anti-Patterns to Avoid

- **Derived lists in Zustand selectors:** `useQueueStore((s) => Object.values(s.orders).filter(...))` — causes `useSyncExternalStore` infinite loop per CLAUDE.md. Always select `s.orders` and derive in `useMemo`.
- **Adding delivery/takeaway to table.store:** These are not physical tables; mixing them in `table.store` corrupts floor tile rendering and merge candidate logic.
- **Appending QueueOrderStatus to OrderStage:** Semantic corruption — KDS ticket stage and queue order status are separate state machines.
- **Mutating a `Set` in place:** Zustand shallow equality won't detect changes. Always `new Set(existing)` before add/delete (same as kds.store `checkedItems` pattern).
- **Shadow tokens in Tailwind classes:** `shadow-[var(--shadow-card)]` breaks with multi-value tokens. Use `style={{ boxShadow: 'var(--shadow-card)' }}`.
- **Persisting `demoActive`:** Demo mode should reset to off on page reload. Use `partialize` to exclude it from localStorage.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab switcher | Custom tab component with state | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `src/components/ui/tabs.tsx` | Already in project, Base UI a11y built in |
| Reject reason dialog | Custom modal from scratch | `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` pattern from `OpenTableModal.tsx` | Consistent UX, disablePointerDismissal, escape key handling included |
| New takeaway form | Custom form | Mirror `OpenTableModal.tsx` exactly — same Input + Button pattern | Two-field form; no need for react-hook-form |
| Platform badge colors | Inline style per card | Extend `badge.tsx` CVA with `grab` and `lineman` variants | Consistent dark mode, border styling, and reuse in Phase 19 KDS |
| Elapsed timer | Custom date math per render | `useKdsTimer` hook pattern (already in `src/components/kds/useKdsTimer.ts`) — create `useQueueTimer` as a copy/rename | Handles formatting and color thresholds cleanly |
| Order ID generation | UUID library | String concatenation: `DL-${platform}-${Date.now()}` for delivery; TK counter for takeaway | Zero dep; unique enough for in-memory wireframe |

**Key insight:** Every primitive needed (tabs, dialog, badge, timer hook, demo injection loop, shadow tokens) already exists in the project. Phase 17 is pure composition and new store design.

---

## Common Pitfalls

### Pitfall 1: Zustand Selector Infinite Loop
**What goes wrong:** `useQueueStore((s) => Object.values(s.orders).filter(o => o.status === 'Pending'))` causes React to error "The result of getSnapshot should be cached."
**Why it happens:** `Object.values()` returns a new array reference on every call, so Zustand's `useSyncExternalStore` detects a change on every render, triggering an infinite re-render loop.
**How to avoid:** Select `s.orders` (the Record object reference, stable unless orders change), then derive filtered arrays in `useMemo`.
**Warning signs:** React error "getSnapshot should be cached" or rapid re-render spiral in DeliveryPanel/TakeawayPanel.

### Pitfall 2: Persisting Demo/UI State
**What goes wrong:** `demoActive: true` is persisted to localStorage, so every page reload starts in demo mode.
**Why it happens:** Forgetting `partialize` in persist config.
**How to avoid:** Use `partialize` to include only `orders` and `takeawayCounter` in the persist snapshot. `demoActive`, `autoAccept` are session-only.

### Pitfall 3: Breaking Existing Dine-in Flow
**What goes wrong:** Wrapping `TableGrid` in `TabsContent` changes layout — grid breaks or bottom sheet positions incorrectly.
**Why it happens:** The existing `TableGrid` + `TableBottomSheet` + `OpenTableModal` triplet depends on the parent's `min-h-full` div. `TabsContent` needs the same height pass-through.
**How to avoid:** Apply `className="h-full"` or `className="flex-1 min-h-0"` to the `TabsContent` for dine-in so the grid gets the same height it had before. Test table tap → bottom sheet → open table modal still works after tab wrap.

### Pitfall 4: Cross-Store Import Circularity
**What goes wrong:** `queue.store.ts` imports from `kds.store.ts`, which may later import from `queue.store.ts` — creating a circular module dependency that causes undefined at import time.
**Why it happens:** Cross-store write-backs done via static module imports.
**How to avoid:** Use dynamic `getState()` calls (already the established pattern). Never import the other store's `create` result at module level — only call `useKdsStore.getState()` inside action functions.

### Pitfall 5: Countdown Ring Not Animating Smoothly
**What goes wrong:** Ring appears static or jumps rather than draining smoothly.
**Why it happens:** Using `Date.now()` polled only on React renders (which may be infrequent) rather than a CSS animation.
**How to avoid:** For the countdown ring, prefer a CSS `@keyframes` animation with `animation-duration` set to the remaining window time. This runs at 60fps independent of React renders. Set `animation-timing-function: linear` and `animation-fill-mode: forwards`.

### Pitfall 6: TakeawayCounter Not Persisted
**What goes wrong:** After page reload, TK counter resets to 0, creating duplicate TK-001 orders.
**Why it happens:** `takeawayCounter` excluded from persist partialize or forgotten.
**How to avoid:** Include `takeawayCounter` in the `partialize` allowlist alongside `orders`.

---

## Code Examples

Verified patterns from existing codebase:

### persist Middleware (from table.store.ts)
```typescript
// Source: src/stores/table.store.ts — exact pattern to replicate
export const useTableStore = create<TableStore>()(
  persist(
    (set) => ({
      // state and actions
    }),
    { name: 'table-store' }
  )
)
// queue.store uses: { name: 'queue-store' } with partialize
```

### Dialog Pattern (from OpenTableModal.tsx)
```tsx
// Source: src/components/table-map/OpenTableModal.tsx
<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }} disablePointerDismissal>
  <DialogContent showCloseButton={false}>
    <DialogHeader><DialogTitle>New Takeaway Order</DialogTitle></DialogHeader>
    <div className="flex flex-col gap-2 py-2">
      <label className="text-sm font-medium">Customer name *</label>
      <Input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <label className="text-sm font-medium">Phone (optional)</label>
      <Input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
    </div>
    <DialogFooter>
      <Button variant="outline" size="lg" onClick={onClose}>Cancel</Button>
      <Button size="lg" onClick={handleConfirm} disabled={!name.trim()}>Create Order</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Demo Simulation Loop (from kds/page.tsx)
```typescript
// Source: src/app/(kds)/kds/page.tsx — exact pattern to mirror in DeliveryPanel
useEffect(() => {
  if (!demoActive) return
  let timeoutId: ReturnType<typeof setTimeout>
  function scheduleNext() {
    const delay = 8000 + Math.random() * 4000
    timeoutId = setTimeout(() => {
      simulateOrder()   // queue.store action instead of injectDemoTicket
      scheduleNext()
    }, delay)
  }
  scheduleNext()
  return () => clearTimeout(timeoutId)
}, [demoActive, simulateOrder])
```

### KDS Demo Mode Button (from kds/page.tsx — reference for DeliveryPanel header)
```tsx
// Source: src/app/(kds)/kds/page.tsx
<button
  onClick={toggleDemoActive}
  className="text-xs border border-border rounded px-3 py-1.5 hover:bg-accent transition-colors"
>
  Demo Mode
</button>
// DeliveryPanel adds alongside: an auto-accept toggle chip
```

### Cross-Store Write-back Pattern (from KdsTicketCard.tsx)
```typescript
// Source: src/components/kds/KdsTicketCard.tsx
// On bump: non-reactive getState() call to write back to table.store
useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Cooking' })

// Mirrored for delivery accept:
// useKdsStore.getState().addTicket(orderId, orderLabel)
```

### Shadow Token via Inline Style (from CLAUDE.md)
```tsx
// Multi-value CSS strings incompatible with Tailwind v4 @theme inline
// Use inline style on delivery cards:
style={{ boxShadow: 'var(--shadow-card)' }}
```

### CVA Badge Extension (from badge.tsx)
```typescript
// Source: src/components/ui/badge.tsx — extend in-place (never wrap)
// Add to badgeVariants cva:
grab:    "bg-[var(--platform-grab-bg)]    text-[var(--platform-grab)]    border-[var(--platform-grab)]/30",
lineman: "bg-[var(--platform-lineman-bg)] text-[var(--platform-lineman)] border-[var(--platform-lineman)]/30",
// Tokens go in globals.css :root and .dark
// --platform-grab:    oklch(0.72 0.18 145)   (Grab green)
// --platform-lineman: oklch(0.55 0.22 260)   (LINE MAN blue)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One monolithic order store | Separate stores per concern (table, order, bill, kds, queue) | v1.1, v1.2, v1.3 | Each store has clear lifecycle ownership; no cross-contamination |
| Cross-store state via event bus | Direct `getState()` synchronous calls at action call sites | Established CLAUDE.md pattern | No async coordination needed; simpler and type-safe |
| Inline derived selectors | `useMemo` for all derived list values | CLAUDE.md infinite loop fix | Prevents `useSyncExternalStore` re-render loops |

**Deprecated/outdated:**
- AppSidebar's `NAV_ITEMS` hardcoded array: will need a 'queue' slot added — this is the established mutation point, not a new pattern.

---

## Open Questions

1. **Does 'queue' become a new NavSlug or does table-map badge serve NAV-02?**
   - What we know: CONTEXT.md says sidebar badge shows pending delivery count. AppSidebar currently has `table-map` as the floor plan entry point. The Delivery tab lives inside `/table-map`.
   - What's unclear: Does the sidebar get a new "Queue" nav item (with its own slug and route), or does the existing "Table Map" item gain a badge count?
   - Recommendation: Add `'queue'` as a new `NavSlug` and new `NAV_ITEM` pointing to `/table-map?tab=delivery` (or just `/table-map` with the tab defaulting via store). This gives the clearest signal in the sidebar. The planner should pick one approach and lock it.

2. **Default active tab on page load**
   - What we know: Current `table-map/page.tsx` has no tab state.
   - What's unclear: Should the active tab be local React state (resets on navigate away), or driven by URL search param (`?tab=delivery`), or driven by a queue.store `activeTab` field?
   - Recommendation: Local React state defaulting to `'dine-in'` is simplest and consistent with the wireframe's existing pattern (no URL param routing). If the sidebar badge click needs to deep-link to the Delivery tab, use URL search param (`useSearchParams`).

3. **Auto-reject on countdown ring expiry**
   - What we know: DLVR-09 requires a countdown ring for visual effect. The requirement says "before auto-reject" but DLVR-03 says staff manually rejects.
   - What's unclear: Does the ring expiry actually auto-reject, or is it purely visual?
   - Recommendation: For the wireframe demo, the ring is visual only — it drains to empty and the card turns red/amber, but does NOT automatically call `rejectOrder`. This is safe for demo purposes and avoids surprising stakeholders with orders disappearing.

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — project has no test framework per CLAUDE.md |
| Config file | None |
| Quick run command | `npm run build` |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Tabs render; Dine-in shows TableGrid | smoke (build) | `npm run build` | N/A — build confirms TypeScript |
| NAV-02 | Badge count derives from queue.store | smoke (build) | `npm run build` | N/A |
| DLVR-01 | DeliveryPanel renders queue orders | smoke (build) | `npm run build` | N/A |
| DLVR-02 | acceptOrder calls addTicket | smoke (build) | `npm run build` | N/A |
| DLVR-03 | rejectOrder removes from orders | smoke (build) | `npm run build` | N/A |
| DLVR-04 | advanceStatus follows correct sequence | smoke (build) | `npm run build` | N/A |
| DLVR-05–09 | Visual/interaction features | manual-only | Stakeholder demo | N/A |
| TKWY-01 | createTakeaway assigns TK-NNN id | smoke (build) | `npm run build` | N/A |

**Note:** No test framework is installed (`CLAUDE.md` is explicit). TypeScript strict mode via `npm run build` is the primary correctness gate. All behavioral verification is manual demo.

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Full build + lint green before `/gsd:verify-work`

### Wave 0 Gaps
None — no test framework setup needed. `npm run build` is the existing gate.

---

## Sources

### Primary (HIGH confidence)
- Direct source code read: `src/stores/kds.store.ts` — KdsStore interface, addTicket signature, toggleDemoActive pattern
- Direct source code read: `src/stores/table.store.ts` — persist middleware pattern, partialize not yet used (informs queue.store design)
- Direct source code read: `src/components/ui/tabs.tsx` — TabsPrimitive from `@base-ui/react/tabs`, TabsContent/TabsList/TabsTrigger already available
- Direct source code read: `src/components/ui/badge.tsx` — CVA badgeVariants, extend-in-place pattern confirmed
- Direct source code read: `src/components/table-map/OpenTableModal.tsx` — Dialog pattern, form with required/optional fields, onClose contract
- Direct source code read: `src/components/app-shell/AppSidebar.tsx` — NAV_ITEMS array, NavSlug usage, how to add new nav item
- Direct source code read: `src/components/kds/KdsTicketCard.tsx` — cross-store write-back via `getState()` pattern
- Direct source code read: `src/app/(kds)/kds/page.tsx` — demo simulation loop with setTimeout, toggleDemoActive, header button placement
- Direct source code read: `src/lib/mock-data/kds-demo.ts` — buildMockDemoTicket factory pattern for delivery-demo.ts
- Direct source code read: `src/app/globals.css` — existing OKLCH token structure for :root and .dark, `@theme inline` constraint
- Direct source code read: `src/lib/role-permissions.ts` — NavSlug union, ActionKey union, ROLE_NAV_ACCESS record, ACTION_PERMISSIONS record
- Direct source code read: `.planning/phases/17-queue-store-floor-plan-tabs/17-CONTEXT.md` — locked decisions, code insights, integration points
- Direct source code read: `.planning/REQUIREMENTS.md` — full requirement specifications
- Direct source code read: `.planning/STATE.md` — v1.3 architecture decisions, accumulated context

### Secondary (MEDIUM confidence)
- CLAUDE.md project instructions — Zustand selector infinite loop pattern, shadow token inline style rule, persist middleware usage, CVA variant extension rule

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present in source files
- Architecture: HIGH — queue.store design confirmed against existing store patterns; integration points confirmed in source
- Pitfalls: HIGH — selector infinite loop confirmed in CLAUDE.md; persist partialize confirmed against table.store pattern; layout pitfall inferred from existing page structure
- Countdown ring animation: MEDIUM — CSS conic-gradient is standard browser feature; specific implementation detail (timing function, mask trick) is Claude's discretion

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable stack — no npm changes needed)
