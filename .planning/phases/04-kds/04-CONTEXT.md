# Phase 4: KDS - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Kitchen staff can view incoming orders on a full-screen ticket board (no AppShell sidebar), bump items and tickets through stages, recall bumped tickets, and run a demo mode where tickets auto-inject at a realistic cadence. Phase 3 sends orders and sets `orderStage: 'Ordered'` — KDS picks up from there and drives stage progression.

</domain>

<decisions>
## Implementation Decisions

### KDS shell & route
- Kitchen role: PIN login → directly to `/kds` route — no AppShell rendered
- `/kds` uses its own layout (full-screen, no sidebar, no top nav header from AppShell)
- KDS has its own minimal header bar: board title + Demo Mode toggle + DEMO badge (when active)
- Other roles still use AppShell with KDS nav item disabled/greyed out (Phase 1 pattern unchanged)

### KDS board layout
- Three columns: **New** / **In Progress** / **Ready**
- Columns are vertically scrollable if tickets overflow (board does not stop injecting when full)
- High-contrast visual style for kitchen readability (dark card backgrounds or bold borders — Claude's discretion within "high-contrast" constraint from KDS-01)
- No AppShell sidebar visible

### Ticket card design
- **Header:** Table number only (e.g. "T03") + elapsed MM:SS timer
- **Timer color progression:** green → amber at 10 min → red at 15 min
- **Items:** each item listed as a row — item name + modifier summary inline beneath (always visible, no expand needed)
  - e.g. "Tonkotsu Ramen / Tonkotsu • Spice 3 • Katame • Extra Chashu"
- **Item checkbox:** small checkbox on each item row (tap to mark item done)
- **Voided items:** struck-through text + small 'VOID' badge, dim gray — kitchen sees what was removed (KDS-03)
- **Allergy / special request flags:** visually distinct from regular modifier lines — e.g. orange badge or highlighted row (KDS-03)
- **Footer:** large full-width [BUMP] button — easy to hit with gloved hands

### Bump interaction
- **Ticket-level bump:** tap [BUMP] button at card footer → advances stage: New → In Progress → In Progress → Ready → Ready → Done (removed from board)
- **Item-level bump:** tap checkbox on individual item row to mark it done; when all items checked, [BUMP] button activates/glows to signal ticket is ready to advance
- No confirmation required — single tap advances; recall handles mistakes
- Recall tray: a collapsed row at the bottom of the KDS screen showing recently bumped/done tickets; tap any recalled ticket to restore it to the Ready column

### Demo mode
- **Entry:** [Demo Mode] toggle button in KDS header (top-right area)
- **Indicator:** subtle 'DEMO' pill/badge in header while active — always visible but not dominant
- **Auto-injection:** new mock tickets appear via `setInterval` at a randomized 8–12 second cadence
- **Board full:** columns continue scrolling vertically — injection does not pause (user chose this)
- **Exit:** toggle off Demo Mode — injection stops; existing demo tickets remain until bumped

### Claude's Discretion
- Exact card colors and contrast level (dark card vs high-contrast border on light card)
- Exact allergy/special request highlight treatment (badge color, border highlight)
- Recall tray exact expand/collapse behavior
- Mock ticket data used in demo mode (can reuse menu fixture from Phase 3)
- Animation on ticket injection (slide in, fade in, or instant)
- Exact BUMP button color/style (green? Prominent neutral?)

</decisions>

<specifics>
## Specific Ideas

- KDS should feel like a real kitchen display — high-contrast, large touch targets, readable from a distance
- Demo Mode is primarily for stakeholder presentations — toggle should be easy to find without being accidentally triggered
- The recall tray should be unobtrusive but accessible — kitchen staff occasionally need it but it shouldn't dominate the board view

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/order.store.ts` — `useOrderStore`, `ActiveOrder`, `OrderLineItem`, `LineItemStatus` (unsent/sent/voided) — KDS reads sent orders from this store
- `src/stores/table.store.ts` — `OrderStage` type (Ordered | Cooking | Ready | Served | Billed), `updateTable()` — KDS writes stage progression back to table store
- `src/components/auth/ManagerPinModal.tsx` — not needed for KDS (kitchen role doesn't void); KDS only reads voidItem results from order store
- `src/stores/session.store.ts` — role detection for routing (Kitchen role → redirect to /kds)
- Lucide React icons — already installed, use for checkbox states, timer icon, etc.

### Established Patterns
- Zustand 5 `create()` store pattern — KDS may need its own `kds.store.ts` for demo interval state and bump stage tracking (separate from order.store)
- Slide-up/slide-in CSS animations — established in Phase 2 (TableBottomSheet) and Phase 3 (ModifierSheet); ticket injection animation can follow same pattern
- `useParams()` from Next.js 15 for any dynamic segments (not needed for `/kds` — no table ID in route)
- TypeScript strict mode — all new files must compile clean

### Integration Points
- Auth guard in `src/app/(app)/layout.tsx` — Kitchen role currently routes into AppShell; Phase 4 needs to redirect Kitchen role to `/kds` instead
- `useOrderStore.getOrder(tableId)` — KDS needs to aggregate all active orders across all tables (not per-table); may need a new selector or store action
- `useTableStore.updateTable(tableId, { orderStage })` — KDS bumps write to table store; floor map tile updates reactively
- Route: `/kds` sits in `src/app/(app)/kds/page.tsx` but needs a layout that opts out of the AppShell

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-kds*
*Context gathered: 2026-03-11*
