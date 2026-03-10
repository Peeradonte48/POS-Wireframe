---
phase: 01-foundation
plan: 02
subsystem: auth-ui
tags: [pin-login, numpad, role-selector, zustand, react, tailwind]

# Dependency graph
requires:
  - 01-01 (Role type, useSessionStore, verifyPin, globals.css animate-shake)
provides:
  - PinNumpad reusable component with 4-digit auto-submit and shake/red error state
  - RoleSelector component with four role cards
  - Fully functional /login page wiring role selection -> PIN entry -> store.login -> redirect
affects: [01-03, 01-04, 04-manager-layer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-step login state machine: 'role' | 'pin' managed in page-level useState"
    - "PinNumpad auto-submit via useEffect watching digits.length === 4 (not inline handler)"
    - "Error state lifecycle: parent sets pinError=true -> PinNumpad shakes/clears -> calls onErrorClear -> parent resets"
    - "useCallback on handlePinComplete and handleErrorClear to stabilize PinNumpad useEffect deps"

key-files:
  created:
    - src/components/auth/PinNumpad.tsx
    - src/components/auth/RoleSelector.tsx
  modified:
    - src/app/(auth)/login/page.tsx

key-decisions:
  - "PinNumpad auto-clear uses 600ms timeout to wait for shake animation before clearing digits and calling onErrorClear"
  - "Backspace uses * slot in 3x4 grid bottom-left; bottom-right slot is empty div (no confirm button)"
  - "RoleSelector uses cn() for hover:border-brand-primary to reference the @theme brand color from globals.css"

requirements-completed: [AUTH-01]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 1 Plan 02: PIN Login Flow Summary

**Two-step PIN login UI: RoleSelector + PinNumpad wired to verifyPin and useSessionStore — /login is fully functional with correct-PIN redirect and wrong-PIN shake/red/auto-clear feedback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T05:18:46Z
- **Completed:** 2026-03-10T05:20:29Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `PinNumpad` component built: 3x4 numpad grid, 4-digit auto-submit via `useEffect`, `error` prop triggers `animate-shake` Tailwind class (from `globals.css @theme`), red border/dots, and 600ms auto-clear
- `RoleSelector` component built: four role cards (Waiter, Cashier, Manager, Kitchen) with Lucide icons and `brand-primary` hover border
- `/login` page fully wired: two-step state machine (role -> pin), calls `verifyPin(role, pin)`, dispatches `store.login(role, name, id)`, redirects to `/shift-open` on success, sets `pinError=true` on failure, Back button returns to role selection

## Task Commits

Each task was committed atomically:

1. **Task 1: Build PinNumpad component** - `fd73225` (feat)
2. **Task 2: Build RoleSelector and wire the login page** - `5242687` (feat)

## Files Created/Modified

- `src/components/auth/PinNumpad.tsx` — Reusable 3x4 PIN numpad with 4-digit auto-submit, shake/red error state; exports `PinNumpad` and `PinNumpadProps`
- `src/components/auth/RoleSelector.tsx` — Four role card buttons (Waiter, Cashier, Manager, Kitchen) with Lucide icons
- `src/app/(auth)/login/page.tsx` — Full login page: role selection -> PIN entry -> verifyPin -> store.login -> router.replace('/shift-open')

## Decisions Made

- `PinNumpad` auto-clear timeout set to 600ms to match the 0.5s `shake` animation duration (with 100ms buffer) before resetting digits and calling `onErrorClear`
- Bottom-left key slot is backspace (renders `<Delete>` icon), bottom-right slot is an empty `<div>` spacer — no confirm button exists, 4th digit auto-submits
- `useCallback` wraps `handlePinComplete` and `handleErrorClear` in the login page to prevent stale closure issues in `PinNumpad`'s `useEffect` dependency arrays

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compiled cleanly on first attempt. All interfaces matched the contracts defined in Plan 01.

## User Setup Required

None.

## Next Phase Readiness

- `/login` is fully functional — role selection, PIN entry, correct/wrong PIN feedback all work
- `PinNumpad` is reusable — Plan 04 (Manager PIN override modal) can import directly
- `RoleSelector` is standalone and can be reused if needed
- `npx tsc --noEmit` passes with zero errors

---
*Phase: 01-foundation*
*Completed: 2026-03-10*

## Self-Check: PASSED

All 3 key files present on disk. Both task commits (fd73225, 5242687) verified in git log.
