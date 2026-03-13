# Phase 15: Order Tracking - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can see live order stage on every active table tile on the floor plan, open a per-item timeline from the TableBottomSheet, and receive a visual escalation warning for any item that has been in its current stage for >15 minutes. Phase covers display and derivation only — no new order actions, no manager threshold settings.

</domain>

<decisions>
## Implementation Decisions

### Timeline Entry Point
- Timeline lives as a **second tab inside TableBottomSheet** — tab bar shows `[ Actions ] [ Timeline ]`
- Tab bar is only rendered for **Occupied and CheckRequested** tables; other statuses use the existing single-view layout unchanged
- Items grouped **by round** (Round 1, Round 2…) — mirrors how orders are sent to kitchen in batches

### Timeline Item Rows
- Each row: **stage dot (colored) + item name + elapsed time since sent**
  - e.g. `● COOKING  Tonkotsu Ramen  18 min`
- Elapsed time derived from `OrderRound.sentAt` (already exists) — no per-bump timestamps needed, no kds.store schema changes
- Elapsed time updates **every 60 seconds** (a `setInterval` or `useDwellTimer`-style hook)
- Stage dot uses the **same 4-color tokens as the tile badge** (see Stage badge section below)

### Stage Badge Design
- 4 distinct semantic color token pairs (added to globals.css following `--status-{name}` / `--status-{name}-bg` pattern):
  - `--status-ordered` — blue (new stage, queued at kitchen)
  - `--status-cooking` — amber (in progress)
  - `--status-ready` — green (distinct from settled — "ready to serve" not "paid")
  - `--status-served` — reuses existing `--status-settled` token (terminal state, same green-gray)
- Badge shows on **Occupied and CheckRequested** tables; hidden on other statuses
- Badge uses `table.orderStage` (already updated by KDS bump via `updateTable`) — no new derived state in table.store
- The existing plain-outline `orderStage` badge in TableTile is **replaced** by this color-coded version

### Escalation
- Threshold: **15 minutes** — hardcoded named constant `ESCALATION_THRESHOLD_MS = 15 * 60 * 1000` in a shared utils or constants file
- **Tile badge**: if ANY item in the table's in-flight order has been in its current stage for >15 min, the badge color **overrides to red** — same badge, same text, color token switches to a `--status-escalated` red variant
- **No animation** — color change only (consistent with KDS timer escalation pattern from Phase 4)
- **Timeline row**: escalated items get a **faint red background tint + red elapsed text** — two visual signals on the row itself

### Stage Derivation (Wireframe)
- Per-item stage is **derived from the KDS ticket's stage** — all items in a round share their ticket's stage:
  - `KdsStage.New` → `Ordered`
  - `KdsStage.InProgress` → `Cooking`
  - `KdsStage.Ready` → `Ready`
  - Ticket removed from board (no ticket found) → `Served` (cross-referenced with `table.servedAt`)
- This derivation is a **pure function** — no redundant storage, consistent with the "derivation over duplication" architectural principle
- Escalation check uses `OrderRound.sentAt` as the start time for elapsed calculation (already available on every round)

### Claude's Discretion
- Exact OKLCH values for the 4 new stage tokens (`--status-ordered`, `--status-cooking`, `--status-ready`, `--status-escalated`) — blue/amber/green/red within the OKLCH space, independently tuned for light and dark mode
- Solar icon (if any) on the stage badge — may use a small dot/circle or no icon (label-only badge is acceptable)
- Tab bar implementation — whether to use the existing `shadcn Tabs` component or a simpler two-button toggle (same visual result)
- Exact wording of round section headers in the Timeline tab (e.g. "Round 1 · 12:31" vs "Round 1 (3 items)")
- Empty state in Timeline tab when no order exists yet for the table

</decisions>

<specifics>
## Specific Ideas

- TableBottomSheet tab mockup confirmed by user: `[ Actions ] [ Timeline ]` header with item rows showing `● COOKING  Tonkotsu Ramen  18 min` and a bottom escalation warning line `⚠️ Tonkotsu — 18 min in Cooking`
- The escalation warning line at the bottom of the Timeline tab (as shown in the mockup) is a good UX pattern — staff sees the summary without scanning all rows; include this as part of the Timeline view

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TableBottomSheet.tsx` — add tab bar at top of sheet body; tab state is local (no store needed); render Actions or Timeline content based on active tab
- `TableTile.tsx` — `orderStage` badge slot already exists (lines 103–107); replace plain outline badge with color-coded `--status-{stage}` token variant; escalation check adds a derived boolean passed to the badge class
- `useDwellTimer.ts` — existing custom hook for elapsed time display with `setInterval`; reuse or copy the pattern for per-item elapsed time in the Timeline tab
- `OrderRound.sentAt` (order.store) — timestamp already present; use as start time for elapsed calculation
- `table.orderStage` (table.store) — already updated by KDS bump via `updateTable`; the tile badge reads this directly; no new store state needed
- `Badge` component (badge.tsx) — extend with `variant="ordered"`, `"cooking"`, `"ready"` variants following the `"settled"` pattern already there
- KDS store `tickets` record — pure function to look up a table's current ticket stage: `Object.values(tickets).find(t => t.tableId === id)`

### Established Patterns
- Status token pattern: `--status-{name}` + `--status-{name}-bg` in `:root` and `.dark` — 4 new token pairs follow exactly this pattern in globals.css
- TableTile badge priority: `split > merge > orderStage` — Phase 15 replaces the `orderStage` fallback with a color-coded badge, priority unchanged
- Bottom sheet idiom: TabBottomSheet already slides up from the floor plan; the Timeline tab lives inside this existing sheet (no new sheet component needed)
- Zustand selector safety: derive from `s.tickets` (stable Record reference) + `useMemo`, not from a function that returns a new array — same pattern as the merge badge fix

### Integration Points
- `globals.css` — add `--status-ordered`, `--status-cooking`, `--status-ready`, `--status-escalated` token pairs in `:root`, `.dark`, and `@theme inline`
- `badge.tsx` — add `ordered`, `cooking`, `ready` variants (alongside existing `settled`)
- `TableTile.tsx` — replace plain outline badge with color-coded; add escalation boolean derived from `OrderRound.sentAt` cross-referenced with `kds.store.tickets`
- `TableBottomSheet.tsx` — add tab state + tab bar; render Timeline tab content for Occupied/CheckRequested
- New `OrderTimeline.tsx` (or inline in TableBottomSheet) — renders round-grouped item rows with stage dot, name, elapsed time, escalation tint

</code_context>

<deferred>
## Deferred Ideas

- Manager-configurable escalation threshold — out of scope for Phase 15; could live in manager settings in a future phase
- Per-item individual stage tracking (each item has its own stage independent of the ticket) — real-system behavior, out of scope for this wireframe phase

</deferred>

---

*Phase: 15-order-tracking*
*Context gathered: 2026-03-13*
