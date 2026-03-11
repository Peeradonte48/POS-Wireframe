# Phase 6: Manager Layer - Research

**Researched:** 2026-03-11
**Domain:** React/Next.js App Router — role-gated manager dashboard, Zustand persist, derived store aggregation
**Confidence:** HIGH

## Summary

Phase 6 is entirely an in-app composition problem — no new libraries are required. All four requirements (SHIFT-01 through SHIFT-04) are served by reading and deriving data from existing stores (`session.store`, `order.store`, `table.store`) and one new thin store (`manager.store` for 86'd state). The single `/manager` route holds a shadcn/ui `Tabs` component with four panels; the Tabs component is already installed and used in Phase 3.

The primary architectural challenge is computing accurate EOD financial totals from `order.store`. Orders are stored as `ActiveOrder` records keyed by `tableId`, each containing rounds of `OrderLineItem` objects. Gross revenue is the sum of `basePrice * quantity` for all non-voided items across all orders. Void count is the count of items with `status === 'voided'`. Discount totals are not stored on `order.store` directly (discounts are applied at payment time on `PaymentPage` as local component state and never persisted) — this is a known wireframe gap; EOD discount total must either be accepted as 0 or a `completedPayments` record added to a new or extended store. The decision is documented in Open Questions below.

The 86'd toggle integration point (`MenuPanel.tsx`) requires only a store read and a conditional render tweak — no refactor is needed. The `AppSidebar.tsx` manager nav item already exists with the correct slug and href; it only needs the hide-for-non-Manager logic changed from the current greyed-out pattern to a fully hidden one, per CONTEXT.md decision.

**Primary recommendation:** Create `manager.store.ts` with persist middleware for 86'd item IDs, build the `/manager` route with four `TabsContent` panels, derive all EOD numbers from existing stores at render time, and integrate 86'd state into `MenuPanel` with a store read.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Manager screen navigation**
- Single `/manager` route with 4 tabs: EOD Summary | Sales Snapshot | 86'd Items | Open Tickets
- Default tab on load: EOD Summary (most likely reason manager opens this screen)
- Manager nav item is hidden for non-Manager roles (does not appear greyed out — breaks from Phase 1 pattern intentionally for this role)
- Close Shift requires a confirm dialog only — no re-PIN (Manager is already authenticated at login)

**EOD Summary layout (SHIFT-01)**
- Two card sections: "Sales Summary" (revenue, net sales, VAT, cover count) and "Adjustments" (void count, discount total)
- Payment method breakdown: one row per method (Cash / QR / Card) with amount only — no transaction count or percentages
- Cash reconciliation: input field for closing cash → system auto-calculates and shows Over/Short variance in red (short) or green (over)
- After "Close Shift" confirm: summary becomes read-only with a "Shift Closed" banner + Logout button — does not auto-logout immediately

**86'd item toggle (SHIFT-03)**
- Dedicated tab within /manager ("86'd Items" tab)
- Menu displayed as flat list grouped by category (category header, then items with a toggle switch)
- 86'd state persists via localStorage (same Zustand persist pattern from Phase 5) — survives role switches within a shift
- On the order screen: 86'd items appear greyed out with an "86'd" badge and are not tappable (stay visible so staff can explain to customers)

**Open Tickets & Staff List (SHIFT-04)**
- Single "Open Tickets" tab — Open Tickets section stacked above Staff List section (not separate tabs)
- Open Tickets: table-grouped list — one row per occupied table showing: Table ID, waiter name, cover count, order stage, estimated total, time open
- Tapping a table row navigates to `/order/[tableId]` — manager can review or intervene
- Staff List: name + role badge + table IDs assigned — simple 3-column list of who's on shift

**Sales Snapshot (SHIFT-02)**
- Numbers view only — no charts (already specified in requirement)
- Tab accessible from the 4-tab nav at /manager

### Claude's Discretion
- Exact spacing, typography, and shadcn/ui component choices for manager screens
- Sales Snapshot specific data fields and layout (requirements specify: revenue, covers, top items as numbers)
- How mock data is generated for EOD totals (can derive from order.store + session.store)
- Exact wording for confirm dialogs

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHIFT-01 | Manager can close shift and view an end-of-day summary (revenue, payment method breakdown, voids, discounts, net sales, cash reconciliation input) | Derive gross revenue and void count from `order.store.orders`; payment method breakdown requires completed-payment tracking (see Open Questions); cash reconciliation is a reactive controlled input comparing `closingCash` against `session.openingCash + cashRevenue` |
| SHIFT-02 | Manager can view a sales snapshot dashboard (revenue, covers, top items — numbers view, not charts) | Revenue and cover count derivable from `order.store` + `table.store`; top items by quantity: aggregate `menuItemName` counts across all non-voided line items |
| SHIFT-03 | Manager can toggle item availability (86'd) from within the Staff POS app | New `manager.store.ts` with `eightySixedIds: Set<string>` (persisted as array); `MenuPanel.tsx` reads store and applies greyed + non-tappable state |
| SHIFT-04 | Manager can view all open tickets across tables and a staff list | Read `table.store.tables` filtered to `status === 'Occupied'`; read `MOCK_STAFF` for staff list; estimated total derived from `order.store.getOrder(tableId)` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand + persist | 5.x (already installed) | `manager.store.ts` for 86'd state | Established project pattern — all stores use this |
| shadcn/ui Tabs | Already installed (`@base-ui/react/tabs` wrapper) | 4-tab manager nav | Already used in Phase 3 order screen |
| shadcn/ui Dialog | Already installed | Close Shift confirm dialog | Already used for ManagerPinModal |
| shadcn/ui Badge | Already installed | Role badges in staff list, 86'd badge on menu items | Already used throughout |
| shadcn/ui Input | Already installed | Cash reconciliation input | Already used on payment screen |
| shadcn/ui Button | Already installed | Close Shift, Logout | Already used throughout |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | Already installed | Icons for manager panels (TrendingUp, Users, List, etc.) | Icon decorations only |
| `cn` utility | Already installed (`src/lib/utils.ts`) | Conditional class merging | Variance coloring (red/green Over/Short) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deriving EOD totals at render | Caching totals in store | Render-time derivation is fine for wireframe; caching adds complexity with no benefit |
| Flat 86'd ID set in manager.store | Boolean flag on each MenuItem in menu.ts | Store approach keeps mock data pure and makes toggle reactive across components |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── manager.store.ts          # NEW — 86'd state with persist
├── app/(app)/
│   └── manager/
│       └── page.tsx              # NEW — 4-tab manager dashboard
├── components/
│   └── manager/
│       ├── EodSummaryTab.tsx     # NEW — SHIFT-01
│       ├── SalesSnapshotTab.tsx  # NEW — SHIFT-02
│       ├── EightySixTab.tsx      # NEW — SHIFT-03
│       └── OpenTicketsTab.tsx    # NEW — SHIFT-04
└── components/order/
    └── MenuPanel.tsx             # MODIFY — read manager.store for 86'd items
```

AppSidebar.tsx — MODIFY: hide manager nav item for non-Manager roles

### Pattern 1: Manager Store (86'd State)
**What:** Zustand persist store holding a `Set` of eighty-sixed menu item IDs, serialized as an array in localStorage.
**When to use:** Any component that needs to read or toggle 86'd status.

```typescript
// src/stores/manager.store.ts
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ManagerStore {
  eightySixedIds: string[]
  toggleEightySix: (menuItemId: string) => void
  isEightySixed: (menuItemId: string) => boolean
}

export const useManagerStore = create<ManagerStore>()(
  persist(
    (set, get) => ({
      eightySixedIds: [],
      toggleEightySix: (id) =>
        set((state) => ({
          eightySixedIds: state.eightySixedIds.includes(id)
            ? state.eightySixedIds.filter((x) => x !== id)
            : [...state.eightySixedIds, id],
        })),
      isEightySixed: (id) => get().eightySixedIds.includes(id),
    }),
    { name: 'manager-store' },
  ),
)
```

### Pattern 2: EOD Totals Derivation
**What:** Compute shift totals at render time from `order.store.orders`. All orders in the store represent the current shift (store is cleared on logout).
**When to use:** EodSummaryTab and SalesSnapshotTab.

```typescript
// Gross revenue (sum of all non-voided items × basePrice)
const allItems = Object.values(orders).flatMap((order) =>
  order.rounds.flatMap((r) => r.items),
)
const soldItems = allItems.filter((i) => i.status !== 'voided')
const voidedItems = allItems.filter((i) => i.status === 'voided')

const grossRevenue = soldItems.reduce(
  (sum, i) => sum + i.basePrice * i.quantity,
  0,
)
const vatAmount = Math.round(grossRevenue * 0.07)
const netSales = grossRevenue + vatAmount
const voidCount = voidedItems.length

// Cover count (sum of guestCount across all occupied/billed tables)
const coverCount = Object.values(tables)
  .filter((t) => t.openedAt !== null)
  .reduce((sum, t) => sum + (t.guestCount ?? 0), 0)

// Top items by quantity
const itemCountMap = soldItems.reduce<Record<string, { name: string; qty: number }>>(
  (acc, i) => {
    acc[i.menuItemId] = {
      name: i.menuItemName,
      qty: (acc[i.menuItemId]?.qty ?? 0) + i.quantity,
    }
    return acc
  },
  {},
)
const topItems = Object.values(itemCountMap)
  .sort((a, b) => b.qty - a.qty)
  .slice(0, 5)
```

### Pattern 3: Cash Reconciliation (Reactive)
**What:** Controlled input that derives variance immediately as manager types — no submit button needed.
**When to use:** Cash reconciliation field in EodSummaryTab.

```typescript
const [closingCash, setClosingCash] = useState<number>(0)

// openingCash comes from session.store
const variance = closingCash - (openingCash ?? 0) - cashRevenue
// Positive = Over (green), Negative = Short (red)
const varianceClass = variance >= 0 ? 'text-green-600' : 'text-red-600'
const varianceLabel = variance >= 0 ? `Over ฿${variance}` : `Short ฿${Math.abs(variance)}`
```

### Pattern 4: Shift Closed State Machine
**What:** Local boolean in manager page that flips after confirm dialog — makes EOD summary read-only.
**When to use:** After manager taps "Close Shift" and confirms.

```typescript
const [shiftClosed, setShiftClosed] = useState(false)
const [confirmOpen, setConfirmOpen] = useState(false)

function handleCloseShift() {
  setShiftClosed(true)
  setConfirmOpen(false)
}
```

After `shiftClosed === true`: display a "Shift Closed" banner, disable all inputs, show Logout button that calls `session.logout()`.

### Pattern 5: Hide Manager Nav for Non-Manager Roles
**What:** Change AppSidebar to skip rendering the manager nav item entirely when `role !== 'Manager'`.
**When to use:** AppSidebar.tsx modification.

Current behavior: items with `!canAccess` render as a greyed-out `<div>`.
Required behavior (CONTEXT.md locked): manager item is fully absent from the DOM for non-Manager roles.

```typescript
// In AppSidebar NAV_ITEMS.map():
// Add early return guard before the isAccessible check:
if (slug === 'manager' && role !== 'Manager') return null
```

### Pattern 6: 86'd Items in MenuPanel
**What:** Read `useManagerStore` in `MenuPanel.tsx`, apply disabled visual state per item.
**When to use:** MenuPanel renders any menu item — check store before rendering tappable state.

```typescript
// In MenuPanel.tsx
import { useManagerStore } from '@/stores/manager.store'

const eightySixedIds = useManagerStore((s) => s.eightySixedIds)

// Per item render:
const is86d = eightySixedIds.includes(item.id)

<button
  key={item.id}
  onClick={is86d ? undefined : () => onItemTap(item.id)}
  disabled={is86d}
  className={cn(
    'w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors',
    is86d ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent',
  )}
>
  {/* ... existing content ... */}
  {is86d && (
    <Badge variant="outline" className="text-xs shrink-0">86'd</Badge>
  )}
</button>
```

### Anti-Patterns to Avoid
- **Storing EOD totals in a separate store:** Derived data belongs at render time; computing from source stores avoids sync bugs.
- **Auto-logout on Close Shift:** CONTEXT.md explicitly says "does not auto-logout immediately" — let manager review summary first.
- **Re-PIN on Close Shift:** CONTEXT.md says confirm dialog only — manager is already authenticated.
- **Rendering charts for Sales Snapshot:** Requirements specify numbers view only; no chart libraries needed.
- **Using TabsContent for category filtering in 86'd Items tab:** Tabs component controls the 4 main manager tabs. Category grouping in the 86'd list is simple JS `groupBy` on `MENU_ITEMS`, not a nested Tabs component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle switch UI | Custom checkbox/button toggle | Native HTML `<input type="checkbox">` with `accent-primary` OR shadcn Switch if available | Phase 3 used native checkbox with `accent-primary` successfully; consistent pattern |
| Confirm dialog | Inline conditional render | shadcn/ui Dialog (already installed) | Accessibility handled, dismiss behavior established |
| Role badge | Custom styled span | shadcn/ui Badge (already installed) | Consistent visual language with rest of app |
| Monetary formatting | Manual template literal | `toLocaleString()` already used on payment screen | Consistent formatting, handles thousands separator |

**Key insight:** Every UI primitive for Phase 6 is already in the component library. The only new code is layout composition, store derivation logic, and the single new `manager.store.ts`.

---

## Common Pitfalls

### Pitfall 1: Discount Total is Not Persisted
**What goes wrong:** `discountAmount` in `PaymentPage` is local component state, never written to `order.store` or `table.store`. EOD Adjustments "Discount Total" will always be ฿0.
**Why it happens:** Payment was designed as a self-contained flow; discounts were not anticipated as EOD-reportable.
**How to avoid:** Two options — (A) Accept ฿0 as a wireframe limitation with a design annotation, or (B) extend `table.store.TableRecord` with a `discountApplied: number` field written by `PaymentPage` on confirm. Option B is ~5 lines of code. See Open Questions.
**Warning signs:** Reviewer notices EOD discount total is always 0 even after applying coupons.

### Pitfall 2: Payment Method Breakdown Has No Persistence
**What goes wrong:** Same root cause as Pitfall 1 — payment method selected in `PaymentPage` is local state, not stored. EOD payment method breakdown rows will all show ฿0.
**Why it happens:** PaymentPage was built as a self-contained checkout flow.
**How to avoid:** Same Option B approach — add `paidAmount: number` and `paymentMethod: string | null` to `TableRecord` and write them at `handleConfirmPayment`. This is the minimal viable fix.
**Warning signs:** Cash/QR/Card all show ฿0 on EOD summary.

### Pitfall 3: `useManagerStore` Called Before Persist Hydration
**What goes wrong:** On first render, `eightySixedIds` is `[]` even if localStorage has data. Items may flash as available before hydrating to 86'd state.
**Why it happens:** Zustand persist hydration is async on the client.
**How to avoid:** Use Zustand `useStore` with a hydration guard, OR accept the brief flash since this is a wireframe. The `order.store` and `table.store` have the same behavior and it was accepted in Phase 5.
**Warning signs:** Menu items briefly appear tappable then grey out on page load.

### Pitfall 4: `Tabs` Component Uses `data-active` Not `aria-selected`
**What goes wrong:** Styling active tab state with `aria-selected` will not work — the Base UI Tabs wrapper uses `data-active` attribute.
**Why it happens:** Project uses `@base-ui/react/tabs` wrapper (see `src/components/ui/tabs.tsx`) with custom `data-active` styling.
**How to avoid:** Use `data-active:` class variants as already defined in `TabsTrigger`. Do not add Radix or headless-ui patterns.
**Warning signs:** Active tab does not show highlighted state.

### Pitfall 5: `shiftClosed` State Lives in Manager Page, Not Session Store
**What goes wrong:** If manager navigates away from `/manager` and back, the shift closed state resets (local state).
**Why it happens:** Using `useState` instead of persisted store.
**How to avoid:** Store `shiftClosed` in `manager.store.ts` alongside `eightySixedIds` — both need to survive navigation.
**Warning signs:** Manager closes shift, goes to table-map, returns to /manager, and finds the summary is editable again.

---

## Code Examples

Verified from existing codebase patterns:

### Zustand Persist Store (from order.store.ts)
```typescript
// Source: src/stores/order.store.ts — confirmed pattern
export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({ /* state + actions */ }),
    { name: 'order-store' },
  ),
)
```

### Tabs Component Usage (from Phase 3 MenuPanel)
```typescript
// Source: src/components/order/MenuPanel.tsx — confirmed pattern
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b h-10 px-2">
    {TAB_ITEMS.map((tab) => (
      <TabsTrigger key={tab.value} value={tab.value} className="text-xs shrink-0">
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

Note: Phase 3 uses Tabs without TabsContent (drives filter state). Phase 6 should use `TabsContent` panels since each tab renders distinct content, not filtered list variants.

### Dialog Confirm Pattern (from ManagerPinModal.tsx)
```typescript
// Source: src/components/auth/ManagerPinModal.tsx — confirmed pattern
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Close Shift?</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">
      This will lock the EOD summary. You can review before logging out.
    </p>
    <div className="flex gap-3 pt-2">
      <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
      <Button onClick={handleCloseShift}>Close Shift</Button>
    </div>
  </DialogContent>
</Dialog>
```

### Variance Color Pattern (using cn)
```typescript
// Source: pattern from src/lib/utils.ts cn utility — used project-wide
import { cn } from '@/lib/utils'

<span className={cn(
  'text-sm font-medium tabular-nums',
  variance >= 0 ? 'text-green-600' : 'text-red-500'
)}>
  {variance >= 0 ? `+฿${variance.toLocaleString()}` : `-฿${Math.abs(variance).toLocaleString()}`}
</span>
```

### AppSidebar — Hide Manager Item for Non-Manager
```typescript
// Source: src/components/app-shell/AppSidebar.tsx — existing file, MODIFY
// Inside NAV_ITEMS.map():
if (slug === 'manager' && role !== 'Manager') return null
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory Zustand stores | Zustand + persist middleware | Phase 5 (reversed Phase 1 decision) | All stores survive route group navigation; 86'd state must use persist too |
| Radix UI primitives | Base UI primitives (`@base-ui/react`) | Phase 1 setup | Dialog uses `disablePointerDismissal` not Radix `onInteractOutside`; Tabs uses `data-active` not `aria-selected` |
| `@radix-ui/react-checkbox` | Native `<input type="checkbox">` with `accent-primary` | Phase 3 | Toggle switches in 86'd list should use native checkbox or Switch — not Radix |

**Deprecated/outdated for this project:**
- Radix UI patterns: project uses Base UI — any documentation showing `@radix-ui/react-*` dialog/tabs patterns does not apply here.

---

## Open Questions

1. **Discount total and payment method breakdown on EOD summary**
   - What we know: `discountAmount` and `paymentMethod` are local state in `PaymentPage` and are never persisted. EOD display would show ฿0 for both.
   - What's unclear: Is this acceptable as a wireframe annotation, or does the stakeholder demo require realistic numbers?
   - Recommendation: Add `paidAmount: number` and `paymentMethod: 'Cash' | 'QR PromptPay' | 'Card' | null` and `discountApplied: number` fields to `TableRecord` in `table.store.ts`. Write them in `PaymentPage.handleConfirmPayment()`. This is a ~10 line cross-phase change that unblocks realistic EOD totals. If stakeholder demo fidelity matters, do this in Plan 01 as a store extension task.

2. **`shiftClosed` persistence scope**
   - What we know: Closing a shift should be persistent within the session (survive navigation away from /manager).
   - What's unclear: Should `shiftClosed` reset on `session.logout()`, or does the manager store need its own clear action?
   - Recommendation: Add `shiftClosed: boolean` and `closeShift: () => void` and `resetShift: () => void` to `manager.store.ts`. Call `resetShift()` from `session.logout()` in `session.store.ts` (cross-store action via `useManagerStore.getState().resetShift()`).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — this is a Next.js wireframe project with no test runner configured |
| Config file | none — see Wave 0 |
| Quick run command | `npx tsc --noEmit` (type-check as proxy for correctness) |
| Full suite command | `npx tsc --noEmit && npx next build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHIFT-01 | Manager can view EOD summary with financial totals and close shift | manual-only | n/a — browser visual verification | n/a |
| SHIFT-02 | Sales snapshot shows revenue, covers, top items as numbers | manual-only | n/a — browser visual verification | n/a |
| SHIFT-03 | 86'd toggle persists and disables item in order screen | manual-only | n/a — browser interaction | n/a |
| SHIFT-04 | Open tickets list and staff list render correctly for Manager role | manual-only | n/a — browser visual verification | n/a |

**Rationale for manual-only:** All four requirements are UI rendering and interaction concerns on a mock-data wireframe. No business logic functions exist in isolation that warrant unit tests. Type correctness is verified by `tsc --noEmit`.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npx tsc --noEmit`
- **Phase gate:** All 4 success criteria browser-verified before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure is expected for this wireframe project; TypeScript type-check is the automated gate.

---

## Integration Checklist

These are cross-file modifications required alongside new file creation:

| File | Change | Why |
|------|--------|-----|
| `src/components/app-shell/AppSidebar.tsx` | Hide manager item for non-Manager roles | CONTEXT.md locked decision |
| `src/components/order/MenuPanel.tsx` | Read `manager.store` for 86'd state | SHIFT-03 order screen integration |
| `src/stores/table.store.ts` | Add `paidAmount`, `paymentMethod`, `discountApplied` fields to `TableRecord` | EOD payment breakdown (if Open Question 1 is resolved as "fix it") |
| `src/app/(app)/payment/[tableId]/page.tsx` | Write payment totals to table record on confirm | EOD payment breakdown |
| `src/app/(app)/layout.tsx` | Ensure `/manager` is in allowed routes | Route access guard |

---

## Sources

### Primary (HIGH confidence)
- Direct source file reading — `src/stores/order.store.ts`, `table.store.ts`, `session.store.ts` — type definitions and persist patterns
- Direct source file reading — `src/components/app-shell/AppSidebar.tsx`, `src/lib/role-permissions.ts` — nav gate logic
- Direct source file reading — `src/components/ui/tabs.tsx` — Base UI Tabs wrapper, `data-active` attribute pattern
- Direct source file reading — `src/components/order/MenuPanel.tsx` — 86'd integration point
- Direct source file reading — `src/components/auth/ManagerPinModal.tsx` — Dialog confirm pattern
- `.planning/phases/06-manager-layer/06-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` accumulated context section — established patterns from Phases 1–5

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present in source files
- Architecture: HIGH — patterns derived from reading actual existing code, not documentation
- Pitfalls: HIGH — root causes traced to specific source file locations
- Integration points: HIGH — exact file paths and line-level changes identified

**Research date:** 2026-03-11
**Valid until:** End of project (stable wireframe; no external dependency changes expected)
