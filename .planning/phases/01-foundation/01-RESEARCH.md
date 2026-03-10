# Phase 1: Foundation - Research

**Researched:** 2026-03-10
**Domain:** Next.js 15 App Router scaffold, Zustand 5 auth state, shadcn/ui component setup, Tailwind CSS v4 CSS-first config
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**PIN Login flow**
- Role selection comes first (Waiter / Cashier / Manager / Kitchen), then PIN entry
- Large centered numpad grid (3x4), no confirm button needed
- 4-digit PIN, auto-submits on 4th digit entry
- Wrong PIN feedback: screen shake animation + red flash on input, then auto-clear for re-entry

**AppShell layout**
- Top header + left collapsible sidebar
- Header displays: Branch Name - Role Badge - Staff Name
- Sidebar nav items: Table Map, Orders, KDS, Payment, Manager — all visible, role-filtered (greyed out if role can't access)
- Sidebar is collapsible: full (icon + label) <-> compact (icon only)

**Shift Open screen**
- Branch selection via dropdown select
- Opening cash: single number input field prefixed with Thai Baht symbol
- Shift Open is a soft gate — AppShell sidebar renders but all sections show a locked state until shift is opened
- After confirming shift: navigate directly to Table Map (no intermediate confirmation screen)

**Role-based UI treatment**
- Restricted actions render as greyed out / disabled buttons — visible but not tappable
- Manager PIN override: full overlay modal (dark backdrop, centered card) with the action context shown (e.g., "Authorize: Void Item") above the PIN numpad
- Modal uses the same numpad style as the login screen (consistent pattern)
- Kitchen role: AppShell renders normally, but only KDS nav item is enabled — all others greyed out

### Claude's Discretion
- Exact sidebar width and collapse animation style
- Loading skeleton states during auth
- Specific shadcn/ui component choices (Select, Dialog, Input, etc.)
- Tailwind class spacing and typography scale

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Staff can log in via PIN with role routing to the appropriate view (Waiter / Cashier / Manager / Kitchen) | PIN numpad component pattern, Zustand auth store, Next.js route groups for role-scoped layouts |
| AUTH-02 | One role-aware interface — permission-driven enabled/disabled/authorize states per action (not separate apps per role) | Zustand role state accessed by all components; disabled prop pattern in shadcn/ui |
| AUTH-03 | Manager can authorize restricted actions (void, discount) via an in-app PIN override modal | shadcn/ui Dialog with programmatic open state, same PinNumpad component reused |
| AUTH-04 | Staff can open a shift with branch selection and opening cash input before accessing the main POS | shadcn/ui Select for branch, Input for cash, Zustand shiftOpen flag as soft gate |
| AUTH-05 | Multi-branch context is visible in the persistent navigation header throughout the session | Zustand session state read in AppShell header; branch + role badge rendered server-side via layout |
</phase_requirements>

---

## Summary

Phase 1 establishes every structural piece that subsequent phases render inside: the Next.js app scaffold, the Zustand session store, the AppShell (header + collapsible sidebar), the PIN login screen with role routing, the Shift Open gate screen, and the Manager PIN override modal. Nothing in later phases can be built without these contracts being stable.

The project starts from an almost-blank state — only the `shadcn` CLI is installed as a dev dependency. This means Phase 1 must run `create-next-app`, configure Tailwind v4's CSS-first format, install Zustand, add all shadcn/ui components, and write mock fixtures before any UI work begins. Because this is a wireframe (no real backend), all auth logic is pure client-side state — Zustand with in-memory mock PIN data, no server sessions.

The most consequential design decision for downstream phases is the shape of the Zustand auth store. Later phases (2–7) all read `role`, `branch`, `staffName`, and `shiftOpen` from this store. Get the TypeScript interface right in Phase 1 and subsequent phases are easy. Retrofit it later and every phase breaks.

**Primary recommendation:** Scaffold with `create-next-app --yes`, configure Tailwind v4 CSS-first in `globals.css`, add Zustand with a typed `useSessionStore`, define the route group structure `(auth)/` and `(app)/` in one wave, then build UI components in dependency order: PinNumpad -> LoginScreen -> ShiftOpenScreen -> AppShell.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 (latest) | App Router, file-system routing, layouts | Project decision; App Router route groups enable auth/app layout split cleanly |
| TypeScript | 5 (strict) | Type safety | Project decision; `strict: true` in tsconfig catches role/permission bugs early |
| Tailwind CSS | 4 (latest) | Utility styling | Project decision; v4 CSS-first config eliminates tailwind.config.js entirely |
| shadcn/ui | 4.x (CLI) | Component primitives | Project decision; components are copied into repo, fully ownable |
| Zustand | 5 (latest) | Client state (auth, session, shift) | Project decision; minimal boilerplate, works cleanly with `'use client'` components |
| Lucide React | latest | Icons (nav, badges, lock states) | Project decision; tree-shakable, consistent style |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix UI (via shadcn) | bundled | Accessible primitives (Dialog, Select) | Automatically included when adding shadcn components |
| React 19 | bundled with Next.js 15 | UI rendering | Included by create-next-app |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand (client-only) | Context + useReducer | Zustand requires zero provider boilerplate; simpler for this wireframe with no server auth |
| shadcn/ui Dialog | Custom modal div | shadcn Dialog includes focus trap, a11y, Escape key — don't hand-roll |
| Tailwind v4 @theme | tailwind.config.js v3 style | v4 CSS-first is the current standard; v3 format still works via `@config` directive but is deprecated path |

**Installation (from blank scaffold):**

```bash
# Step 1: scaffold Next.js 15 with recommended defaults
npx create-next-app@latest . --yes
# Installs: TypeScript, Tailwind CSS v4, ESLint, App Router, Turbopack

# Step 2: install Zustand
npm install zustand

# Step 3: initialize shadcn/ui (use existing Next.js project)
npx shadcn@latest init

# Step 4: add shadcn components needed in Phase 1
npx shadcn@latest add button input select dialog badge skeleton

# Step 5: install Lucide React (may already be included by shadcn)
npm install lucide-react
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/               # Unauthenticated route group — no AppShell
│   │   ├── layout.tsx        # Minimal layout (centered card, no sidebar)
│   │   └── login/
│   │       └── page.tsx      # PIN login screen
│   ├── (app)/                # Authenticated + shift-open route group
│   │   ├── layout.tsx        # AppShell layout (header + sidebar)
│   │   ├── shift-open/
│   │   │   └── page.tsx      # Shift Open gate screen
│   │   └── table-map/
│   │       └── page.tsx      # Placeholder for Phase 2
│   ├── globals.css           # Tailwind v4 @import + @theme block
│   ├── layout.tsx            # Root layout (html/body, Zustand hydration wrapper)
│   └── page.tsx              # Root redirect -> /login
├── components/
│   ├── ui/                   # shadcn/ui generated components (do not edit manually)
│   ├── app-shell/
│   │   ├── AppShell.tsx      # Composes Header + Sidebar + children
│   │   ├── AppHeader.tsx     # Branch name, role badge, staff name
│   │   └── AppSidebar.tsx    # Collapsible nav, role-filtered items
│   ├── auth/
│   │   ├── PinNumpad.tsx     # Reusable 3x4 numpad (used in login + manager override)
│   │   ├── RoleSelector.tsx  # Role selection step
│   │   └── ManagerPinModal.tsx # Dialog wrapper around PinNumpad
│   └── shift/
│       └── ShiftOpenForm.tsx  # Branch select + opening cash input
├── lib/
│   ├── mock-data/
│   │   ├── staff.ts          # Mock staff records with PINs and roles
│   │   └── branches.ts       # Mock branch list
│   └── role-permissions.ts   # Role -> allowed nav items map
└── stores/
    └── session.store.ts      # Zustand useSessionStore
```

### Pattern 1: Route Groups for Auth vs App Layout

**What:** Two route groups `(auth)` and `(app)` each with their own `layout.tsx`. The auth group has no sidebar. The app group wraps all protected screens in AppShell.

**When to use:** Any screen that needs AppShell goes under `(app)/`. Login goes under `(auth)/`.

**Note on redirects:** For this wireframe (no real server auth), navigation guards are implemented client-side in layout components using Zustand state — not Next.js middleware. Middleware runs on the Edge and cannot read Zustand (client state). Use a client component wrapper that checks `useSessionStore` and redirects with `useRouter` if unauthenticated.

```typescript
// src/app/(app)/layout.tsx
// Source: Next.js App Router docs — route groups
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { AppShell } from '@/components/app-shell/AppShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { role, shiftOpen } = useSessionStore()

  useEffect(() => {
    if (!role) {
      router.replace('/login')
    } else if (!shiftOpen) {
      router.replace('/shift-open')
    }
  }, [role, shiftOpen, router])

  if (!role) return null

  return <AppShell>{children}</AppShell>
}
```

### Pattern 2: Zustand Session Store (TypeScript strict)

**What:** A single Zustand store holds the entire session state. All components read role, branch, staffName, and shiftOpen from here. This is the contract all later phases depend on.

**When to use:** Any component that needs to know who is logged in, what branch, or whether the shift is open.

```typescript
// src/stores/session.store.ts
// Source: Zustand docs + TypeScript integration guide
import { create } from 'zustand'

export type Role = 'Waiter' | 'Cashier' | 'Manager' | 'Kitchen'

interface SessionState {
  // Auth
  role: Role | null
  staffName: string | null
  // Branch + shift
  branch: string | null
  openingCash: number | null
  shiftOpen: boolean
  // Actions
  login: (role: Role, staffName: string) => void
  openShift: (branch: string, openingCash: number) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  role: null,
  staffName: null,
  branch: null,
  openingCash: null,
  shiftOpen: false,

  login: (role, staffName) => set({ role, staffName }),

  openShift: (branch, openingCash) =>
    set({ branch, openingCash, shiftOpen: true }),

  logout: () =>
    set({
      role: null,
      staffName: null,
      branch: null,
      openingCash: null,
      shiftOpen: false,
    }),
}))
```

**Critical note:** No `persist` middleware. This is intentional for a wireframe — each page load starts fresh at the login screen. Adding `persist` would require solving the Next.js SSR hydration mismatch problem (see Pitfalls). Keep it simple.

### Pattern 3: PinNumpad Reuse

**What:** One `PinNumpad` component handles both the login PIN screen and the Manager PIN override modal. It takes a callback `onComplete: (pin: string) => void` and manages its own digit state internally. The parent handles verification logic.

**When to use:** Everywhere a PIN is entered. This keeps the numpad behavior (shake animation, auto-clear) centralized.

```typescript
// src/components/auth/PinNumpad.tsx
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PinNumpadProps {
  onComplete: (pin: string) => void
  error?: boolean       // triggers shake + red flash
  onErrorClear?: () => void
}

// 3x4 grid layout: 1-9 then * 0 #
const KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'] as const
```

### Pattern 4: Tailwind v4 Custom Animation (Shake)

**What:** Define `animate-shake` directly in `globals.css` using the `@theme` block. No `tailwind.config.js` required.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Custom shake animation for wrong PIN feedback */
  --animate-shake: shake 0.5s ease-out;

  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }
}
```

Apply in JSX: `className={cn('...', error && 'animate-shake border-red-500')}`.

### Pattern 5: Role-Based Nav Gating

**What:** A static map from Role to allowed nav slugs. Used by AppSidebar to determine which items render enabled vs disabled.

```typescript
// src/lib/role-permissions.ts
export type NavSlug = 'table-map' | 'orders' | 'kds' | 'payment' | 'manager'

export const ROLE_NAV_ACCESS: Record<Role, NavSlug[]> = {
  Waiter:   ['table-map', 'orders'],
  Cashier:  ['table-map', 'orders', 'payment'],
  Manager:  ['table-map', 'orders', 'kds', 'payment', 'manager'],
  Kitchen:  ['kds'],
}
```

### Anti-Patterns to Avoid

- **Separate app per role:** AUTH-02 explicitly requires one interface. Never conditionally render different layouts per role — use disabled states instead.
- **Zustand persist in Phase 1:** Adds SSR hydration complexity with no benefit for a wireframe. Omit persist middleware entirely.
- **Middleware for auth redirects:** Next.js middleware runs on Edge and cannot read client-side Zustand state. Use a client component guard in layout.tsx instead.
- **Manager PIN in a separate route:** The override modal must not leave the current screen (AUTH-03). Use Dialog with `open` state controlled by parent, not navigation.
- **Separate numpad implementations:** Build one `PinNumpad` component, reuse it in both login and manager override modal. Duplicate implementations diverge immediately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible modal overlay | Custom div with z-index | `shadcn/ui Dialog` | Focus trap, Escape key, aria-modal, backdrop — all included |
| Dropdown branch select | Custom `<select>` with styling | `shadcn/ui Select` | Consistent styling, keyboard navigation, controlled value |
| Sidebar collapse animation | Custom CSS transitions from scratch | Tailwind transition utilities + state toggle | `transition-all`, `w-64`/`w-16` toggle is sufficient; no animation library needed |
| Icon set | Custom SVGs | `lucide-react` | Already in stack; consistent weight/size; tree-shakable |
| Form validation | Custom validation logic | TypeScript + simple guard checks | PIN is 4 digits, cash is a number — no schema library needed for this phase |

**Key insight:** The shadcn/ui Dialog component alone saves 50+ lines of accessibility boilerplate per modal. The manager PIN override pattern (AUTH-03) requires it.

---

## Common Pitfalls

### Pitfall 1: Zustand + SSR Hydration Mismatch

**What goes wrong:** If `persist` middleware is used (localStorage), Next.js renders the component on the server with initial state (logged out), then the client hydrates with persisted state (logged in). React throws a hydration mismatch error.

**Why it happens:** Server and client render different HTML. Zustand's persist middleware rehydrates from localStorage only on the client.

**How to avoid:** Do not use `persist` middleware in Phase 1. For this wireframe, each session starts fresh on page load. If persist is needed later, wrap consumers in a `useEffect` that defers reading persisted state until after hydration.

**Warning signs:** "Hydration failed because the initial UI does not match" console error.

### Pitfall 2: Tailwind v4 Config Format

**What goes wrong:** Creating a `tailwind.config.js` file and defining `theme.extend.keyframes` there — this is the v3 pattern and does not work with Tailwind v4 by default.

**Why it happens:** Muscle memory from v3. `create-next-app --yes` installs v4 but documentation for custom animations is scattered.

**How to avoid:** All customization goes in `globals.css` inside an `@theme` block. Custom animations: `--animate-name: keyframes-name duration easing` plus the `@keyframes` block inside `@theme`. The `tailwind.config.js` file should not exist in a v4 project.

**Warning signs:** Custom `animate-*` classes not being generated; seeing `tailwind.config.js` in project root.

### Pitfall 3: Loose Zustand Store TypeScript Typing

**What goes wrong:** Using `create` without a generic type parameter, letting TypeScript infer `any`. Later phases add state reads that TypeScript cannot check.

**Why it happens:** Zustand infers types automatically in simple cases, but `strict: true` + complex union types (e.g., `Role | null`) require explicit generics.

**How to avoid:** Always use `create<InterfaceName>(...)` with an explicit interface. Define `Role` as a union type in the store file, export it, and import from there across all consumers.

**Warning signs:** TypeScript not catching invalid role values; `role` typed as `string` not `'Waiter' | 'Cashier' | ...`.

### Pitfall 4: Kitchen Role Rendering the AppShell Incorrectly

**What goes wrong:** Kitchen staff logs in and sees the full sidebar with all items. The spec requires only KDS to be enabled for Kitchen.

**Why it happens:** Missing the Kitchen role case in the `ROLE_NAV_ACCESS` map, or using an overly broad "is authenticated" check for sidebar rendering.

**How to avoid:** The `ROLE_NAV_ACCESS` map explicitly defines `Kitchen: ['kds']`. AppSidebar iterates ALL nav items, renders all, but applies `disabled` / greyed-out styling to any item whose slug is not in `ROLE_NAV_ACCESS[role]`. The sidebar structure is identical for all roles — only enabled state differs.

**Warning signs:** Kitchen user can click non-KDS nav items; or Kitchen user sees a completely different sidebar structure.

### Pitfall 5: Auto-Submit on 4th Digit Timing

**What goes wrong:** PIN input auto-submits but the state update and verification run in the same render cycle, causing the shake animation not to trigger visibly.

**Why it happens:** React batches state updates; if `setDigits` and `onComplete` fire in the same handler, the "4 digits entered" visual state may never render.

**How to avoid:** Use `useEffect` to watch `digits.length === 4` and call `onComplete` there, not directly in the click handler. This ensures the 4-digit display renders for at least one frame before submitting.

```typescript
useEffect(() => {
  if (digits.length === 4) {
    onComplete(digits.join(''))
  }
}, [digits])
```

---

## Code Examples

Verified patterns from official sources:

### shadcn/ui Dialog (Manager PIN Override)

```typescript
// Source: https://ui.shadcn.com/docs/components/radix/dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ManagerPinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionLabel: string            // e.g. "Authorize: Void Item"
  onAuthorize: (pin: string) => void
}

export function ManagerPinModal({
  open,
  onOpenChange,
  actionLabel,
  onAuthorize,
}: ManagerPinModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{actionLabel}</DialogTitle>
        </DialogHeader>
        <PinNumpad onComplete={onAuthorize} />
      </DialogContent>
    </Dialog>
  )
}
```

### shadcn/ui Select (Branch Selection)

```typescript
// Source: https://ui.shadcn.com/docs/components/radix/select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// In ShiftOpenForm:
<Select value={branch} onValueChange={setBranch}>
  <SelectTrigger>
    <SelectValue placeholder="Select branch" />
  </SelectTrigger>
  <SelectContent>
    {BRANCHES.map((b) => (
      <SelectItem key={b.id} value={b.id}>
        {b.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Next.js Route Group Structure

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
// app/(auth)/layout.tsx — no AppShell
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  )
}

// app/(app)/layout.tsx — has AppShell, client-side auth guard
// See Pattern 1 above for full implementation
```

### Tailwind v4 CSS-First Configuration

```css
/* Source: https://tailwindcss.com/blog/tailwindcss-v4 */
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Brand colors */
  --color-brand-primary: oklch(0.55 0.18 262);

  /* Shake animation for wrong PIN */
  --animate-shake: shake 0.5s ease-out;

  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }
}
```

### Mock Staff Data (Fixture Shape)

```typescript
// src/lib/mock-data/staff.ts
import type { Role } from '@/stores/session.store'

interface StaffMember {
  id: string
  name: string
  role: Role
  pin: string  // 4-digit string
}

export const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Somchai',  role: 'Waiter',   pin: '1234' },
  { id: 's2', name: 'Nida',     role: 'Cashier',  pin: '2345' },
  { id: 's3', name: 'Prayuth',  role: 'Manager',  pin: '9999' },
  { id: 's4', name: 'Malee',    role: 'Kitchen',  pin: '5678' },
]

export function verifyPin(role: Role, pin: string): StaffMember | null {
  return MOCK_STAFF.find((s) => s.role === role && s.pin === pin) ?? null
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `theme.extend` | `@theme` block in `globals.css` | Tailwind v4 (early 2025) | No config file; all tokens in CSS |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | Tailwind v4 | Single import replaces three directives |
| `next/headers` + cookies for auth state | Client-side Zustand (for wireframes) | N/A — context dependent | For no-backend wireframes, skip server auth entirely |
| Separate layout per role | One layout + permission map + disabled states | AUTH-02 requirement | All roles share one AppShell structure |

**Deprecated/outdated:**
- `tailwind.config.js` for new v4 projects: replaced by `@theme` in CSS. Still works via `@config` directive but is the migration path, not the greenfield path.
- `@tailwind base` / `@tailwind components` / `@tailwind utilities`: replaced by `@import "tailwindcss"` in v4.

---

## Open Questions

1. **Sidebar collapse: which direction is "compact"?**
   - What we know: "icon only" compact mode is specified
   - What's unclear: Whether the sidebar slides to zero (hidden) or collapses to icon-only width (64px). The spec says "icon only", not "hidden".
   - Recommendation: Default to icon-only (not hidden). Implement as `w-64`/`w-16` toggle with `transition-all duration-200`. Planner should treat exact width as Claude's discretion.

2. **Shift Open screen URL**
   - What we know: After login, navigate to shift-open gate; after shift-open, navigate to table-map.
   - What's unclear: Whether the shift-open screen should be gated inside `(app)/` (with AppShell sidebar showing locked state) or inside `(auth)/` (no AppShell).
   - Recommendation: Inside `(app)/layout.tsx` but guarded separately from the full shift-open check. The spec says "AppShell sidebar renders but all sections show locked state" — this means AppShell is visible during shift-open, so route under `(app)/`.

3. **Opening cash field validation**
   - What we know: Single number input prefixed with Thai Baht symbol
   - What's unclear: Whether zero or empty is a valid opening cash amount (some shifts legitimately start at 0 float)
   - Recommendation: Accept 0 as valid. Only block submission if the field is entirely empty. No minimum enforcement in wireframe.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — project is a blank scaffold |
| Config file | None — see Wave 0 |
| Quick run command | `npm test` (after setup) |
| Full suite command | `npm test` (after setup) |

**Note:** This is a wireframe project with no backend logic. The appropriate test surface is limited to: (a) TypeScript compilation (`tsc --noEmit`), (b) mock data fixture shape validation, and (c) Zustand store action correctness. No DOM testing framework is required for Phase 1.

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `verifyPin(role, pin)` returns correct staff or null | Unit | `npx tsc --noEmit` (type check) | Wave 0 |
| AUTH-01 | Role routing: login calls `useSessionStore.login()` with correct role | Unit | Manual verification in browser | N/A — client state |
| AUTH-02 | `ROLE_NAV_ACCESS['Kitchen']` only contains `'kds'` | Unit | `npx tsc --noEmit` | Wave 0 |
| AUTH-03 | Manager PIN modal renders without leaving current screen | Manual | Visual check in browser | N/A — DOM behavior |
| AUTH-04 | `openShift` sets `shiftOpen: true` in store | Unit | `npx tsc --noEmit` | Wave 0 |
| AUTH-05 | Session store exports `branch` and `role` in state interface | Unit | `npx tsc --noEmit` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` — TypeScript strict mode catches type regressions
- **Per wave merge:** `npx tsc --noEmit && npm run lint`
- **Phase gate:** All TypeScript errors resolved + all 5 success criteria verified manually in browser before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tsconfig.json` with `"strict": true` — verify `create-next-app --yes` enables strict mode; if not, add manually
- [ ] `src/lib/mock-data/staff.ts` — covers AUTH-01 (verifyPin function)
- [ ] `src/lib/role-permissions.ts` — covers AUTH-02 (ROLE_NAV_ACCESS map)
- [ ] `src/stores/session.store.ts` — covers AUTH-04, AUTH-05 (store interface)

---

## Sources

### Primary (HIGH confidence)

- [Next.js official installation docs](https://nextjs.org/docs/app/getting-started/installation) — create-next-app flags, tsconfig defaults, App Router layout structure
- [Next.js route groups docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — route group convention, layout scoping, caveats
- [Tailwind CSS v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — @theme directive, CSS-first config, @keyframes inside @theme
- [shadcn/ui Dialog docs](https://ui.shadcn.com/docs/components/radix/dialog) — sub-components, programmatic open control, showCloseButton prop
- [shadcn/ui Select docs](https://ui.shadcn.com/docs/components/radix/select) — sub-components, controlled value pattern, TypeScript usage
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) — init command, component add workflow

### Secondary (MEDIUM confidence)

- [Zustand GitHub README](https://github.com/pmndrs/zustand) — TypeScript create<T> pattern, middleware overview (verified against official repo)
- [Zustand + Next.js hydration discussion](https://github.com/pmndrs/zustand/discussions/2788) — confirmed that persist + App Router requires per-request store or client-only hydration strategy
- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) — confirmed @theme replaces tailwind.config.js, @import replaces @tailwind directives

### Tertiary (LOW confidence)

- Multiple Medium/DEV articles on Next.js 15 + shadcn/ui + Tailwind v4 setup — used to cross-verify CLI flags and project structure patterns, not treated as authoritative

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are locked project decisions; versions verified against official docs
- Architecture: HIGH — Next.js route groups and layout patterns verified against official Next.js docs
- Zustand patterns: HIGH — TypeScript pattern verified against official Zustand README
- Tailwind v4 config: HIGH — @theme and @keyframes syntax verified against official Tailwind v4 announcement
- shadcn/ui components: HIGH — Dialog and Select APIs verified against official shadcn docs
- Pitfalls: MEDIUM — hydration mismatch and Tailwind config pitfalls verified; timing/animation pitfall is engineering judgment

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable ecosystem — Next.js 15, Tailwind v4, shadcn/ui are all release-stable)
