# Architecture Research

**Domain:** Next.js POS Wireframe — v1.1 Bug Fixes + Brand Polish
**Researched:** 2026-03-11
**Confidence:** HIGH (all findings derived from direct source code inspection — no assumptions)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Browser / Tablet                              │
├──────────────────────────────────────────────────────────────────┤
│  Route Groups (Next.js App Router)                                │
│  ┌──────────────────┐  ┌────────────────────┐  ┌──────────────┐ │
│  │   (auth)         │  │   (app)            │  │   (kds)      │ │
│  │  /login          │  │  /table-map        │  │  /kds        │ │
│  │  layout: bare    │  │  /order/[tableId]  │  │  layout:     │ │
│  └──────────────────┘  │  /payment/[tableId]│  │  full-screen │ │
│                         │  /manager          │  │  server comp │ │
│                         │  /shift-open       │  └──────────────┘ │
│                         │  layout: AppShell  │                    │
│                         │  + role/shift guard│                    │
│                         └────────────────────┘                    │
├──────────────────────────────────────────────────────────────────┤
│  UI Layer                                                         │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  AppShell        │  │  shadcn/ui     │  │ Feature         │  │
│  │  AppHeader       │  │  button.tsx    │  │ Components      │  │
│  │  AppSidebar      │  │  badge.tsx     │  │ TableTile,      │  │
│  │  (Toaster MISSING│  │  dialog.tsx    │  │ KdsBoard,       │  │
│  │   — Bug 3)       │  │  @base-ui/react│  │ TicketPanel...  │  │
│  └──────────────────┘  └────────────────┘  └─────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Permissions Layer                                                │
│  src/lib/role-permissions.ts                                      │
│  ROLE_NAV_ACCESS  →  canAccess(role, navSlug)                    │
│  ACTION_PERMISSIONS → canDoAction(role, actionKey)                │
│  (void-post-send ActionKey MISSING — Bug 4)                      │
├──────────────────────────────────────────────────────────────────┤
│  State Layer (Zustand 5 — in-memory, no persist middleware)       │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  session.store  │  │  table.store │  │  order.store       │  │
│  │  role           │  │  tables{}    │  │  orders{}          │  │
│  │  shiftOpen      │  │  updateTable │  │  rounds[]          │  │
│  └─────────────────┘  └──────────────┘  └────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────┐                           │
│  │  kds.store      │  │ manager.store│                           │
│  │  tickets{}      │  │  eightySixed │                           │
│  │  bumped[]       │  │  resetShift  │                           │
│  └─────────────────┘  └──────────────┘                           │
├──────────────────────────────────────────────────────────────────┤
│  Token Layer                                                      │
│  src/app/globals.css                                              │
│  @theme { brand colors, animations }                              │
│  @theme inline { maps CSS vars to Tailwind utilities }            │
│  :root { shadcn semantic tokens in OKLCH }                        │
│  .dark { dark mode overrides }                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `RootLayout` | Font variables, ThemeProvider, viewport lock (no zoom) | `src/app/layout.tsx` |
| `AppLayout` | Role guard, shift guard, AppShell wrapper for all `(app)` routes | `src/app/(app)/layout.tsx` |
| `KdsLayout` | Full-screen canvas, server component, no sidebar, for `(kds)` routes | `src/app/(kds)/layout.tsx` |
| `AppShell` | Fixed chrome: AppHeader + AppSidebar + main content slot | `src/components/app-shell/AppShell.tsx` |
| `AppSidebar` | Role-filtered nav links, shift-lock banner, collapsed/expanded state | `src/components/app-shell/AppSidebar.tsx` |
| `role-permissions.ts` | ROLE_NAV_ACCESS, ACTION_PERMISSIONS, canAccess, canDoAction | `src/lib/role-permissions.ts` |
| `globals.css` | All design tokens: brand OKLCH values, shadcn semantic tokens, dark mode | `src/app/globals.css` |
| `button.tsx` | CVA variant map over `@base-ui/react` Button primitive | `src/components/ui/button.tsx` |
| `badge.tsx` | CVA variant map over `@base-ui/react` useRender | `src/components/ui/badge.tsx` |
| `ThemeProvider` | next-themes wrapper, `attribute="class"` for dark mode | `src/providers/ThemeProvider.tsx` |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root: fonts, ThemeProvider, viewport lock
│   ├── globals.css             # ALL brand + shadcn tokens live here — single source
│   ├── page.tsx                # Root redirect
│   ├── (auth)/
│   │   ├── layout.tsx          # Bare canvas layout
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          # AppLayout: auth + shift guard + AppShell
│   │   ├── table-map/page.tsx
│   │   ├── order/[tableId]/page.tsx  # Has own Toaster — BUG 3
│   │   ├── payment/[tableId]/page.tsx
│   │   ├── shift-open/page.tsx
│   │   └── manager/page.tsx    # No role guard — BUG 5
│   └── (kds)/
│       ├── layout.tsx          # Full-screen server component layout
│       └── kds/page.tsx        # Role guard blocks Manager — BUG 2
├── components/
│   ├── app-shell/
│   │   ├── AppShell.tsx        # Toaster missing here — BUG 3
│   │   ├── AppHeader.tsx
│   │   └── AppSidebar.tsx      # /orders href is dead — BUG 1
│   ├── ui/                     # shadcn components — extend via CVA, never replace
│   │   ├── button.tsx          # @base-ui/react Button primitive + CVA
│   │   ├── badge.tsx           # @base-ui/react useRender + CVA
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── order/
│   │   └── TicketPanel.tsx     # Uses void-pre-send; needs void-post-send check
│   └── [feature]/
├── lib/
│   └── role-permissions.ts     # void-post-send ActionKey missing — BUG 4
├── stores/
│   ├── session.store.ts        # role, shiftOpen — read by all guards
│   ├── table.store.ts
│   ├── order.store.ts
│   ├── kds.store.ts
│   └── manager.store.ts
└── providers/
    └── ThemeProvider.tsx
```

### Structure Rationale

- **`globals.css` as single token source:** Tailwind CSS 4 has no `tailwind.config.js`. All design tokens live in `@theme {}` (brand values) and `:root {}` (semantic aliases) in `globals.css`. Brand refresh = edit one file; Tailwind regenerates all utilities automatically.
- **Route groups for layout isolation:** `(app)` uses AppShell, `(kds)` uses full-screen canvas, `(auth)` uses bare canvas. Each route group has its own `layout.tsx` with its own guards. This is correct and should not change.
- **`src/components/ui/` as override surface:** shadcn components are owned code (not a node_modules package). Variant changes go into the CVA `cva()` call in each file. No wrapper components, no new files — edit in place.
- **`role-permissions.ts` as single permissions source:** Both nav access (sidebar) and action access (UI buttons) route through one file. New action keys are added here, TypeScript enforces exhaustiveness, then consumed in components via `canDoAction()`.

---

## Architectural Patterns

### Pattern 1: Tailwind CSS 4 Token Layering

**What:** Three-layer token system — brand values in `@theme`, semantic aliases mapped via `@theme inline`, light/dark values in `:root` and `.dark`.

**When to use:** All color and spacing changes. Never hardcode OKLCH values in component classNames.

**Trade-offs:** Single edit point for entire-UI color changes. Dark mode handled at the token layer — components need zero conditional logic.

**Example:**
```css
/* Layer 1: Named brand values in @theme */
@theme {
  --color-brand-red: oklch(0.52 0.22 27);
  --color-brand-red-hover: oklch(0.46 0.22 27);
}

/* Layer 2: Semantic tokens in :root (shadcn convention) */
:root {
  --primary: oklch(0.52 0.22 27);
}

/* Layer 3: @theme inline maps CSS var to Tailwind utility class */
@theme inline {
  --color-primary: var(--primary);
}

/* Layer 4: Dark mode overrides — same keys, different values */
.dark {
  --primary: oklch(0.63 0.22 27);
}
```

**For brand polish:** Increase chroma on `--primary` (e.g., from `0.22` to `0.26`), raise `--destructive` contrast, add `--color-brand-*` entries in `@theme` for new accent roles if needed. No component files need changing for pure color strength changes.

### Pattern 2: CVA Variant Extension for shadcn Components

**What:** shadcn components in `src/components/ui/` use `class-variance-authority` for variant maps. The component file is owned code. Extending means adding or modifying variant keys inside the `cva()` call. The `@base-ui/react` primitive underneath does not change.

**When to use:** Any time a UI primitive needs a new visual variant or an existing variant needs stronger styling for brand polish.

**Trade-offs:** Direct mutation is fast and type-safe. The risk of shadcn CLI overwriting is irrelevant here — the wireframe stack is frozen, no CLI upgrades.

**Example (strengthening the default button variant in `button.tsx`):**
```typescript
// In src/components/ui/button.tsx inside buttonVariants cva():
variant: {
  default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all",
  // Existing classes extended — no new file, no wrapper
}
```

**Never do:** Create `PrimaryButton.tsx` that wraps `<Button>` with hardcoded className. This splits the variant surface across files and breaks the CVA type system.

### Pattern 3: Page-Level Role Guard

**What:** A `useEffect` + early return pattern at the top of a page component that redirects unauthorized roles before rendering any content. Complements the layout-level guard which handles authentication and shift state.

**When to use:** For pages that are accessible to some but not all roles within the `(app)` route group. The layout guard covers "authenticated + shift open" for the whole group; page guards cover "only role X can be here."

**Trade-offs:** Tiny overhead per render. Necessary because sidebar hiding is UX-only — direct URL navigation bypasses it.

**Example (canonical pattern used in `kds/page.tsx`, extrapolated for `manager/page.tsx`):**
```typescript
const ALLOWED_ROLES: Role[] = ['Manager']

useEffect(() => {
  if (role === null) router.replace('/login')
  else if (!ALLOWED_ROLES.includes(role)) router.replace('/table-map')
}, [role, router])

if (role === null || !ALLOWED_ROLES.includes(role)) return null
```

---

## Bug Fix Map

This is the primary integration reference for downstream roadmap phases. Each bug is mapped to its exact file, the line(s) involved, root cause, and fix approach.

### Bug 1 — AppSidebar `/orders` Dead Link

**File:** `src/components/app-shell/AppSidebar.tsx`

**Location:** Line 29, `NAV_ITEMS` array.

**Root cause:** `href: '/orders'` points to a route that does not exist. There is no `src/app/(app)/orders/` directory. The actual order entry point is `/order/[tableId]`, which requires a table ID. The sidebar cannot link directly to it without a table context.

**Fix:** Create `src/app/(app)/orders/page.tsx` as a client redirect to `/table-map`. The file is three lines — import `useRouter`, call `router.replace('/table-map')` in a `useEffect`. The sidebar href `/orders` now resolves to a real route, and the user lands at the table map to pick a table.

**Files touched:** `src/app/(app)/orders/page.tsx` (new file).

### Bug 2 — KDS Page Guard Blocks Manager

**File:** `src/app/(kds)/kds/page.tsx`

**Location:** Lines 17–24 (`useEffect` guard) and line 48 (early return).

**Root cause:** The guard condition is `role !== 'Kitchen'`. This redirects all non-Kitchen roles, including Manager, to `/table-map`. However `ROLE_NAV_ACCESS` in `role-permissions.ts` (line 8) correctly grants Manager access to `'kds'`. The nav access table is correct; the page guard is over-restrictive.

**Fix:** Change the redirect condition from `role !== 'Kitchen'` to `!['Kitchen', 'Manager'].includes(role)`. Update the early return on line 48 from `if (role === null)` to `if (!role || !['Kitchen', 'Manager'].includes(role))`.

**Files touched:** `src/app/(kds)/kds/page.tsx` only (two line changes).

### Bug 3 — Toaster Not in AppShell

**File:** `src/components/app-shell/AppShell.tsx`

**Location:** No `<Toaster>` present. Currently `<Toaster>` is mounted only inside `src/app/(app)/order/[tableId]/page.tsx` (line 54).

**Root cause:** `<Toaster>` from `sonner` was added only to the order page. Pages like `table-map`, `payment`, and `manager` share `AppShell` but have no Toaster instance. Any `toast()` call on those pages fires into void.

**Fix:** Add `import { Toaster } from 'sonner'` and render `<Toaster position="top-center" />` inside the root div of `AppShell.tsx`. Remove `<Toaster>` and its import from `order/[tableId]/page.tsx`. The `(kds)` route group uses a separate layout with no AppShell — if KDS needs toasts, add `<Toaster>` to `src/app/(kds)/layout.tsx` separately.

**Files touched:** `src/components/app-shell/AppShell.tsx` (add Toaster), `src/app/(app)/order/[tableId]/page.tsx` (remove Toaster + import).

### Bug 4 — Missing `void-post-send` in ACTION_PERMISSIONS

**File:** `src/lib/role-permissions.ts`

**Location:** `ActionKey` type union (lines 20–30) and `ACTION_PERMISSIONS` record (lines 32–43).

**Root cause:** The `ActionKey` union does not include `'void-post-send'`. There are 10 current action keys; `void-post-send` (voiding an already-sent item, which requires manager authorization) is absent. Any component needing to gate the void-post-send button has no typed action key to pass to `canDoAction()`.

**Fix:** Add `'void-post-send'` to the `ActionKey` union and add a corresponding entry to `ACTION_PERMISSIONS`. Appropriate roles: `['Manager']` only — voiding a sent item requires manager override in the A Ramen workflow.

**Files touched:** `src/lib/role-permissions.ts` only (two line additions).

### Bug 5 — Manager Page Has No Role Guard

**File:** `src/app/(app)/manager/page.tsx`

**Location:** Top of `ManagerPage()` function — guard is absent.

**Root cause:** `AppLayout` (`(app)/layout.tsx`) only checks "authenticated + shift open." It does not block non-Manager roles from the `/manager` route. `AppSidebar` hides the Manager nav item for non-Manager roles (line 63), but direct URL navigation bypasses sidebar visibility entirely.

**Fix:** Add the page-level guard pattern at the top of `ManagerPage`. Allowed roles: `['Manager']`. Redirect to `/table-map` for all other roles. Two additions: the `useEffect` guard and the early return.

**Files touched:** `src/app/(app)/manager/page.tsx` only.

---

## Data Flow

### Token to Component Flow

```
globals.css @theme
    --color-brand-red: oklch(...)
        |
        v
globals.css :root
    --primary: oklch(...)
        |
        v
globals.css @theme inline
    --color-primary: var(--primary)
        |
        v
Tailwind CSS 4 generates bg-primary, text-primary, border-primary ...
        |
        v
CVA variant strings in button.tsx, badge.tsx, custom components
        |
        v
className props consumed in JSX
```

### Role Permission Flow

```
session.store  →  role: Role | null
                      |
          ┌───────────┼──────────────────────────────────┐
          v           v                                    v
  AppLayout       AppSidebar                    Page-level guards
  (app)/layout    canAccess(role, slug)          KdsPage: ['Kitchen','Manager']
  auth + shift    shows/hides nav items          ManagerPage: ['Manager']
  guard for       (UX only — not security)       (enforces route security)
  whole group
                      |
                      v
              Feature components
              canDoAction(role, actionKey)
              enables/disables action buttons
```

### Toast Coverage (after Bug 3 fix)

```
AppShell.tsx
    <Toaster position="top-center" />
        |
        covers all (app) routes:
        /table-map, /order/[tableId],
        /payment/[tableId], /manager, /shift-open

(kds)/layout.tsx (if needed)
    <Toaster position="top-center" />
        |
        covers (kds) routes: /kds
```

---

## Scaling Considerations

This is a browser wireframe. Scaling here means "stays maintainable as polish scope grows."

| Scale | Architecture Approach |
|-------|-----------------------|
| 5 bug fixes | Direct edits to exact files. Zero abstraction overhead needed. |
| 10–15 polished components | CVA variant edits in existing `src/components/ui/` files; token edits in `globals.css`. |
| 30+ component variants | Consider a `src/tokens/` module exporting named OKLCH constants, imported by `globals.css` via `@import` and also available for TypeScript references. |

### Scaling Priorities

1. **Token drift:** If the same OKLCH value appears in both `globals.css` and component className strings, they diverge independently. Enforce: all raw OKLCH values live only in `globals.css`; components use only Tailwind utility names.
2. **Guard duplication:** As more pages add role guards, extract a `useRoleGuard(allowedRoles: Role[], redirectTo: string)` hook to eliminate the repeated `useEffect` + early return pattern. Not needed for v1.1 (only two guard additions), but worth flagging for v1.2+.

---

## Anti-Patterns

### Anti-Pattern 1: Hardcoding OKLCH in Component Classes

**What people do:** Write `className="bg-[oklch(0.52_0.22_27)]"` in JSX to match a brand color.

**Why it's wrong:** The value is disconnected from the token system. Dark mode breaks, brand updates require grep across all components, CSS variable chain is bypassed.

**Do this instead:** Set the OKLCH value in `globals.css :root`, add it to `@theme inline` as a Tailwind utility, consume as `bg-primary` in className. All components update when the token changes.

### Anti-Pattern 2: New shadcn File per Visual Variant

**What people do:** Create `src/components/ui/button-destructive.tsx` wrapping `<Button>` with hardcoded className.

**Why it's wrong:** Fragments the variant surface. TypeScript VariantProps diverge. The entire shadcn and CVA design is one `cva()` call per primitive — one file, all variants.

**Do this instead:** Add the new variant key inside the existing `buttonVariants` cva call in `button.tsx`.

### Anti-Pattern 3: Relying Only on Sidebar Visibility for Route Security

**What people do:** Hide a nav link in the sidebar for unauthorized roles and assume that is sufficient access control.

**Why it's wrong:** Direct URL navigation, browser history, and back-button presses all bypass sidebar rendering. A Waiter can type `/manager` and reach the page.

**Do this instead:** Sidebar hiding (UX) AND page-level `useEffect` guard (navigation control). Both are needed. This is the root cause of Bug 5.

### Anti-Pattern 4: Mounting Toaster in Individual Pages

**What people do:** Add `<Toaster>` inside each page component that needs toast feedback.

**Why it's wrong:** Multiple Sonner instances produce duplicate toasts when pages re-render. Toast appears on some pages and silently fails on others. The current codebase exhibits this — only order page has a Toaster.

**Do this instead:** One `<Toaster>` at the layout level. One in `AppShell.tsx` for all `(app)` routes. One in `(kds)/layout.tsx` for the KDS route.

### Anti-Pattern 5: Adding Role Arrays Inline in Components

**What people do:** Write `role === 'Manager' || role === 'Kitchen'` directly in JSX.

**Why it's wrong:** Role logic is scattered across components. When roles change (e.g., a "Supervisor" role is added), every component must be found and updated.

**Do this instead:** Add the action to `ACTION_PERMISSIONS` in `role-permissions.ts` with the correct role array, then call `canDoAction(role, 'action-key')` in the component. The permissions table is the single source of truth.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `globals.css` ↔ components | CSS custom properties → Tailwind utilities → className strings | Token changes propagate automatically; no component edits for color-only brand changes |
| `role-permissions.ts` ↔ guards and components | Direct TypeScript imports of `canAccess`, `canDoAction`, `ROLE_NAV_ACCESS` | Add ActionKey here first, then consume — never inline role arrays in components |
| `session.store` ↔ layout and page guards | `useSessionStore()` hook called in layout.tsx and page guards | Handle `role === null` (unauthenticated) separately from wrong-role case |
| `AppShell` ↔ Toaster | `<Toaster>` mounted once inside AppShell JSX | All `(app)` pages share this single instance via Sonner's global state |
| `(app)/layout.tsx` ↔ `(kds)/layout.tsx` | No shared layout state; both read `session.store` independently | KDS layout is a server component — role guard lives in `kds/page.tsx` (client component) |
| `button.tsx` ↔ `@base-ui/react` | `ButtonPrimitive` from `@base-ui/react/button` is the underlying element | Do not import from `@radix-ui` — this project uses Base UI, not Radix |

### Build Order for v1.1 Phases

Bug fixes must precede brand polish because:

1. Toaster fix (Bug 3) ensures toast feedback is visible on all pages during polish testing.
2. Role guard fixes (Bugs 2, 5) allow managers to navigate to KDS and manager screens when reviewing polished UI.
3. ACTION_PERMISSIONS fix (Bug 4) is a prerequisite for any component checking `void-post-send`.
4. All bugs are small, isolated, zero-visual-risk changes — do them in one atomic phase before touching any CSS.

Recommended phase order:
1. **Bug Phase** — All 5 bugs in one phase. Five files, minimal diffs, zero visual change.
2. **Token Phase** — Strengthen brand tokens in `globals.css`. Entire UI updates immediately.
3. **Component Polish Phases** — Buttons, badges, cards, typography. CVA-safe edits to `src/components/ui/` files.

---

## Sources

- `src/app/(kds)/kds/page.tsx` — direct inspection of role guard (Bug 2)
- `src/components/app-shell/AppSidebar.tsx` — NAV_ITEMS href inspection (Bug 1)
- `src/components/app-shell/AppShell.tsx` — confirmed Toaster absent (Bug 3)
- `src/lib/role-permissions.ts` — ACTION_PERMISSIONS key inventory (Bug 4)
- `src/app/(app)/manager/page.tsx` — confirmed no role guard present (Bug 5)
- `src/app/(app)/order/[tableId]/page.tsx` — Toaster currently mounted here (Bug 3 context)
- `src/app/globals.css` — Tailwind CSS 4 @theme / :root / .dark token structure confirmed
- `src/components/ui/button.tsx` — CVA + @base-ui/react pattern confirmed
- `src/components/ui/badge.tsx` — CVA + @base-ui/react useRender pattern confirmed
- `package.json` — Next.js 16.1.6, @base-ui/react 1.2.0, sonner 2.0.7, Tailwind CSS 4, Zustand 5.0.11
- Confidence: HIGH for all findings — every claim is traceable to a specific file and line number

---
*Architecture research for: Next.js POS Wireframe v1.1 Bug Fixes + Brand Polish*
*Researched: 2026-03-11*
