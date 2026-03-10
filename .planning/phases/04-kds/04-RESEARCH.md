# Phase 4: KDS - Research

**Researched:** 2026-03-11
**Domain:** React full-screen dashboard UI, Zustand 5 store design, Next.js App Router layout isolation, setInterval demo mode, CSS-only animation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**KDS shell & route**
- Kitchen role: PIN login → directly to `/kds` route — no AppShell rendered
- `/kds` uses its own layout (full-screen, no sidebar, no top nav header from AppShell)
- KDS has its own minimal header bar: board title + Demo Mode toggle + DEMO badge (when active)
- Other roles still use AppShell with KDS nav item disabled/greyed out (Phase 1 pattern unchanged)

**KDS board layout**
- Three columns: New / In Progress / Ready
- Columns are vertically scrollable if tickets overflow (board does not stop injecting when full)
- High-contrast visual style for kitchen readability (dark card backgrounds or bold borders — Claude's discretion within "high-contrast" constraint)
- No AppShell sidebar visible

**Ticket card design**
- Header: Table number only (e.g. "T03") + elapsed MM:SS timer
- Timer color progression: green → amber at 10 min → red at 15 min
- Items: each item listed as a row — item name + modifier summary inline beneath (always visible, no expand needed)
  - e.g. "Tonkotsu Ramen / Tonkotsu • Spice 3 • Katame • Extra Chashu"
- Item checkbox: small checkbox on each item row (tap to mark item done)
- Voided items: struck-through text + small 'VOID' badge, dim gray — kitchen sees what was removed (KDS-03)
- Allergy / special request flags: visually distinct from regular modifier lines — e.g. orange badge or highlighted row (KDS-03)
- Footer: large full-width [BUMP] button — easy to hit with gloved hands

**Bump interaction**
- Ticket-level bump: tap [BUMP] button → advances stage: New → In Progress → In Progress → Ready → Ready → Done (removed from board)
- Item-level bump: tap checkbox on individual item row to mark it done; when all items checked, [BUMP] button activates/glows
- No confirmation required — single tap advances; recall handles mistakes
- Recall tray: a collapsed row at the bottom of the KDS screen showing recently bumped/done tickets; tap any recalled ticket to restore it to the Ready column

**Demo mode**
- Entry: [Demo Mode] toggle button in KDS header (top-right area)
- Indicator: subtle 'DEMO' pill/badge in header while active — always visible but not dominant
- Auto-injection: new mock tickets appear via `setInterval` at a randomized 8–12 second cadence
- Board full: columns continue scrolling vertically — injection does not pause
- Exit: toggle off Demo Mode — injection stops; existing demo tickets remain until bumped

### Claude's Discretion
- Exact card colors and contrast level (dark card vs high-contrast border on light card)
- Exact allergy/special request highlight treatment (badge color, border highlight)
- Recall tray exact expand/collapse behavior
- Mock ticket data used in demo mode (can reuse menu fixture from Phase 3)
- Animation on ticket injection (slide in, fade in, or instant)
- Exact BUMP button color/style (green? Prominent neutral?)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| KDS-01 | Kitchen staff can view a full-screen KDS (no sidebar, high-contrast) with ticket columns (New / In Progress / Ready) | Next.js route group layout isolation pattern eliminates AppShell; three-column flex/grid layout with dark card design |
| KDS-02 | Kitchen staff can bump items and tickets, recall tickets, with elapsed timer per ticket | `kds.store.ts` manages KDS stage state independent of order.store; `useKdsTimer` hook mirrors existing `useDwellTimer` pattern; recall tray holds bumped ticket snapshots |
| KDS-03 | Allergy/special request flags and post-send voided items (struck-through) are visible on KDS tickets | `specialRequest` and `status: 'voided'` fields already exist on `OrderLineItem`; display logic is pure rendering — no store changes needed |
| KDS-04 | KDS auto-updates with mock new tickets in demo mode via setInterval | `setInterval` in a `useEffect` inside `kds.store.ts` or in KDS page; mock ticket factory reuses MENU_ITEMS fixture from Phase 3 |
</phase_requirements>

---

## Summary

Phase 4 is a self-contained UI surface that lives outside AppShell. The entire challenge is architectural isolation (a new Next.js route group or layout segment that renders no sidebar), plus an internal store for KDS-specific state that the order.store does not need to know about.

The existing codebase provides everything needed: order data lives in `useOrderStore` (rounds with sent/voided items), table stage lives in `useTableStore`, the timer hook pattern exists in `useDwellTimer`, and CSS-only slide animations are established in TableBottomSheet and ModifierSheet. KDS adds one new store (`kds.store.ts`) for bump stages, item-checked state, demo interval handle, and the recall tray snapshot list.

The key data-flow insight: KDS **reads** from `useOrderStore` (all tables' sent items) and **writes** back to `useTableStore` (advancing `orderStage`). KDS's own stage progression (New → In Progress → Ready → Done) is a KDS-internal concept stored in `kds.store.ts`, not in `order.store` or `table.store`.

**Primary recommendation:** Use a dedicated `(kds)` route group with its own `layout.tsx` that renders only `{children}` — this opts the `/kds` route out of AppShell with zero changes to the existing `(app)/layout.tsx`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, route groups, layout isolation | Already in project |
| React | 19.2.3 | Component model, useEffect for setInterval/timer | Already in project |
| Zustand | 5.0.11 | KDS store for bump stages, demo state, recall tray | Established pattern in project |
| Tailwind CSS | 4.x | Utility classes for high-contrast KDS layout | Established pattern in project |
| Lucide React | 0.577.0 | CheckSquare, Clock, RotateCcw, Zap icons for KDS | Already installed |
| shadcn/ui Badge | installed | VOID badge, DEMO badge, allergy badge rendering | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tw-animate-css` | 1.4.0 | slide-in animation for new ticket injection | Ticket appears in New column |
| `cn` (clsx + tailwind-merge) | installed | conditional class composition on timer, bump button | Timer color switching, button glow state |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS-only slide-in animation | Framer Motion | Framer Motion adds ~30KB; CSS-only is sufficient and matches Phase 2/3 pattern |
| Zustand for KDS state | useState in page | useState scatters state across components; Zustand allows recall tray and demo interval to be centralized |
| Route group layout isolation | Conditional render in (app)/layout | Route group is cleaner — no conditional logic needed in existing layout |

**Installation:** No new packages needed. All dependencies are already present.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (app)/                    # existing — AppShell wrapped routes
│   │   └── layout.tsx            # unchanged
│   └── (kds)/                    # NEW route group — no AppShell
│       ├── layout.tsx            # renders {children} only — full-screen
│       └── kds/
│           └── page.tsx          # KDS board page
├── stores/
│   ├── order.store.ts            # unchanged — KDS reads from here
│   ├── table.store.ts            # KDS writes orderStage back here
│   └── kds.store.ts              # NEW — bump stages, item checks, demo state, recall tray
├── components/
│   └── kds/
│       ├── KdsBoard.tsx          # three-column layout
│       ├── KdsTicketCard.tsx     # individual ticket card
│       ├── KdsItemRow.tsx        # item row with checkbox, void strike-through, allergy flag
│       ├── KdsRecallTray.tsx     # collapsed recall tray at bottom
│       └── useKdsTimer.ts        # elapsed MM:SS hook (mirrors useDwellTimer)
```

### Pattern 1: Route Group Layout Isolation

**What:** A `(kds)` route group in `src/app/(kds)/layout.tsx` renders only `{children}` with no AppShell. The `/kds` page inside this group gets a full-screen blank canvas.

**When to use:** Any page that must opt out of the AppShell without changing `(app)/layout.tsx`.

**Example:**
```typescript
// src/app/(kds)/layout.tsx
// No 'use client' needed — this is a Server Component layout

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  )
}
```

**Auth guard note:** The `/kds` page needs its own auth redirect (check `useSessionStore` on mount, redirect to `/login` if no role). The existing `(app)/layout.tsx` auth guard only runs for `(app)` routes.

### Pattern 2: KDS Store Design

**What:** `kds.store.ts` holds KDS-specific ephemeral state. It does NOT duplicate order data — it stores only what is unique to KDS: bump stage per ticket, per-item checked state, recall tray, and demo interval ref.

**Key type definitions:**

```typescript
// src/stores/kds.store.ts
'use client'
import { create } from 'zustand'

export type KdsStage = 'New' | 'InProgress' | 'Ready' // 'Done' = removed from board

export interface KdsTicket {
  ticketId: string       // = tableId (one active ticket per table)
  tableId: string
  tableLabel: string     // e.g. "T03"
  addedAt: number        // timestamp when ticket appeared on KDS board
  stage: KdsStage
  checkedItems: Set<string>  // lineIds of items marked done by kitchen
}

export interface RecalledTicket {
  ticket: KdsTicket
  recalledAt: number
}

interface KdsStore {
  tickets: Record<string, KdsTicket>  // keyed by tableId
  recallTray: RecalledTicket[]        // recently bumped tickets

  // Demo mode
  demoActive: boolean
  demoIntervalId: ReturnType<typeof setInterval> | null

  // Actions
  addTicket: (tableId: string, tableLabel: string) => void
  bumpTicket: (tableId: string) => void           // advances stage; Done → moves to recall tray
  checkItem: (tableId: string, lineId: string) => void
  recallTicket: (tableId: string) => void         // restores from tray to Ready column
  toggleDemo: (inject: () => void) => void        // starts/stops setInterval
  injectDemoTicket: (ticket: KdsTicket) => void
}
```

**Critical:** `KdsTicket.checkedItems` uses `Set<string>`. Zustand 5 `create()` handles Set correctly when the setter returns a new Set object (not mutating in place).

### Pattern 3: Demo Ticket Injection

**What:** `setInterval` fires every 8–12 seconds (randomized on each tick) and adds a new mock ticket to the New column.

**When to use:** Only when `demoActive === true`.

**Example:**
```typescript
// In kds/page.tsx — demo interval management
useEffect(() => {
  if (!demoActive) return

  function scheduleNext() {
    const delay = 8000 + Math.random() * 4000  // 8–12s
    const id = setTimeout(() => {
      injectDemoTicket(buildMockTicket())
      scheduleNext()  // re-schedule with new random delay
    }, delay)
    return id
  }

  const id = scheduleNext()
  return () => clearTimeout(id)  // cleanup on demo toggle off
}, [demoActive])
```

**Note:** `setTimeout` with re-scheduling gives better randomness than `setInterval` with a fixed interval. Both are valid — `setTimeout` with re-schedule is recommended because the cadence varies per the user decision (8–12s randomized).

### Pattern 4: Elapsed KDS Timer Hook

**What:** Mirrors `useDwellTimer` exactly but formats as MM:SS and returns both a formatted string and the raw elapsed seconds (for color threshold logic).

**Example:**
```typescript
// src/components/kds/useKdsTimer.ts
'use client'
import { useState, useEffect } from 'react'

export function useKdsTimer(addedAt: number): { display: string; elapsedSeconds: number } {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [addedAt])

  const elapsed = Math.floor((now - addedAt) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return {
    display: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    elapsedSeconds: elapsed,
  }
}
```

**Timer color thresholds (confirmed from CONTEXT.md):**
- `elapsedSeconds < 600` → green (text-green-500)
- `elapsedSeconds >= 600 && < 900` → amber (text-amber-500)
- `elapsedSeconds >= 900` → red (text-red-500)

### Pattern 5: Reading All Tables' Orders for KDS Board

**What:** KDS needs ALL tables' sent orders, not a single table's order. The existing `useOrderStore` stores `orders: Record<string, ActiveOrder>`. KDS derives tickets by iterating all entries.

**Selector approach (no store changes needed):**
```typescript
// In KdsBoard or kds/page.tsx
const allOrders = useOrderStore((s) => s.orders)

// Derive tickets that have sent items — one entry per tableId
const tablesWithSentItems = Object.values(allOrders).filter(
  (order) => order.rounds.some((r) => r.sentAt !== null && r.items.some((i) => i.status !== 'voided'))
)
```

**Key insight:** A KDS ticket corresponds to one table that has at least one sent round. The KDS store then tracks that ticket's stage separately.

### Anti-Patterns to Avoid

- **Storing order data in kds.store:** The kds store should only store KDS-specific state (stage, checked items, recall tray). Order item data lives in order.store. Duplicating creates sync issues.
- **Putting the setInterval/setTimeout in the store directly:** Interval IDs are not serializable and React strict mode double-invokes effects. Keep the interval in a `useEffect` in the page component.
- **Using `window` APIs or `document.body.style.overflow` in KDS:** KDS is full-screen by CSS; body scroll lock is not needed (unlike ModifierSheet).
- **Placing `/kds` inside `(app)` group:** This would cause AppShell to render. The route group `(kds)` must be a sibling of `(app)`, not nested inside it.
- **Kitchen role accessing AppShell routes:** The `(app)/layout.tsx` auth guard redirects based on `!role` and `!shiftOpen`, but does not check role. Phase 4 must add Kitchen role → redirect to `/kds` in the `(app)/layout.tsx`, AND add a standalone auth guard in the `(kds)/kds/page.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MM:SS tick timer | Custom date math with manual re-render | Mirror `useDwellTimer` pattern (setInterval + useState) | Already proven in Phase 2; same pattern, just format differently |
| Ticket slide-in animation | JS-based animation library | CSS `translate-y-full` → `translate-y-0` with `transition-transform` | Already used in TableBottomSheet and ModifierSheet; no extra deps |
| Badge for VOID / ALLERGY / DEMO | Custom span styling | shadcn `<Badge>` component | Already installed; consistent appearance |
| Modifier summary string | Custom template string logic | Inline string builder in `KdsItemRow` — same approach as `buildModifierSummary` in `TicketLineItem` | Project precedent; small, self-contained |

**Key insight:** KDS is primarily display + simple state machine. Every pattern needed already exists in the codebase.

---

## Common Pitfalls

### Pitfall 1: Kitchen Role Bypasses (app) Auth Guard But Has No Own Guard

**What goes wrong:** After adding the `(kds)` route group, Kitchen role can navigate to `/kds` without logging in if the KDS page has no auth guard.

**Why it happens:** The `(app)/layout.tsx` auth guard only covers routes inside the `(app)` group. The `(kds)` group has no guard by default.

**How to avoid:** Add a `useEffect` in `src/app/(kds)/kds/page.tsx` that checks `useSessionStore().role` and redirects to `/login` if null. Same pattern as `(app)/layout.tsx` but simpler (no shift check needed for Kitchen role — kitchen staff use the KDS directly, not the order flow).

**Warning signs:** KDS page loads without any logged-in role; store shows `role: null`.

### Pitfall 2: (app) Auth Guard Does Not Redirect Kitchen Role to /kds

**What goes wrong:** A Kitchen role staff member logs in via PIN, then the `(app)/layout.tsx` guard tries to show AppShell with shift-open screen before redirecting to `/kds`. Kitchen staff don't open a shift.

**Why it happens:** The existing guard only checks `!role` and `!shiftOpen` — it does not check if role === 'Kitchen'.

**How to avoid:** Add a `role === 'Kitchen'` branch to `(app)/layout.tsx`'s `useEffect` that calls `router.replace('/kds')`. Comes before the `!shiftOpen` check.

```typescript
// In (app)/layout.tsx useEffect — add this branch FIRST
if (role === 'Kitchen') {
  router.replace('/kds')
  return
}
```

**Warning signs:** Kitchen role lands on `/shift-open` or AppShell instead of `/kds`.

### Pitfall 3: setInterval Memory Leak from Demo Mode

**What goes wrong:** Demo mode `setInterval` or `setTimeout` not cleaned up when component unmounts or when demo is toggled off.

**Why it happens:** `setInterval` returns an ID that must be passed to `clearInterval` in the `useEffect` cleanup function.

**How to avoid:** Always return cleanup from the `useEffect`:
```typescript
useEffect(() => {
  if (!demoActive) return
  // ... schedule next
  return () => clearTimeout(id)  // or clearInterval(id)
}, [demoActive])
```

**Warning signs:** Multiple demo tickets injecting per interval; tickets appear after demo is toggled off.

### Pitfall 4: KDS Board Not Scrolling When Tickets Overflow

**What goes wrong:** Column cards overflow outside the viewport without scrolling; ticket content gets cut off.

**Why it happens:** Parent flex containers with `overflow: hidden` or `h-screen` prevent child scroll.

**How to avoid:** Each KDS column must have `overflow-y-auto` and a defined height. Use `h-full` + `overflow-y-auto` on each column div, with the outer board container being `h-screen` or `h-[calc(100vh-3.5rem)]` (subtracting KDS header height).

**Warning signs:** Tickets past the first 3-4 are not visible or scrollable.

### Pitfall 5: Zustand Set with Set<string> Mutating In Place

**What goes wrong:** `checkedItems` Set is mutated directly (`prev.add(lineId)`) without creating a new Set, so Zustand's shallow equality check sees no change and React does not re-render.

**Why it happens:** Sets are reference types; Zustand 5 uses shallow comparison.

**How to avoid:** Always spread into a new Set:
```typescript
checkItem: (tableId, lineId) =>
  set((state) => {
    const ticket = state.tickets[tableId]
    if (!ticket) return state
    const newChecked = new Set(ticket.checkedItems)
    newChecked.add(lineId)
    return {
      tickets: {
        ...state.tickets,
        [tableId]: { ...ticket, checkedItems: newChecked },
      },
    }
  }),
```

---

## Code Examples

Verified patterns from existing codebase:

### Route Group Layout (matches Next.js App Router docs)

```typescript
// src/app/(kds)/layout.tsx — server component, no 'use client'
export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

### KDS Board Three-Column Layout

```tsx
// src/app/(kds)/kds/page.tsx
<div className="flex flex-col h-screen bg-background">
  {/* KDS Header */}
  <header className="h-14 shrink-0 border-b flex items-center justify-between px-4">
    <span className="text-sm font-semibold">Kitchen Display</span>
    <div className="flex items-center gap-3">
      {demoActive && (
        <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          DEMO
        </span>
      )}
      <button onClick={toggleDemo} className="...">
        Demo Mode
      </button>
    </div>
  </header>

  {/* Three columns */}
  <div className="flex flex-1 gap-3 p-3 overflow-hidden">
    {(['New', 'InProgress', 'Ready'] as KdsStage[]).map((stage) => (
      <div key={stage} className="flex-1 flex flex-col min-w-0">
        <div className="text-xs font-semibold text-muted-foreground mb-2 px-1 uppercase tracking-wide">
          {stage === 'InProgress' ? 'In Progress' : stage}
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {ticketsInStage(stage).map((ticket) => (
            <KdsTicketCard key={ticket.ticketId} ticket={ticket} />
          ))}
        </div>
      </div>
    ))}
  </div>

  {/* Recall Tray */}
  <KdsRecallTray />
</div>
```

### Timer Color Logic (matches useDwellTimer pattern)

```tsx
// In KdsTicketCard — timer color via cn()
const { display, elapsedSeconds } = useKdsTimer(ticket.addedAt)

const timerClass = cn(
  'font-mono text-sm tabular-nums',
  elapsedSeconds < 600  && 'text-green-500',
  elapsedSeconds >= 600 && elapsedSeconds < 900 && 'text-amber-500',
  elapsedSeconds >= 900 && 'text-red-500',
)
```

### Voided Item Rendering (reads from order.store)

```tsx
// In KdsItemRow — mirrors TicketLineItem voided logic
{item.status === 'voided' ? (
  <span className="line-through text-muted-foreground/50 flex items-center gap-1.5">
    {item.menuItemName}
    <Badge variant="outline" className="text-[10px] py-0 border-muted-foreground/30 text-muted-foreground/50">
      VOID
    </Badge>
  </span>
) : (
  <span>{item.menuItemName}</span>
)}
```

### Special Request / Allergy Flag Rendering

```tsx
// In KdsItemRow — specialRequest field from OrderLineItem
{item.specialRequest && (
  <div className="flex items-center gap-1.5 mt-0.5">
    <span className="text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
      ALLERGY
    </span>
    <span className="text-xs text-orange-700 dark:text-orange-300">{item.specialRequest}</span>
  </div>
)}
```

### Mock Ticket Factory for Demo Mode

```typescript
// Can reuse MENU_ITEMS from Phase 3
import { MENU_ITEMS } from '@/lib/mock-data/menu'

const DEMO_TABLE_IDS = ['demo-t01', 'demo-t02', 'demo-t03', 'demo-t04', 'demo-t05']
let demoCounter = 0

function buildMockTicket(): KdsTicket {
  const tableIdx = demoCounter % DEMO_TABLE_IDS.length
  demoCounter++
  const tableId = DEMO_TABLE_IDS[tableIdx]
  // Pick 1-3 random MENU_ITEMS from sent-eligible items
  return {
    ticketId: `demo-${Date.now()}`,
    tableId,
    tableLabel: `T${String(tableIdx + 1).padStart(2, '0')}`,
    addedAt: Date.now(),
    stage: 'New',
    checkedItems: new Set(),
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate KDS app or iframe | Same Next.js app, route group layout isolation | N/A — chosen from start | No cross-origin complexity; shared Zustand stores |
| Real WebSocket for KDS updates | Zustand in-memory store (wireframe only) | Design decision | Demo mode via setInterval sufficient for presentation artifact |

**Deprecated/outdated:**
- Nothing in the current stack is deprecated for this phase.

---

## Open Questions

1. **Kitchen role shift-open behavior**
   - What we know: Kitchen role currently flows into AppShell where the shift-open check blocks. The (app)/layout.tsx guard needs a Kitchen branch.
   - What's unclear: Does Kitchen role ever need to "open a shift"? Based on the user flow description (kitchen staff use KDS directly), they do not.
   - Recommendation: Kitchen role logs in via PIN → immediately redirected to `/kds` — no shift-open step. Add `role === 'Kitchen'` → `router.replace('/kds')` in `(app)/layout.tsx` BEFORE the `!shiftOpen` check.

2. **Demo mode tickets: use real order.store or KDS-only mock objects?**
   - What we know: Demo mode is for stakeholder presentations. The user approved injecting mock tickets without manual input.
   - What's unclear: Should demo tickets appear in `useOrderStore` (making them visible on the floor map) or only in `kds.store`?
   - Recommendation: KDS-only mock objects in `kds.store.tickets` (not injected into order.store). This avoids polluting the floor map with fake tables. The CONTEXT.md notes "can reuse menu fixture from Phase 3" — meaning data shapes, not actual store injection.

3. **Recall tray: how many tickets to retain?**
   - What we know: Recall tray shows recently bumped/done tickets. No limit specified.
   - What's unclear: Should there be a max (e.g., last 5)?
   - Recommendation: Cap at 5 recalled tickets in the tray. Older entries are silently dropped. This keeps the tray compact without adding a scroll inside a scroll.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — no jest.config, vitest.config, or test directories found |
| Config file | None — see Wave 0 gaps |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KDS-01 | Full-screen KDS renders three columns; no AppShell sidebar visible | manual-only | Browser visual verification at `/kds` | ❌ Wave 0 |
| KDS-02 | Bump advances stage; recall restores ticket; timer ticks per second | manual-only | Tap BUMP, verify column change; tap recall tray | ❌ Wave 0 |
| KDS-03 | Voided items show strike-through + VOID badge; special requests show allergy badge | manual-only | Add order with special request, void an item, send; verify on /kds | ❌ Wave 0 |
| KDS-04 | Demo mode injects tickets at 8–12s cadence without manual input | manual-only | Toggle Demo Mode, wait 30s, verify tickets appear | ❌ Wave 0 |

**Justification for manual-only:** This is a browser-based interactive wireframe with no test framework installed. All verification is visual/interactive. TypeScript strict mode compile (`tsc --noEmit`) serves as the automated gate.

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (TypeScript strict compile, zero errors required)
- **Per wave merge:** Browser verify each KDS success criterion in order
- **Phase gate:** All 4 KDS success criteria browser-verified before marking phase complete

### Wave 0 Gaps

- [ ] No test framework installed — this is intentional for the wireframe deliverable; verification is browser-based per STATE.md precedent
- [ ] TypeScript strict compile (`npx tsc --noEmit`) must pass clean after each file is added

*(Existing phases 1–3 follow same browser-verification-only pattern — this is consistent with project convention.)*

---

## Sources

### Primary (HIGH confidence)

- Direct read of `/src/stores/order.store.ts` — `LineItemStatus`, `OrderLineItem`, `OrderRound`, `ActiveOrder`, store actions confirmed
- Direct read of `/src/stores/table.store.ts` — `OrderStage` type, `updateTable()` action confirmed
- Direct read of `/src/stores/session.store.ts` — `Role` type includes 'Kitchen', `login()` action confirmed
- Direct read of `/src/app/(app)/layout.tsx` — auth guard logic confirmed; Kitchen redirect gap confirmed
- Direct read of `/src/components/table-map/useDwellTimer.ts` — timer hook pattern confirmed (setInterval + useState)
- Direct read of `/src/components/table-map/TableBottomSheet.tsx` — CSS-only slide animation pattern confirmed
- Direct read of `/src/components/order/ModifierSheet.tsx` — slide animation, body scroll lock, sticky footer patterns confirmed
- Direct read of `/src/lib/mock-data/menu.ts` — MENU_ITEMS structure confirmed for demo ticket factory
- Direct read of `package.json` — confirmed versions: Next.js 16.1.6, React 19.2.3, Zustand 5.0.11, Tailwind 4.x, Lucide React 0.577.0
- Direct read of `.planning/phases/04-kds/04-CONTEXT.md` — all locked decisions and discretion areas confirmed

### Secondary (MEDIUM confidence)

- Next.js App Router route groups documentation pattern — `(groupName)` folders create layout scope boundaries without affecting URL segments. Consistent with Next.js 13+ App Router behavior verified through project's existing `(app)` and `(auth)` route groups.

### Tertiary (LOW confidence)

- None — all findings are based on direct codebase inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly confirmed in package.json
- Architecture: HIGH — route groups already used in project ((app), (auth)); patterns are direct extensions of existing code
- Pitfalls: HIGH — auth guard gap confirmed by reading (app)/layout.tsx; Set mutation pitfall is a documented Zustand 5 behavior
- Code examples: HIGH — all examples derived from existing project patterns

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable stack — Next.js 16, Zustand 5, Tailwind 4 are not fast-moving at this point)
