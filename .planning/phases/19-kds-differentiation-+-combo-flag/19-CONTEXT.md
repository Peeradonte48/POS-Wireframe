# Phase 19: KDS Differentiation + Combo Flag — Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual channel identity to the KDS board: order type badges on every ticket, filter tabs to narrow the board by channel, and a pack-to-go flag on individual dine-in order items. Phase 18 already wrote `orderType` + `platform` fields onto `KdsTicket` and platform OKLCH tokens are already in `globals.css` — this phase is purely presentational and additive.

</domain>

<decisions>
## Implementation Decisions

### Order type badge — placement
- Badge sits **inline with the table label** in the ticket header: `T-3  [TKWY]  [In Progress]  3:42`
- Stage badge (New / InProgress / Ready) stays on the right — nothing moves, badge is purely additive
- All tickets show an order type badge — dine-in is not exempt

### Order type badge — text & color
- **Abbreviated caps**: `DIN` / `TKWY` / `GRAB` / `LINE MAN`
- For delivery, show **platform name** (GRAB or LINE MAN) instead of a generic DLVR label. Fall back to `DLVR` if `platform` is null
- **Colors per channel** (CVA variants reusing existing tokens):
  - `DIN` → indigo (hue 250, matches existing ordered-stage token)
  - `TKWY` → amber (hue 75, matches cooking/check-requested amber family)
  - `GRAB` → platform-grab token (`--color-platform-grab` / `--color-platform-grab-bg`)
  - `LINE MAN` → platform-lineman token (`--color-platform-lineman` / `--color-platform-lineman-bg`)
  - `DLVR` (fallback) → neutral/muted
- **All badges use the same CVA variant** (solid chip style) — differentiated by color only, not shape or weight

### Filter tabs
- **Horizontal row above the full board**, between the KDS page header and the 3-column grid
- Tab labels: `All` / `Dine-in` / `Takeaway` / `Delivery` (full words, not abbreviated)
- **Counts in labels**: e.g. `All (7)` / `TKWY (2)` — total across all stages for that channel
- When a filter is active, **empty columns stay visible** with the existing dashed-border "No tickets" placeholder — no layout shift
- Filter selection is **ephemeral** — local `useState` in `KdsBoard`, resets to `All` on page reload; no kds.store persistence needed
- Tab style: plain `<button>` with `border-b-2 border-primary -mb-px` underline (established Phase 15 pattern)

### Pack-to-go flag — who & where
- **Waiter-initiated on the order entry page** — a small bag icon button on each item row in the order entry line item list
- Tap to toggle the flag on/off; flag is always togglable even after the item is sent to kitchen
- Pack-to-go is **dine-in only** — the flag is hidden/unavailable on takeaway and delivery order entry pages

### Pack-to-go flag — data model
- `packToGo?: boolean` field added to `OrderLineItem` in `order.store`
- The KDS ticket reads `packToGo` from the order items it already receives — **no kds.store changes needed**
- Default is `undefined` / falsy — existing items are unaffected

### Pack-to-go flag — KDS display
- Items with `packToGo: true` show a **small colored chip `[PACK]`** inline on the KDS item row (consistent with how modifiers/spice levels appear)
- BUMP button label and behavior are **unchanged** — PACK is a visual cue, not a workflow gate

### Demo mode
- `buildMockDemoTicket` assigns **random orderType** (weighted toward dine-in, occasionally takeaway or delivery with platform set)
- A **subset of demo items** get `packToGo: true` so the PACK badge is visible in demo without order entry
- Demo Mode button label stays as **"Demo Mode"** — no channel preview in the button label

### Claude's Discretion
- Exact weighting of orderType distribution in demo (e.g. 60% dine-in, 25% takeaway, 15% delivery)
- Exact Solar icon used for the bag toggle on order entry item rows
- Exact PACK badge color (amber or brand-red — whichever reads more clearly on the KDS item row)
- Fallback DLVR badge color (suggest neutral muted)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/kds.store.ts`: `KdsTicket` already has `orderType?: 'dine-in' | 'takeaway' | 'delivery'` and `platform?: 'grab' | 'lineman'` — Phase 18 added these; zero store changes needed for badge rendering
- `src/stores/order.store.ts` → `OrderLineItem`: Add `packToGo?: boolean` field here
- `src/components/ui/badge.tsx` CVA variants: Extend in place with new `order-type-din`, `order-type-tkwy`, `order-type-grab`, `order-type-lineman`, `order-type-dlvr` variants (or a single parameterized variant)
- `src/components/kds/KdsTicketCard.tsx`: Ticket header already has `tableLabel` + stage badge + timer. Badge slot goes between label and stage badge
- `src/components/kds/KdsItemRow.tsx`: Item rows are the integration point for the PACK badge on the KDS side
- `src/components/kds/KdsBoard.tsx`: Filter tab row goes at top of `KdsBoard` component; `stageTickets` filter currently filters by stage — add second filter by `activeChannelFilter`
- `src/lib/mock-data/kds-demo.ts` (`buildMockDemoTicket`): Update to assign random orderType + platform + packToGo items

### Established Patterns
- **Platform OKLCH tokens** already in `globals.css`: `--color-platform-grab`, `--color-platform-grab-bg`, `--color-platform-lineman`, `--color-platform-lineman-bg` — both `:root` and `.dark` independently tuned
- **Badge CVA extend-in-place**: Never wrap `badge.tsx` — add variants inline (CLAUDE.md)
- **Tab pattern**: `<button>` with `border-b-2 border-primary -mb-px` (Phase 15, used in `TableBottomSheet`)
- **Shadow tokens via inline style**: `style={{ boxShadow: 'var(--shadow-*)' }}` — not needed here (no new elevation)
- **Zustand selector safety**: Filter tab count derivation must use `useMemo` on raw `tickets` record — never call derived functions inside selectors

### Integration Points
- `KdsBoard.tsx`: Add filter tab row + `activeChannelFilter` state + filtering logic on `stageTickets`
- `KdsTicketCard.tsx`: Render order type badge in header
- `KdsItemRow.tsx` (or parent): Render `[PACK]` chip when `item.packToGo === true`
- Order entry page item row component: Add bag icon toggle that calls a new `togglePackToGo(tableId, roundIndex, lineId)` action on `order.store`
- `order.store.ts`: Add `packToGo?: boolean` to `OrderLineItem` type + `togglePackToGo` action
- `kds-demo.ts`: Update `buildMockDemoTicket` for randomized orderType + packToGo items

</code_context>

<specifics>
## Specific Ideas

- Badge position reference: `T-3  [TKWY]  [In Progress]  3:42` — label, then order type badge, then stage badge, then timer
- Filter tabs above the board: `[All (7)] [Dine-in (4)] [Takeaway (2)] [Delivery (1)]`
- Pack-to-go in order entry: bag icon button on the item row, tap to toggle; shows as `[PACK]` chip on the KDS item row
- Demo mode should surface all three channels + PACK badges without the tester having to place real orders — important for stakeholder presentations

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-kds-differentiation-+-combo-flag*
*Context gathered: 2026-03-15*
