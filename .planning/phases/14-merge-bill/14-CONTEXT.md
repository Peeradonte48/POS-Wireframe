# Phase 14: Merge Bill - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can merge bills from 2+ occupied/check-requested tables into one combined bill on a primary table's payment page, with secondary tables linking back to the primary. Staff can also revert a per-seat split back to a single bill before any seat is paid. Merge does not combine with split — they are mutually exclusive states.

</domain>

<decisions>
## Implementation Decisions

### Merge Entry Flow
- **Both entry points**: a "Merge Bill" button in `TotalsSection` on the payment page (alongside Split Bill) AND a "Merge Bill" action in `TableBottomSheet` on the floor plan
- Table picker: **bottom sheet with option-card buttons** (multi-select, then a confirm action) — the `option-card` Button variant built in Phase 13 is used here directly
- Eligible tables in picker: **Occupied or CheckRequested** — Open, Reserved, and Cleaning tables are excluded
- Secondary table status **stays unchanged** after merge (no new TableStatus added) — the "Merged→T2" badge communicates the link
- One primary per secondary: a table can only be merged into one other table at a time

### Merged Bill Display
- Line items on primary table's payment page are **grouped by source table** — each group has a section header (e.g. "T3 — 2 guests") with that table's items listed below
- **Merge and split are mutually exclusive**: while a merge is active, the Split Bill button is hidden/disabled; staff must dissolve the merge first
- **Dissolve merge**: a small ghost/outline "Dissolve Merge" button appears near the merge group header; tapping it restores each table to its own independent bill

### Unsplit Placement & Guard
- "Revert to Single Bill" lives **inside the SplitSheet** — consistent with how cancel/revert already exists in that context
- If no seats paid: tapping "Revert to Single Bill" shows a **confirm dialog** ("Revert to single bill? This will remove all seat assignments."), then on confirm: clears split state and closes sheet
- If ≥1 seat already paid: button is **disabled** with an inline label: "Cannot revert — N seat(s) already paid"

### Secondary Table Behavior
- Secondary (merged-away) table tile shows a **"Merged→T[X]" badge in the top-right slot** — same absolute position as the split progress badge, same slot priority logic
- Badge uses a **new `--status-merged` / `--status-merged-bg` semantic token** (indigo/violet hue, OKLCH ~270°) — independently tuned for light and dark mode, following the same pattern as `--status-split` and `--status-settled`
- Tapping a secondary table tile **navigates directly to the primary table's payment page** (`/payment/[primaryTableId]`) — bypasses or shows a minimal "Merged into T[X] — viewing combined bill" state in TableBottomSheet

### Claude's Discretion
- Exact OKLCH values for `--status-merged` / `--status-merged-bg` (target: indigo/violet, readable, contrasts with amber split and crimson primary)
- Solar icon for the "Merged→T[X]" badge (link, merge-arrows, or similar)
- Solar icon for "Merge Bill" entry buttons
- Exact wording of confirm dialog for dissolve merge
- bill.store merge state shape: `merges: Record<string, string>` (secondaryTableId → primaryTableId) is the likely pattern

</decisions>

<specifics>
## Specific Ideas

- Grouped bill display: "T2 — 2 guests / T3 — 3 guests" with items under each — staff and customer see what came from where, which matters for party seating where different groups may want to know their share
- The option-card table picker should show the table label prominently and guest count as subtext — enough for staff to identify the right table quickly in a busy floor

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button variant="option-card"` (button.tsx) — Phase 13 built this specifically for the merge table picker; multi-select by toggling `data-selected` on multiple cards
- `TotalsSection.tsx` — already has a "Split Bill" Button slot; add "Merge Bill" in the same area (or replace with a billing actions row)
- `TableBottomSheet.tsx` — existing action button area (markReserved, requestCheck, etc.); add "Merge Bill" action for Occupied/CheckRequested tables
- `TableTile.tsx` — `showSplitBadge` pattern (lines ~46-49); merge badge uses same slot with `showMergeBadge` guard
- `useBillStore` (bill.store.ts) — extend with `merges: Record<string, string>`, `initMerge`, `dissolve`, `getMergeGroup` actions
- `SplitSheet.tsx` — add "Revert to Single Bill" button at the bottom; read `paidCount` (already computed) to determine disabled state

### Established Patterns
- Bottom sheet idiom: same slide-up pattern as SplitSheet — MergeSheet follows identical structure
- Status tokens: `--status-{name}` + `--status-{name}-bg` in `:root` and `.dark` in globals.css — `--status-merged` follows this exact pattern
- Top-right badge slot in TableTile: `absolute top-2 right-2` — existing priority logic: splitBadge > orderStage; merge badge sits at same level as split badge
- `style={{ boxShadow: 'var(--shadow-*)' }}` — shadow tokens via inline style, same as all other sheets/panels
- `cancelSplit` uses destructuring rest pattern (bill.store) — dissolve merge uses the same Zustand immutable pattern

### Integration Points
- `bill.store.ts` — add `merges` state + initMerge / dissolve / getMergeGroup / isMergedSecondary / getPrimaryTable actions
- `globals.css` — new `--status-merged` and `--status-merged-bg` tokens in `:root` and `.dark`
- `TableTile.tsx` — read `isMergedSecondary(table.id)` from bill.store; show merged badge; `onTap` override to route to primary
- `TotalsSection.tsx` — add "Merge Bill" button; conditionally show "Dissolve Merge" group header button when merges exist
- `TableBottomSheet.tsx` — add "Merge Bill" action button for Occupied/CheckRequested status
- `SplitSheet.tsx` — add "Revert to Single Bill" footer button with paid-guard disabled state

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-merge-bill*
*Context gathered: 2026-03-13*
