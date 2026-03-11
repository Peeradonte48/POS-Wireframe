---
phase: 08-bug-fixes
plan: "01"
subsystem: ui
tags: [next.js, app-router, routing, redirect]

# Dependency graph
requires: []
provides:
  - "/orders route exists and redirects staff to /table-map"
  - "No 404 when sidebar Orders link is tapped"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["Server component redirect stub — 5-line page.tsx that calls redirect() immediately, no JSX needed"]

key-files:
  created:
    - src/app/(app)/orders/page.tsx
  modified: []

key-decisions:
  - "Server-side redirect chosen over client redirect to avoid flash of content"
  - "NavSlug 'orders' in ROLE_NAV_ACCESS left unchanged — only the missing route is fixed, not the sidebar config"

patterns-established:
  - "Stub redirect pattern: import redirect from next/navigation, call redirect('/destination') as sole statement"

requirements-completed: [BUG-01]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 8 Plan 01: Orders Route Stub Summary

**Server component redirect at /orders that immediately forwards staff to /table-map, eliminating BUG-01's 404 on sidebar tap**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T11:15:52Z
- **Completed:** 2026-03-11T11:20:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `src/app/(app)/orders/page.tsx` as a 5-line server component
- Sidebar Orders link now redirects to /table-map instead of producing a 404
- TypeScript compiles clean with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /orders stub redirect page** - `5cdfcee` (feat)

## Files Created/Modified
- `src/app/(app)/orders/page.tsx` - Server component that calls `redirect('/table-map')` — fixes BUG-01

## Decisions Made
- Used server-side `redirect()` from `next/navigation` rather than a client `useRouter().push()` to avoid any flash of content; the redirect happens before any render cycle
- Left the `'orders'` NavSlug in `ROLE_NAV_ACCESS` untouched — the plan explicitly forbids changing sidebar visibility config; only the missing route needed fixing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BUG-01 resolved; /orders no longer 404s
- Plans 08-02 through 08-05 were already committed in a prior session (KDS role guard, ThemedToaster, void ActionKey, manager role guard)
- Phase 8 bug fixes are complete; Phase 9 (Flow Alignment) can proceed

---
*Phase: 08-bug-fixes*
*Completed: 2026-03-11*
