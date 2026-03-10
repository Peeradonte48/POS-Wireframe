# Phase 3: Order Flow - Research

**Researched:** 2026-03-10
**Domain:** POS Order Entry UI — split-panel tablet layout, modifier sheet, Zustand order store, route integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Order screen layout**
- Split-panel layout: left panel = menu categories + item list, right panel = live ticket
- Both panels always visible (tablet-first, 1024px primary viewport)
- Header above split: table number + guest count only (e.g. "T03 • 3 guests") — no waiter name in header
- Category navigation: horizontal scrollable tab row at top of left panel (shadcn Tabs component)
- Menu items: list rows with small thumbnail placeholder + name + price (not card grid, not text-only)
- Ticket line item: item name + modifier summary line + quantity controls (− qty +) + trash icon
- Right panel footer: running total + [Send to Kitchen] button

**Order screen navigation**
- Entry point: `/order/[tableId]` route — navigated to from TableBottomSheet [View Order] button
- The [View Order] button on TableBottomSheet activates in Phase 3 (was disabled placeholder in Phase 2)
- Back navigation: ← back arrow in header returns to `/table-map`; unsent items persist in store (not discarded on back)
- No discard prompt on back — staff can return to the ticket and continue

**Modifier sheet UX**
- Tapping a menu item opens a slide-up bottom sheet (same CSS pattern as Phase 2 TableBottomSheet)
- Bottom sheet covers ~70% of screen with dim backdrop behind split panel
- Modifier groups in order: Broth (required, single-select) → Spice Level (required, 1–5 icon selector) → Toppings (optional, multi-select checkboxes) → Special Request (optional free text input)
- Spice level: 5 chili icons in a row, tap to select 1–5, filled = selected, dim = unselected, label "1 2 3 4 5" beneath
- Required group validation: [Add to Order] button is always active; tapping with missing required fields highlights the group in red with inline error text and scrolls to it
- Editing: tapping a ticket line item reopens the modifier sheet pre-filled with that item's current values
- Quantity in sheet: sheet has a qty control (default 1); each tap of [Add to Order] adds a separate line item — same item added again = new independent line, NOT merged

**Ticket quantity controls**
- Each ticket line: − / qty / + controls for adjusting quantity (pre-send only)
- Sent items qty is immutable
- Trash icon removes the line item (pre-send: instant remove, no confirm)

**Pre-send item removal (ORDER-03)**
- Trash icon on each unsent ticket line — tap to remove instantly, no confirmation

**Send to kitchen flow (ORDER-04)**
- [Send to Kitchen] button at bottom of right panel
- On send: Sonner toast "Order sent to kitchen" fires; staff stays on order screen
- Ticket transitions: sent items become read-only (lighter/muted styling, no trash or qty controls)
- Table store updated: `useTableStore.updateTable(tableId, { orderStage: 'Ordered' })`
- After sending: [Add Items] button appears at top of right panel; tapping re-activates menu

**Mid-meal add-on round (ORDER-06)**
- After sending, [Add Items] button activates menu browsing
- New items form a "pending" round (visually distinct from sent items)
- Staff sends the new round separately with [Send to Kitchen] again

**Post-send void (ORDER-05)**
- Sent items show a muted/outlined trash icon (different from pre-send trash)
- Tap sent item trash → Manager PIN overlay fires immediately (reuses Phase 1 ManagerPinModal)
- PIN verified → item shows struck-through text + 'Voided' badge; item is NOT removed (audit trail)
- PIN rejected → overlay closes, nothing changes

**ORDER-07 table tile stage updates**
- Order screen writes directly to `useTableStore.updateTable()` on each Send
- Stage value written: 'Ordered' on first send (subsequent sends keep 'Ordered' until KDS)
- Floor plan tile badge already reflects orderStage reactively via Phase 2 wiring

### Claude's Discretion
- Exact tab indicator styling (underline, filled pill, etc.)
- Menu item thumbnail placeholder design (gray rect with food icon, or colored placeholder)
- Sent vs unsent item visual differentiation (exact colors/opacity)
- Bottom sheet handle + height percentages
- Modifier sheet scroll behavior (single scroll vs sticky section headers)
- Exact shadcn/ui component choices (Tabs, Checkbox, etc.)

### Deferred Ideas (OUT OF SCOPE)
- Seat-assignable items (split bill v2 pre-req) — do NOT add seat field to order items in Phase 3
- Course/round management (ORDER-V2-01) — v2 requirement
- Modifier presets (ORDER-V2-02) — v2, not Phase 3
- Order history / receipt reprint from order screen — Phase 5 (Payment)
- 86'd item availability toggle — Phase 6 (Manager Layer); all menu items available in Phase 3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORDER-01 | Staff can browse menu by category tabs and add items to an active order | Menu fixture with A Ramen categories; shadcn Tabs for category nav; order store addItem action |
| ORDER-02 | Staff can configure item modifiers — required single-select (broth type, visual spice 1–5), optional multi-select (toppings, add-ons), and free text (special request) | ModifierSheet component; ModifierGroup types in menu fixture; validation pattern for required fields |
| ORDER-03 | Staff can add, edit, or remove items from an open ticket before sending | OrderStore with editItem/removeItem; ticket renders unsent items with full controls; pre-fill sheet on edit tap |
| ORDER-04 | Staff can send order to kitchen with a confirmation state | sendRound() in order store; Sonner toast; sent items become read-only; useTableStore.updateTable orderStage |
| ORDER-05 | Staff can void items pre-send (simple remove) and post-send (requires manager PIN override) | ManagerPinModal reuse; voidItem() action; struck-through + Voided badge on voided items |
| ORDER-06 | Staff can add items to an existing open order (mid-meal add-on round) | Order store tracks rounds; [Add Items] button re-activates menu; pending round visually distinct |
| ORDER-07 | Table tile on floor map updates to reflect order stage (Ordered/Cooking/Ready/Billed) | useTableStore.updateTable already wired; TableTile already renders orderStage badge |
</phase_requirements>

---

## Summary

Phase 3 is a UI-intensive phase with no new infrastructure dependencies. The entire stack (Next.js 15, Zustand 5, Tailwind CSS 4, shadcn/ui, Base UI, Lucide React) is already installed and proven in Phases 1 and 2. The primary new artifacts are: a route at `/order/[tableId]`, a new `order.store.ts` for ticket state, a `menu.ts` mock-data fixture containing A Ramen's real categories and modifier trees, and three new component files (OrderPage split panel, ModifierSheet, TicketPanel).

The most critical design decision already locked is the split-panel layout for tablet. This means the order page does NOT live inside a bottom sheet — it is a full-page route. The modifier sheet for item configuration is the only overlay, and it reuses the exact CSS translate-y slide-up pattern from Phase 2's `TableBottomSheet`.

The order store state model is the most intellectually demanding part of this phase. It must distinguish between unsent (editable) and sent (read-only / void-only) line items, support multiple send rounds, and correctly serialize modifier selections for display in the ticket modifier summary line and eventually the KDS (Phase 4). Getting the type model right in Wave 0 prevents every downstream task from fighting TypeScript.

**Primary recommendation:** Build `order.store.ts` types and `menu.ts` fixture first (Wave 0), then the split-panel page shell, then ModifierSheet, then ticket interactions, then Send flow — matching the dependency order of the success criteria.

---

## Standard Stack

### Core (all already installed — no new installs required)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 16.1.6 | App Router, dynamic route `/order/[tableId]` | Installed |
| React | 19.2.3 | `'use client'` components, hooks | Installed |
| Zustand | 5.0.11 | `order.store.ts` — ticket state, no persist | Installed |
| Tailwind CSS | 4.x | Styling, CSS-first config in globals.css | Installed |
| shadcn/ui | 4.0.2 | Tabs, Checkbox, Button, Input, Badge | Installed |
| Base UI | 1.2.0 | Dialog backing for ManagerPinModal (already used) | Installed |
| Lucide React | 0.577.0 | Trash2, ChevronLeft, Plus, Minus, Flame icons | Installed |
| tw-animate-css | 1.4.0 | Transition classes for sheet slide animation | Installed |

### No New Installs

All required capabilities are already present. Do not add Sonner separately — check if it is already in the project or use a simple toast alternative already wired. (The CONTEXT.md references Sonner toast for ORDER-04; verify it is already installed or use a simple state-based toast pattern that matches the wireframe goal.)
**Action:** Check whether `sonner` package is in `package.json`. If absent, add it with `npm install sonner`. The CONTEXT.md explicitly calls for Sonner.

---

## Architecture Patterns

### New Files Required

```
src/
├── app/(app)/order/
│   └── [tableId]/
│       └── page.tsx          # OrderPage — 'use client', split panel
├── components/order/
│   ├── MenuPanel.tsx          # Left panel: CategoryTabs + MenuItemList
│   ├── TicketPanel.tsx        # Right panel: ticket lines + footer
│   ├── ModifierSheet.tsx      # Slide-up overlay for item configuration
│   └── TicketLineItem.tsx     # Single row in the ticket (unsent or sent)
├── stores/
│   └── order.store.ts         # New Zustand store for order state
└── lib/mock-data/
    └── menu.ts                # A Ramen menu fixture: categories, items, modifier trees
```

### Pattern 1: Order Store Design

**What:** Zustand store (no persist) holding one "active order" keyed by `tableId`. Each order contains rounds; each round contains line items. A line item holds the item reference, resolved modifier selections, quantity, status (unsent | sent | voided), and a client-generated UUID.

**When to use:** All ticket mutations (add, edit, remove, send, void) go through this store. The order page is stateless — it reads from the store.

**Critical type model:**

```typescript
// src/stores/order.store.ts
// Source: pattern established from table.store.ts in Phase 2

export type LineItemStatus = 'unsent' | 'sent' | 'voided'

export interface ModifierSelection {
  groupId: string
  groupLabel: string
  optionId: string
  optionLabel: string
}

export interface OrderLineItem {
  lineId: string                   // crypto.randomUUID() at creation
  menuItemId: string
  menuItemName: string
  basePrice: number
  modifiers: ModifierSelection[]   // all selected modifier options (including multi-select)
  spiceLevel: number | null        // 1–5, null if broth type doesn't use spice
  specialRequest: string
  quantity: number
  status: LineItemStatus
}

export interface OrderRound {
  roundId: string
  sentAt: number | null            // null = unsent round
  items: OrderLineItem[]
}

export interface ActiveOrder {
  tableId: string
  rounds: OrderRound[]
}

interface OrderStore {
  orders: Record<string, ActiveOrder>   // keyed by tableId
  // Actions
  addItem: (tableId: string, item: OrderLineItem) => void
  editItem: (tableId: string, lineId: string, updated: OrderLineItem) => void
  removeItem: (tableId: string, lineId: string) => void
  sendRound: (tableId: string) => void   // marks all unsent items → sent, records sentAt
  voidItem: (tableId: string, lineId: string) => void
  getOrder: (tableId: string) => ActiveOrder | undefined
}
```

**Key invariant:** `sendRound` finds all items with `status: 'unsent'` across ALL rounds for a table, marks them `'sent'`, and sets `sentAt: Date.now()` on that round. After send, a new empty round is NOT pre-created — it is created on-demand when the first new item is added post-send.

### Pattern 2: ModifierSheet Slide-Up (reuse TableBottomSheet pattern)

**What:** CSS-only slide-up with fixed backdrop. Identical motion to Phase 2's `TableBottomSheet`. No new animation library.

**When to use:** Any time staff taps a menu item row (add) or a ticket line item (edit).

```typescript
// Source: TableBottomSheet.tsx pattern established in Phase 2
// Reuse the same CSS classes exactly:

// Backdrop:
// className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
//   ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}

// Panel:
// className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
//   shadow-lg transition-transform duration-300 ease-out max-h-[70vh] overflow-y-auto
//   ${open ? 'translate-y-0' : 'translate-y-full'}`}
```

**Note:** Max height is `max-h-[70vh]` for the modifier sheet (vs `max-h-[80vh]` for TableBottomSheet) per the CONTEXT.md "~70% of screen" decision.

### Pattern 3: Required Field Validation (scroll-to-error)

**What:** [Add to Order] button always active. On tap, validate required groups. If a required group has no selection, add a `validationError` flag to local component state, highlight the group label + border in `text-destructive / border-destructive`, and call `element.scrollIntoView({ behavior: 'smooth' })` on the first errored group ref.

**When to use:** Only in ModifierSheet, only for Broth and Spice Level groups.

```typescript
// Pattern for scroll-to-first-error
const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

const handleAddToOrder = () => {
  const errors: string[] = []
  if (!selectedBroth) errors.push('broth')
  if (!selectedSpice) errors.push('spice')

  if (errors.length > 0) {
    setValidationErrors(errors)
    const firstRef = groupRefs.current[errors[0]]
    firstRef?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  // proceed to build OrderLineItem and call store.addItem
}
```

### Pattern 4: Sent vs Unsent Visual Distinction

**What:** Ticket lines render differently based on `status`.

| Property | Unsent | Sent | Voided |
|----------|--------|------|--------|
| Opacity | Full | `opacity-60` | `opacity-40` |
| Trash icon | Filled, `text-destructive` | Outlined `Trash2`, `text-muted-foreground` | Hidden |
| Qty controls | Visible | Hidden | Hidden |
| Text | Normal | Normal | `line-through` + Voided badge |
| Tap behavior | Opens edit sheet | Tap trash → PIN modal | No action |

### Pattern 5: Route Param Access (Next.js 15 App Router)

**What:** In Next.js 15, dynamic route params are a Promise. Use `React.use()` or `async/await` in server components. For client components, use the Next.js `useParams` hook.

```typescript
// src/app/(app)/order/[tableId]/page.tsx
'use client'
import { useParams } from 'next/navigation'

export default function OrderPage() {
  const { tableId } = useParams<{ tableId: string }>()
  // tableId is now a string, safe to use
}
```

**Why this matters:** If you try to destructure params as a plain object in a client component without `useParams`, TypeScript will complain in Next.js 15. This is a breaking change from Next.js 14.

### Pattern 6: Navigation to Order Route

**What:** `TableBottomSheet.tsx` currently has a disabled "View Order (Phase 3)" button. In Phase 3, replace with `router.push('/order/' + table.id)`.

```typescript
// In TableBottomSheet.tsx — replace the disabled button:
import { useRouter } from 'next/navigation'

const router = useRouter()

// In the Occupied block:
<Button
  variant="outline"
  className="flex-1"
  onClick={() => router.push(`/order/${table.id}`)}
>
  View Order
</Button>
```

### Anti-Patterns to Avoid

- **Merging same-item lines:** The locked decision is explicit — each [Add to Order] tap creates a new independent line item with its own UUID and modifier set. Do NOT detect duplicates or merge.
- **Clearing ticket on back navigation:** Unsent items must persist in `order.store.ts` when staff navigates back to `/table-map`. The store is in-memory (no persist), but it persists for the session. Do not call any reset on unmount.
- **Using React state for ticket contents:** The ticket is a cross-route concern (order screen and floor map both read it). It belongs in Zustand, not component state.
- **Removing sent items on void:** Voided items must remain in the ticket for the audit trail. Only their `status` changes to `'voided'`.
- **Building a custom checkbox:** Use shadcn Checkbox component for toppings multi-select. It already handles indeterminate state and accessibility.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notification on send | Custom toast component | Sonner (already specified) | Handles stacking, timing, dismissal, accessibility |
| Modal for PIN override | Custom dialog | ManagerPinModal (Phase 1) | Already built, tested, uses Base UI Dialog with `disablePointerDismissal` |
| Tab navigation styling | Custom tab component | shadcn Tabs | Already in project, consistent with design system |
| Multi-select checkboxes | Custom checkbox | shadcn Checkbox | Already in project |
| Unique IDs for line items | Custom counter | `crypto.randomUUID()` | Available in all modern browsers, no dependency needed |
| Slide-up animation | Framer Motion | CSS translate-y classes (established pattern) | Pattern already proven in Phase 2, no new dependency |

**Key insight:** Every UI primitive needed for Phase 3 is already installed. The value is in the composition, not the primitives.

---

## Common Pitfalls

### Pitfall 1: Next.js 15 Params API Change
**What goes wrong:** Accessing `params.tableId` directly on the page component props causes a TypeScript error or runtime warning in Next.js 15, which changed params to a Promise for server components.
**Why it happens:** Next.js 15 App Router breaking change from v14.
**How to avoid:** Use `useParams()` hook in client components. The page is `'use client'` per CONTEXT.md, so `useParams<{ tableId: string }>()` is the correct pattern.
**Warning signs:** TypeScript error "Type 'Promise<...>' is not assignable to type 'string'".

### Pitfall 2: Modifier Summary Line Gets Out of Sync
**What goes wrong:** When editing a ticket line item, the modifier summary shown on the ticket reflects the old selection because the store update was applied to the wrong item or a new item was created instead of updating the existing one.
**Why it happens:** Confusion between "add a new line" (adding from menu) and "edit existing line" (tapping a ticket line). They use different store actions: `addItem` vs `editItem`.
**How to avoid:** ModifierSheet needs an `editingLineId: string | null` prop. When `null`, [Add to Order] calls `addItem`. When set, it calls `editItem` with the existing `lineId`.
**Warning signs:** Ticket shows two entries for the same edit, or modifier summary doesn't update after editing.

### Pitfall 3: `line-through` Tailwind Class on Voided Items
**What goes wrong:** Tailwind's JIT purge removes `line-through` because it never appears in a static class string — only conditionally.
**Why it happens:** Tailwind v4 CSS-first config still requires classes to appear as complete strings in source files for detection.
**How to avoid:** Use the full class name as a string literal: `className={item.status === 'voided' ? 'line-through' : ''}`. Do not build strings like `${prefix}-through`.
**Warning signs:** Voided items do not appear struck-through in production build.

### Pitfall 4: Zustand Selector Causing Full Re-render
**What goes wrong:** The ticket panel re-renders on every table store change (including unrelated tables) because it subscribes to the entire `orders` object.
**Why it happens:** `useOrderStore((s) => s.orders)` returns a new reference every time any order changes.
**How to avoid:** Select only the specific order: `useOrderStore((s) => s.orders[tableId])`. Zustand 5 uses shallow equality by default when you select a derived value.
**Warning signs:** Visible flicker on the ticket panel when navigating between categories.

### Pitfall 5: Body Scroll Lock Missing on ModifierSheet
**What goes wrong:** When the modifier sheet is open on mobile, scrolling the sheet content also scrolls the background split panel.
**Why it happens:** Phase 2's TableBottomSheet sets `document.body.style.overflow = 'hidden'` when open. ModifierSheet must do the same.
**How to avoid:** Copy the `useEffect` scroll lock pattern from `TableBottomSheet.tsx` into `ModifierSheet.tsx`.
**Warning signs:** Background panel scrolls while modifier sheet is open on iOS/Android.

### Pitfall 6: `crypto.randomUUID()` Not Available in Tests
**What goes wrong:** If unit tests run in a Node environment without crypto, `crypto.randomUUID()` throws.
**Why it happens:** Node < 19 requires `require('crypto').randomUUID()` instead of the global.
**How to avoid:** Since this is a wireframe with no test framework currently (nyquist_validation is enabled but no test files exist), add a simple polyfill guard: `const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)`. Alternatively, accept that tests will run in jsdom/Next.js environment where `crypto` is available.

---

## Code Examples

### Menu Fixture Structure (A Ramen specific)

A Ramen's real ordering flow involves paper forms with broth choice, noodle firmness (katame/futsu/yawaraka), and toppings. Based on CONTEXT.md modifier groups (Broth, Spice Level, Toppings, Special Request), the fixture should be:

```typescript
// src/lib/mock-data/menu.ts

export interface MenuModifierOption {
  id: string
  label: string
  priceAdj: number      // 0 for most; positive for premium toppings
}

export interface MenuModifierGroup {
  id: string
  label: string
  type: 'single' | 'multi'
  required: boolean
  options: MenuModifierOption[]
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  nameTh: string        // Thai name for staff who read Thai
  basePrice: number     // in THB
  thumbnailPlaceholder: string   // emoji or color hint for placeholder design
  modifierGroups: MenuModifierGroup[]
}

export interface MenuCategory {
  id: string
  label: string
  labelTh: string
}

// A Ramen actual categories (ramen shop):
export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'ramen',     label: 'Ramen',      labelTh: 'ราเมน' },
  { id: 'rice',      label: 'Rice Bowls', labelTh: 'ข้าว' },
  { id: 'sides',     label: 'Sides',      labelTh: 'เซ็ท/ของเสริม' },
  { id: 'drinks',    label: 'Drinks',     labelTh: 'เครื่องดื่ม' },
]

// Example modifier tree for a ramen item:
// Broth group (required, single-select):
//   Tonkotsu / Miso / Shoyu / Spicy Miso
// Spice Level (required, single-select, rendered as icon selector not dropdown):
//   1 / 2 / 3 / 4 / 5
// Noodle Firmness (required, single-select):
//   Firm (Katame) / Regular (Futsu) / Soft (Yawaraka)
// Toppings (optional, multi-select):
//   Extra Chashu +30 / Soft-boiled Egg +20 / Corn +15 / Bamboo Shoots +10 / Butter +10
// Special Request (optional, free text)
```

**Note:** Spice Level uses a custom icon-selector UI, not a standard single-select dropdown. The modifier group type for Spice Level is still `'single'` in data — the UI component makes the rendering decision.

### order.store.ts addItem Pattern

```typescript
// Source: follows table.store.ts Zustand 5 pattern from Phase 2
addItem: (tableId, item) =>
  set((state) => {
    const existing = state.orders[tableId]
    if (!existing) {
      // First item for this table — create order with one round
      return {
        orders: {
          ...state.orders,
          [tableId]: {
            tableId,
            rounds: [{
              roundId: crypto.randomUUID(),
              sentAt: null,
              items: [item],
            }],
          },
        },
      }
    }

    // Find the current unsent round (last round with sentAt === null)
    const rounds = [...existing.rounds]
    const unsentIdx = rounds.findLastIndex((r) => r.sentAt === null)

    if (unsentIdx >= 0) {
      // Add to existing unsent round
      rounds[unsentIdx] = {
        ...rounds[unsentIdx],
        items: [...rounds[unsentIdx].items, item],
      }
    } else {
      // All rounds are sent — create new round
      rounds.push({ roundId: crypto.randomUUID(), sentAt: null, items: [item] })
    }

    return { orders: { ...state.orders, [tableId]: { ...existing, rounds } } }
  }),
```

### sendRound Pattern

```typescript
// Marks all unsent items across all rounds as sent;
// sets sentAt on the round that contains them
sendRound: (tableId) =>
  set((state) => {
    const existing = state.orders[tableId]
    if (!existing) return state

    const now = Date.now()
    const rounds = existing.rounds.map((round) => {
      if (round.sentAt !== null) return round   // already sent round, skip
      return {
        ...round,
        sentAt: now,
        items: round.items.map((item) =>
          item.status === 'unsent' ? { ...item, status: 'sent' as const } : item
        ),
      }
    })

    return { orders: { ...state.orders, [tableId]: { ...existing, rounds } } }
  }),
```

### Modifier Summary String for Ticket Line

```typescript
// Build a compact summary string from selected modifiers for display under item name
// Example: "Tonkotsu • Spice 3 • Katame • +Chashu, +Egg"
function buildModifierSummary(item: OrderLineItem): string {
  const parts: string[] = []

  // Find broth selection
  const broth = item.modifiers.find((m) => m.groupId === 'broth')
  if (broth) parts.push(broth.optionLabel)

  // Spice level
  if (item.spiceLevel !== null) parts.push(`Spice ${item.spiceLevel}`)

  // Noodle firmness
  const firmness = item.modifiers.find((m) => m.groupId === 'noodle-firmness')
  if (firmness) parts.push(firmness.optionLabel)

  // Toppings (multi-select, prefix with +)
  const toppings = item.modifiers.filter((m) => m.groupId === 'toppings')
  if (toppings.length > 0) parts.push(toppings.map((t) => `+${t.optionLabel}`).join(', '))

  // Special request (truncated)
  if (item.specialRequest) {
    const truncated = item.specialRequest.length > 20
      ? item.specialRequest.slice(0, 20) + '…'
      : item.specialRequest
    parts.push(`"${truncated}"`)
  }

  return parts.join(' • ')
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js 14 `params` as plain object | Next.js 15 `params` as Promise; use `useParams()` in client components | Next.js 15 | Must use `useParams` hook — do not destructure page props |
| Zustand 4 `useStore(selector, shallow)` | Zustand 5 built-in shallow equality via subscribeWithSelector | Zustand 5 | Simpler selectors; no need to import `shallow` separately |
| `array.findLast()` not available | `Array.prototype.findLastIndex()` is ES2023, available in Node 18+ and all modern browsers | 2023+ | Safe to use for finding last unsent round |

---

## Open Questions

1. **Sonner toast package installation**
   - What we know: CONTEXT.md explicitly says `Sonner toast "Order sent to kitchen"` fires on send
   - What's unclear: `sonner` is not in the current `package.json` (only `tw-animate-css`, base UI, etc.)
   - Recommendation: Wave 0 task must check and add `sonner` if absent. If stakeholder wants zero new deps, implement a simple fixed-position toast using existing Tailwind + tw-animate-css.

2. **Spice level modifier storage in ModifierSelection vs dedicated field**
   - What we know: CONTEXT.md says "Spice Level (required, 1–5 icon selector)" — separate from broth single-select
   - What's unclear: Should spice be stored as `spiceLevel: number` on `OrderLineItem` OR as a `ModifierSelection` in the `modifiers[]` array?
   - Recommendation: Store as dedicated `spiceLevel: number | null` field on `OrderLineItem` (cleaner for KDS display in Phase 4 and summary string building). Keep it out of the generic `modifiers[]` array to avoid special-case parsing later.

3. **Noodle firmness modifier — is it part of A Ramen's real menu?**
   - What we know: CLAUDE.md mentions staff key "ระดับความเผ็ดและความนุ่มของเส้น" (spice level and noodle firmness) via Forced Modifiers
   - What's unclear: Whether noodle firmness is always required for all ramen items or only some
   - Recommendation: Treat it as a required single-select modifier group on all ramen items in the fixture. Staff validated this in real operations per CLAUDE.md description.

---

## Validation Architecture

nyquist_validation is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None currently installed — Wave 0 gap |
| Config file | None |
| Quick run command | N/A — Wave 0 must establish |
| Full suite command | N/A |

**Note:** This is a Next.js wireframe project with no test files detected anywhere in `src/`. The project's primary validation method has been browser-based verification (as established in Phase 1 Plan 05 and Phase 2 Plan 04). Given the wireframe nature and the pattern established across previous phases, the practical Nyquist validation for Phase 3 is a structured browser checklist rather than automated unit tests.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORDER-01 | Category tabs render + item list filters by category | manual-browser | N/A — no test runner installed | Wave 0 gap |
| ORDER-02 | Modifier sheet opens, required validation fires, item adds to ticket | manual-browser | N/A | Wave 0 gap |
| ORDER-03 | Edit/remove on unsent items; edit pre-fills modifier sheet | manual-browser | N/A | Wave 0 gap |
| ORDER-04 | Send button fires toast, sent items become read-only, [Add Items] appears | manual-browser | N/A | Wave 0 gap |
| ORDER-05 | Void on sent item triggers Manager PIN; voided shows struck-through | manual-browser | N/A | Wave 0 gap |
| ORDER-06 | Post-send new item added, second Send works | manual-browser | N/A | Wave 0 gap |
| ORDER-07 | Floor map tile shows 'Ordered' badge after send | manual-browser | N/A | Wave 0 gap |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` — TypeScript type check (already used in Phases 1 and 2 as the verification gate)
- **Per wave merge:** `npx tsc --noEmit` + browser walkthrough of success criteria
- **Phase gate:** All 5 success criteria verified in browser at 1024px viewport before `/gsd:verify-work`

### Wave 0 Gaps

- No automated test framework — consistent with previous phases; browser verification is the established pattern
- `npx tsc --noEmit` as the automated gate is sufficient given wireframe scope
- If a test runner is desired, `vitest` + `@testing-library/react` would be the appropriate choice for this stack, but this is out of scope per the wireframe-only deliverable

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection: `src/stores/table.store.ts` — Zustand 5 store pattern, `OrderStage` type
- Codebase direct inspection: `src/components/table-map/TableBottomSheet.tsx` — slide-up CSS pattern to reuse
- Codebase direct inspection: `src/components/auth/ManagerPinModal.tsx` — PIN modal API and usage pattern
- Codebase direct inspection: `src/lib/role-permissions.ts` — `orders` slug already granted to Waiter, Cashier, Manager
- Codebase direct inspection: `src/components/table-map/TableTile.tsx` — `orderStage` badge already wired
- Codebase direct inspection: `package.json` — full dependency list; `sonner` absent
- `.planning/phases/03-order-flow/03-CONTEXT.md` — all locked implementation decisions

### Secondary (MEDIUM confidence)

- Next.js 15 App Router docs: `useParams()` is the correct hook for client components accessing dynamic route segments
- Zustand 5 docs: `create()` with no persist, standard set() pattern unchanged from v4

### Tertiary (LOW confidence)

- A Ramen menu structure: inferred from CLAUDE.md description of "Forced Modifiers" (ระดับความเผ็ดและความนุ่มของเส้น) + general ramen restaurant menu conventions. Actual menu items/prices not confirmed with operational staff — fixture values should be treated as representative placeholders.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; no new discovery needed
- Architecture: HIGH — store pattern directly mirrors Phase 2's `table.store.ts`; slide-up mirrors `TableBottomSheet`; route pattern follows existing `(app)` group structure
- A Ramen menu fixture: MEDIUM — categories/modifier structure inferred from CLAUDE.md operational description; specific items/prices are representative
- Pitfalls: HIGH — `useParams` change verified against Next.js 15 App Router; other pitfalls are direct observations from existing code patterns

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack — no fast-moving dependencies)
