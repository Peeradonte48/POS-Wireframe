# Phase 8: Bug Fixes - Research

**Researched:** 2026-03-11
**Domain:** Next.js App Router routing, role-based access control, sonner Toaster, permission keys
**Confidence:** HIGH — all findings sourced directly from reading the actual codebase

---

## Summary

Phase 8 resolves five concrete defects discovered after v1.0 shipped. Each bug has a clear, localized root cause that requires a surgical change to one or two files. No new dependencies are needed. No architectural changes are required. All five bugs can be fixed independently.

The bugs fall into three categories: (1) a missing route causing a 404 (BUG-01), (2) an over-restrictive role guard locking out a permitted role (BUG-02 and BUG-05), (3) a missing `<Toaster>` mount in layouts that have components calling `toast()` (BUG-03), and (4) a missing ActionKey entry meaning the permission check never runs for a gated action (BUG-04).

**Primary recommendation:** Fix bugs in isolation — one plan per bug. Each change is 5-30 lines. Validate each independently before marking the phase done.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUG-01 | Staff can navigate to `/orders` without hitting a 404 | Confirmed: no `/orders` route exists. Sidebar links to `/orders` but the correct route is `/order/[tableId]`. Fix is a redirect or destination correction in the sidebar. |
| BUG-02 | Manager role can access the `/kds` route | Confirmed: `kds/page.tsx` guard rejects anyone who is not `Kitchen`. `ROLE_NAV_ACCESS` already grants Manager access to `kds` — only the page guard needs updating. |
| BUG-03 | Toast notifications appear on all pages (floor map, manager, KDS) | Confirmed: `<Toaster>` is mounted only in `order/[tableId]/page.tsx` and `payment/[tableId]/page.tsx`. The three affected layouts (`(app)/layout` via AppShell, `(kds)/layout`) have no Toaster. Components on those pages call `toast()` from sonner, so toasts fire but are never displayed. |
| BUG-04 | `void-post-send` action respects role permissions before showing UI | Confirmed: `void-post-send` is absent from `ActionKey` type and `ACTION_PERMISSIONS` map. `TicketLineItem` renders the void button for sent items using `canRemove` prop — but `TicketPanel` passes `canDoAction(role, 'void-pre-send')` for that prop, not `void-post-send`. Both the type definition and the call site in TicketPanel need updating. |
| BUG-05 | Direct URL access to `/manager` is blocked for non-Manager roles | Confirmed: `manager/page.tsx` has no role guard. The sidebar already hides the link for non-Managers, but direct URL navigation bypasses the sidebar entirely. The `(app)/layout.tsx` does not protect individual sub-routes. |
</phase_requirements>

---

## Bug-by-Bug Findings

### BUG-01 — Dead Orders Link (404)

**File:** `src/components/app-shell/AppSidebar.tsx`

**Root cause:** `NAV_ITEMS` defines `href: '/orders'` for the Orders nav item (line 29). No route exists at `/orders` in the app. The order flow is at `/order/[tableId]` — a dynamic route requiring a table ID. There is no index page at `/orders` either.

**What the sidebar currently shows:**
```
{ slug: 'orders', label: 'Orders', href: '/orders', icon: NotesLinear }
```

**Resolution options (choose one):**
1. Change `href` to `/table-map` with a note that orders are opened from the table map — this is consistent with the user flow where staff tap a table then navigate to `/order/[tableId]`
2. Create a stub `/orders` page that redirects to `/table-map` with a toast hint "Select a table to view or create an order"

Option 2 is safer for UX: if a staff member navigates directly to `/orders` via bookmark or deep link, they get a helpful redirect rather than a 404. The stub page also documents the intended navigation path.

**Files to change:**
- `src/app/(app)/orders/page.tsx` — create new stub redirect page (does not exist yet)
- OR `src/components/app-shell/AppSidebar.tsx` line 29 — change `href` value

**Watch-out:** The `orders` NavSlug in `ROLE_NAV_ACCESS` is used by `canAccess()` to gate the sidebar link. This slug must stay intact regardless of which `href` approach is chosen.

---

### BUG-02 — Manager Locked Out of KDS

**File:** `src/app/(kds)/kds/page.tsx`

**Root cause:** The `useEffect` auth guard on lines 17-24 redirects any role that is not `Kitchen`:

```typescript
// CURRENT (buggy)
} else if (role !== 'Kitchen') {
  router.replace('/table-map')
}
```

`ROLE_NAV_ACCESS` in `role-permissions.ts` already correctly grants Manager access to `kds` (line 8). The page guard overrides the permission table.

**Fix:** Change the condition to allow both `Kitchen` and `Manager`:

```typescript
// FIXED
} else if (role !== 'Kitchen' && role !== 'Manager') {
  router.replace('/table-map')
}
```

The early-return guard below the effect (line 48) also needs updating:

```typescript
// CURRENT (buggy) — prevents Manager from seeing the page content
if (role === null) return null

// FIXED — also skip render for non-Kitchen/Manager roles to avoid flash
if (role === null || (role !== 'Kitchen' && role !== 'Manager')) return null
```

**Files to change:**
- `src/app/(kds)/kds/page.tsx` — two locations within the file

**Watch-out:** The `(kds)` route group has its own `layout.tsx` (no AppShell, full-screen canvas). This is correct — Manager viewing KDS should also see the full-screen KDS layout with no sidebar. No layout change needed.

---

### BUG-03 — Toaster Not Mounted on Table Map, Manager, and KDS

**Files:** `src/components/app-shell/AppShell.tsx` and `src/app/(kds)/layout.tsx`

**Root cause:** `<Toaster>` from sonner is mounted only inside `order/[tableId]/page.tsx` and `payment/[tableId]/page.tsx` — both as local page-level mounts. The following components call `toast()` but have no `<Toaster>` anywhere in their render tree:

| Component | toast() call | Layout ancestor |
|-----------|-------------|-----------------|
| `TableBottomSheet.tsx` | `toast('Table reserved')`, `toast('Table served')` | `(app)/layout` → `AppShell` |
| `OpenTableModal.tsx` | (likely uses toast) | `(app)/layout` → `AppShell` |
| `EodSummaryTab.tsx` | `toast.success('Shift closed')` | `(app)/layout` → `AppShell` |
| `EightySixTab.tsx` | (likely uses toast) | `(app)/layout` → `AppShell` |
| KDS page components | (any future toast calls) | `(kds)/layout` |

**Correct fix:** Mount `<Toaster>` once per route group layout so all pages in that group share a single instance:

1. Add `<Toaster>` to `AppShell.tsx` — covers all `(app)` routes (table-map, manager, shift-open, payment, order pages that don't have their own)
2. Add `<Toaster>` to `(kds)/layout.tsx` — covers KDS

The existing page-level `<Toaster>` instances in `order/[tableId]/page.tsx` and `payment/[tableId]/page.tsx` should be removed to avoid duplicate Toaster mounts (sonner renders both, which can cause toast duplication).

**Dark mode requirement:** `<Toaster>` in sonner does not automatically inherit the `next-themes` theme. It requires an explicit `theme` prop. The `useTheme` hook from `next-themes` is already used in the project (`ThemeToggle.tsx` imports it). The corrected mount:

```typescript
// AppShell.tsx (client component — 'use client' already present)
import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

// Inside component:
const { resolvedTheme } = useTheme()
// In JSX:
<Toaster position="top-center" theme={resolvedTheme as 'light' | 'dark' | 'system'} />
```

For `(kds)/layout.tsx` — this is currently a Server Component (no `'use client'` directive). Adding `useTheme` requires converting it to a client component, OR extracting a small `KdsToaster` client component that wraps `<Toaster>` with theme resolution. The client component wrapper pattern avoids converting the full layout:

```typescript
// src/components/app-shell/ThemedToaster.tsx  (new file)
'use client'
import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'
export function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return <Toaster position="top-center" theme={resolvedTheme as 'light' | 'dark' | 'system'} />
}
```

Then use `<ThemedToaster />` in both `AppShell.tsx` and `(kds)/layout.tsx`.

**Files to change:**
- `src/components/app-shell/AppShell.tsx` — add `<ThemedToaster />`
- `src/app/(kds)/layout.tsx` — add `<ThemedToaster />`
- `src/components/app-shell/ThemedToaster.tsx` — create new shared component
- `src/app/(app)/order/[tableId]/page.tsx` — remove page-level `<Toaster>` (now covered by AppShell)
- `src/app/(app)/payment/[tableId]/page.tsx` — remove page-level `<Toaster>` instances (there are two — lines 120 and 136)

**Watch-out:** `payment/[tableId]/page.tsx` has a Toaster mounted twice (lines 120 and 136 per the grep result). Both should be removed after AppShell gets `<ThemedToaster>`.

---

### BUG-04 — void-post-send Missing from ACTION_PERMISSIONS

**File:** `src/lib/role-permissions.ts`

**Root cause:** `ActionKey` type (lines 21-30) does not include `'void-post-send'`. `ACTION_PERMISSIONS` map therefore has no entry for it. In `TicketPanel.tsx`, the void button for sent items uses:

```typescript
canRemove={canDoAction(role, 'void-pre-send')}
```

This means sent items use the pre-send permission check, which is too permissive (Waiter, Cashier, Manager can all void before sending — but voiding after send should be more restricted).

The intended behavior from the success criteria: "The void-after-send action is visible only to roles with permission." The business logic implies only Manager should void after send (it requires manager authorization in the current flow — `ManagerPinModal` is already wired in `TicketPanel`).

**Fix in `role-permissions.ts`:**

```typescript
export type ActionKey =
  | 'open-table'
  | 'mark-reserved'
  | 'request-check'
  | 'send-to-kitchen'
  | 'void-pre-send'
  | 'void-post-send'   // ADD THIS
  | 'confirm-payment'
  | 'eighty-six-toggle'
  | 'close-shift'
  | 'kds-bump'
  | 'mark-served'

export const ACTION_PERMISSIONS: Record<ActionKey, Role[]> = {
  // ... existing entries ...
  'void-post-send': ['Manager'],   // ADD THIS — only Manager can void after send
}
```

**Fix in `TicketPanel.tsx`:** Change the `canRemove` prop passed to `TicketLineItem` for the void-on-sent-item path. Currently `TicketPanel` passes one `canRemove` prop for all line items. The void button on sent items needs the `void-post-send` check, while the remove button on unsent items uses `void-pre-send`.

Looking at `TicketLineItem.tsx`: the `canRemove` prop is used in two places — the trash button on the unsent branch (line 140) and the void button on the sent branch (line 88). Both receive the same prop. To gate them independently, `TicketPanel` needs to pass separate permission values or `TicketLineItem` needs to accept both. The simplest fix: `TicketPanel` already has `role` in scope — pass `canVoidSent={canDoAction(role, 'void-post-send')}` as a distinct prop to `TicketLineItem`, and use it for the sent-item void button.

**Files to change:**
- `src/lib/role-permissions.ts` — add `'void-post-send'` to type and map
- `src/components/order/TicketPanel.tsx` — change prop passed for sent-item void gate
- `src/components/order/TicketLineItem.tsx` — add `canVoidSent` prop, use it for the sent-branch trash button

---

### BUG-05 — No Page-Level Guard on /manager

**File:** `src/app/(app)/manager/page.tsx`

**Root cause:** `ManagerPage` renders without any role check. The sidebar hides the Manager link for non-Manager roles (line 63 of `AppSidebar.tsx`: `if (slug === 'manager' && role !== 'Manager') return null`), but this only prevents the link from appearing — it does not block direct URL navigation.

The `(app)/layout.tsx` only checks: is a role set? Is shift open? It does not enforce per-route role restrictions.

**Fix:** Add a `useEffect` guard to `manager/page.tsx` matching the pattern used in `kds/page.tsx`:

```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'

// Inside ManagerPage:
const router = useRouter()
const { role } = useSessionStore()

useEffect(() => {
  if (role !== null && role !== 'Manager') {
    router.replace('/table-map')
  }
}, [role, router])

// Prevent content flash for non-Manager
if (role !== 'Manager') return null
```

**Watch-out:** The guard must only redirect when `role !== null` — if role is null the `(app)/layout.tsx` already redirects to `/login`. Do not double-redirect.

**Files to change:**
- `src/app/(app)/manager/page.tsx` — add role guard useEffect and conditional early return

---

## Standard Stack

No new packages required. All fixes use existing project dependencies:

| Library | Current Use | Used in Fix |
|---------|------------|-------------|
| `sonner` | toast notifications in order + payment pages | BUG-03: add Toaster to layouts |
| `next-themes` | `useTheme` in ThemeToggle | BUG-03: useTheme for Toaster theme prop |
| `next/navigation` | `useRouter`, `usePathname` | BUG-02, BUG-05: role guard redirects |
| `@/stores/session.store` | role state | BUG-02, BUG-05: read role |

---

## Architecture Patterns

### Pattern 1: Page-Level Role Guard (existing pattern, to be replicated)

The KDS page already demonstrates the correct guard pattern. The manager page fix mirrors it exactly:

```typescript
// Pattern used in kds/page.tsx — replicate for manager/page.tsx
useEffect(() => {
  if (role === null) {
    router.replace('/login')
  } else if (role !== 'Kitchen') {  // expand to 'Kitchen' | 'Manager' for BUG-02
    router.replace('/table-map')
  }
}, [role, router])

if (role === null) return null  // no flash
```

### Pattern 2: Shared Client Component in Server Layout

`(kds)/layout.tsx` is a Server Component. Adding a client-side hook (`useTheme`) requires either converting the layout to a client component or extracting a thin client wrapper. The wrapper pattern is correct for Next.js App Router:

```typescript
// Server layout stays server — just renders a client leaf
export default function KdsLayout({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <ThemedToaster />
      {children}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Double Toaster mount:** Do not leave page-level `<Toaster>` in `order/[tableId]/page.tsx` after adding it to AppShell — sonner will show duplicate toasts.
- **Guard on null role:** Do not redirect when `role === null` in the manager page guard — the layout already handles the unauthenticated case.
- **Changing ROLE_NAV_ACCESS for BUG-02:** The nav access table is correct. Only the page guard needs to change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Theme-aware toast | Custom toast component | `<Toaster theme={resolvedTheme}>` from sonner |
| Route protection | Middleware or custom HOC | `useEffect` + `router.replace` (established pattern in codebase) |

---

## Common Pitfalls

### Pitfall 1: Leaving Duplicate Toasters After BUG-03 Fix
**What goes wrong:** Developer adds Toaster to AppShell but forgets to remove it from `order/[tableId]/page.tsx`. Both fire. Every `toast()` call produces two notifications.
**How to avoid:** BUG-03 plan must explicitly list the page-level `<Toaster>` removals as part of the same task.

### Pitfall 2: Toaster Missing theme Prop in Dark Mode
**What goes wrong:** `<Toaster>` renders with a hardcoded light background in dark mode because sonner reads the CSS `class` attribute, not `next-themes` state.
**How to avoid:** Always pass `theme={resolvedTheme}` — use `useTheme()` from `next-themes` to get `resolvedTheme` (not `theme`, which can be `'system'`).

### Pitfall 3: Manager Page Guard Redirecting on null Role
**What goes wrong:** Guard fires before Zustand hydration, `role` is null, page redirects to `/table-map` instead of waiting for auth — then layout sends to `/login`. Creates a redirect loop or incorrect destination.
**How to avoid:** Use `role !== null && role !== 'Manager'` as the redirect condition.

### Pitfall 4: BUG-02 Fix Allowing All Non-Kitchen Roles into KDS
**What goes wrong:** Changing `role !== 'Kitchen'` to `role !== null` inadvertently allows Waiter and Cashier into KDS.
**How to avoid:** Allowlist explicitly: `role !== 'Kitchen' && role !== 'Manager'`. Do not use a denylist.

### Pitfall 5: KDS Layout Server/Client Boundary
**What goes wrong:** Importing `useTheme` directly in `(kds)/layout.tsx` causes a build error — Server Components cannot use hooks.
**How to avoid:** Create `ThemedToaster` as a separate `'use client'` component file. The layout imports and renders it without needing to become a client component itself.

---

## Code Examples

Verified from codebase inspection:

### Current buggy KDS guard (to be fixed)
```typescript
// src/app/(kds)/kds/page.tsx lines 17-24
useEffect(() => {
  if (role === null) {
    router.replace('/login')
  } else if (role !== 'Kitchen') {
    // Non-kitchen roles routed away — send to table-map as their home
    router.replace('/table-map')
  }
}, [role, router])
```

### Current AppShell (no Toaster)
```typescript
// src/components/app-shell/AppShell.tsx — returns layout with no <Toaster>
return (
  <div className="flex flex-col h-screen overflow-hidden">
    <AppHeader />
    <div className="flex flex-1 overflow-hidden">
      <div className="relative flex">
        <AppSidebar collapsed={sidebarCollapsed} />
        ...
      </div>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  </div>
)
```

### useTheme already in project
```typescript
// src/components/ui/theme-toggle.tsx
import { useTheme } from 'next-themes'
const { theme, setTheme } = useTheme()
// resolvedTheme is the same hook, different destructured key
```

### Current ACTION_PERMISSIONS (missing void-post-send)
```typescript
// src/lib/role-permissions.ts lines 32-43
export const ACTION_PERMISSIONS: Record<ActionKey, Role[]> = {
  'open-table':        ['Waiter', 'Cashier', 'Manager'],
  'mark-reserved':     ['Waiter', 'Cashier', 'Manager'],
  'request-check':     ['Waiter', 'Cashier', 'Manager'],
  'send-to-kitchen':   ['Waiter', 'Manager'],
  'void-pre-send':     ['Waiter', 'Cashier', 'Manager'],
  'confirm-payment':   ['Cashier', 'Manager'],
  'eighty-six-toggle': ['Manager'],
  'close-shift':       ['Manager'],
  'kds-bump':          ['Kitchen', 'Manager'],
  'mark-served':       ['Waiter', 'Cashier', 'Manager'],
  // 'void-post-send' is ABSENT — this is the bug
}
```

---

## File Change Summary

| Bug | Files Changed | Lines Affected |
|-----|--------------|----------------|
| BUG-01 | Create `src/app/(app)/orders/page.tsx` (stub redirect) | ~10 lines new |
| BUG-02 | `src/app/(kds)/kds/page.tsx` | 2 condition changes |
| BUG-03 | Create `src/components/app-shell/ThemedToaster.tsx`, edit `AppShell.tsx`, `(kds)/layout.tsx`, remove from `order/[tableId]/page.tsx` and `payment/[tableId]/page.tsx` | ~5 files, ~20 lines net |
| BUG-04 | `src/lib/role-permissions.ts`, `src/components/order/TicketPanel.tsx`, `src/components/order/TicketLineItem.tsx` | 3 files, ~10 lines |
| BUG-05 | `src/app/(app)/manager/page.tsx` | ~10 lines added |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test directories found |
| Config file | None — Wave 0 gap |
| Quick run command | Manual browser verification (see per-bug steps below) |
| Full suite command | Manual browser verification |

No automated test infrastructure exists in this project. All validation is manual browser-based verification against the success criteria.

### Phase Requirements — Verification Map

| Req ID | Behavior | Test Type | Verification Step |
|--------|----------|-----------|-------------------|
| BUG-01 | Tap Orders in sidebar → no 404 | manual-smoke | Log in as Waiter, open shift, tap Orders in sidebar. Expect: table-map or redirect page. No 404. |
| BUG-02 | Manager can reach /kds | manual-smoke | Log in as Manager, open shift. Navigate to `/kds` directly in URL bar. Expect: KDS board renders. No redirect to /table-map. |
| BUG-03 | Toast appears on table map, manager, KDS | manual-smoke | (a) Log in as Waiter, open shift, tap a table, tap Mark Reserved → expect toast banner appears. (b) Log in as Manager, close shift on EOD tab → expect success toast. (c) Open KDS as Manager → no toast test yet but Toaster should be mounted (verify with React DevTools or fire a manual toast). |
| BUG-04 | Void-post-send only visible to Manager | manual-smoke | Log in as Waiter, open a table, add item, send to kitchen. On the ticket, the sent item's trash button must be DISABLED (not clickable). Log in as Manager — same item trash button must be ENABLED. |
| BUG-05 | Non-Manager redirect from /manager URL | manual-smoke | Log in as Waiter, open shift, type `/manager` in URL bar. Expect: redirected to `/table-map`. Log in as Manager — `/manager` must load normally. |

### Wave 0 Gaps

- [ ] No test framework installed — all validation is manual browser walkthrough
- [ ] Consider adding a basic Playwright or Cypress smoke test file in a future phase if regression coverage is needed

*(Note: Given this is a Hi-Fi wireframe deliverable rather than a production app, manual browser verification is the established and appropriate validation approach for this project.)*

---

## Open Questions

1. **BUG-01 — redirect or dead link removal?**
   - What we know: `/orders` 404s. The correct destination for orders is `/order/[tableId]`.
   - What's unclear: Should the sidebar link be removed, changed to `/table-map`, or should a stub `/orders` page redirect?
   - Recommendation: Create a stub `/orders` page that redirects to `/table-map` with a hint toast. This preserves the NavSlug for permission gating and gives a better UX for direct navigation.

2. **BUG-04 — void-post-send roles**
   - What we know: The action key is missing. The existing `ManagerPinModal` flow already gates the actual void execution.
   - What's unclear: Should Cashier also be permitted to initiate void-post-send (requiring manager PIN), or only Manager?
   - Recommendation: Set `'void-post-send': ['Manager']` only. The ManagerPinModal already provides authorization escalation — the UI gate should be restrictive.

---

## Sources

### Primary (HIGH confidence)
- Direct file reads of all 5 named bug files — confirmed root causes
- Direct file reads of `(app)/layout.tsx`, `(kds)/layout.tsx`, `app/layout.tsx` — confirmed Toaster mount points
- Direct file reads of `TicketPanel.tsx`, `TicketLineItem.tsx` — confirmed void prop flow
- Direct file reads of `TableBottomSheet.tsx`, `EodSummaryTab.tsx` — confirmed toast() calls with no Toaster in scope
- Grep for all `Toaster` mounts — confirmed exactly 2 page-level mounts, both in dynamic order/payment routes
- Grep for all `toast` call sites — confirmed 6 files with toast calls

### Secondary (MEDIUM confidence)
- sonner docs pattern for `theme` prop: confirmed by existing `ThemeToggle.tsx` using `useTheme` from `next-themes` — same hook, same provider already in place

---

## Metadata

**Confidence breakdown:**
- Bug root causes: HIGH — read directly from source files, no inference
- Fix approach: HIGH — follows established patterns already in codebase
- File change list: HIGH — verified by reading every affected file

**Research date:** 2026-03-11
**Valid until:** Until codebase changes — these findings are tied to specific line numbers
