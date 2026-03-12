# Phase 14: Merge Bill - Research

**Researched:** 2026-03-13
**Domain:** Zustand state extension, bottom-sheet UI, cross-table bill composition, CSS design tokens
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Merge Entry Flow**
- Both entry points: a "Merge Bill" button in `TotalsSection` on the payment page (alongside Split Bill) AND a "Merge Bill" action in `TableBottomSheet` on the floor plan
- Table picker: bottom sheet with option-card buttons (multi-select, then a confirm action) — the `option-card` Button variant built in Phase 13 is used here directly
- Eligible tables in picker: Occupied or CheckRequested — Open, Reserved, and Cleaning tables are excluded
- Secondary table status stays unchanged after merge (no new TableStatus added) — the "Merged→T2" badge communicates the link
- One primary per secondary: a table can only be merged into one other table at a time

**Merged Bill Display**
- Line items on primary table's payment page are grouped by source table — each group has a section header (e.g. "T3 — 2 guests") with that table's items listed below
- Merge and split are mutually exclusive: while a merge is active, the Split Bill button is hidden/disabled; staff must dissolve the merge first
- Dissolve merge: a small ghost/outline "Dissolve Merge" button appears near the merge group header; tapping it restores each table to its own independent bill

**Unsplit Placement & Guard**
- "Revert to Single Bill" lives inside the SplitSheet — consistent with how cancel/revert already exists in that context
- If no seats paid: tapping "Revert to Single Bill" shows a confirm dialog ("Revert to single bill? This will remove all seat assignments."), then on confirm: clears split state and closes sheet
- If ≥1 seat already paid: button is disabled with an inline label: "Cannot revert — N seat(s) already paid"

**Secondary Table Behavior**
- Secondary (merged-away) table tile shows a "Merged→T[X]" badge in the top-right slot — same absolute position as the split progress badge, same slot priority logic
- Badge uses a new `--status-merged` / `--status-merged-bg` semantic token (indigo/violet hue, OKLCH ~270°) — independently tuned for light and dark mode, following the same pattern as `--status-split` and `--status-settled`
- Tapping a secondary table tile navigates directly to the primary table's payment page (`/payment/[primaryTableId]`) — bypasses or shows a minimal "Merged into T[X] — viewing combined bill" state in TableBottomSheet

### Claude's Discretion
- Exact OKLCH values for `--status-merged` / `--status-merged-bg` (target: indigo/violet, readable, contrasts with amber split and crimson primary)
- Solar icon for the "Merged→T[X]" badge (link, merge-arrows, or similar)
- Solar icon for "Merge Bill" entry buttons
- Exact wording of confirm dialog for dissolve merge
- bill.store merge state shape: `merges: Record<string, string>` (secondaryTableId → primaryTableId) is the likely pattern

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MERGE-01 | Staff can merge bills across 2+ tables into a combined bill showing all items with correct totals; source tables link to merged bill | bill.store `merges` map + grouped line items rendering on primary's payment page + secondary tile badge + secondary tile tap routing |
| MERGE-02 | Staff can unsplit previously separated seats back into a single bill before any seat is paid | "Revert to Single Bill" button inside existing SplitSheet; `paidCount` guard already computed in SplitSheet; calls `cancelSplit` on confirm |
</phase_requirements>

---

## Summary

Phase 14 is a pure state-and-UI extension phase. There are no new npm packages, no new routes (secondary tables route to an existing payment URL), and no new backend concerns. All complexity lives in three areas: (1) extending `bill.store.ts` with a `merges` map, (2) creating a `MergeSheet` bottom-sheet component that mirrors SplitSheet's slide-up structure, and (3) wiring the secondary-table badge + navigation override into `TableTile` and `TableBottomSheet`.

The merge state shape is intentionally simple: `merges: Record<string, string>` where the key is a secondary tableId and the value is the primary tableId. This flat map supports O(1) lookup in both directions (with a small helper). Every action (`initMerge`, `dissolveAll`, `isMergedSecondary`, `getPrimaryTable`, `getMergedSecondaries`) can be derived from this single map — no nested structures needed.

Grouped bill display on the primary payment page requires reading `order.store` for both the primary and each secondary tableId. The payment page already computes `billItems` from a single `getOrder(tableId)` call; this becomes a merge of N `getOrder` calls grouped by source, with combined subtotal/VAT/grandTotal computed on the merged flat list. The existing VAT formula (`Math.round(subtotal * 0.07)`) applies to the combined discountedSubtotal — not to each table individually — to produce a single correct grand total.

**Primary recommendation:** Extend `bill.store.ts` with the `merges` map and five new selectors/actions, build `MergeSheet.tsx` following the SplitSheet slide-up pattern exactly, and thread the merge badge + routing override through `TableTile`. Then update `TotalsSection`, `TableBottomSheet`, the payment page, and `SplitSheet` for integration touchpoints.

---

## Standard Stack

### Core (already installed — zero new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand 5 + persist | 5.x | Merge state that survives route-group transitions | Already the project standard for all cross-route state |
| Next.js App Router | 16.x | `useRouter().push()` for secondary→primary navigation | Already the routing layer |
| CVA (class-variance-authority) | latest | Badge variant `merged` in badge.tsx | Already used for `settled` variant — same pattern |
| Solar icon set | latest | Icons for Merge Bill button and badge | Project icon standard |
| Tailwind CSS 4 + `@theme inline` | 4.x | `--status-merged` / `--status-merged-bg` tokens | All status tokens live here |

### No New Packages Required

Every capability needed for Phase 14 is already present in the installed stack. No `npm install` step is needed.

---

## Architecture Patterns

### Recommended New Files
```
src/
├── components/
│   └── table-map/
│       └── MergeSheet.tsx          # New: table picker + confirm, mirrors SplitSheet structure
└── stores/
    └── bill.store.ts               # Extended: add merges map + 5 new actions
```

### Pattern 1: Flat Merge Map in bill.store

**What:** `merges: Record<string, string>` where key=secondaryTableId, value=primaryTableId. Primary table is never a key in this map — it holds no entry for itself.

**When to use:** Any time you need O(1) "is this table a secondary?" or "who is this table's primary?"

```typescript
// State shape extension (bill.store.ts)
interface BillStore {
  splits: Record<string, BillSplit>
  merges: Record<string, string>          // secondaryId → primaryId

  // New actions
  initMerge: (primaryTableId: string, secondaryTableIds: string[]) => void
  dissolveAll: (primaryTableId: string) => void
  isMergedSecondary: (tableId: string) => boolean
  getPrimaryTable: (secondaryTableId: string) => string | undefined
  getMergedSecondaries: (primaryTableId: string) => string[]
}
```

Zustand immutable update pattern (consistent with existing `cancelSplit`):
```typescript
initMerge: (primaryId, secondaryIds) =>
  set((state) => {
    const newEntries = Object.fromEntries(secondaryIds.map((id) => [id, primaryId]))
    return { merges: { ...state.merges, ...newEntries } }
  }),

dissolveAll: (primaryId) =>
  set((state) => {
    const remaining = Object.fromEntries(
      Object.entries(state.merges).filter(([, v]) => v !== primaryId)
    )
    return { merges: remaining }
  }),
```

Selector helpers (use `get()` not reactive subscription — same pattern as `getSplit`):
```typescript
isMergedSecondary: (tableId) => tableId in get().merges,
getPrimaryTable: (tableId) => get().merges[tableId],
getMergedSecondaries: (primaryId) =>
  Object.keys(get().merges).filter((k) => get().merges[k] === primaryId),
```

### Pattern 2: MergeSheet Component

**What:** Slide-up bottom sheet following the exact SplitSheet structural template: fixed backdrop + fixed panel with drag handle, `open` prop drives translate-y, body scroll lock in `useEffect([open])`, view reset in `useEffect([open])`.

**When to use:** Triggered from both TotalsSection ("Merge Bill" button) and TableBottomSheet ("Merge Bill" action button).

```typescript
// MergeSheet props
interface MergeSheetProps {
  open: boolean
  onClose: () => void
  primaryTableId: string
  onMergeConfirmed: () => void
}
```

Internal view state:
```typescript
type MergeView = 'picker' | 'confirming'
```

Table picker renders occupied+checkRequested tables (excluding the primary itself and any already-merged secondaries for other primaries) as `Button variant="option-card"` with `data-selected={selectedIds.includes(table.id)}`. Multi-select by toggling Set membership. Confirm button disabled when `selectedIds.length === 0`.

### Pattern 3: Grouped Bill Items on Payment Page

**What:** When `getMergedSecondaries(tableId).length > 0`, the payment page renders items grouped by source table instead of the flat list. Each group has a header row and a "Dissolve Merge" ghost button. The combined totals are computed from all items across all tables.

**When to use:** Replaces the default flat `billItems` render when a merge is active.

```typescript
// In payment page — replace billItems computation
const mergedSecondaryIds = useBillStore((s) => s.getMergedSecondaries(tableId))
const isMerged = mergedSecondaryIds.length > 0

// All tableIds to collect items from
const allTableIds = [tableId, ...mergedSecondaryIds]

// Collect orders per table for grouped display
const tableOrders = allTableIds.map((tid) => ({
  tableId: tid,
  label: tables[tid]?.label ?? tid,
  guestCount: tables[tid]?.guestCount ?? null,
  items: (useOrderStore.getState().getOrder(tid)?.rounds ?? [])
    .flatMap((r) => r.items)
    .filter((item) => item.status !== 'voided'),
}))

// Combined flat list for totals
const billItems = tableOrders.flatMap((g) => g.items)
```

Note: `subtotal`, `vatAmount`, and `grandTotal` already compute correctly from the merged `billItems` flat list — no changes to the totals formula.

### Pattern 4: Secondary Table Badge and Routing Override

**What:** `TableTile` reads `isMergedSecondary(table.id)` from bill.store. If true, the badge slot shows `"Merged→T[X]"` using the `--status-merged` token. The `onTap` prop is still called by the tile — but the *caller* (`TableGrid` → `table-map/page.tsx` → `TableBottomSheet`) handles the routing override, or `TableTile` can override it directly via `useRouter` if cleaner.

**Decision point for planner:** The simplest approach is for `TableTile` to call `router.push(\`/payment/\${primaryId}\`)` directly when `isMergedSecondary` is true, bypassing `onTap` entirely. This avoids threading merge-routing logic through `TableGrid` and the page.

```typescript
// TableTile — override click for merged secondaries
const isMergedSecondary = useBillStore((s) => s.isMergedSecondary(table.id))
const primaryTableId = useBillStore((s) => s.getPrimaryTable(table.id))
const router = useRouter()

// In the button onClick:
onClick={() => {
  if (isMergedSecondary && primaryTableId) {
    router.push(`/payment/${primaryTableId}`)
  } else {
    onTap(table)
  }
}}
```

Badge slot priority (top-right `absolute top-2 right-2`):
1. `showSplitBadge` (existing — CheckRequested + split in progress)
2. `showMergeBadge` (new — isMergedSecondary)
3. `table.orderStage` badge (existing)

The split badge takes priority over the merge badge because a table cannot be both split (per-seat) and merged simultaneously (mutually exclusive).

### Pattern 5: Revert to Single Bill (MERGE-02)

**What:** "Revert to Single Bill" button added at the bottom of SplitSheet, inside the `renderCancelSection()` area or as a separate footer row. Reads `paidCount` (already computed in the component) to determine disabled state.

```typescript
// In SplitSheet — addition to renderCancelSection or new footer section
const paidCount = split ? Object.keys(split.payments).length : 0

// Revert button
<Button
  variant="ghost"
  className="w-full text-muted-foreground"
  disabled={paidCount > 0}
  onClick={() => setShowRevertConfirm(true)}
>
  Revert to Single Bill
</Button>

// If paidCount > 0, show inline label instead
{paidCount > 0 && (
  <p className="text-xs text-muted-foreground text-center">
    Cannot revert — {paidCount} seat(s) already paid
  </p>
)}
```

Confirm dialog pattern — use existing `showCancelWarning` boolean approach (no new dialog library):
```typescript
// Confirm state
const [showRevertConfirm, setShowRevertConfirm] = useState(false)

// On confirm
function handleConfirmRevert() {
  cancelSplit(tableId)
  toast('Reverted to single bill')
  setShowRevertConfirm(false)
  onClose()
}
```

### Pattern 6: --status-merged CSS Token

**What:** New semantic token pair added to `:root` and `.dark` in `globals.css`, registered in `@theme inline`. Follows the exact pattern of all other `--status-*` tokens.

OKLCH indigo/violet at ~270° (hue chosen to contrast visually with amber split at 60° and crimson primary at ~27°):

```css
/* In :root */
--status-merged:    oklch(0.50 0.20 270);
--status-merged-bg: oklch(0.94 0.05 270);

/* In .dark */
--status-merged:    oklch(0.72 0.18 270);
--status-merged-bg: oklch(0.24 0.07 270);
```

Registration in `@theme inline` (alongside existing status aliases):
```css
--color-status-merged:    var(--status-merged);
--color-status-merged-bg: var(--status-merged-bg);
```

The planner has discretion to tune exact L and C values; the hue 270° is the constraint.

### Anti-Patterns to Avoid

- **Storing merge state in table.store:** Merge is a payment-phase concern (same as splits). Keep it in bill.store only — table.store stays status-only.
- **New TableStatus for merged secondary:** Decided against in CONTEXT.md. Status stays Occupied/CheckRequested; badge communicates the link.
- **Allowing merge + split simultaneously:** Mutually exclusive. While `getMergedSecondaries(tableId).length > 0`, the Split Bill button must be hidden or disabled.
- **Computing combined totals table-by-table then summing:** Apply VAT to the combined discounted subtotal once, not per-table. The existing formula (`Math.round(discountedSubtotal * 0.07)`) is already correct when `billItems` is the merged flat list.
- **Using reactive Zustand subscriptions inside bill.store action implementations:** Use `get()` not `useXxxStore` hook (same pattern as existing `cancelSplit`, `getSplit`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-up bottom sheet | Custom modal from scratch | Copy MergeSheet structure from SplitSheet.tsx | The exact pattern is already working: fixed backdrop, translate-y, body scroll lock, drag handle |
| Multi-select state | Complex UI library | `useState<Set<string>>` with toggle logic | Two lines; Set.has() gives O(1) membership for `data-selected` prop |
| Table picker cards | Custom card component | `Button variant="option-card"` (Phase 13) | Was built specifically for this picker; `data-[selected=true]` styling already baked in |
| Grouped list sections | FlatList/virtualized list | Plain `map()` with section header `<p className="caps">` | Item count is bounded (8–16 items across 2–3 tables); no virtualization needed |
| Confirm dialog for dissolve/revert | Dialog component import | Inline conditional render of confirm + cancel buttons | Same pattern SplitSheet uses for `showCancelWarning`; consistent, no dependency |

---

## Common Pitfalls

### Pitfall 1: Stale `billItems` on Payment Page After Merge

**What goes wrong:** Payment page computes `billItems` via `useMemo` with `[order]` dependency. After `initMerge`, the `order` for the primary hasn't changed — the stale memo still shows only primary items. Secondary items are never displayed.

**Why it happens:** `useOrderStore((s) => s.getOrder(tableId))` subscribes to one table's order. When secondaries are added to the merge, this subscription doesn't fire.

**How to avoid:** Subscribe to the full `merges` map as an additional dependency, or derive `mergedSecondaryIds` reactively from bill.store and include them in the `useMemo` deps array. Read all secondary orders via `useOrderStore.getState().getOrder(secId)` inside the memo (non-reactive, but the memo re-runs when `mergedSecondaryIds` changes).

**Warning signs:** Payment page shows correct total for primary only; secondary items missing from bill.

### Pitfall 2: `dissolveAll` Leaving Orphan State

**What goes wrong:** Staff dissolves a merge, but the payment page still reads stale `mergedSecondaryIds` from a Zustand selector that was subscribed before the dissolve. Or `cancelSplit` is not called for secondary tables that had no split — this is fine, but secondary tables that somehow had splits would need those cleared too.

**Why it happens:** Zustand reactive selectors update on the next render; if `dissolveAll` is called and the component unmounts/navigates away before re-rendering, no cleanup issue. But if the page stays open, the merge-group display must re-render to show the flat list again.

**How to avoid:** `dissolveAll` updates `merges` — since the payment page subscribes reactively to `getMergedSecondaries(tableId)` via a Zustand selector, the component will re-render automatically when the map changes. No manual cleanup needed.

**Warning signs:** "Dissolve Merge" button disappears but items still shown grouped; or clicking Dissolve has no visible effect.

### Pitfall 3: Badge Slot Collision in TableTile

**What goes wrong:** A table that is both the primary of a merge AND has a split in progress shows two badges in the same `absolute top-2 right-2` slot.

**Why it happens:** `showSplitBadge` and `showMergeBadge` are independent booleans; the existing ternary only chains `showSplitBadge → orderStage`, not `showMergeBadge`.

**How to avoid:** The primary table of a merge cannot also be split simultaneously (mutually exclusive). The `showMergeBadge` only applies to *secondary* tables — which can never themselves be split primaries while merged. So the collision scenario does not exist in practice. But the badge ternary order should still be: `showSplitBadge` (highest priority) → `showMergeBadge` → `orderStage`.

**Warning signs:** TypeScript type error on the ternary chain would surface this at build time.

### Pitfall 4: TableBottomSheet "Merge Bill" Triggering on Secondary Tables

**What goes wrong:** Staff taps a secondary table tile (which navigates directly to primary's payment page). If for some reason `TableBottomSheet` also opens, it shows the secondary table's own status and a "Merge Bill" button — which is confusing.

**Why it happens:** If the routing override in `TableTile` calls `router.push()` but also calls `onTap(table)` (which opens the sheet), both happen.

**How to avoid:** In `TableTile`, when `isMergedSecondary` is true, call `router.push()` and return — do NOT call `onTap(table)`. This prevents the bottom sheet from opening for secondary tables.

**Warning signs:** Bottom sheet and navigation both trigger on secondary table tap.

### Pitfall 5: Tailwind v4 Shadow Token on option-card Items in MergeSheet

**What goes wrong:** A developer adds `shadow-card` as a Tailwind class on the MergeSheet panel. Tailwind v4 `@theme inline` multi-value shadow tokens are incompatible with class-based application.

**Why it happens:** The `option-card` Button variant uses `[box-shadow:var(--shadow-card)]` arbitrary property syntax to work around this limitation. The floating panel must use `style={{ boxShadow: 'var(--shadow-floating)' }}`.

**How to avoid:** Always use `style={{ boxShadow: 'var(--shadow-*)' }}` for shadow tokens — never Tailwind class syntax for shadow tokens. The `option-card` variant's use of `[box-shadow:...]` is the only exception (it's an arbitrary property in the CVA string).

---

## Code Examples

Verified patterns from existing codebase:

### Zustand Immutable Map Deletion (destructuring rest)
```typescript
// From bill.store.ts cancelSplit — use same pattern for dissolveAll
cancelSplit: (tableId) =>
  set((state) => {
    const { [tableId]: _, ...rest } = state.splits
    return { splits: rest }
  }),

// dissolveAll equivalent
dissolveAll: (primaryId) =>
  set((state) => {
    const remaining = Object.fromEntries(
      Object.entries(state.merges).filter(([, v]) => v !== primaryId)
    )
    return { merges: remaining }
  }),
```

### Bottom Sheet Panel Structure (from SplitSheet.tsx)
```typescript
// Backdrop
<div
  onClick={onClose}
  className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
/>

// Panel
<div
  style={{ boxShadow: 'var(--shadow-floating)' }}
  className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
    transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto
    ${open ? 'translate-y-0' : 'translate-y-full'}`}
>
  {/* Drag handle */}
  <div className="flex justify-center pt-3 pb-1">
    <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
  </div>
  {/* Content */}
</div>
```

### option-card Multi-Select Toggle (from SplitSheet mode-select)
```typescript
// data-selected prop drives the CVA variant styling
<Button
  variant="option-card"
  data-selected={selectedIds.has(table.id)}
  onClick={() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(table.id)) next.delete(table.id)
      else next.add(table.id)
      return next
    })
  }}
>
  <p className="font-semibold text-sm">{table.label}</p>
  <p className="text-xs text-muted-foreground">{table.guestCount} guests</p>
</Button>
```

### Status Token Registration Pattern (from globals.css)
```css
/* @theme inline — add alongside existing status aliases */
--color-status-merged:    var(--status-merged);
--color-status-merged-bg: var(--status-merged-bg);

/* :root */
--status-merged:    oklch(0.50 0.20 270);
--status-merged-bg: oklch(0.94 0.05 270);

/* .dark */
--status-merged:    oklch(0.72 0.18 270);
--status-merged-bg: oklch(0.24 0.07 270);
```

### Badge Slot Ternary in TableTile (current pattern to extend)
```typescript
// Existing (from TableTile.tsx lines 73–84) — extend with merge case
{showSplitBadge ? (
  <Badge className="absolute top-2 right-2 ...">
    <ScissorsLinear size={10} />
    {paidCount}/{split!.seatCount} paid
  </Badge>
) : showMergeBadge ? (
  <Badge className="absolute top-2 right-2 text-[10px] py-0 bg-status-merged-bg text-status-merged border-0">
    <LinkLinear size={10} className="mr-0.5" />
    Merged→{primaryLabel}
  </Badge>
) : table.orderStage !== null ? (
  <Badge variant="outline" className="absolute top-2 right-2 text-[10px] py-0">
    {table.orderStage}
  </Badge>
) : null}
```

### Grouped Bill Items Render in Payment Page
```typescript
// When merge is active, replace flat BillLineItem map
{isMerged ? (
  tableOrders.map((group) => (
    <section key={group.tableId}>
      <div className="flex items-center justify-between mb-2">
        <p className="caps">{group.label} — {group.guestCount} guests</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs"
          onClick={() => dissolveAll(tableId)}
        >
          Dissolve Merge
        </Button>
      </div>
      <div className="divide-y">
        {group.items.map((item) => (
          <BillLineItem key={item.lineId} item={item} />
        ))}
      </div>
    </section>
  ))
) : (
  billItems.map((item) => (
    <BillLineItem key={item.lineId} item={item} />
  ))
)}
```

---

## Integration Touchpoints

Six files need changes. Ordered by dependency:

| File | Change | Scope |
|------|--------|-------|
| `src/stores/bill.store.ts` | Add `merges` state + 5 actions | Foundation — everything else depends on this |
| `src/app/globals.css` | Add `--status-merged` / `--status-merged-bg` tokens in `:root`, `.dark`, and `@theme inline` | Visual — badge cannot render without this |
| `src/components/table-map/MergeSheet.tsx` | New file: table picker bottom sheet | New component |
| `src/components/table-map/TableTile.tsx` | Add `showMergeBadge` + routing override for secondary tables | ~15 line addition |
| `src/components/table-map/TableBottomSheet.tsx` | Add "Merge Bill" action button for Occupied/CheckRequested status sections | ~10 line addition |
| `src/components/payment/TotalsSection.tsx` | Add "Merge Bill" button; update `onSplitBill` visibility guard | ~10 line addition + 1 new prop |
| `src/app/(app)/payment/[tableId]/page.tsx` | Add `mergedSecondaryIds` subscription; grouped items render; combined totals; MergeSheet integration | ~40 line extension |
| `src/components/payment/SplitSheet.tsx` | Add "Revert to Single Bill" button + confirm flow + paidCount guard | ~30 line addition |

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| N/A (no merge yet) | `merges: Record<string, string>` flat map in bill.store | Introduced in Phase 14 |
| Single-table billItems flat list | Grouped-by-source rendering when merge is active | Conditional in payment page |

---

## Open Questions

1. **Where does "Dissolve Merge" button live — per-group header or a single button?**
   - What we know: CONTEXT.md says "a small ghost/outline 'Dissolve Merge' button appears near the merge group header"
   - What's unclear: "near" could mean one button per secondary group, or one master button for the entire merge
   - Recommendation: One "Dissolve Merge" button per secondary group header (each secondary can be independently dissolved). If only one secondary exists, this is identical to a single button. This matches "near the merge group header" literally.

2. **Secondary table TableBottomSheet behavior — navigate immediately or show minimal sheet?**
   - What we know: CONTEXT.md says "navigates directly to the primary table's payment page... bypasses or shows a minimal 'Merged into T[X] — viewing combined bill' state in TableBottomSheet"
   - What's unclear: Which interpretation to implement
   - Recommendation: Navigate directly (bypass sheet entirely) via the `TableTile` routing override. Simpler, fewer states, less confusion for staff. The badge already communicates the merge visually before they tap.

3. **Solar icon for "Merged→T[X]" badge**
   - What we know: Claude's discretion; options include link, merge-arrows
   - Recommendation: `LinkLinear` from solar-icon-set — clear visual metaphor for "linked to another table"; visually distinct from `ScissorsLinear` (split)

---

## Validation Architecture

`nyquist_validation` is `true` in `.planning/config.json`. No test framework is configured in this project (CLAUDE.md: "No test framework is configured. Use `npm run build` to verify TypeScript correctness.").

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — TypeScript via `npm run build` |
| Config file | tsconfig.json (strict mode) |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| MERGE-01 | bill.store `merges` map updates correctly on initMerge/dissolveAll | manual-only | `npm run build` (type check) | No unit test framework; TypeScript strict mode catches shape errors |
| MERGE-01 | Secondary tile shows merge badge and routes to primary | manual-only | `npm run build` | Visual/routing verification; TypeScript checks prop types |
| MERGE-01 | Combined bill totals = sum of all table items with correct VAT | manual-only | `npm run build` | Arithmetic logic is same formula as existing; verify in browser with mock data |
| MERGE-02 | Revert to Single Bill disabled when paidCount > 0 | manual-only | `npm run build` | Conditional disabled prop verified by TypeScript; runtime behavior manual |

### Sampling Rate

- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` green before `/gsd:verify-work`

### Wave 0 Gaps

None — no test infrastructure is needed beyond what already exists (`npm run build`). The project explicitly documents no test framework.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/stores/bill.store.ts` — full store shape, action patterns, immutable update idioms
- Direct codebase read: `src/components/payment/SplitSheet.tsx` — slide-up sheet structure, view state machine, paidCount computation
- Direct codebase read: `src/components/table-map/TableTile.tsx` — badge slot ternary, bill.store subscription pattern
- Direct codebase read: `src/components/table-map/TableBottomSheet.tsx` — action button structure, status-gated sections
- Direct codebase read: `src/components/payment/TotalsSection.tsx` — existing Split Bill button placement
- Direct codebase read: `src/app/(app)/payment/[tableId]/page.tsx` — bill assembly, memo deps, SplitSheet integration
- Direct codebase read: `src/app/globals.css` — full token naming convention, OKLCH value ranges for existing status tokens
- Direct codebase read: `src/components/ui/button.tsx` — option-card variant definition
- Direct codebase read: `src/components/ui/badge.tsx` — settled variant pattern (template for merged variant)
- Direct codebase read: `.planning/phases/14-merge-bill/14-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — confirmed zero new npm packages policy, cancelSplit destructuring rest pattern
- `.planning/REQUIREMENTS.md` — MERGE-01 and MERGE-02 requirement definitions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by direct codebase inspection; all needed capabilities already present
- Architecture: HIGH — merge state shape, grouped rendering, and badge routing are straightforward extensions of existing patterns
- Pitfalls: HIGH — all pitfalls derived from direct reading of existing code, not inference
- OKLCH token values: MEDIUM — planner has discretion on exact L/C; hue 270° is the constraint

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack; Tailwind v4 and Next.js 16 APIs won't change in this window)
