---
phase: 08-bug-fixes
plan: "04"
subsystem: ui
tags: [role-permissions, ticket, void, order-management, typescript]

# Dependency graph
requires: []
provides:
  - "void-post-send ActionKey with Manager-only permission in ACTION_PERMISSIONS"
  - "canVoidSent prop on TicketLineItem controlling sent-item void button visibility"
  - "TicketPanel passes canVoidSent={canDoAction(role, 'void-post-send')} for permission gate"
affects: [09-flow-alignment, 10-dark-mode, 11-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Separate ActionKey entries for pre-send and post-send void — granular permission control per item state"
    - "canVoidSent prop defaults to false — sent-item void button hidden unless explicitly granted"

key-files:
  created: []
  modified:
    - src/lib/role-permissions.ts
    - src/components/order/TicketLineItem.tsx
    - src/components/order/TicketPanel.tsx

key-decisions:
  - "Sent-branch void button renders conditionally with {canVoidSent && <button>} rather than disabled — no phantom touch targets for non-Manager roles"
  - "canVoidSent defaults to false in TicketLineItem — safe by default, must be explicitly granted"
  - "void-post-send permission is Manager-only; void-pre-send remains Waiter/Cashier/Manager"

patterns-established:
  - "Per-state permission props pattern: canRemove (unsent) vs canVoidSent (sent) — distinct props for distinct item states"

requirements-completed: [BUG-04]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 08 Plan 04: Void-Post-Send Permission Gate Summary

**void-post-send ActionKey added to role-permissions and wired through TicketPanel/TicketLineItem so only Manager sees the void button on sent items**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-11T11:16:06Z
- **Completed:** 2026-03-11T11:17:20Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `'void-post-send'` to the `ActionKey` union type and `ACTION_PERMISSIONS` map with `['Manager']` restriction
- Added `canVoidSent` prop to `TicketLineItem` — sent-branch void button renders only when `canVoidSent` is true
- `TicketPanel` passes `canVoidSent={canDoAction(role, 'void-post-send')}` giving Manager-only visibility
- Unsent-item trash button unchanged — `canRemove`/`void-pre-send` behavior fully preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Add void-post-send to ActionKey and ACTION_PERMISSIONS** - `9155959` (feat)
2. **Task 2: Wire canVoidSent prop through TicketPanel to TicketLineItem** - `0a19e85` (feat)

## Files Created/Modified
- `src/lib/role-permissions.ts` - Added `'void-post-send'` ActionKey member and `ACTION_PERMISSIONS` entry `['Manager']`
- `src/components/order/TicketLineItem.tsx` - Added `canVoidSent` prop; sent-branch void button now conditionally rendered
- `src/components/order/TicketPanel.tsx` - Passes `canVoidSent={canDoAction(role, 'void-post-send')}` to TicketLineItem

## Decisions Made
- Used conditional render `{canVoidSent && <button>}` instead of `disabled` prop on sent-branch void button — removes phantom touch targets entirely for Waiter/Cashier rather than showing a greyed-out button
- `canVoidSent` defaults to `false` in TicketLineItem for safe-by-default behavior
- Kept void-pre-send for Waiter/Cashier/Manager on unsent items — no regression to existing remove permissions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- BUG-04 resolved: void-after-send is now Manager-only at the UI level
- Phase 09 (Flow Alignment) can proceed — no blockers from this plan
- TypeScript compiles clean; no regressions to unsent-item remove behavior

## Self-Check: PASSED

All files present, all commits verified, all key content checks passed.

---
*Phase: 08-bug-fixes*
*Completed: 2026-03-11*
