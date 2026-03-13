# Phase 15: Order Tracking - Research

**Researched:** 2026-03-13
**Domain:** React state derivation, real-time UI timers, Zustand multi-store cross-reads, CSS token extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary**
Staff can see live order stage on every active table tile on the floor plan, open a per-item timeline from the TableBottomSheet, and receive a visual escalation warning for any item that has been in its current stage for >15 minutes. Phase covers display and derivation only — no new order actions, no manager threshold settings.

**Timeline Entry Point**
- Timeline lives as a second tab inside TableBottomSheet — tab bar shows `[ Actions ] [ Timeline ]`
- Tab bar is only rendered for Occupied and CheckRequested tables; other statuses use the existing single-view layout unchanged
- Items grouped by round (Round 1, Round 2…) — mirrors how orders are sent to kitchen in batches

**Timeline Item Rows**
- Each row: stage dot (colored) + item name + elapsed time since sent
  - e.g. `● COOKING  Tonkotsu Ramen  18 min`
- Elapsed time derived from `OrderRound.sentAt` (already exists) — no per-bump timestamps needed, no kds.store schema changes
- Elapsed time updates every 60 seconds (a `setInterval` or `useDwellTimer`-style hook)
- Stage dot uses the same 4-color tokens as the tile badge (see Stage badge section below)

**Stage Badge Design**
- 4 distinct semantic color token pairs (added to globals.css following `--status-{name}` / `--status-{name}-bg` pattern):
  - `--status-ordered` — blue (new stage, queued at kitchen)
  - `--status-cooking` — amber (in progress)
  - `--status-ready` — green (distinct from settled — "ready to serve" not "paid")
  - `--status-served` — reuses existing `--status-settled` token (terminal state, same green-gray)
- Badge shows on Occupied and CheckRequested tables; hidden on other statuses
- Badge uses `table.orderStage` (already updated by KDS bump via `updateTable`) — no new derived state in table.store
- The existing plain-outline `orderStage` badge in TableTile is replaced by this color-coded version

**Escalation**
- Threshold: 15 minutes — hardcoded named constant `ESCALATION_THRESHOLD_MS = 15 * 60 * 1000` in a shared utils or constants file
- Tile badge: if ANY item in the table's in-flight order has been in its current stage for >15 min, the badge color overrides to red — same badge, same text, color token switches to a `--status-escalated` red variant
- No animation — color change only (consistent with KDS timer escalation pattern from Phase 4)
- Timeline row: escalated items get a faint red background tint + red elapsed text — two visual signals on the row itself

**Stage Derivation (Wireframe)**
- Per-item stage is derived from the KDS ticket's stage — all items in a round share their ticket's stage:
  - `KdsStage.New` → `Ordered`
  - `KdsStage.InProgress` → `Cooking`
  - `KdsStage.Ready` → `Ready`
  - Ticket removed from board (no ticket found) → `Served` (cross-referenced with `table.servedAt`)
- This derivation is a pure function — no redundant storage, consistent with the "derivation over duplication" architectural principle
- Escalation check uses `OrderRound.sentAt` as the start time for elapsed calculation (already available on every round)

### Claude's Discretion

- Exact OKLCH values for the 4 new stage tokens (`--status-ordered`, `--status-cooking`, `--status-ready`, `--status-escalated`) — blue/amber/green/red within the OKLCH space, independently tuned for light and dark mode
- Solar icon (if any) on the stage badge — may use a small dot/circle or no icon (label-only badge is acceptable)
- Tab bar implementation — whether to use the existing `shadcn Tabs` component or a simpler two-button toggle (same visual result)
- Exact wording of round section headers in the Timeline tab (e.g. "Round 1 · 12:31" vs "Round 1 (3 items)")
- Empty state in Timeline tab when no order exists yet for the table

### Deferred Ideas (OUT OF SCOPE)

- Manager-configurable escalation threshold — out of scope for Phase 15; could live in manager settings in a future phase
- Per-item individual stage tracking (each item has its own stage independent of the ticket) — real-system behavior, out of scope for this wireframe phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRACK-01 | Table tile shows live order stage badge (Queued → Cooking → Ready → Served) derived from KDS + order store state | New CSS token pairs in globals.css + new CVA badge variants + escalation boolean computed via useMemo in TableTile |
| TRACK-02 | Tapping a table's order shows per-item timeline with timestamp trail (ordered → cooking → ready → served) | New tab state in TableBottomSheet + new OrderTimeline component using round-grouped data from order.store + useSentTimer hook |
| TRACK-03 | Items exceeding time threshold (15 min) show visual escalation warning on both table tile and timeline view | ESCALATION_THRESHOLD_MS constant + escalation boolean passed to badge + row-level tint/text change in OrderTimeline |
</phase_requirements>

---

## Summary

Phase 15 is a pure display/derivation phase with no new store mutations or npm dependencies. All required data is already in flight: `table.orderStage` (set by KDS bump), `OrderRound.sentAt` (set when a round is sent), and `kds.store.tickets` (live KDS board state). The work breaks cleanly into four surfaces: CSS token extension, badge CVA variant extension, TableTile escalation wiring, and TableBottomSheet tab + OrderTimeline component.

The most architecturally sensitive decision is how to derive per-round stage in the Timeline. The locked decision — pure function deriving from KDS ticket stage with a "no ticket = Served" fallback — is sound and avoids any new store state. The only Zustand pitfall to guard is the selector safety rule already established in Phase 14: select `s.tickets` (stable Record reference) and derive inside `useMemo`, never call a function that returns a new array/object inside the selector.

The escalation check crosses two stores (order.store for `sentAt`, kds.store for ticket existence). This is safe as a component-level derivation; there is no need for a combined selector or new store action. The 60-second timer for elapsed display follows the same `setInterval` pattern as the existing `useDwellTimer` hook — a new `useElapsedMinutes` (or `useSentTimer`) hook parameterized on a `sentAt: number | null` is the appropriate extraction.

**Primary recommendation:** Build in three waves — (1) CSS tokens + badge variants, (2) TableTile color-coded badge + escalation, (3) TableBottomSheet tab bar + OrderTimeline component.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Used |
|---------|---------|---------|----------|
| Zustand 5 | ^5 | Cross-store state reads in components | Persisted order/kds/table state; `getState()` for non-reactive reads |
| React 19 | ^19 | `useState`, `useEffect`, `useMemo` | Hooks for local tab state, timer, and memoized derivations |
| Tailwind CSS 4 | ^4 | Utility classes for layout, spacing, tinting | `@theme inline` tokens drive all color utilities |
| CVA (class-variance-authority) | latest | Badge variant extension | `variant="ordered"` etc. follow settled/merged pattern |
| Solar icon set | latest | Optional dot icon on badge | Already imported in TableTile; no new import needed |

### No New Dependencies

Zero new npm packages required. All capabilities needed are present in the existing stack.

---

## Architecture Patterns

### Recommended File Layout

```
src/
├── components/
│   └── table-map/
│       ├── TableTile.tsx          # extend: color-coded badge + escalation boolean
│       ├── TableBottomSheet.tsx   # extend: tab state + tab bar + Timeline tab render
│       ├── OrderTimeline.tsx      # NEW: round-grouped item rows with elapsed + escalation
│       └── useSentTimer.ts        # NEW: 60-second interval hook returning elapsed minutes
├── components/ui/
│   └── badge.tsx                  # extend: ordered, cooking, ready, escalated variants
├── app/
│   └── globals.css                # extend: 4 new token pairs in :root, .dark, @theme inline
└── lib/
    └── order-tracking.ts          # NEW: pure derivation functions (deriveRoundStage, isEscalated)
```

### Pattern 1: Multi-Store Zustand Read with useMemo (Selector Safety)

**What:** Read stable primitive state from multiple stores, derive complex values in `useMemo`. Never call a function returning new arrays/objects inside a Zustand selector.

**When to use:** Any cross-store derivation — escalation check reads `order.store.orders`, `kds.store.tickets`, `table.store.tables` in a single component.

**Example:**
```tsx
// In TableTile or OrderTimeline
const tickets = useKdsStore((s) => s.tickets)           // stable Record reference
const orders = useOrderStore((s) => s.orders)           // stable Record reference

const escalated = useMemo(() => {
  const order = orders[tableId]
  if (!order) return false
  const ticket = Object.values(tickets).find((t) => t.tableId === tableId)
  if (!ticket) return false   // already served — no escalation
  const now = Date.now()
  return order.rounds
    .filter((r) => r.sentAt !== null)
    .some((r) => now - r.sentAt! > ESCALATION_THRESHOLD_MS)
}, [tickets, orders, tableId])
```

### Pattern 2: Stage Derivation Pure Function

**What:** Map KDS ticket presence and stage to the 4 display stages with no side effects.

**When to use:** Both the tile badge and the Timeline rows call this function.

**Example:**
```ts
// src/lib/order-tracking.ts
import type { KdsStage } from '@/stores/kds.store'
import type { OrderStage } from '@/stores/table.store'

export const ESCALATION_THRESHOLD_MS = 15 * 60 * 1000

export function deriveRoundStage(
  tableId: string,
  tickets: Record<string, { tableId: string; stage: KdsStage }>,
  hasServedAt: boolean,
): OrderStage {
  const ticket = Object.values(tickets).find((t) => t.tableId === tableId)
  if (!ticket) return hasServedAt ? 'Served' : 'Served'
  if (ticket.stage === 'New') return 'Ordered'
  if (ticket.stage === 'InProgress') return 'Cooking'
  return 'Ready'
}

export function isRoundEscalated(sentAt: number | null): boolean {
  if (sentAt === null) return false
  return Date.now() - sentAt > ESCALATION_THRESHOLD_MS
}
```

### Pattern 3: useSentTimer Hook (60-second Tick)

**What:** A lightweight hook that ticks every 60 seconds and returns elapsed minutes since `sentAt`. Models `useDwellTimer` but with coarser granularity and minutes output.

**When to use:** OrderTimeline rows — each row needs a stable elapsed minutes value that updates every minute.

**Example:**
```ts
// src/components/table-map/useSentTimer.ts
'use client'
import { useState, useEffect } from 'react'

export function useSentTimer(sentAt: number | null): number {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!sentAt) return
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [sentAt])

  if (!sentAt) return 0
  return Math.floor((now - sentAt) / 60_000)
}
```

### Pattern 4: CSS Token Extension

**What:** Add 4 new token pairs (`--status-ordered`, `--status-cooking`, `--status-ready`, `--status-escalated`) to `:root`, `.dark`, and `@theme inline`. Follow the exact pattern of existing status tokens.

**Key rule:** `@theme inline` must use `var(--token)` references only — never literal OKLCH values. Dark mode values must be independently tuned (higher lightness, same chroma) not derived via opacity.

**Example additions to globals.css:**
```css
/* In @theme inline block */
--color-status-ordered:       var(--status-ordered);
--color-status-ordered-bg:    var(--status-ordered-bg);
--color-status-cooking:       var(--status-cooking);
--color-status-cooking-bg:    var(--status-cooking-bg);
--color-status-ready:         var(--status-ready);
--color-status-ready-bg:      var(--status-ready-bg);
--color-status-escalated:     var(--status-escalated);
--color-status-escalated-bg:  var(--status-escalated-bg);

/* In :root block (light mode OKLCH values — Claude's discretion) */
--status-ordered:             oklch(0.50 0.18 250);   /* blue */
--status-ordered-bg:          oklch(0.95 0.04 250);
--status-cooking:             oklch(0.60 0.18 75);    /* amber (reuse check-requested hue) */
--status-cooking-bg:          oklch(0.97 0.05 75);
--status-ready:               oklch(0.50 0.20 155);   /* green (distinct from settled hue 145) */
--status-ready-bg:            oklch(0.95 0.06 155);
--status-escalated:           oklch(0.52 0.26 27);    /* brand red */
--status-escalated-bg:        oklch(0.96 0.06 27);

/* In .dark block (independently tuned) */
--status-ordered:             oklch(0.70 0.16 250);
--status-ordered-bg:          oklch(0.22 0.06 250);
--status-cooking:             oklch(0.75 0.16 75);
--status-cooking-bg:          oklch(0.28 0.07 75);
--status-ready:               oklch(0.70 0.18 155);
--status-ready-bg:            oklch(0.24 0.06 155);
--status-escalated:           oklch(0.72 0.22 27);
--status-escalated-bg:        oklch(0.24 0.08 27);
```

### Pattern 5: Badge CVA Variant Extension

**What:** Add `ordered`, `cooking`, `ready`, `escalated` variants to `badgeVariants` in badge.tsx. Follow the `settled` variant pattern exactly.

**Example:**
```ts
// In badgeVariants, variants.variant object:
ordered:   "bg-status-ordered-bg   text-status-ordered   border-status-ordered/30",
cooking:   "bg-status-cooking-bg   text-status-cooking   border-status-cooking/30",
ready:     "bg-status-ready-bg     text-status-ready     border-status-ready/30",
escalated: "bg-status-escalated-bg text-status-escalated border-status-escalated/30",
```

### Pattern 6: Tab Bar in TableBottomSheet

**What:** Local `useState<'actions' | 'timeline'>('actions')` tab state. A two-button toggle renders above the existing content block for Occupied and CheckRequested statuses. On tab switch, render either the existing action content or the new `<OrderTimeline>` component. Reset tab to `'actions'` on sheet close (via `useEffect([table?.id])`).

**Simpler than shadcn Tabs** — two `<button>` elements with a shared underline or background indicator is sufficient and avoids importing an additional Base UI component. This is within Claude's discretion per CONTEXT.md.

### Anti-Patterns to Avoid

- **Calling `getMergedSecondaries` or any function returning new arrays inside Zustand selector:** causes `getSnapshot should be cached` infinite loop. Always select the raw Record and derive in `useMemo`.
- **Storing derived stage in table.store or order.store:** the locked decision is derivation over duplication. No new `roundStage` field in any store.
- **Using `style={{ boxShadow: ... }}` for color tokens:** color tokens are Tailwind utility classes (e.g. `bg-status-cooking-bg`), not shadow tokens. Shadow tokens are the exception that requires inline style — color tokens are fine as utilities.
- **Triggering escalation check on every render without memoization:** the escalation scan over all rounds is O(rounds × items); memoize on `[tickets, orders, tableId]`.
- **Mounting a `setInterval` without cleanup:** always return `() => clearInterval(id)` from the `useEffect`. The existing `useDwellTimer` is the reference implementation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Elapsed time display | Custom date arithmetic inline in JSX | `useSentTimer` hook (modeled on `useDwellTimer`) | Single source of truth, correct cleanup, coarse 60s tick is appropriate |
| Stage-to-color mapping | Ad-hoc `if/else` in JSX | CVA badge variants + CSS token pairs | Already-established pattern, dark mode handled, avoids style prop on every badge |
| Cross-store escalation derivation | Store action computing escalation | `useMemo` in component with raw Record selectors | Keeps stores dumb, avoids circular dependencies, consistent with existing merge badge pattern |
| Dark mode color math | Opacity modifications of light tokens | Independently tuned OKLCH dark values | Project rule: `.dark` tokens are never opacity-reduced versions; dark bg must be tuned for contrast |

---

## Common Pitfalls

### Pitfall 1: Zustand Selector Returns New Object/Array on Every Call

**What goes wrong:** `useKdsStore((s) => Object.values(s.tickets).find(t => t.tableId === id))` — `.find()` returns a new reference each render, triggering infinite `getSnapshot` loop.

**Why it happens:** Zustand's shallow equality check sees a new object reference each time, re-runs the selector, sees a new object again, loops.

**How to avoid:** Select `s.tickets` (the stable Record), then derive the specific ticket in `useMemo`. Exact same fix applied in Phase 14 for `getMergedSecondaries`.

**Warning signs:** React DevTools console error "getSnapshot should be cached" or component appears to re-render endlessly.

### Pitfall 2: Tab State Not Reset on Sheet Re-open

**What goes wrong:** User taps Table A (Actions tab), closes sheet, taps Table B — Timeline tab is still active from Table A.

**Why it happens:** Local `useState` persists across renders if the component isn't unmounted.

**How to avoid:** `useEffect(() => { setActiveTab('actions') }, [table?.id])` — reset tab whenever the selected table changes, following the pattern already used for `localWaiter` and `localNote`.

### Pitfall 3: Escalation Fires for Unsent Rounds

**What goes wrong:** Round with `sentAt === null` (items not yet sent to kitchen) has elapsed time calculated from `null`, producing `NaN` or false-positive escalation.

**Why it happens:** `Date.now() - null` evaluates to `Date.now()` in JS (null coerces to 0).

**How to avoid:** Always guard: `if (round.sentAt === null) continue` or `filter(r => r.sentAt !== null)` before escalation check.

### Pitfall 4: @theme inline with Literal OKLCH Values

**What goes wrong:** Adding `--color-status-ordered: oklch(0.50 0.18 250)` directly in `@theme inline` instead of `var(--status-ordered)`. Dark mode silently breaks — the literal value ignores the `.dark` override.

**Why it happens:** `@theme inline` resolves at build time; CSS custom property `var()` references resolve at runtime and respect the cascade.

**How to avoid:** `@theme inline` entries always use `var(--token)` references. Raw OKLCH values go only in `:root` and `.dark`.

### Pitfall 5: "Served" Derivation When No Ticket and No servedAt

**What goes wrong:** A table with a sent order but whose ticket was deleted from KDS (e.g. KDS board was reset) incorrectly shows "Served" even though food hasn't arrived.

**Why it happens:** The derivation rule is "no ticket found → Served."

**How to avoid:** The wireframe context explicitly accepts this simplification per CONTEXT.md ("Ticket removed from board (no ticket found) → Served (cross-referenced with `table.servedAt`)")). Document the assumption in the pure function's JSDoc. For the wireframe, this is acceptable behavior.

---

## Code Examples

### Stage Badge Replacement in TableTile

```tsx
// Replace the existing plain-outline orderStage badge (lines 110-113 in TableTile.tsx)
// Source: derived from existing badge priority pattern at lines 98-114

const STAGE_VARIANT: Record<OrderStage, 'ordered' | 'cooking' | 'ready' | 'settled' | 'escalated'> = {
  Ordered: 'ordered',
  Cooking: 'cooking',
  Ready:   'ready',
  Served:  'settled',
  Billed:  'settled',
}

// In the badge priority block, replace the last branch:
: table.orderStage !== null && (table.status === 'Occupied' || table.status === 'CheckRequested') ? (
  <Badge
    variant={isEscalated ? 'escalated' : STAGE_VARIANT[table.orderStage]}
    className="absolute top-2 right-2 text-[10px] py-0"
  >
    {table.orderStage}
  </Badge>
) : null
```

### OrderTimeline Component Structure

```tsx
// src/components/table-map/OrderTimeline.tsx
'use client'
import { useMemo } from 'react'
import { useOrderStore } from '@/stores/order.store'
import { useKdsStore } from '@/stores/kds.store'
import { useTableStore } from '@/stores/table.store'
import { deriveRoundStage, isRoundEscalated, ESCALATION_THRESHOLD_MS } from '@/lib/order-tracking'
import { useSentTimer } from './useSentTimer'

interface OrderTimelineProps { tableId: string }

export function OrderTimeline({ tableId }: OrderTimelineProps) {
  const tickets = useKdsStore((s) => s.tickets)
  const orders = useOrderStore((s) => s.orders)
  const table = useTableStore((s) => s.tables[tableId])

  const order = orders[tableId]
  // sentRounds = rounds that have been sent (sentAt !== null), excludes draft rounds
  const sentRounds = useMemo(
    () => order?.rounds.filter((r) => r.sentAt !== null) ?? [],
    [order],
  )

  // Escalation summary: any sent round over threshold
  const escalatedRounds = useMemo(
    () => sentRounds.filter((r) => isRoundEscalated(r.sentAt)),
    [sentRounds],
  )

  if (!order || sentRounds.length === 0) {
    return <p className="text-sm text-muted-foreground px-4 py-3">No order sent yet.</p>
  }

  const stage = deriveRoundStage(tableId, tickets, table?.servedAt != null)

  return (
    <div className="px-4 pb-4 flex flex-col gap-4">
      {sentRounds.map((round, idx) => (
        <RoundSection
          key={round.roundId}
          round={round}
          index={idx}
          stage={stage}
          tickets={tickets}
          tableId={tableId}
          hasServedAt={table?.servedAt != null}
        />
      ))}
      {/* Escalation summary banner */}
      {escalatedRounds.length > 0 && (
        <div className="rounded-lg bg-status-escalated-bg text-status-escalated px-3 py-2 text-xs font-medium flex flex-col gap-0.5">
          {escalatedRounds.map((r) => (
            r.items
              .filter((i) => i.status !== 'voided')
              .map((item) => (
                <span key={item.lineId}>
                  Delayed: {item.menuItemName} — {Math.floor((Date.now() - r.sentAt!) / 60_000)} min in {stage}
                </span>
              ))
          ))}
        </div>
      )}
    </div>
  )
}
```

### Elapsed Minutes Display in Timeline Row

```tsx
// Inside a timeline item row component (inline or extracted)
// sentAt is the OrderRound.sentAt (number)
const elapsed = useSentTimer(round.sentAt)
const escalated = elapsed * 60_000 > ESCALATION_THRESHOLD_MS

// Row rendering
<div className={`flex items-center gap-2 py-1.5 px-2 rounded-md ${escalated ? 'bg-status-escalated-bg/40' : ''}`}>
  <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-status-${STAGE_VARIANT[stage]}`} />
  <span className="flex-1 text-sm">{item.menuItemName}</span>
  <span className={`text-xs font-mono ${escalated ? 'text-status-escalated' : 'text-muted-foreground'}`}>
    {elapsed} min
  </span>
</div>
```

---

## Existing Assets Inventory

| Asset | File | Current State | Phase 15 Change |
|-------|------|---------------|-----------------|
| `useDwellTimer` | `table-map/useDwellTimer.ts` | 1-second tick, returns `"mm:ss"` string | No change — new `useSentTimer` is a 60-second variant |
| `TableTile` orderStage badge | `table-map/TableTile.tsx` lines 110–113 | Plain `variant="outline"` badge | Replace with color-coded `variant={STAGE_VARIANT[stage]}` + escalation override |
| `TableBottomSheet` Occupied section | `table-map/TableBottomSheet.tsx` lines 112–202 | Single-view layout | Wrap content in tab structure; render Actions or Timeline based on `activeTab` state |
| `Badge` CVA | `components/ui/badge.tsx` | 7 variants including `settled` | Add `ordered`, `cooking`, `ready`, `escalated` |
| `globals.css` status tokens | `app/globals.css` | 8 status token pairs in `:root`/`.dark`/`@theme inline` | Add 4 new pairs (ordered, cooking, ready, escalated) in all three locations |
| `order.store` `OrderRound.sentAt` | `stores/order.store.ts` | `number \| null`, set by `sendRound` | No change — used as-is for elapsed calculation |
| `table.store` `orderStage` | `stores/table.store.ts` | `OrderStage \| null` on `TableRecord` | No change — already driven by KDS bump |
| `kds.store` `tickets` | `stores/kds.store.ts` | `Record<string, KdsTicket>` with stage `New\|InProgress\|Ready` | No change — read as stable Record for derivation |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Plain `variant="outline"` orderStage badge (Phase <15) | Color-coded CVA variant badge driven by CSS token pairs | Consistent with all other status badges; dark mode automatic |
| No timeline in TableBottomSheet | Second tab `[ Actions ] [ Timeline ]` for Occupied/CheckRequested | Staff can inspect per-item progress without leaving the floor plan |
| No escalation indicator | Red badge override + row tint + elapsed text color | Passive escalation visible at a glance without alerts |

---

## Open Questions

1. **Tab bar visual style for the two-button toggle**
   - What we know: CONTEXT.md grants discretion on whether to use shadcn Tabs or a simple toggle
   - What's unclear: Whether shadcn/Base UI `Tabs` component is present in the project's shadcn installation
   - Recommendation: Use a simple two-`<button>` underline tab bar — avoids importing any new component, follows the "no new dependencies" constraint, and keeps the implementation self-contained in `TableBottomSheet.tsx`

2. **Round section header format**
   - What we know: CONTEXT.md grants discretion — "Round 1 · 12:31" vs "Round 1 (3 items)"
   - Recommendation: "Round {n} · {time}" where time is `sentAt` formatted as `HH:mm` in `th-TH` locale — matches the dwell timer locale already used in the sheet

3. **`useSentTimer` — single hook instance vs per-round**
   - What we know: Elapsed is per-round (one `sentAt` per round), multiple rounds may be visible
   - Recommendation: Either extract a `RoundSection` sub-component that calls `useSentTimer(round.sentAt)` once per round, or call the hook multiple times at the OrderTimeline level in a stable array. The sub-component approach is cleaner and follows React hooks rules without needing arrays.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured — project uses `npm run build` (TypeScript) for correctness verification |
| Config file | None |
| Quick run command | `npm run build` |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRACK-01 | Color-coded stage badge appears on Occupied/CheckRequested tiles | manual-only (visual) | `npm run build` (type correctness) | N/A |
| TRACK-02 | Timeline tab shows round-grouped items with elapsed time | manual-only (visual) | `npm run build` | N/A |
| TRACK-03 | Escalated items show red override on badge and timeline row | manual-only (visual) | `npm run build` | N/A |

**Note:** No test framework is configured. All functional verification is through TypeScript build (`npm run build`) plus manual browser interaction. This is the established project pattern per CLAUDE.md.

### Sampling Rate

- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run build` green + manual browser verification of all three requirements before `/gsd:verify-work`

### Wave 0 Gaps

None — no test infrastructure is needed. The project has no test framework by design. TypeScript strict mode via `npm run build` is the sole automated correctness gate.

---

## Sources

### Primary (HIGH confidence)

- Direct source read: `src/stores/kds.store.ts` — KdsStage values (`New | InProgress | Ready`), ticket shape, `bumpTicket` logic
- Direct source read: `src/stores/order.store.ts` — `OrderRound.sentAt: number | null`, `sendRound` sets it to `Date.now()`
- Direct source read: `src/stores/table.store.ts` — `OrderStage` type (`Ordered | Cooking | Ready | Served | Billed`), `table.orderStage` field, `updateTable` patch action
- Direct source read: `src/components/table-map/TableTile.tsx` — badge priority order (split > merge > orderStage), current plain outline badge at lines 110–113
- Direct source read: `src/components/table-map/TableBottomSheet.tsx` — Occupied/CheckRequested content structure, existing `useEffect([table?.id])` reset pattern
- Direct source read: `src/components/table-map/useDwellTimer.ts` — `setInterval`/`clearInterval` pattern, 1-second tick
- Direct source read: `src/components/ui/badge.tsx` — CVA badgeVariants, `settled` variant as model
- Direct source read: `src/app/globals.css` — existing status token OKLCH values, `@theme inline` pattern, `:root` and `.dark` structure
- Direct source read: `.planning/phases/15-order-tracking/15-CONTEXT.md` — all locked decisions, discretion areas, deferred scope
- Direct source read: `.planning/STATE.md` — accumulated architectural decisions, Zustand selector safety rule, derivation-over-duplication principle

### Secondary (MEDIUM confidence)

- CLAUDE.md project instructions — tech stack versions, critical patterns (shadow tokens, Zustand selector safety, `@theme inline` rules)
- `.planning/REQUIREMENTS.md` — TRACK-01/02/03 requirement text

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries are confirmed installed; no new dependencies required
- Architecture: HIGH — all integration points verified by direct source read; derivation approach confirmed by CONTEXT.md locked decisions
- CSS token pattern: HIGH — globals.css structure read directly; OKLCH values for new tokens are Claude's discretion per CONTEXT.md
- Pitfalls: HIGH — Zustand selector infinite loop is a documented project lesson from Phase 14 (STATE.md); other pitfalls derived from direct code inspection
- Validation: HIGH — CLAUDE.md explicitly states no test framework; build-only verification is the established pattern

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack, no fast-moving dependencies)
