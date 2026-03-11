# Phase 6: Manager Layer - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Manager-only tools within the Staff POS app: close a shift with an end-of-day financial summary, view a sales snapshot, toggle item availability (86'd), and view all open tickets with a staff list. Everything lives under a single /manager route with tab navigation. No admin back office, no real backend.

</domain>

<decisions>
## Implementation Decisions

### Manager screen navigation
- Single `/manager` route with 4 tabs: EOD Summary | Sales Snapshot | 86'd Items | Open Tickets
- Default tab on load: EOD Summary (most likely reason manager opens this screen)
- Manager nav item is **hidden** for non-Manager roles (does not appear greyed out — breaks from Phase 1 pattern intentionally for this role)
- Close Shift requires a confirm dialog only — no re-PIN (Manager is already authenticated at login)

### EOD Summary layout (SHIFT-01)
- Two card sections: "Sales Summary" (revenue, net sales, VAT, cover count) and "Adjustments" (void count, discount total)
- Payment method breakdown: one row per method (Cash / QR / Card) with amount only — no transaction count or percentages
- Cash reconciliation: input field for closing cash → system auto-calculates and shows Over/Short variance in red (short) or green (over)
- After "Close Shift" confirm: summary becomes read-only with a "Shift Closed" banner + Logout button — does not auto-logout immediately

### 86'd item toggle (SHIFT-03)
- Dedicated tab within /manager ("86'd Items" tab)
- Menu displayed as flat list grouped by category (category header, then items with a toggle switch)
- 86'd state persists via localStorage (same Zustand persist pattern from Phase 5) — survives role switches within a shift
- On the order screen: 86'd items appear greyed out with an "86'd" badge and are not tappable (stay visible so staff can explain to customers)

### Open Tickets & Staff List (SHIFT-04)
- Single "Open Tickets" tab — Open Tickets section stacked above Staff List section (not separate tabs)
- Open Tickets: table-grouped list — one row per occupied table showing: Table ID, waiter name, cover count, order stage, estimated total, time open
- Tapping a table row navigates to `/order/[tableId]` — manager can review or intervene
- Staff List: name + role badge + table IDs assigned — simple 3-column list of who's on shift

### Sales Snapshot (SHIFT-02)
- Numbers view only — no charts (already specified in requirement)
- Claude has discretion on specific layout; suggested: revenue, covers, top items by quantity sold
- Tab accessible from the 4-tab nav at /manager

### Claude's Discretion
- Exact spacing, typography, and shadcn/ui component choices for manager screens
- Sales Snapshot specific data fields and layout (requirements specify: revenue, covers, top items as numbers)
- How mock data is generated for EOD totals (can derive from order.store + session.store)
- Exact wording for confirm dialogs

</decisions>

<specifics>
## Specific Ideas

- Shift closed state: summary read-only + "Shift Closed" banner + Logout button — gives manager a moment to review before ending session
- Cash reconciliation variance should be immediately visible as manager types (reactive input), not requiring a submit button
- Open tickets list should feel like a lightweight ops view — similar density to the KDS board but in list form

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `session.store.ts`: has `role`, `branch`, `branchName`, `openingCash`, `shiftOpen` — EOD can derive opening cash from here
- `order.store.ts` (persisted): all orders by tableId — EOD totals and open tickets can be derived from this
- `table.store.ts` (persisted): all table records — Open Tickets list reads occupied tables with waiter/order data
- `src/lib/mock-data/staff.ts`: MOCK_STAFF array with name/role — Staff List reads from this
- `src/lib/mock-data/menu.ts`: menu items with categories — 86'd Items tab reads this list
- `src/components/ui/`: badge, button, dialog, input, label, select, skeleton, tabs — all available
- `src/components/auth/ManagerPinModal.tsx`: existing PIN override modal pattern (not needed for close shift but reusable pattern)

### Established Patterns
- Zustand `persist` middleware (Phase 5) — new `manager.store.ts` should use it for 86'd state
- `useTableStore` + `useOrderStore` read-only in display components (Phase 2–5 pattern)
- Tabs component from shadcn/ui already installed — used in Phase 3 order screen

### Integration Points
- Manager nav item in AppShell sidebar: currently visible but needs to route to `/manager` when role === Manager, hidden otherwise
- Order screen (`src/app/(app)/order/[tableId]/page.tsx`): menu items need to check 86'd store before rendering
- `src/app/(app)/layout.tsx`: may need to add /manager to the allowed routes list

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-manager-layer*
*Context gathered: 2026-03-11*
