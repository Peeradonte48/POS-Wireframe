# Phase 19: KDS Differentiation + Combo Flag - Research

**Researched:** 2026-03-15
**Domain:** React/Zustand UI — additive KDS badge rendering, filter state, order data model extension
**Confidence:** HIGH

## Summary

Phase 19 is a purely presentational and additive phase. Every significant infrastructure piece was laid in earlier phases: `KdsTicket.orderType` and `KdsTicket.platform` fields exist in `kds.store.ts` (Phase 18), OKLCH platform tokens for Grab green and LINE MAN blue are already in `globals.css` (`:root` and `.dark`), and `badge.tsx` already has `grab` and `lineman` CVA variants. No new npm packages, no new routes, no schema migrations.

The work splits into four independent tracks: (1) add `DIN`/`TKWY`/`GRAB`/`LINE MAN`/`DLVR` CVA variants to `badge.tsx` and render them in `KdsTicketCard.tsx` header; (2) add an `activeChannelFilter` state and tab row to `KdsBoard.tsx`; (3) add `packToGo?: boolean` to `OrderLineItem` in `order.store.ts`, a `togglePackToGo` action, and a bag icon toggle in `TicketLineItem.tsx` (dine-in only); (4) update `kds-demo.ts` to surface all three channels and PACK badges in demo mode.

**Primary recommendation:** Work sequentially — store type extension first (needed by all other tracks), then badge variants, then KDS rendering, then order entry UI, then demo. Each track can be implemented and committed independently with no inter-track blocking.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Order type badge — placement**
- Badge sits inline with the table label in the ticket header: `T-3  [TKWY]  [In Progress]  3:42`
- Stage badge (New / InProgress / Ready) stays on the right — nothing moves, badge is purely additive
- All tickets show an order type badge — dine-in is not exempt

**Order type badge — text & color**
- Abbreviated caps: `DIN` / `TKWY` / `GRAB` / `LINE MAN`
- For delivery, show platform name (GRAB or LINE MAN) instead of a generic DLVR label. Fall back to `DLVR` if `platform` is null
- Colors per channel (CVA variants reusing existing tokens):
  - `DIN` → indigo (hue 250, matches existing ordered-stage token)
  - `TKWY` → amber (hue 75, matches cooking/check-requested amber family)
  - `GRAB` → platform-grab token (`--color-platform-grab` / `--color-platform-grab-bg`)
  - `LINE MAN` → platform-lineman token (`--color-platform-lineman` / `--color-platform-lineman-bg`)
  - `DLVR` (fallback) → neutral/muted
- All badges use the same CVA variant (solid chip style) — differentiated by color only, not shape or weight

**Filter tabs**
- Horizontal row above the full board, between the KDS page header and the 3-column grid
- Tab labels: `All` / `Dine-in` / `Takeaway` / `Delivery` (full words, not abbreviated)
- Counts in labels: e.g. `All (7)` / `TKWY (2)` — total across all stages for that channel
- When a filter is active, empty columns stay visible with the existing dashed-border "No tickets" placeholder — no layout shift
- Filter selection is ephemeral — local `useState` in `KdsBoard`, resets to `All` on page reload; no kds.store persistence needed
- Tab style: plain `<button>` with `border-b-2 border-primary -mb-px` underline (established Phase 15 pattern)

**Pack-to-go flag — who & where**
- Waiter-initiated on the order entry page — a small bag icon button on each item row in the order entry line item list
- Tap to toggle the flag on/off; flag is always togglable even after the item is sent to kitchen
- Pack-to-go is dine-in only — the flag is hidden/unavailable on takeaway and delivery order entry pages

**Pack-to-go flag — data model**
- `packToGo?: boolean` field added to `OrderLineItem` in `order.store`
- The KDS ticket reads `packToGo` from the order items it already receives — no kds.store changes needed
- Default is `undefined` / falsy — existing items are unaffected

**Pack-to-go flag — KDS display**
- Items with `packToGo: true` show a small colored chip `[PACK]` inline on the KDS item row (consistent with how modifiers/spice levels appear)
- BUMP button label and behavior are unchanged — PACK is a visual cue, not a workflow gate

**Demo mode**
- `buildMockDemoTicket` assigns random orderType (weighted toward dine-in, occasionally takeaway or delivery with platform set)
- A subset of demo items get `packToGo: true` so the PACK badge is visible in demo without order entry
- Demo Mode button label stays as "Demo Mode" — no channel preview in the button label

### Claude's Discretion
- Exact weighting of orderType distribution in demo (e.g. 60% dine-in, 25% takeaway, 15% delivery)
- Exact Solar icon used for the bag toggle on order entry item rows
- Exact PACK badge color (amber or brand-red — whichever reads more clearly on the KDS item row)
- Fallback DLVR badge color (suggest neutral muted)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMBO-01 | Staff can flag individual items on a dine-in order as "pack to go" — flagged items appear on the same bill but are packed separately | `packToGo?: boolean` added to `OrderLineItem`; `togglePackToGo` action in `order.store`; bag icon toggle in `TicketLineItem.tsx` (dine-in only, gated by `!isTakeaway` passed as prop from `TicketPanel`) |
| COMBO-02 | KDS tickets show a "PACK" indicator on flagged items so kitchen knows to bag them, not plate them | `KdsItemRow.tsx` already receives `OrderLineItem`; add inline chip when `item.packToGo === true` |
| KDS-01 | KDS tickets show an order type badge (Dine-in / Takeaway / Delivery + platform) so kitchen knows to plate or bag | `KdsTicket.orderType` + `KdsTicket.platform` already populated; add badge to `KdsTicketCard.tsx` header; new CVA variants in `badge.tsx` |
| KDS-02 | KDS board can be filtered by order type (All / Dine-in / Takeaway / Delivery) | `activeChannelFilter` useState in `KdsBoard.tsx`; tab row before the 3-column grid; second filter pass on `stageTickets` |
| UI-01 | Delivery platform colors — Grab green and LINE MAN blue — applied as OKLCH design tokens and CVA badge variants | Tokens already in `globals.css`; `grab` and `lineman` CVA variants already in `badge.tsx`; new `order-type-din`, `order-type-tkwy`, `order-type-dlvr` variants need adding |
</phase_requirements>

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand 5 | `^5.0.0` | State — `OrderLineItem` type extension + `togglePackToGo` action | Established store pattern; persist middleware already on `order.store` |
| CVA (class-variance-authority) | `^0.7.x` | Badge variants for order-type chips | Pattern already used in `badge.tsx`; extend in place |
| Solar icon set | Latest | Bag icon for pack-to-go toggle on order entry | All icons imported as `{ IconNameLinear }` |
| Tailwind CSS 4 | `^4.0.0` | All styling; `@theme inline` for token aliases | Project standard; `bg-status-*` / `text-status-*` class pattern |

No new packages required for this phase. Zero new npm installs.

### What Is Already In Place
| Asset | Location | Status |
|-------|----------|--------|
| `KdsTicket.orderType` field | `src/stores/kds.store.ts` line 16 | EXISTS — `'dine-in' \| 'takeaway' \| 'delivery' \| undefined` |
| `KdsTicket.platform` field | `src/stores/kds.store.ts` line 17 | EXISTS — `'grab' \| 'lineman' \| undefined` |
| `--platform-grab` / `--platform-grab-bg` tokens | `src/app/globals.css` lines 162–165 | EXISTS — both `:root` and `.dark` independently tuned |
| `--platform-lineman` / `--platform-lineman-bg` tokens | `src/app/globals.css` lines 164–165 | EXISTS — both `:root` and `.dark` independently tuned |
| `grab` CVA variant in `badge.tsx` | `src/components/ui/badge.tsx` line 27 | EXISTS — uses `var(--platform-grab-bg)` / `var(--platform-grab)` |
| `lineman` CVA variant in `badge.tsx` | `src/components/ui/badge.tsx` line 28 | EXISTS — uses `var(--platform-lineman-bg)` / `var(--platform-lineman)` |
| `--color-status-ordered` alias (hue 250, indigo) | `globals.css` line 85–86 | EXISTS — maps `--status-ordered` / `--status-ordered-bg` |
| `--color-status-cooking` alias (hue 75, amber) | `globals.css` line 87–88 | EXISTS — maps `--status-cooking` / `--status-cooking-bg` |
| Tab pattern `border-b-2 border-primary -mb-px` | Phase 15 (`TableBottomSheet`) | ESTABLISHED — copy exactly |

---

## Architecture Patterns

### Recommended Plan Decomposition

```
19-01: Store type extension + new badge CVA variants
       - Add packToGo?: boolean to OrderLineItem (order.store.ts)
       - Add togglePackToGo(tableId, lineId) action (order.store.ts)
       - Add order-type-din, order-type-tkwy, order-type-dlvr CVA variants to badge.tsx
       (grab/lineman variants already exist)

19-02: KDS rendering
       - KdsTicketCard.tsx: order type badge in header slot
       - KdsItemRow.tsx: PACK chip when item.packToGo === true
       - KdsBoard.tsx: activeChannelFilter useState + tab row + filter logic

19-03: Order entry pack-to-go toggle + demo update
       - TicketLineItem.tsx: bag icon toggle button (dine-in only via showPackToGo prop)
       - TicketPanel.tsx: pass showPackToGo={!isTakeaway} down to each TicketLineItem
       - order/[tableId]/page.tsx: pass isTakeaway context into TicketPanel (already available)
       - kds-demo.ts: randomized orderType/platform/packToGo in buildMockDemoTicket
```

### Pattern 1: CVA Variant Extension in `badge.tsx`

**What:** Add three new variants inline in `badgeVariants` — never wrap `Badge` or create a new component.

**When to use:** Any new semantic badge color required by the project.

```typescript
// src/components/ui/badge.tsx — add to variant map (extend in place)
// Source: existing badge.tsx pattern + globals.css token names
"order-type-din":  "bg-status-ordered-bg  text-status-ordered  border-status-ordered/30",
"order-type-tkwy": "bg-status-cooking-bg  text-status-cooking  border-status-cooking/30",
"order-type-dlvr": "bg-muted             text-muted-foreground border-border",
// grab and lineman variants already exist — no change needed
```

Note: `order-type-din` reuses `status-ordered` (indigo hue 250) and `order-type-tkwy` reuses `status-cooking` (amber hue 75) — intentional, per locked decisions.

### Pattern 2: Order Type Badge in `KdsTicketCard.tsx` Header

**What:** Insert badge between `tableLabel` and the stage badge. The header already has a flex row with gap-2.

**Current header structure:**
```tsx
// Existing: tableLabel + stage badge + timer (right)
<span className="font-bold text-base">{ticket.tableLabel}</span>
<Badge className={...}>{ticket.stage}</Badge>
// timer on right
```

**Target structure:**
```tsx
<span className="font-bold text-base">{ticket.tableLabel}</span>
<OrderTypeBadge orderType={ticket.orderType} platform={ticket.platform} />
<Badge className={...}>{ticket.stage}</Badge>
```

Where `OrderTypeBadge` is a small co-located helper (not a separate file — it's 10 lines):

```typescript
// Co-located helper inside KdsTicketCard.tsx
function getOrderTypeBadgeVariant(
  orderType: KdsTicket['orderType'],
  platform: KdsTicket['platform']
): string {
  if (orderType === 'delivery') {
    if (platform === 'grab') return 'grab'
    if (platform === 'lineman') return 'lineman'
    return 'order-type-dlvr'
  }
  if (orderType === 'takeaway') return 'order-type-tkwy'
  return 'order-type-din'   // dine-in (or undefined — all tickets show a badge)
}

function getOrderTypeLabel(
  orderType: KdsTicket['orderType'],
  platform: KdsTicket['platform']
): string {
  if (orderType === 'delivery') {
    if (platform === 'grab') return 'GRAB'
    if (platform === 'lineman') return 'LINE MAN'
    return 'DLVR'
  }
  if (orderType === 'takeaway') return 'TKWY'
  return 'DIN'
}
```

### Pattern 3: Filter Tabs in `KdsBoard.tsx`

**What:** Local `useState<'all' | 'dine-in' | 'takeaway' | 'delivery'>('all')` in `KdsBoard`. Tab row renders above the stage-column grid. Second filter applied to `stageTickets`.

**Counts MUST use `useMemo` on raw `tickets` record** — not a derived function inside a selector (CLAUDE.md infinite loop rule):

```typescript
// Source: CLAUDE.md Zustand selector safety pattern
const tickets = useKdsStore((s) => s.tickets)

const channelCounts = useMemo(() => {
  const ticketList = Object.values(tickets)
  return {
    all:      ticketList.length,
    'dine-in':  ticketList.filter((t) => !t.orderType || t.orderType === 'dine-in').length,
    takeaway:   ticketList.filter((t) => t.orderType === 'takeaway').length,
    delivery:   ticketList.filter((t) => t.orderType === 'delivery').length,
  }
}, [tickets])
```

Filter applied as a second pass after the stage filter:

```typescript
const stageTickets = Object.values(tickets).filter((t) => {
  if (t.stage !== stage) return false
  if (activeChannelFilter !== 'all') {
    const effectiveType = t.orderType ?? 'dine-in'
    if (effectiveType !== activeChannelFilter) return false
  }
  const items = getOrderItems(t)
  return items.some((item) => item.status !== 'voided')
})
```

**Tab row placement:** Between the `<div className="flex flex-1 h-full gap-2 p-3 ...">` board grid and whatever wraps KdsBoard. Since `KdsBoard` returns a single `<div>`, a wrapper `<div className="flex flex-col flex-1 h-full">` containing tab row + board `<div>` is the clean approach.

### Pattern 4: `togglePackToGo` in `order.store.ts`

**What:** Immutable update on `OrderLineItem.packToGo` — follows exact same pattern as `voidItem` and `editItem`.

```typescript
// Source: existing voidItem pattern in order.store.ts
togglePackToGo: (tableId, lineId) =>
  set((state) => {
    const existing = state.orders[tableId]
    if (!existing) return state
    const newRounds = existing.rounds.map((round) => ({
      ...round,
      items: round.items.map((item) =>
        item.lineId === lineId
          ? { ...item, packToGo: !item.packToGo }
          : item
      ),
    }))
    return {
      orders: { ...state.orders, [tableId]: { ...existing, rounds: newRounds } },
    }
  }),
```

`packToGo?: boolean` is added to the `OrderLineItem` interface. Since it's optional (`?:`), existing persisted state hydrates without issues — undefined items are falsy.

### Pattern 5: PACK chip in `KdsItemRow.tsx`

**What:** Small inline chip after the modifier summary, same visual weight as the ALLERGY chip already present.

```tsx
// After modifierSummary line — source: existing ALLERGY chip pattern in KdsItemRow.tsx
{item.packToGo && (
  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 bg-status-cooking-bg text-status-cooking">
    PACK
  </span>
)}
```

The color choice (amber `bg-status-cooking-bg / text-status-cooking`) is Claude's discretion. Amber is chosen because: (a) it doesn't clash with brand-red (ALLERGY), (b) it's distinct from green (ready) and indigo (ordered), and (c) it visually signals "handle differently" without alarming red.

### Pattern 6: Bag icon toggle in `TicketLineItem.tsx`

**What:** A `showPackToGo` boolean prop on `TicketLineItem`. When `true`, renders a bag icon toggle button. Available for both `sent` and `unsent` items — dine-in only.

The Solar icon set provides `BagLinear` or `BagHeartLinear`. `Bag2Linear` is the standard shopping bag shape. Exact icon is Claude's discretion — `Bag2Linear` recommended as most recognizable bag icon.

Toggle renders in the same row as the trash icon (unsent items) or inline in the sent row — consistent with existing row patterns.

```tsx
// TicketLineItem.tsx — additional prop
interface TicketLineItemProps {
  // ... existing props
  showPackToGo?: boolean
  onTogglePackToGo?: (lineId: string) => void
}
```

`TicketPanel.tsx` passes `showPackToGo={!isTakeaway}` and `onTogglePackToGo={(lineId) => togglePackToGo(tableId, lineId)}`. The `isTakeaway` value is already derived via `useQueueStore.getState()` at the order page level — it must be threaded down to `TicketPanel` (currently not a prop; `TicketPanel` would need to detect it internally or receive it as a prop).

**Cleaner approach:** `TicketPanel.tsx` detects `isTakeaway` itself via `useQueueStore.getState().orders[tableId]` — same non-reactive read pattern already used in `order/[tableId]/page.tsx`. This avoids adding a new prop to `TicketPanel`.

### Pattern 7: Demo mode update in `kds-demo.ts`

**What:** `buildMockDemoTicket` must assign `orderType` and optionally `platform` and set `packToGo` on a subset of items.

```typescript
// Suggested weights (Claude's discretion)
const rand = Math.random()
let orderType: KdsTicket['orderType']
let platform: KdsTicket['platform']

if (rand < 0.60) {
  orderType = 'dine-in'
} else if (rand < 0.85) {
  orderType = 'takeaway'
} else {
  orderType = 'delivery'
  platform = Math.random() < 0.6 ? 'grab' : 'lineman'
}
```

For `packToGo` on demo items: set `packToGo: true` on approximately the first item of dine-in tickets (30% chance per item), so PACK badges appear naturally without requiring order entry.

The `buildMockDemoTicket` return value must include `orderType` and `platform`:
```typescript
return {
  ticketId,
  tableId: slot.tableId,
  tableLabel: slot.tableLabel,
  addedAt: Date.now(),
  stage: 'New',
  checkedItems: new Set(),
  orderType,
  platform,
}
```

And demo `OrderLineItem` objects need `packToGo` added conditionally.

### Anti-Patterns to Avoid

- **Calling derived functions inside Zustand selectors for channel counts:** Always select raw `tickets` record, then derive counts in `useMemo`. Never `useKdsStore(s => s.getChannelCount('dine-in'))`.
- **Wrapping `Badge` component:** Extend `badgeVariants` in place. Never create `OrderTypeBadge` as a new component that wraps `<Badge>` — the `Badge` component itself should be used directly with the variant prop.
- **Using inline style for badge colors:** The existing token system enables `bg-status-ordered-bg text-status-ordered` Tailwind classes — no `style={{ backgroundColor: 'var(--status-ordered-bg)' }}` needed.
- **Persisting filter tab state in kds.store:** Locked decision — local useState only, ephemeral.
- **Showing pack-to-go toggle on takeaway/delivery orders:** The toggle is dine-in only. `TicketPanel` detects this via `useQueueStore.getState().orders[tableId]`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge color variants | Inline style / className conditionals | CVA variant in `badge.tsx` | Consistency, dark mode safety, single source of truth |
| Filter tab underline | Custom active indicator div | `border-b-2 border-primary -mb-px` className | Established Phase 15 pattern, no extra DOM |
| Channel count derivation | Counter in kds.store | `useMemo` on raw `tickets` in `KdsBoard` | Avoids Zustand selector loop, no store API surface bloat |
| Pack-to-go detection in KdsItemRow | Store lookup | Read `item.packToGo` directly from `OrderLineItem` prop | Data already present on item, zero additional queries |

---

## Common Pitfalls

### Pitfall 1: Zustand Selector Infinite Loop on Channel Counts
**What goes wrong:** Calling `useKdsStore(s => s.getSomeFilteredList())` where the function returns a new array on every call triggers React's `useSyncExternalStore` comparison loop ("getSnapshot should be cached").
**Why it happens:** Zustand's `useSyncExternalStore` compares previous and next snapshots with reference equality. A new array is never reference-equal.
**How to avoid:** Select the raw `tickets: Record<string, KdsTicket>` (stable object reference when no tickets change), then `useMemo` over `Object.values(tickets)`.
**Warning signs:** Component re-renders infinitely, React DevTools shows `useSyncExternalStore` in the call stack.

### Pitfall 2: `packToGo` Not Surviving Zustand `persist` Hydration
**What goes wrong:** Adding an optional field to a persisted store type can cause TypeScript errors if the persisted JSON has older shape objects without the field.
**Why it happens:** `persist` deserializes stored JSON — older items won't have `packToGo`.
**How to avoid:** The field is `packToGo?: boolean` (optional). Falsy `undefined` is safe — all logic gates on `item.packToGo === true` or truthy check. No migration needed.
**Warning signs:** TypeScript errors at call sites expecting boolean instead of `boolean | undefined`.

### Pitfall 3: Badge Token Reference Syntax in Tailwind v4
**What goes wrong:** Using `bg-[oklch(0.95 0.04 250)]` inline instead of the `bg-status-ordered-bg` utility class name.
**Why it happens:** Developer doesn't realize the `@theme inline` block creates Tailwind utility aliases.
**How to avoid:** Use the semantic class `bg-status-ordered-bg` / `text-status-ordered`. These resolve through the `--color-status-ordered-bg: var(--status-ordered-bg)` alias chain.
**Warning signs:** Dark mode colors don't switch (literal OKLCH bakes the light-mode value).

### Pitfall 4: `isTakeaway` Detection in `TicketPanel`
**What goes wrong:** Passing `isTakeaway` as a new prop through the component tree from the page creates a prop API change and requires updating every `TicketPanel` call site.
**Why it happens:** Reflex to pass data down rather than read it locally.
**How to avoid:** `TicketPanel` reads `useQueueStore.getState().orders[tableId]` directly — non-reactive, stable for the lifetime of the component. This is the established CLAUDE.md pattern for static reads.
**Warning signs:** TypeScript prop type errors at `TicketPanel` call sites in `order/[tableId]/page.tsx`.

### Pitfall 5: Layout Shift When Filter Hides All Tickets in a Column
**What goes wrong:** Removing ticket cards from a stage column causes column width to collapse, shifting the other columns.
**Why it happens:** The column uses `flex-1` but without content has no minimum width.
**How to avoid:** Locked decision — empty columns show the existing `No tickets` dashed border placeholder. The filter replaces the ticket list with the placeholder, not the column. Column flex structure stays identical.
**Warning signs:** The 3-column grid reflows when switching filter tabs.

---

## Code Examples

### Channel filter tab row (KdsBoard)
```tsx
// Source: Phase 15 tab pattern (TableBottomSheet) + locked decision in CONTEXT.md
const CHANNEL_FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'dine-in',  label: 'Dine-in' },
  { key: 'takeaway', label: 'Takeaway' },
  { key: 'delivery', label: 'Delivery' },
] as const

type ChannelFilter = typeof CHANNEL_FILTERS[number]['key']

// Inside KdsBoard component:
const [activeChannelFilter, setActiveChannelFilter] = useState<ChannelFilter>('all')

// Tab row JSX (above the flex gap-2 board div):
<div className="flex gap-0 border-b border-border px-3 shrink-0">
  {CHANNEL_FILTERS.map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setActiveChannelFilter(key)}
      className={cn(
        'px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2',
        activeChannelFilter === key
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {label} ({channelCounts[key]})
    </button>
  ))}
</div>
```

### Ticket header with order type badge
```tsx
// Source: KdsTicketCard.tsx existing header, CONTEXT.md badge position spec
<div className="px-3 py-2 bg-muted/30 flex justify-between items-center border-b border-border/40">
  <div className="flex items-center gap-2">
    <span className="font-bold text-base">{ticket.tableLabel}</span>
    <Badge variant={getOrderTypeBadgeVariant(ticket.orderType, ticket.platform)}>
      {getOrderTypeLabel(ticket.orderType, ticket.platform)}
    </Badge>
    <Badge className={`${KDS_STAGE_CONFIG[ticket.stage].bgClass} ${KDS_STAGE_CONFIG[ticket.stage].textClass} border-0 text-xs`}>
      {ticket.stage === 'InProgress' ? 'In Progress' : ticket.stage}
    </Badge>
  </div>
  <span className={`font-mono text-sm tabular-nums ${timerColorClass}`}>{display}</span>
</div>
```

### PACK chip in KdsItemRow (non-voided path)
```tsx
// Source: existing ALLERGY chip pattern in KdsItemRow.tsx line 73–79
{item.packToGo && (
  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 bg-status-cooking-bg text-status-cooking">
    PACK
  </span>
)}
```

### Bag toggle in TicketLineItem (sent item row, dine-in only)
```tsx
// Source: existing sent-item row pattern in TicketLineItem.tsx lines 79–100
// showPackToGo and onTogglePackToGo are new optional props
{showPackToGo && (
  <button
    onClick={() => onTogglePackToGo?.(item.lineId)}
    className={cn(
      'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors',
      item.packToGo
        ? 'text-status-cooking bg-status-cooking-bg'
        : 'text-muted-foreground/50 hover:text-status-cooking hover:bg-status-cooking-bg'
    )}
    aria-label={item.packToGo ? 'Remove pack-to-go flag' : 'Flag as pack-to-go'}
  >
    <Bag2Linear size={14} />
  </button>
)}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| All KDS tickets show no channel info | Order type badge in ticket header | Kitchen instantly knows plate vs bag |
| KDS board shows all channels always | Filter tabs narrow to one channel | Rush-hour focus: delivery cook, takeaway cook can work independently |
| All dine-in items always plated | `packToGo` flag per item | Mixed dine-in/takeaway orders handled without a separate order |

---

## Open Questions

1. **`TicketPanel` receiving `isTakeaway` context**
   - What we know: The order page derives `isTakeaway` via `useQueueStore.getState().orders[tableId]`. `TicketPanel` receives `tableId` as a prop.
   - What's unclear: Whether `TicketPanel` should self-detect (cleaner, fewer props) or receive it from parent (more explicit, easier to test).
   - Recommendation: Self-detect in `TicketPanel` via `useQueueStore.getState().orders[tableId]` — consistent with established non-reactive read pattern. No prop change at call sites.

2. **Bag icon choice (Claude's discretion)**
   - What we know: Solar icon set is the only icon library used. Common bag icons: `Bag2Linear`, `BagLinear`, `BagHeartLinear`, `ShoppingBagLinear`.
   - Recommendation: Use `Bag2Linear` — most neutral, recognizable as a takeout/packaging bag.

3. **PACK badge color (Claude's discretion)**
   - What we know: Amber (`status-cooking-bg / status-cooking`) is available and distinct from ALLERGY red and modifier gray.
   - Recommendation: Amber. It signals "different handling" without implying error. Avoid brand-red (too alarming, conflicts with ALLERGY chip).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured — `npm run build` (TypeScript) is the project's verification method |
| Config file | none |
| Quick run command | `npm run build` |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMBO-01 | `togglePackToGo` action toggles `packToGo` on correct item | manual-only (no test framework) | `npm run build` | N/A |
| COMBO-02 | PACK chip renders when `item.packToGo === true` | manual-only | `npm run build` | N/A |
| KDS-01 | Order type badge renders correct text/variant per orderType+platform | manual-only | `npm run build` | N/A |
| KDS-02 | Filter tabs hide/show tickets by channel, counts match | manual-only | `npm run build` | N/A |
| UI-01 | Grab green and LINE MAN blue render in both light and dark mode | manual-only | `npm run build` | N/A |

**Note:** No test framework is configured in this project. TypeScript strict-mode build (`npm run build`) is the primary automated quality gate. Visual/behavioral verification is done via browser at `localhost:3000`.

### Wave 0 Gaps
None — existing build infrastructure covers all phase requirements. No test files or framework config needed.

---

## Sources

### Primary (HIGH confidence)
- `src/stores/kds.store.ts` — `KdsTicket` interface, `addTicket` signature, confirmed `orderType`/`platform` fields present
- `src/stores/order.store.ts` — `OrderLineItem` interface, `voidItem`/`editItem` pattern for `togglePackToGo` implementation
- `src/components/ui/badge.tsx` — CVA variant structure, confirmed `grab`/`lineman` variants exist
- `src/components/kds/KdsTicketCard.tsx` — Header DOM structure, confirmed badge import and flex layout
- `src/components/kds/KdsBoard.tsx` — `stageTickets` filter pattern, confirmed `tickets` selector
- `src/components/kds/KdsItemRow.tsx` — ALLERGY chip pattern for PACK chip reference
- `src/components/order/TicketLineItem.tsx` — Sent/unsent item row patterns for bag toggle placement
- `src/components/order/TicketPanel.tsx` — `isTakeaway` detection path, `showPackToGo` prop threading
- `src/app/globals.css` — All OKLCH token definitions confirmed, `--platform-grab`/`--platform-lineman` present
- `src/lib/mock-data/kds-demo.ts` — `buildMockDemoTicket` factory, confirmed no `orderType` assignment yet

### Secondary (MEDIUM confidence)
- `.planning/phases/19-kds-differentiation-+-combo-flag/19-CONTEXT.md` — All locked decisions; CONTEXT.md is the authoritative source for implementation specifics
- `CLAUDE.md` — Zustand selector safety rule, CVA extend-in-place rule, non-reactive getState() pattern

### Tertiary (LOW confidence)
None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies
- Architecture: HIGH — all integration points read directly from source; no inference required
- Pitfalls: HIGH — three pitfalls (Zustand loop, dark mode tokens, isTakeaway detection) are verified against actual source code patterns in this codebase

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable stack; nothing moves until a dependency upgrade)
