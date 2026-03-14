# Phase 17: Queue Store + Floor Plan Tabs — Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the `queue.store` foundation and multi-channel floor plan UI. Staff can switch between Dine-in, Takeaway, and Delivery via tabs on the floor plan; view and manage the delivery order queue (accept, reject, advance status); and create new takeaway orders. Order entry and payment pipeline for takeaway/delivery is Phase 18.

</domain>

<decisions>
## Implementation Decisions

### Delivery Queue Layout
- Vertical card list layout (not Kanban, not compact rows) — cards stacked top-to-bottom, newest at top
- Each delivery card shows: platform badge + order ID, customer name, items summary, elapsed timer
- Status shown as: colored status badge (e.g. "Accepted") + single action CTA that changes per stage ("Mark Ready for Rider", "Confirm Picked Up")
- **Pending orders appear in a separate highlighted section at the top** ("Waiting for response"); accepted/active orders below in the main list

### Accept / Reject Flow
- Accept and Reject buttons are **inline on the pending card** — no extra tap needed (fast, matches Grab operator app pattern)
- On Accept: card animates from "Waiting for response" section down into the active queue; status badge updates to "Accepted"
- On Reject: a small **reason picker dialog** appears with preset reasons (Sold out / Too busy / Can't fulfil / Other) — one tap to select, then confirms

### New Takeaway Order
- Staff starts a takeaway order via a **FAB (+) button** in the Takeaway tab — opens a small dialog (same pattern as existing `OpenTableModal`)
- **Customer name is required; phone is optional** — order number auto-assigned (TK-001, TK-002…)
- Takeaway cards use the **same visual language as delivery cards**: order number, customer name, status badge, single action CTA ("Mark Ready", "Mark Collected")

### Demo Controls Placement
- **"Simulate Order" button** lives in the Delivery tab header (top area of the DeliveryPanel) — immediately visible when on Delivery tab; mirrors KDS demo mode button placement
- **Auto-accept toggle chip** lives in the same Delivery tab header row alongside Simulate Order — all queue controls in one place
- **Countdown timer**: rendered as a **circular ring animation** draining around the elapsed timer or platform badge on each pending card — high visual impact for stakeholder demos

### Claude's Discretion
- Exact card padding, spacing, and typography within the established design token system
- Exact ring animation implementation (CSS `conic-gradient` or SVG `stroke-dashoffset`)
- Empty state illustration / text for each tab when no active orders
- Transition/animation specifics for card moving from pending to active section
- Sidebar badge count implementation detail (reactive vs polling)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — already in project; no new component needed for tab switcher
- `src/components/ui/badge.tsx`: CVA variants for status badges — extend with `grab`, `lineman`, `takeaway` variants (per research)
- `src/components/ui/dialog.tsx`: Base UI dialog — use for New Takeaway form (same as `OpenTableModal` pattern)
- `src/components/table-map/OpenTableModal.tsx`: Reference pattern for the New Takeaway dialog (form with required/optional fields + confirm button)
- `src/components/table-map/TableGrid.tsx`: Existing Dine-in grid — goes inside `TabsContent value="dine-in"`, completely untouched
- `src/components/table-map/TableBottomSheet.tsx` / `MergeSheet.tsx`: Reference for bottom sheet patterns if needed
- `src/stores/kds.store.ts`: `addTicket(tableId, tableLabel)` — call this on delivery accept; needs `orderType` + `platform` fields added (Phase 18/19 concern, but store extension starts here)

### Established Patterns
- **Zustand selector safety** (CLAUDE.md): Select `orders: Record<string, QueueOrder>` from queue.store; derive filtered lists in `useMemo` — never call derived-list functions inside selectors (infinite loop risk)
- **Shadow tokens via inline style**: `style={{ boxShadow: 'var(--shadow-card)' }}` — multi-value CSS strings incompatible with Tailwind v4 `@theme inline`
- **Non-reactive store reads**: Use `useQueueStore.getState().someValue` for values that don't change at runtime
- **Demo mode pattern**: KDS `toggleDemoActive()` + `demoActive` boolean in store — mirror this pattern for delivery simulation toggle
- **`persist` middleware with unique key**: Existing keys are `table-store`, `order-store`, `bill-store`, `manager-store` — use `queue-store` (no collision)

### Integration Points
- `src/app/(app)/table-map/page.tsx`: Wrap existing content in `<Tabs>` — Dine-in `TabsContent` gets current `<TableGrid>` + `<TableBottomSheet>` + `<OpenTableModal>` unchanged; two new `TabsContent` slots for `TakeawayPanel` and `DeliveryPanel`
- `src/lib/role-permissions.ts`: Add `'queue'` to NavSlug type + appropriate role access; add `'new-takeaway'` ActionKey
- AppShell sidebar: Add queue nav item with pending delivery badge count
- `src/app/globals.css`: Add 6 OKLCH tokens for Grab green + LINE MAN blue + takeaway amber (`:root` and `.dark` independently tuned)

</code_context>

<specifics>
## Specific Ideas

- Pending section header: something like "⏳ Waiting for response (2)" with count — urgency without alarm
- Platform badge colors: Grab = green (`oklch(0.72 0.18 145)`), LINE MAN = blue (`oklch(0.55 0.22 260)`) — established in research
- Countdown ring: drains clockwise from full to empty, ring turns amber then red as urgency increases
- Auto-accept toggle: small chip/pill toggle, not a full switch component — stays compact in the header row
- Delivery tab badge: shows count of pending (not-yet-accepted) orders specifically — most urgent signal

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 17 scope. Order entry and payment pipeline for takeaway/delivery are Phase 18 by design.

</deferred>

---

*Phase: 17-queue-store-floor-plan-tabs*
*Context gathered: 2026-03-15*
