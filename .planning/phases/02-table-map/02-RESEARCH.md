# Phase 2: Table Map - Research

**Researched:** 2026-03-10
**Domain:** React floor plan UI, Zustand state machines, bottom sheet modals, dwell timer, Tailwind CSS 4
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Floor plan structure
- Single zone "Main Floor" — no multiple zones or sections
- 12 tables, labeled T01–T12
- Responsive grid: 4 columns on tablet (≥768px), 3 columns on mobile (375px)
- Page header shows live count: "X / 12 tables available"
- No drag-to-reposition (static layout — decided in Phase 1 roadmap)

#### Table tile
- Always visible on tile: table number, colored border (status), status text label, guest count (when occupied), dwell timer (when occupied), order stage badge (when order exists)
- Assigned waiter is NOT on the tile — shown in the bottom sheet only
- Status visual: colored border + status text label (not background fill, not dot-only)
- Status color mapping (Claude's discretion for exact hex, follow this intent):
  - Open → green
  - Occupied → red/orange
  - Reserved → blue/purple
  - Check Requested → amber/yellow
  - Cleaning → gray

#### Table detail bottom sheet
- Tapping any non-Open table slides up a bottom sheet from the bottom
- Floor plan fades behind sheet (overlay/dim)
- Bottom sheet content varies by status:
  - **Occupied**: table number, guest count, dwell timer, waiter name (editable inline text), table note (editable inline text), order stage badge, [View Order] + [Served] + [Request Check] buttons
  - **Check Requested**: table number + [Go to Payment] button (Phase 5 target — placeholder link in Phase 2)
  - **Cleaning**: table number + [Mark Clean] button → resets table to Open
  - **Reserved**: table number + status label only (read-only, no interactive trigger)

#### Open Table modal
- Tapping an Open tile → bottom sheet with two options: [Open Table] and [Mark Reserved]
- Tapping [Open Table] → center modal (reusing existing Dialog component from Phase 1)
- Modal fields: Guest count (number input, required, min 1) — no waiter or note in modal
- Confirm button label: "Open Table"
- After confirming: modal closes, tile immediately updates to Occupied; user stays on floor plan — NO navigation to order entry

#### State machine
- Open → Occupied: via "Open Table" modal (guest count input)
- Open → Reserved: via "Mark Reserved" in bottom sheet (mock only — pre-seed 1–2 reserved tables)
- Occupied → Check Requested: via "Request Check" button in occupied bottom sheet
- Check Requested → Cleaning: driven by Phase 5 payment (placeholder in Phase 2)
- Cleaning → Open: via "Mark Clean" button in cleaning bottom sheet
- Occupied order stage updates (Ordered → Cooking → Ready → Billed): driven by Phase 3 KDS/order data

#### Served button
- Lives inside the occupied table bottom sheet
- Pressing Served changes order stage badge to "Served" and records servedAt timestamp in store

#### Zustand store
- New `table.store.ts` follows same pattern as `session.store.ts`
- Table state shape: `{ id, label, status, guestCount, openedAt, waiterId, waiterName, note, orderStage, servedAt }`
- Tables initialized as Open; 1–2 pre-seeded as Reserved in mock data
- Dwell timer: computed from `openedAt` using `Date.now()` — interval-driven display in component

#### Established patterns (non-negotiable)
- Tailwind CSS 4 CSS-first config (`@theme` in `globals.css`) — no `tailwind.config.js`
- `'use client'` on all interactive components
- Base UI Dialog (NOT shadcn Radix Dialog) — confirmed canonical in Phase 1
- Zustand 5 with no persist middleware
- TypeScript strict mode — all types fully declared

### Claude's Discretion
- Exact Tailwind color classes for each status (follow color intent above)
- Bottom sheet animation implementation (CSS transition or Framer Motion)
- Exact spacing, typography, tile height
- Dwell timer format: use `0:42` for under 1 hour, `1h 02m` for 1 hour+
- Loading/empty states

### Deferred Ideas (OUT OF SCOPE)
- Loyalty program / QR code on receipt
- Queue system integration
- QR coupon scanning (Payment phase)
- Dynamic QR payment
- Auto-print receipt with unique QR
- Reserved table interactive toggle (Phase 6/7 if needed)
- Table search / lookup by number (Phase 5)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FLOOR-01 | Staff can view a floor plan with color + icon status per table (Open, Occupied, Reserved, Check Requested, Cleaning) | TableTile component with status-specific colored border + Lucide status icons + status text label. Accessible: color + icon, never color alone. |
| FLOOR-02 | Staff can tap a table to perform the status-appropriate action (Empty → seat modal, Occupied → open order, Check Requested → payment screen) | Single tap handler on tile dispatches based on current status; bottom sheet for non-Open, Dialog modal for Open. State machine transitions in Zustand action. |
| FLOOR-03 | Staff can enter seat/cover count when seating a table via a "Seat Table" modal | Dialog component (existing from Phase 1) with controlled number Input; `openTable(id, guestCount)` action in table store. |
| FLOOR-04 | Time-on-table dwell timer badge is visible on each occupied table tile | `useEffect` + `setInterval(1000)` in tile or custom hook `useDwellTimer(openedAt)`. Computes from `openedAt` timestamp. |
| FLOOR-05 | Staff can assign a waiter to a table and add a table-level notes field (persists for the full visit) | Inline editable Input fields in the Occupied bottom sheet; `updateTable(id, { waiterName, note })` action in store. |
</phase_requirements>

---

## Summary

Phase 2 builds the digital floor plan — the first screen staff see after login and the operational hub for the entire dining lifecycle. The UI problem is: how do you display 12 tables' states at a glance, let staff tap into the right action instantly, and update state with zero friction? The architecture is entirely client-side: a Zustand store as the single source of truth for all table data, a CSS grid of TableTile components reading from that store, and two overlay patterns (bottom sheet for context, Dialog for focused data entry).

The technology is all already installed and proven in Phase 1. No new packages are needed. The main engineering concerns are: (1) bottom sheet implementation without an external library — a fixed-position panel with CSS `translate-y` transition and an overlay backdrop works perfectly with the existing Tailwind/tw-animate-css setup; (2) dwell timer correctness — a custom hook encapsulating `useEffect` + `setInterval` prevents memory leaks and keeps timer logic out of rendering; (3) state machine integrity — the Zustand action set must enforce legal transitions to prevent impossible states.

**Primary recommendation:** Build in this order — store first, mock data second, tile grid third, bottom sheet fourth, Open Table modal fifth. Every subsequent piece slots in cleanly once the store is solid.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.1.6 | File-system routing, RSC shell | Project baseline |
| React | 19.2.3 | UI rendering | Project baseline |
| Zustand | 5.0.11 | Table state machine (no persist) | Established in Phase 1 |
| Tailwind CSS | 4.x | Layout, status colors, animation | Established in Phase 1 (CSS-first `@theme`) |
| tw-animate-css | 1.4.0 | Slide-up / fade animations | Already installed; handles bottom sheet transitions |
| @base-ui/react | 1.2.0 | Dialog modal (Open Table) | Canonical in Phase 1 (NOT Radix) |
| lucide-react | 0.577.0 | Status icons on tiles | Already installed |
| class-variance-authority | 0.7.1 | Variant classes for TableTile borders | Already installed |

### No New Packages Required

All required functionality is achievable with existing dependencies:
- Bottom sheet: CSS `translate-y` via Tailwind + tw-animate-css (no `vaul` or `@radix-ui/react-dialog` needed)
- Dwell timer: native `setInterval` in `useEffect`
- Inline editing: native `<input>` via existing `Input` component

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS translate bottom sheet | `vaul` (Vaul drawer) | Vaul adds polish (drag handle, snap points) but requires a new package; CSS transition is sufficient for wireframe |
| Native setInterval | `use-interval` hook library | No benefit; 5-line custom hook avoids a dependency |
| Zustand actions | React context + useReducer | Zustand already proven; no reason to change |

**Installation:** No new packages — `npm install` is not needed for this phase.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── stores/
│   └── table.store.ts           # New: table state machine
├── lib/
│   └── mock-data/
│       └── tables.ts            # New: initial 12 tables fixture
├── components/
│   └── table-map/
│       ├── TableGrid.tsx        # Grid wrapper with header count
│       ├── TableTile.tsx        # Individual tile (status visual + tap)
│       ├── TableBottomSheet.tsx # Status-appropriate bottom sheet
│       ├── OpenTableModal.tsx   # Guest count Dialog modal
│       └── useDwellTimer.ts     # Custom hook: interval-based timer
└── app/
    └── (app)/
        └── table-map/
            └── page.tsx         # Compose TableGrid (replaces placeholder)
```

### Pattern 1: Zustand Table Store (State Machine)

**What:** Single store manages all 12 tables as a Record keyed by table ID. Actions enforce legal state transitions.

**When to use:** Any time a component reads or writes table data.

**Type definition:**
```typescript
// src/stores/table.store.ts
export type TableStatus =
  | 'Open'
  | 'Occupied'
  | 'Reserved'
  | 'CheckRequested'
  | 'Cleaning'

export type OrderStage =
  | 'Ordered'
  | 'Cooking'
  | 'Ready'
  | 'Served'
  | 'Billed'

export interface TableRecord {
  id: string          // 't01' … 't12'
  label: string       // 'T01' … 'T12'
  status: TableStatus
  guestCount: number | null
  openedAt: number | null    // Date.now() timestamp
  waiterId: string | null
  waiterName: string | null
  note: string | null
  orderStage: OrderStage | null
  servedAt: number | null
}

interface TableStore {
  tables: Record<string, TableRecord>
  openTable: (id: string, guestCount: number) => void
  markReserved: (id: string) => void
  requestCheck: (id: string) => void
  markCleaning: (id: string) => void   // Phase 5 calls this
  markClean: (id: string) => void
  markServed: (id: string) => void
  updateTable: (id: string, patch: Partial<Pick<TableRecord, 'waiterName' | 'note' | 'orderStage'>>) => void
}
```

**Store pattern (mirrors session.store.ts exactly):**
```typescript
// Source: existing session.store.ts pattern
import { create } from 'zustand'
import { INITIAL_TABLES } from '@/lib/mock-data/tables'

export const useTableStore = create<TableStore>((set) => ({
  tables: INITIAL_TABLES,

  openTable: (id, guestCount) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'Occupied',
          guestCount,
          openedAt: Date.now(),
          orderStage: null,
          servedAt: null,
        },
      },
    })),

  markClean: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'Open',
          guestCount: null,
          openedAt: null,
          waiterId: null,
          waiterName: null,
          note: null,
          orderStage: null,
          servedAt: null,
        },
      },
    })),

  updateTable: (id, patch) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: { ...state.tables[id], ...patch },
      },
    })),
  // ... other actions follow same shape
}))
```

### Pattern 2: Mock Data Fixture

**What:** Static array of 12 TableRecord objects. T10 and T11 pre-seeded as Reserved.

```typescript
// src/lib/mock-data/tables.ts
import type { TableRecord } from '@/stores/table.store'

function makeTable(num: number): TableRecord {
  const id = `t${String(num).padStart(2, '0')}`
  const label = `T${String(num).padStart(2, '0')}`
  return {
    id, label,
    status: 'Open',
    guestCount: null, openedAt: null,
    waiterId: null, waiterName: null,
    note: null, orderStage: null, servedAt: null,
  }
}

const BASE_TABLES = Array.from({ length: 12 }, (_, i) => makeTable(i + 1))

export const INITIAL_TABLES: Record<string, TableRecord> = Object.fromEntries(
  BASE_TABLES.map((t) => [
    t.id,
    t.id === 't10' || t.id === 't11'
      ? { ...t, status: 'Reserved' as const }
      : t,
  ])
)
```

### Pattern 3: Dwell Timer Custom Hook

**What:** `useDwellTimer(openedAt)` returns a formatted string, updating every second via `setInterval`.

**When to use:** Inside TableTile and the Occupied bottom sheet — wherever live elapsed time is shown.

```typescript
// src/components/table-map/useDwellTimer.ts
'use client'
import { useState, useEffect } from 'react'

export function useDwellTimer(openedAt: number | null): string {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!openedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [openedAt])

  if (!openedAt) return ''

  const elapsed = Math.floor((now - openedAt) / 1000) // seconds
  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60

  if (hours >= 1) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
```

### Pattern 4: Bottom Sheet (CSS-only, no external library)

**What:** Fixed-position panel anchored to bottom of viewport, slide-up via Tailwind transition, backdrop overlay dims floor plan.

**When to use:** All non-Open table taps, and the "Open" tile tap (pre-modal step).

```typescript
// Bottom sheet shell — simplified
'use client'
import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
          shadow-lg transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {children}
      </div>
    </>
  )
}
```

### Pattern 5: TableTile Status Visuals

**What:** Colored left border (4px) + status text label + Lucide icon. No background fill (per decision).

**Status color mapping (Tailwind CSS 4 arbitrary values):**

| Status | Border class | Text class | Lucide icon |
|--------|-------------|-----------|-------------|
| Open | `border-l-green-500` | `text-green-600` | `CircleDot` |
| Occupied | `border-l-red-500` | `text-red-600` | `Users` |
| Reserved | `border-l-blue-500` | `text-blue-600` | `CalendarClock` |
| CheckRequested | `border-l-amber-500` | `text-amber-600` | `CreditCard` |
| Cleaning | `border-l-gray-400` | `text-gray-500` | `Sparkles` |

**Tile structure:**
```typescript
// TableTile — simplified structure (full implementation in task)
<button
  onClick={() => onTap(table)}
  className={`
    relative flex flex-col gap-1 rounded-xl border border-border bg-card p-3
    border-l-4 ${statusBorderClass} min-h-[88px] touch-manipulation
    active:scale-95 transition-transform
  `}
>
  <span className="text-xs font-semibold">{table.label}</span>
  <span className={`text-xs ${statusTextClass} flex items-center gap-1`}>
    <StatusIcon size={12} />
    {statusLabel}
  </span>
  {table.status === 'Occupied' && (
    <>
      <span className="text-xs text-muted-foreground">{table.guestCount} guests</span>
      <span className="text-xs font-mono text-muted-foreground">{dwellTime}</span>
    </>
  )}
  {table.orderStage && (
    <Badge className="absolute top-2 right-2 text-[10px]">{table.orderStage}</Badge>
  )}
</button>
```

### Anti-Patterns to Avoid

- **Deriving timer state inside render:** Computing elapsed time with no `useEffect`/interval causes stale display. Always use the `useDwellTimer` hook.
- **Conditional hook calls based on table status:** React hooks must be called unconditionally. Pass `null` to hook when not Occupied; hook returns `''`.
- **Direct state mutation in Zustand:** Always use spread to return new objects. Zustand 5 does not auto-immutify.
- **Opening Dialog directly from tile click:** The decided flow is tile → bottom sheet (for Open: pick action) → Dialog. Don't skip the bottom sheet for Open tiles.
- **Using Radix Dialog:** The codebase uses `@base-ui/react/dialog`. Never import from `@radix-ui/react-dialog`.
- **`tailwind.config.js`:** Tailwind 4 uses CSS-first config in `globals.css` `@theme` block. Any new status color tokens go there.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-up sheet animation | Custom JS-based animation with requestAnimationFrame | CSS `transition-transform` + Tailwind `translate-y-full` / `translate-y-0` | tw-animate-css already installed; GPU-composited, simpler |
| Status color management | Long if/else chains per component | CVA (`cva`) with status variant map | Already proven pattern with Badge; keeps variants co-located |
| Table ID generation | UUID library | Predictable string `t01`–`t12` from fixture | Static floor plan — IDs are stable and human-readable |
| Elapsed time formatting | date-fns / moment | Native arithmetic in `useDwellTimer` | 10 lines; no library needed |
| Body scroll lock | `body-scroll-lock` package | `document.body.style.overflow = 'hidden'` in `useEffect` | One-liner; package is overkill |

**Key insight:** This phase is UI composition and state management with already-installed tools. Every problem is solvable without installing new packages.

---

## Common Pitfalls

### Pitfall 1: setInterval Memory Leak

**What goes wrong:** `setInterval` in `useEffect` without cleanup causes the interval to continue running after the component unmounts (or when the table becomes non-Occupied).

**Why it happens:** React 19 Strict Mode double-mounts in development, making leaks immediately visible as double-speed timers.

**How to avoid:** Always return `() => clearInterval(id)` from the `useEffect`. Also guard: `if (!openedAt) return` before setting up the interval.

**Warning signs:** Timer ticks twice as fast in dev mode; console warnings about state updates on unmounted components.

### Pitfall 2: Bottom Sheet Z-Index Conflict with AppShell

**What goes wrong:** The AppShell has a header and sidebar. A bottom sheet `z-50` backdrop may not cover the sidebar correctly if the sidebar has a higher z-index.

**Why it happens:** The AppShell `<main>` area is `flex-1 overflow-auto` — the bottom sheet anchored to `fixed bottom-0` will correctly escape the main's overflow context, but the sidebar may render above it.

**How to avoid:** Set backdrop `z-40` and sheet `z-50`. Verify AppHeader and AppSidebar don't exceed `z-40`. If needed, render the sheet via a portal using `document.body` (React's `createPortal`).

**Warning signs:** Backdrop doesn't dim the sidebar; sheet appears behind the header.

### Pitfall 3: Tailwind CSS 4 Arbitrary Color Values

**What goes wrong:** Using Tailwind v3 syntax like `border-[#22c55e]` or referencing colors not in the CSS theme.

**Why it happens:** Tailwind 4 generates utilities from `@theme` tokens, not from a config file. Standard color palette utilities like `border-green-500` still work (they're from `tailwindcss/preflight`), but custom brand colors must go in `@theme`.

**How to avoid:** Use standard Tailwind palette classes (`green-500`, `red-500`, `amber-500`, `blue-500`, `gray-400`) for status colors — these are available in Tailwind 4. Only put brand-specific colors in `@theme`.

**Warning signs:** Class is applied but has no effect; PurgeCSS/JIT doesn't generate the class.

### Pitfall 4: Number Input on Mobile

**What goes wrong:** `<input type="number">` on iOS Safari shows a decimal keypad by default, which is wrong for guest count.

**How to avoid:** Use `<input type="number" inputMode="numeric" pattern="[0-9]*" min="1">` to force the integer keypad on mobile.

**Warning signs:** Decimal point visible on iOS keyboard; user can enter `1.5` as guest count.

### Pitfall 5: Inline Editing State in Bottom Sheet

**What goes wrong:** Inline `waiterName` and `note` fields that update the Zustand store on every keystroke cause unnecessary re-renders of all 12 tiles (because all tiles subscribe to `tables`).

**How to avoid:** Keep inline edit fields as local component state; call `updateTable` only on blur (when user finishes typing). This is the correct UX pattern anyway — update on commit, not on every character.

**Warning signs:** Noticeable lag or flicker in tile grid while typing in the bottom sheet.

### Pitfall 6: Base UI Dialog vs Radix Dialog API Differences

**What goes wrong:** Assuming Radix Dialog's `onInteractOutside` prop exists on Base UI Dialog.

**Why it happens:** shadcn/ui historically wraps Radix; this project uses Base UI (`@base-ui/react`). APIs differ.

**How to avoid:** Use `disablePointerDismissal` prop on `Dialog.Root` (established in Phase 1 ManagerPinModal). Never import from `@radix-ui/react-dialog`.

**Warning signs:** TypeScript error "Property onInteractOutside does not exist"; dialog dismisses unexpectedly.

---

## Code Examples

Verified patterns from existing codebase:

### Zustand Store Creation (mirrors session.store.ts)
```typescript
// Source: src/stores/session.store.ts (existing, Phase 1)
import { create } from 'zustand'
export const useTableStore = create<TableStore>((set) => ({
  // state and actions follow identical pattern
}))
```

### Base UI Dialog (from Phase 1 ManagerPinModal)
```typescript
// Source: src/components/auth/ManagerPinModal.tsx (existing, Phase 1)
<Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Open Table</DialogTitle>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button onClick={handleConfirm}>Open Table</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Badge Component (order stage display)
```typescript
// Source: src/components/ui/badge.tsx (existing, Phase 1)
// Use variant="outline" for neutral order stage, variant="default" for active
<Badge variant="outline">{table.orderStage}</Badge>
```

### Input Component (guest count field)
```typescript
// Source: src/components/ui/input.tsx (existing, Phase 1)
<Input
  type="number"
  inputMode="numeric"
  pattern="[0-9]*"
  min={1}
  value={guestCount}
  onChange={(e) => setGuestCount(Number(e.target.value))}
  placeholder="Number of guests"
/>
```

### Available Lucide Icons (confirmed in lucide-react 0.577.0)
```typescript
import {
  CircleDot,      // Open table
  Users,          // Occupied
  CalendarClock,  // Reserved
  CreditCard,     // Check Requested
  Sparkles,       // Cleaning
  ChevronDown,    // Bottom sheet close handle
  Clock,          // Dwell timer icon
} from 'lucide-react'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind `tailwind.config.js` | CSS-first `@theme` in `globals.css` | Tailwind v4 (2024) | No config file; all tokens in CSS |
| Radix UI Dialog (`@radix-ui/react-dialog`) | Base UI Dialog (`@base-ui/react`) | Phase 1 decision | Different prop API — `disablePointerDismissal` not `onInteractOutside` |
| shadcn/ui for all primitives | Mix: shadcn wraps Base UI in this project | Phase 1 setup | Existing `dialog.tsx`, `badge.tsx`, `button.tsx`, `input.tsx` all use Base UI internally |
| Zustand 4 `persist` middleware default | Zustand 5 with no persist (intentional) | Phase 1 decision | Session state resets on refresh — correct for wireframe |

**Deprecated/outdated in this project:**
- `tailwind.config.js`: Does not exist and should not be created. Use `@theme` block.
- `onInteractOutside`: Radix API — not available in Base UI.

---

## Open Questions

1. **AppShell layout and bottom sheet z-index**
   - What we know: AppShell uses `flex flex-col h-screen`; sidebar has no explicit z-index set in the current code
   - What's unclear: Whether `fixed` positioning in the bottom sheet correctly escapes AppShell's layout context without a portal
   - Recommendation: Implement without portal first; test in browser; add `createPortal(sheet, document.body)` only if z-index conflict observed

2. **`useSessionStore` role reading in bottom sheet**
   - What we know: All `(app)` routes are auth-guarded; `role` is always non-null inside the floor plan
   - What's unclear: Whether the Served / Request Check buttons should be gated by role (Waiter vs Cashier vs Manager)
   - Recommendation: In Phase 2, show all buttons to all allowed roles (Waiter + Manager have table-map access per `ROLE_NAV_ACCESS`); defer role-specific button gating to Phase 7 Polish

3. **"View Order" button target in Phase 2**
   - What we know: Order entry is Phase 3 — the `/orders` route doesn't exist yet
   - What's unclear: Whether [View Order] should be disabled, hidden, or show a placeholder toast
   - Recommendation: Render [View Order] as a disabled button with a tooltip/annotation "Available in Phase 3" — consistent with wireframe pattern of showing future features as annotated placeholders

---

## Validation Architecture

> `nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

No test framework is currently installed in the project. All node_modules test files found belong to `zod` (a transitive dependency), not to the project itself.

| Property | Value |
|----------|-------|
| Framework | None installed |
| Config file | None |
| Quick run command | `npx tsc --noEmit` (type-check only — no test runner) |
| Full suite command | `npx tsc --noEmit && npx next build` |

**Note on testing approach for this project:** This is a browser-based interactive wireframe. The primary validation is:
1. TypeScript strict mode (`tsc --noEmit`) catches type errors in store and component contracts
2. Manual browser validation of the interactive flows
3. No automated component tests are in scope — the wireframe's success criteria are visual and interactive, not unit-testable in isolation

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOOR-01 | 12 table tiles render with correct status visuals | manual | Visual inspection at `/table-map` | ❌ Wave 0 (type-check only) |
| FLOOR-02 | Tap routing: Open → bottom sheet/modal; Occupied → bottom sheet; Check Requested → bottom sheet | manual | Visual flow walkthrough | ❌ Wave 0 |
| FLOOR-03 | Open Table modal accepts guest count ≥ 1 and updates tile to Occupied | manual | Visual + `tsc --noEmit` | ❌ Wave 0 |
| FLOOR-04 | Dwell timer increments each second on Occupied tiles | manual | Visual inspection | ❌ Wave 0 |
| FLOOR-05 | Waiter name and note fields persist in bottom sheet; update store on blur | manual | `tsc --noEmit` validates types | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (runs in ~5 seconds, catches type regressions)
- **Per wave merge:** `npx tsc --noEmit` + manual browser walkthrough of happy-path flows
- **Phase gate:** All success criteria verified manually in browser before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/stores/table.store.ts` — covers state machine for FLOOR-01 through FLOOR-05
- [ ] `src/lib/mock-data/tables.ts` — initial 12-table fixture with 2 pre-seeded Reserved
- [ ] `src/components/table-map/TableGrid.tsx` — covers FLOOR-01 (grid render)
- [ ] `src/components/table-map/TableTile.tsx` — covers FLOOR-01, FLOOR-02, FLOOR-04
- [ ] `src/components/table-map/TableBottomSheet.tsx` — covers FLOOR-02, FLOOR-05
- [ ] `src/components/table-map/OpenTableModal.tsx` — covers FLOOR-03
- [ ] `src/components/table-map/useDwellTimer.ts` — covers FLOOR-04
- [ ] Framework install: none required (TypeScript type check uses existing `tsc`)

---

## Sources

### Primary (HIGH confidence)

- Existing codebase at `src/stores/session.store.ts` — Zustand 5 store pattern confirmed
- Existing codebase at `src/components/auth/ManagerPinModal.tsx` — Base UI Dialog API confirmed (`disablePointerDismissal`)
- Existing codebase at `src/components/ui/dialog.tsx` — confirmed Base UI `@base-ui/react/dialog` is canonical, not Radix
- Existing codebase at `src/app/globals.css` — Tailwind CSS 4 `@theme` block confirmed; standard palette classes (`green-500` etc.) are available
- `package.json` — all dependency versions confirmed; no new installs required
- `src/lib/role-permissions.ts` — Waiter and Manager have `table-map` access; Kitchen does not
- `02-CONTEXT.md` — all locked decisions verified and reproduced above

### Secondary (MEDIUM confidence)

- React 19 docs: `useEffect` cleanup pattern for `setInterval` — standard React pattern, stable across versions
- Tailwind CSS 4 official behavior: standard color palette (`green-500`, `red-500`, etc.) available without custom config — confirmed by existing usage in codebase (e.g., `amber-100` in ManagerPinModal)
- Base UI React 1.2.0 docs: `disablePointerDismissal` on Dialog.Root — confirmed in Phase 1 STATE.md notes

### Tertiary (LOW confidence)

- iOS Safari `inputMode="numeric"` behavior for number inputs — best-practice recommendation, verified against multiple web sources but not device-tested in this specific project setup

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from package.json and existing source files
- Architecture: HIGH — patterns derived directly from existing Phase 1 code; no speculation
- Pitfalls: HIGH (3/6) / MEDIUM (3/6) — timer leak and Base UI API pitfalls verified from codebase; z-index and input pitfalls from general React/mobile knowledge
- Validation architecture: HIGH — test infrastructure absence confirmed from file system scan

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack; 30-day window appropriate)
