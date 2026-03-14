# Technology Stack — Delivery & Takeaway Milestone

**Project:** A Ramen POS Wireframe
**Milestone:** Delivery order queue simulation + takeaway order management
**Researched:** 2026-03-15
**Confidence:** HIGH

> **Scope note:** The production stack (Next.js 16, React 19, Tailwind CSS 4, shadcn/ui,
> Zustand 5, Solar icons, sonner, next-themes, CVA, tw-animate-css) is locked from v1.0–v1.2.
> This document covers ONLY what the delivery/takeaway milestone needs. The answer is again:
> **zero new npm packages.** All capabilities are pure TypeScript state modeling on the existing stack.

---

## Existing Stack (Validated — Do Not Change)

| Package | Version | Role in This Milestone |
|---------|---------|------------------------|
| next | ^16.1.6 | New queue route, takeaway modal/route |
| react | ^19.x | UI components |
| typescript | ^5.x | `OrderChannel` discriminated union, typed queue entries |
| zustand | ^5.0.11 | New `delivery.store.ts` for queue + simulation state |
| tailwindcss | ^4 | New OKLCH status tokens for delivery/takeaway badges |
| shadcn / @base-ui/react | current | Dialogs, badges, tabs — no new components needed |
| class-variance-authority | ^0.7.1 | New `badge` CVA variants for platform labels |
| solar-icon-set | installed | Delivery/scooter/bag icons already in set |
| sonner (ThemedToaster) | installed | Incoming order toast notifications |
| tw-animate-css | ^1.4.0 | Slide-in animation for incoming order cards |

---

## Recommended Stack: Zero New Packages

Each new feature maps cleanly to existing capabilities:

| Feature | What It Needs | Existing Stack Coverage |
|---------|---------------|------------------------|
| Delivery queue simulation | Periodic injection of mock orders | Zustand store action + `setInterval` in `useEffect` |
| Incoming order notifications | Toast on new order arrival | Existing `sonner` via `ThemedToaster` |
| Order type tagging | `dine-in` / `takeaway` / `delivery` discrimination | TypeScript discriminated union on `order.store` |
| Takeaway order creation | New order entry with pickup label | Existing order entry UI + channel guard |
| Platform badge (GRAB, LINE, T/A) | Color-coded label on KDS ticket | New CVA variants on existing `Badge` component |
| Delivery status transitions | 5-state linear lifecycle | Zustand actions on `delivery.store` |

---

## New Implementation Patterns

### 1. Delivery Queue Simulation (Grab / LINE MAN mock)

**Technique:** New Zustand store + `setInterval` in a `useEffect`. No simulation library needed.

```typescript
// src/stores/delivery.store.ts (new)
type DeliveryPlatform = 'GrabFood' | 'LineMAN'

type DeliveryOrder = {
  orderId: string
  platform: DeliveryPlatform
  items: MockOrderLine[]           // drawn from actual A Ramen menu item IDs
  status: 'incoming' | 'accepted' | 'preparing' | 'ready' | 'picked-up' | 'cancelled'
  arrivedAt: number                // Date.now()
  customerName: string
}

interface DeliveryState {
  queue: DeliveryOrder[]
  simulationActive: boolean
  enqueue: (order: DeliveryOrder) => void
  accept: (orderId: string) => void
  advance: (orderId: string) => void
  cancel: (orderId: string) => void
  toggleSimulation: () => void
}
```

The simulation loop lives in a `useEffect` in a manager-visible component:

```typescript
useEffect(() => {
  if (!simulationActive) return
  const id = setInterval(() => {
    useDeliveryStore.getState().enqueue(generateMockDeliveryOrder())
    toast.info('New incoming delivery order')
  }, 15_000)             // 15 s — good pacing for live stakeholder demo
  return () => clearInterval(id)
}, [simulationActive])
```

`generateMockDeliveryOrder()` is a plain TypeScript factory (< 30 LOC) that randomly selects from actual A Ramen menu item IDs and a hardcoded customer name list.

**Why not @faker-js/faker:** A menu-aware factory is ~25 LOC and produces contextually correct data. Faker generates generic product names that do not match actual menu item IDs. Rejected.

**Why not @sinonjs/fake-timers:** Test-only tool. The wireframe demo needs real wall-clock `setInterval`. Rejected.

**Why not MSW:** No fetch layer to intercept. Adds ~40 kB with no integration point. Rejected.

**Why not xstate:** Five linear states, no parallel regions. Discriminated union + Zustand action handles it with no bundle cost. Rejected.

---

### 2. Order Type Tagging (Discriminated Union)

```typescript
export type OrderChannel =
  | { type: 'dine-in';  tableId: string }
  | { type: 'takeaway'; pickupLabel: string }            // e.g. "T/A #42"
  | { type: 'delivery'; platform: DeliveryPlatform; externalOrderId: string }
```

Additive field on existing order session header. All existing dine-in code unchanged. Do NOT add `channel` to `OrderLineItem` — channel is a session-level concern.

---

### 3. KDS Integration for New Order Types

New `badge` CVA variants:

```typescript
'grab':     'bg-[oklch(0.72_0.18_145)] text-white',    // Grab green
'lineman':  'bg-[oklch(0.55_0.22_260)] text-white',    // LINE blue
'takeaway': 'bg-[oklch(0.65_0.16_55)] text-white',     // amber
```

---

## New Stores to Create

**`src/stores/delivery.store.ts`** — Persisted (`delivery-store` localStorage key). Contains delivery order queue, simulation toggle, accept/advance/cancel/reject actions. Does NOT contain takeaway orders.

**`src/stores/takeaway.store.ts`** — Persisted (`takeaway-store` localStorage key). Contains TakeawayRecord[], auto-increment pickup counter, status lifecycle actions.

---

## New Design Token Additions (globals.css)

```css
/* Delivery platform tokens — add to :root block */
--color-status-grab-fg:     oklch(0.72 0.18 145);
--color-status-grab-bg:     oklch(0.96 0.04 145);
--color-status-lineman-fg:  oklch(0.55 0.22 260);
--color-status-lineman-bg:  oklch(0.94 0.04 260);
--color-status-takeaway-fg: oklch(0.60 0.18 55);
--color-status-takeaway-bg: oklch(0.96 0.05 55);
```

Dark mode variants must be independently tuned in `.dark` — never opacity reduction on OKLCH.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@faker-js/faker` | Over-engineered; 300 kB; generic data doesn't match menu | Hand-written factory (~25 LOC) |
| `xstate` | 5-state linear chain; 39 kB bundle cost | Zustand actions with discriminated union |
| `@grab/grabfood-api-sdk` | Requires OAuth2/backend not present | Hand-typed `DeliveryOrder` + `DeliveryPlatform` types |
| `msw` | No network layer to intercept | Direct Zustand store mutations |
| `@sinonjs/fake-timers` | Test tool; live demo needs real time | Native `setInterval` in `useEffect` |
| New shadcn components | Not needed | `Dialog`, `Badge`, `Button`, `Tabs` cover all patterns |
| `@radix-ui/*` primitives | Project uses `@base-ui/react` — do not mix | Stay on `@base-ui/react` |

---

## Version Compatibility

| Concern | Status |
|---------|--------|
| Zustand persist — new `delivery-store` key | Compatible. Separate key from existing stores. |
| TypeScript — new `OrderChannel` type | Compatible. Additive optional-with-default field — non-breaking. |
| Tailwind CSS 4 — new CVA badge variants | Compatible. Same extension pattern as v1.1/v1.2. |
| OKLCH tokens — new delivery/takeaway families | Compatible. Additive additions to `:root` and `.dark` blocks. |

---

*Stack research for: A Ramen POS Wireframe — Delivery & Takeaway Milestone*
*Researched: 2026-03-15*
*Confidence: HIGH*
