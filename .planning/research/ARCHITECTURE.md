# Architecture Patterns

**Domain:** Browser-based interactive restaurant POS wireframe
**Project:** A Ramen / FIP Ecosystem — POS Module
**Researched:** 2026-03-10
**Confidence:** HIGH (established Next.js App Router + shadcn/ui patterns, well-defined POS domain)

---

## Recommended Architecture

The wireframe is a **role-aware, route-driven SPA shell** built on Next.js App Router. Each major POS workflow maps to a top-level route. A persistent shell layout wraps all views with a sidebar/topbar for role switching, branch context, and session state. All data is mock (in-memory), managed via Zustand stores — no API calls.

### High-Level Structure

```
Shell Layout (AppShell)
├── Sidebar: role indicator, branch selector, nav links, session actions
├── Topbar: current shift info, clock, user/role badge
└── Page Content Area (slot)
    ├── /floor          → TableMapView
    ├── /order/[tableId] → OrderScreen
    ├── /kds            → KitchenDisplayView
    ├── /payment/[orderId] → PaymentScreen
    ├── /shift          → ShiftManagementView
    └── /login          → RoleSelectorView (entry point)
```

---

## Route / Page Structure

| Route | View Name | Primary Role(s) | Purpose |
|-------|-----------|-----------------|---------|
| `/login` | RoleSelectorView | All | Role + branch selection entry point. Sets session context. No auth — wireframe only. |
| `/floor` | TableMapView | Waiter, Manager | Animated floor plan. Table cards show status (open, occupied, reserved). Click to open order. |
| `/order/[tableId]` | OrderScreen | Waiter, Cashier | Full order-taking UI: menu categories, item list, selected order, modifier sheet. |
| `/kds` | KitchenDisplayView | Kitchen Staff | Live ticket board (mock). Cards show items, table, time elapsed. Status controls per ticket. |
| `/payment/[orderId]` | PaymentScreen | Cashier, Manager | Bill summary, split bill UI, payment method selection (cash/QR/card). |
| `/shift` | ShiftManagementView | Manager, Cashier | Open/close shift, staff clock-in list, end-of-day summary. |
| `/manager` | ManagerDashboard | Manager | Overview: open tables count, active orders, shift summary cards. Optional — can be Phase 2. |

**Route notes:**
- `/login` is the wireframe's entry point. It should set role + branch in global store, then redirect to `/floor`.
- `[tableId]` and `[orderId]` are mock IDs matching fixture data. Navigation passes them via URL params so browser back works correctly — critical for demo realism.
- KDS (`/kds`) is a separate full-screen view, intentionally isolated from the main flow (mirrors real hardware positioning).

---

## Component Hierarchy

### 1. Shell (Layout Layer)

```
src/app/layout.tsx                  ← Root Next.js layout, providers only
src/app/(pos)/layout.tsx            ← POS shell layout (AppShell)
  └── components/shell/
        ├── AppShell.tsx            ← Flex container: sidebar + main slot
        ├── Sidebar.tsx             ← Nav links, role badge, branch selector, session button
        ├── Topbar.tsx              ← Shift status, clock, current user display
        └── BranchSelector.tsx     ← Dropdown: branch A / branch B (mock)
```

The `(pos)` route group applies the shell to all POS views except `/login`, which gets its own isolated layout.

### 2. Page Views (Feature Layer)

Each page is a thin orchestrator — it reads from the store, composes section components, handles no business logic itself.

```
src/app/(pos)/floor/page.tsx
  └── views/TableMapView.tsx
        ├── FloorGrid.tsx           ← CSS grid of table zones
        ├── TableCard.tsx           ← Single table: status badge, table num, pax count, action
        └── StatusLegend.tsx        ← Open / Occupied / Reserved color key

src/app/(pos)/order/[tableId]/page.tsx
  └── views/OrderScreen.tsx
        ├── MenuPanel.tsx           ← Left: category tabs + item list
        │     ├── CategoryTabs.tsx
        │     └── MenuItemCard.tsx
        ├── OrderPanel.tsx          ← Right: line items, quantities, subtotal
        │     ├── OrderLineItem.tsx
        │     └── OrderSummaryBar.tsx
        └── ModifierSheet.tsx       ← shadcn Sheet: broth, spice, add-ons for selected item

src/app/(pos)/kds/page.tsx
  └── views/KitchenDisplayView.tsx
        ├── KDSHeader.tsx           ← Current time, ticket count
        ├── TicketBoard.tsx         ← Columns: New / In Progress / Ready
        └── TicketCard.tsx          ← Table ref, items, elapsed timer badge

src/app/(pos)/payment/[orderId]/page.tsx
  └── views/PaymentScreen.tsx
        ├── BillSummary.tsx         ← Line items, subtotal, tax, total
        ├── SplitBillPanel.tsx      ← Split modes: equal / by item / custom
        └── PaymentMethodSelector.tsx ← Cash / QR / Card tabs with confirm action

src/app/(pos)/shift/page.tsx
  └── views/ShiftManagementView.tsx
        ├── ShiftStatusCard.tsx     ← Current shift: start time, cashier name, open/close CTA
        ├── StaffClockList.tsx      ← Table of staff clock-in/out records
        └── EndOfDaySummary.tsx     ← Revenue total, table count, order count cards
```

### 3. Shared Components (Design System Layer)

```
src/components/ui/                  ← shadcn/ui generated components (do not edit)
src/components/shared/
  ├── StatusBadge.tsx               ← Reusable: open/occupied/reserved/new/ready variants
  ├── RoleBadge.tsx                 ← Waiter / Cashier / Manager chip
  ├── PriceDisplay.tsx              ← Currency formatting wrapper (THB)
  ├── QuantityControl.tsx           ← + / - stepper for order quantities
  ├── EmptyState.tsx                ← Generic "no items" placeholder
  └── ConfirmDialog.tsx             ← shadcn AlertDialog wrapper for destructive actions
```

### 4. Mock Data Layer

```
src/lib/mock/
  ├── tables.ts                     ← 12–16 table records: id, zone, capacity, status
  ├── menu.ts                       ← Categories + items: ramen, sides, drinks, extras
  ├── orders.ts                     ← Sample orders with line items + modifiers
  ├── staff.ts                      ← Staff roster: roles, names, branch assignments
  └── branches.ts                   ← Branch A (Silom), Branch B (Ekkamai) fixture data

src/lib/mock/index.ts               ← Re-exports all fixtures
```

---

## State Management Approach

**Tool: Zustand** (single dependency, no boilerplate, ideal for wireframe complexity).

Do not use React Context for cross-cutting state. Do not use Redux — overkill. Zustand slices map directly to POS domains.

### Store Slices

```typescript
// src/store/sessionStore.ts
// Who is using the app right now
interface SessionStore {
  role: 'waiter' | 'cashier' | 'manager' | null
  staffName: string
  branchId: string
  shiftOpen: boolean
  shiftStartedAt: string | null
  setSession: (role, staffName, branchId) => void
  openShift: () => void
  closeShift: () => void
}

// src/store/tableStore.ts
// Floor map state
interface TableStore {
  tables: Table[]
  setTableStatus: (tableId: string, status: TableStatus) => void
  getTableById: (tableId: string) => Table | undefined
}

// src/store/orderStore.ts
// Active orders (one per table)
interface OrderStore {
  orders: Record<string, Order>           // keyed by tableId
  addItem: (tableId: string, item: MenuItem, modifiers: Modifier[]) => void
  removeItem: (tableId: string, lineItemId: string) => void
  updateQuantity: (tableId: string, lineItemId: string, qty: number) => void
  sendToKitchen: (tableId: string) => void
  closeOrder: (tableId: string) => void
  getOrder: (tableId: string) => Order | undefined
}

// src/store/kdsStore.ts
// Kitchen ticket state (derived from orders, managed separately for KDS realism)
interface KDSStore {
  tickets: Ticket[]
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void
}
```

### Data Flow Direction

```
Mock fixtures (static)
       ↓
  Zustand stores (initialized on app load from fixtures)
       ↓
  Page views (read store via hooks)
       ↓
  Components (receive props from page views)
       ↓
  User actions (call store actions directly via hooks)
       ↓
  Store updates → React re-renders
```

**Rule:** Components never mutate store directly — always call named actions. Page views are the only place `useStore` hooks are called; they pass data down as props. This makes components portable and testable.

### Role-Based View Gating

Role gating is purely UI-conditional — no auth middleware for wireframe. A `useSession()` hook returns the current role. Views check role to show/hide nav items and action buttons.

```typescript
// Pattern in Sidebar.tsx
const { role } = useSession()
// Manager-only nav items rendered conditionally
{role === 'manager' && <NavItem href="/shift" label="Shift Management" />}
```

---

## Patterns to Follow

### Pattern 1: Route Group for Shell Isolation

Use Next.js route groups to apply the AppShell layout only to POS pages, keeping `/login` frameless.

```
src/app/
  (pos)/              ← route group — inherits AppShell layout
    layout.tsx
    floor/page.tsx
    order/[tableId]/page.tsx
    kds/page.tsx
    payment/[orderId]/page.tsx
    shift/page.tsx
  login/
    page.tsx          ← no shell, full-screen centered card
  layout.tsx          ← root layout: providers (ZustandProvider, ThemeProvider)
```

### Pattern 2: View → Section → Atom Hierarchy

Views are page-level orchestrators. Sections are feature regions within a view. Atoms are reusable primitives.

Never put layout logic inside atomic components. Never put data fetching (or mock data access) inside atoms.

### Pattern 3: Mock Data Initialization via Store Hydration

Stores hydrate from mock fixtures on first access — not via useEffect in components. Keep mock data out of component files entirely.

```typescript
// src/store/tableStore.ts
import { mockTables } from '@/lib/mock/tables'
const useTableStore = create<TableStore>((set, get) => ({
  tables: mockTables,   // ← hydrated at module load time
  ...
}))
```

### Pattern 4: shadcn Sheet for Modifier Flows

The modifier selection flow (broth, spice, add-ons) uses a `Sheet` (side drawer) rather than a modal. This preserves menu context while the user configures an item — matching real POS UX expectations.

### Pattern 5: KDS as Independent Context

KDS is designed to feel like a separate screen. It should:
- Have no sidebar navigation visible (full-screen mode)
- Auto-update ticket display (use a mock setInterval to simulate "new order" arriving every N seconds in demo mode)
- Be the only view that uses a dark or high-contrast color scheme variant — differentiates it visually from front-of-house screens

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic Page Components

**What:** Putting all order-taking logic (menu, order panel, modifier sheet) inside a single `OrderPage` component.
**Why bad:** Becomes unmaintainable at ~300 lines. Impossible for engineers to use as a handoff reference for specific components.
**Instead:** Decompose into View → Section components as specified above. Each section maps to a distinct engineer deliverable.

### Anti-Pattern 2: Mock Data in Components

**What:** Importing fixture arrays directly inside `MenuPanel.tsx` or `TableCard.tsx`.
**Why bad:** Creates hidden dependencies; fixtures can't be swapped centrally. Breaks the data flow contract.
**Instead:** All mock data flows through Zustand stores only. Components receive data as props.

### Anti-Pattern 3: Context API for Cross-Route State

**What:** Using React Context for session/role/order state that must persist across navigation.
**Why bad:** Context does not survive route transitions in App Router without careful provider placement. Role state would reset on navigation — killing demo realism.
**Instead:** Zustand stores persist across route transitions naturally.

### Anti-Pattern 4: useEffect for Store Initialization

**What:** `useEffect(() => { setTables(mockTables) }, [])` inside a page component.
**Why bad:** Causes a render cycle; tables are undefined on first render, producing flash.
**Instead:** Initialize stores with fixture data at module definition time (see Pattern 3).

### Anti-Pattern 5: Tailwind Inline Color Overrides for Semantic States

**What:** `className="bg-green-500"` for "occupied" table status.
**Why bad:** Status color logic becomes scattered; inconsistent across TableCard, StatusBadge, KDS ticket.
**Instead:** Define semantic CSS variables in `globals.css` or a `cn()` variant map. StatusBadge is the single source of truth for status color.

---

## Build Order (Phase Recommendations)

Build in this sequence — each phase produces a fully demonstrable artifact:

| Phase | What to Build | Rationale |
|-------|---------------|-----------|
| 1 | Project scaffold + AppShell + `/login` RoleSelectorView | Foundation; establishes shell, routing, store structure, mock data. Everything else hangs on this. |
| 2 | TableMapView (`/floor`) + TableCard + table status states | Most visually impactful for stakeholders. Tests the store-to-component data flow. |
| 3 | OrderScreen (`/order/[tableId]`) + MenuPanel + OrderPanel | Longest to build; most complex UX. Core POS interaction. Requires table store to be done. |
| 4 | ModifierSheet + KDS View (`/kds`) | Modifier sheet completes the order flow. KDS demonstrates the kitchen-facing dimension. |
| 5 | PaymentScreen (`/payment/[orderId]`) + split bill UI | Natural end-of-flow. Depends on order existing. |
| 6 | ShiftManagementView (`/shift`) + Manager views | Operational management layer. Depends on session store being solid. |
| 7 | Polish pass: role gating, branch switching, demo mode, KDS auto-update | Makes it demo-ready. Adds narrative coherence for stakeholder walkthrough. |

**Build order rationale:**
- Shell first — every other phase uses it.
- Table map second — it is the "home screen" in stakeholder demos; immediate visual payoff.
- Order flow third — it's the heaviest lift and the core POS proof-of-concept.
- KDS and payment follow order — they depend on order state existing.
- Shift management last — least dependent on other flows, can be built in isolation.

---

## Scalability Considerations (Wireframe to Production Path)

| Concern | Wireframe Approach | Production Replacement |
|---------|--------------------|----------------------|
| Data layer | Zustand + mock fixtures | Zustand + React Query + REST/WebSocket API |
| Auth / roles | Session store with manual role selection | NextAuth.js / Clerk with JWT role claims |
| Real-time KDS | setInterval mock updates | WebSocket (Pusher / Socket.io) |
| Multi-branch | Branch ID in session store, filtered mock data | API scoping by branch_id, tenant isolation |
| Payment processing | Mock payment method selection UI | Stripe Terminal / local payment gateway |
| Menu management | Static fixture file | CMS-driven or Inventory module from FIP |

This architecture is intentionally forward-compatible: Zustand stores map directly to API resource shapes, component boundaries match API resource boundaries, and route structure mirrors what a production app would use.

---

## Component Boundary Summary

| Boundary | Rule |
|----------|------|
| Shell vs. Views | Shell owns persistent UI (sidebar, topbar). Views own page content. No cross-contamination. |
| Views vs. Sections | Views read stores and compose sections. Sections receive props only — no store access. |
| Sections vs. Atoms | Sections own layout and section-level logic. Atoms are pure display. |
| Mock data vs. Stores | Mock data lives in `src/lib/mock/`. Stores consume it at init. Components never import mock data. |
| shadcn/ui vs. shared/ | `src/components/ui/` is shadcn territory — untouched. `src/components/shared/` is project-specific wrappers. |

---

## Sources

- Next.js App Router documentation (route groups, layouts, dynamic segments): https://nextjs.org/docs/app/building-your-application/routing
- shadcn/ui component library (Sheet, Dialog, Tabs, Badge): https://ui.shadcn.com/docs
- Zustand documentation (store patterns, slices): https://zustand.docs.pmnd.rs/
- Confidence: HIGH — all patterns are from stable, widely-adopted APIs with strong community consensus. No speculative or LOW-confidence claims in this document.
