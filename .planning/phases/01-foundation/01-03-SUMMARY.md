---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [react, nextjs, zustand, tailwind, lucide-react, shadcn-ui]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: useSessionStore (role, staffName, branchName, shiftOpen, logout), canAccess(role, slug), NavSlug types

provides:
  - AppHeader component reading session store and displaying Branch Name, Role Badge, Staff Name
  - AppSidebar component with role-filtered enabled/disabled nav items, collapsible layout
  - AppShell component composing Header + Sidebar + children, managing sidebar collapse state
  - (app)/layout.tsx auth guard redirecting unauthenticated to /login and pre-shift to /shift-open

affects:
  - All Phase 2+ screens render inside AppShell
  - Any route under (app)/ inherits auth guard and shell layout

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side auth guard via useEffect + useSessionStore in layout.tsx"
    - "Role-filtered nav: canAccess(role, slug) determines Link vs disabled div"
    - "Sidebar collapse managed as local useState in AppShell, passed as prop to AppSidebar"
    - "Soft gate pattern: shift-open page renders inside AppShell with sidebar locked"

key-files:
  created:
    - src/components/app-shell/AppHeader.tsx
    - src/components/app-shell/AppSidebar.tsx
    - src/components/app-shell/AppShell.tsx
  modified:
    - src/app/(app)/layout.tsx

key-decisions:
  - "Disabled nav items are div elements (not Link) to prevent navigation while preserving visual presence"
  - "Sidebar collapse toggle button positioned absolute at bottom of sidebar container"
  - "/shift-open explicitly excluded from shift-open redirect so it renders inside AppShell with locked sidebar"
  - "NavItem icon type widened to include className prop for Lucide React compatibility under strict TypeScript"

patterns-established:
  - "AppShell: full-viewport flex column with fixed header and scrollable main — used by all (app)/ routes"
  - "Role guard: canAccess() drives isAccessible; inaccessible items render as cursor-not-allowed divs with title tooltip"

requirements-completed:
  - AUTH-02
  - AUTH-05

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 1 Plan 03: AppShell + Auth Guard Summary

**Role-aware collapsible AppShell with persistent header showing branch/role/staff and client-side auth guard redirecting unauthenticated and pre-shift users**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T05:18:44Z
- **Completed:** 2026-03-10T05:20:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- AppHeader reads `role`, `staffName`, `branchName` from Zustand session store; renders Branch Name, color-coded Role Badge (Waiter=secondary, Cashier=default, Manager=destructive, Kitchen=outline), Staff Name, and logout button
- AppSidebar renders all 5 nav items always; uses `canAccess(role, slug)` to distinguish accessible (Link) from restricted (div, cursor-not-allowed, greyed out); shows lock banner when `shiftOpen` is false; toggles between w-56 and w-16 via `collapsed` prop
- AppShell composes Header + Sidebar + children in full-viewport layout; manages `sidebarCollapsed` local state with PanelLeftClose/PanelLeftOpen toggle
- (app)/layout.tsx auth guard redirects to `/login` when `!role`, to `/shift-open` when `!shiftOpen && pathname !== '/shift-open'`; returns null while auth unresolved

## Task Commits

Each task was committed atomically:

1. **Task 1: Build AppHeader and AppSidebar components** - `c2192f7` (feat)
2. **Task 2: Compose AppShell and wire (app)/layout.tsx with auth guard** - `5242687` (feat, committed within Plan 01-02 execution)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/components/app-shell/AppHeader.tsx` - Persistent top header: Branch Name, Role Badge, Staff Name, logout
- `src/components/app-shell/AppSidebar.tsx` - Collapsible nav sidebar with role-filtered enabled/disabled states
- `src/components/app-shell/AppShell.tsx` - Composes Header + Sidebar + children, manages sidebar collapse state
- `src/app/(app)/layout.tsx` - Client-side auth guard + AppShell wrapper for all (app)/ routes

## Decisions Made

- Disabled nav items use `div` instead of `Link` — preserves visual layout while being completely non-interactive
- `/shift-open` excluded from shift-open redirect: the soft gate pattern lets authenticated-but-no-shift staff see the AppShell with locked sidebar, guiding them to open a shift before any POS section is accessible
- NavItem icon type widened to `React.ComponentType<{ size?: number; className?: string }>` to satisfy Lucide icon props under TypeScript strict mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Widened NavItem icon type to include className**
- **Found during:** Task 1 (Build AppHeader and AppSidebar components)
- **Issue:** `NavItem.icon` typed as `React.ComponentType<{ size?: number }>` — passing `className` prop to Icon caused TS2769 overload error
- **Fix:** Added `className?: string` to the NavItem icon type definition
- **Files modified:** `src/components/app-shell/AppSidebar.tsx`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `c2192f7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Single-line type fix required for TypeScript strict mode compliance. No scope change.

## Issues Encountered

Task 2 files (AppShell.tsx, (app)/layout.tsx) were already committed by the Plan 01-02 execution agent (commit `5242687`). Content matched exactly — no re-implementation needed. Both tasks are fully complete.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AppShell is the structural container all Phase 2+ screens render inside — ready immediately
- Auth guard is live: unauthenticated users can't access (app)/ routes
- Kitchen role sees only KDS nav item enabled (confirmed by `ROLE_NAV_ACCESS['Kitchen'] = ['kds']` from Plan 01)
- Plan 01-04 (shift-open form) and Plan 01-05 (navigation) can proceed

---
*Phase: 01-foundation*
*Completed: 2026-03-10*

## Self-Check: PASSED

- FOUND: src/components/app-shell/AppHeader.tsx
- FOUND: src/components/app-shell/AppSidebar.tsx
- FOUND: src/components/app-shell/AppShell.tsx
- FOUND: src/app/(app)/layout.tsx
- FOUND: commit c2192f7
- FOUND: commit 5242687
