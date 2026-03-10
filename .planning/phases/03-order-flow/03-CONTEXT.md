# Phase 3: Order Flow - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can browse menu by category, configure ramen modifiers per item, build a ticket, send it to the kitchen, and manage the ticket lifecycle (add items mid-meal, void items with manager PIN override). Table tile on the floor plan updates its orderStage badge when an order is sent. Order entry and KDS are separate — Phase 3 ends at "order sent"; Phase 4 (KDS) handles kitchen-side stage progression.

</domain>

<decisions>
## Implementation Decisions

### Order screen layout
- Split-panel layout: left panel = menu categories + item list, right panel = live ticket
- Both panels always visible (tablet-first, 1024px primary viewport)
- Header above split: table number + guest count only (e.g. "T03 • 3 guests") — no waiter name in header
- Category navigation: horizontal scrollable tab row at top of left panel (shadcn Tabs component)
- Menu items: list rows with small thumbnail placeholder + name + price (not card grid, not text-only)
- Ticket line item: item name + modifier summary line + quantity controls (− qty +) + trash icon
- Right panel footer: running total + [Send to Kitchen] button

### Order screen navigation
- Entry point: `/order/[tableId]` route — navigated to from TableBottomSheet [View Order] button
- The [View Order] button on TableBottomSheet activates in Phase 3 (was disabled placeholder in Phase 2)
- Back navigation: ← back arrow in header returns to `/table-map`; unsent items persist in store (not discarded on back)
- No discard prompt on back — staff can return to the ticket and continue

### Modifier sheet UX
- Tapping a menu item opens a slide-up bottom sheet (same CSS pattern as Phase 2 TableBottomSheet)
- Bottom sheet covers ~70% of screen with dim backdrop behind split panel
- Modifier groups in order: Broth (required, single-select) → Spice Level (required, 1–5 icon selector) → Toppings (optional, multi-select checkboxes) → Special Request (optional free text input)
- Spice level: 5 chili 🌶 icons in a row, tap to select 1–5, filled = selected, dim = unselected, label "1 2 3 4 5" beneath
- Required group validation: [Add to Order] button is always active; tapping with missing required fields highlights the group in red with inline error text and scrolls to it
- Editing: tapping a ticket line item reopens the modifier sheet pre-filled with that item's current values (staff can adjust and confirm)
- Quantity in sheet: sheet has a qty control (default 1); each tap of [Add to Order] adds a separate line item with its own modifier set — same item added again = new independent line, NOT merged with existing

### Ticket quantity controls
- Each ticket line: − / qty / + controls for adjusting quantity
- Quantity changes are pre-send only (unsent items); sent items qty is immutable
- Trash icon removes the line item (pre-send: instant remove, no confirm)

### Pre-send item removal (ORDER-03)
- Trash icon on each unsent ticket line — tap to remove instantly, no confirmation
- Unsent items are clearly styled differently from sent items (see below)

### Send to kitchen flow (ORDER-04)
- [Send to Kitchen] button at bottom of right panel
- On send: Sonner toast "Order sent to kitchen" fires; staff stays on order screen
- Ticket transitions: sent items become read-only (visual distinction — lighter/muted styling, no trash icon or qty controls visible)
- Table store updated: `useTableStore.updateTable(tableId, { orderStage: 'Ordered' })` — tile on floor plan shows 'Ordered' badge immediately
- After sending: [Add Items] button appears at top of right panel; tapping it re-activates the menu for a new round

### Mid-meal add-on round (ORDER-06)
- After sending, [Add Items] button at top of right panel activates menu browsing
- New items added form a "pending" round (visually distinct from sent items)
- Staff sends the new round separately with [Send to Kitchen] again
- Each send updates the table's orderStage (stays 'Ordered' → KDS drives further progression in Phase 4)

### Post-send void (ORDER-05)
- Sent items show a muted trash icon (different styling from pre-send trash — outlined, smaller)
- Tap sent item trash → Manager PIN overlay fires immediately (reuses Phase 1 ManagerPinModal)
- PIN verified → item shows struck-through text + 'Voided' badge; item is NOT removed from the list (audit trail)
- PIN rejected → overlay closes, nothing changes

### ORDER-07 table tile stage updates
- Order screen writes directly to `useTableStore.updateTable()` on each Send
- Stage values written: 'Ordered' on first send (subsequent sends keep 'Ordered' until KDS advances it in Phase 4)
- Floor plan tile badge reflects the current orderStage from table store reactively (already wired via useTableStore in Phase 2)

### Claude's Discretion
- Exact tab indicator styling (underline, filled pill, etc.)
- Menu item thumbnail placeholder design (gray rect with food icon, or colored placeholder)
- Sent vs unsent item visual differentiation (exact colors/opacity)
- Bottom sheet handle + height percentages
- Modifier sheet scroll behavior (single scroll vs sticky section headers)
- Exact shadcn/ui component choices (Tabs, Checkbox, etc.)

</decisions>

<specifics>
## Specific Ideas

- A Ramen real-world flow: customer fills paper order form at table → staff collects it → staff keys order into POS at counter or tableside. The order entry screen must be fast to key from a paper form — list rows (not cards) keep the menu scannable.
- The modifier sheet follows the same CSS slide-up pattern as Phase 2's TableBottomSheet — consistent motion language, no new library needed.
- "Sent" items must remain visible on the ticket (not cleared) so staff can see what's been ordered when a customer has questions.
- The Manager PIN modal for void must fire without leaving the order screen — same overlay behavior as Phase 1 ManagerPinModal (dark backdrop, centered card).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TableBottomSheet.tsx` pattern: CSS-only slide-up (translate-y-full → translate-y-0) with fixed backdrop — reuse exactly for modifier sheet
- `ManagerPinModal` (Phase 1): reuse as-is for post-send void authorization
- `Badge` component (`src/components/ui/badge.tsx`): order stage badge on ticket and floor plan tile (Ordered/Cooking/Ready/Billed)
- `Button`, `Input`, `Select`, `Label` from `src/components/ui/` — all available
- `useTableStore` + `updateTable()`: Phase 3 calls this on Send to update `orderStage`
- `OrderStage` type already defined in `table.store.ts`: `'Ordered' | 'Cooking' | 'Ready' | 'Served' | 'Billed'`
- `session.store.ts`: read `role` for void authorization gating

### Established Patterns
- Zustand store with no persist (new `order.store.ts` follows same pattern as `table.store.ts`)
- Client components (`'use client'`) for all interactive pages
- Tailwind CSS 4 CSS-first config — no config file, `@theme` in globals.css
- TypeScript strict mode — all store types fully typed
- Blur-update pattern (Phase 2): local state for inputs, write to store on blur — apply to special request field

### Integration Points
- New route: `src/app/(app)/order/[tableId]/page.tsx` — inside `(app)` route group, protected by existing auth guard
- `TableBottomSheet.tsx` [View Order] button: replace `disabled` placeholder with `router.push('/order/' + table.id)`
- `ROLE_NAV_ACCESS`: Orders nav item gating already in `role-permissions.ts` — verify Waiter and Cashier have access
- `useTableStore.updateTable()`: called from order screen on Send with `{ orderStage: 'Ordered' }`
- Floor plan tile already renders `orderStage` badge via `TableTile.tsx` — badge will update reactively once store is written

</code_context>

<deferred>
## Deferred Ideas

- **Seat-assignable items** (split bill v2 pre-req): assigning items to specific seats at order time — Phase 5 or v2 consideration; do NOT add seat field to order items in Phase 3 without a clear v2 data model decision (research flag from STATE.md)
- **Course/round management** (ORDER-V2-01): multi-send ordering with kitchen grouping by course — v2 requirement, out of Phase 3 scope
- **Modifier presets** (ORDER-V2-02): quick combos for frequent customizations — v2, not Phase 3
- **Order history / receipt reprint from order screen**: belongs in Phase 5 (Payment)
- **86'd item availability toggle**: SHIFT-03, belongs in Phase 6 (Manager Layer) — for Phase 3, all menu items are available

</deferred>

---

*Phase: 03-order-flow*
*Context gathered: 2026-03-10*
