---
phase: 08-bug-fixes
plan: "05"
subsystem: auth
tags: [role-guard, zustand, next-navigation, client-component]

requires: []
provides:
  - "Manager page protected by client-side role guard redirecting non-Manager roles to /table-map"
affects: [phase-09-flow-alignment, phase-11-component-polish]

tech-stack:
  added: []
  patterns:
    - "useEffect role guard with null-check (role !== null && role !== 'Manager') to avoid redirect during Zustand hydration"
    - "Early return (if role !== 'Manager') after useEffect to prevent content flash before redirect fires"

key-files:
  created: []
  modified:
    - src/app/(app)/manager/page.tsx

key-decisions:
  - "Guard condition is role !== null && role !== 'Manager' — the null check prevents redirect before Zustand hydration completes, which would fight (app)/layout.tsx auth guard"
  - "Early return condition is role !== 'Manager' (includes null) — unauthenticated users see blank while layout redirects to /login; authenticated non-managers see blank while useEffect redirects to /table-map"

patterns-established:
  - "Role guard pattern: useEffect with null-check + early return, matching kds/page.tsx exactly"

requirements-completed: [BUG-05]

duration: 5min
completed: 2026-03-11
---

# Phase 8 Plan 05: Manager Page Role Guard Summary

**Client-side useEffect role guard on manager/page.tsx redirecting non-Manager roles to /table-map, mirroring the kds/page.tsx pattern**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-11T11:11:00Z
- **Completed:** 2026-03-11T11:16:45Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `useEffect` guard to `manager/page.tsx` that redirects any authenticated non-Manager role to `/table-map`
- Added early return (`if (role !== 'Manager') return null`) to prevent content flash before redirect fires
- Null-guarded the condition so Zustand hydration race does not trigger incorrect redirects
- TypeScript compiles clean (`npx tsc --noEmit` passes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add role guard to manager page** - `adc35da` (fix)

**Plan metadata:** _(to be added in final commit)_

## Files Created/Modified
- `src/app/(app)/manager/page.tsx` - Added useEffect role guard + early return; added imports for useEffect, useRouter, useSessionStore

## Decisions Made
- Used `role !== null && role !== 'Manager'` in useEffect (not just `role !== 'Manager'`) — avoids redirect on null which fires before (app)/layout.tsx auth guard, preventing a redirect loop or wrong destination.
- Used `role !== 'Manager'` (allows null) in early return — null (unauthenticated) users should see blank while layout handles /login, not be sent to /table-map.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- BUG-05 resolved: direct URL navigation to /manager is now protected for all non-Manager roles
- No blockers for subsequent plans in Phase 8

---
*Phase: 08-bug-fixes*
*Completed: 2026-03-11*
