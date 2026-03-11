---
phase: 04-kds
plan: 01
subsystem: ui
tags: [zustand, next-app-router, kds, typescript, react-hooks]

# Dependency graph
requires:
  - phase: 03-order-flow
    provides: OrderLineItem, OrderRound, ActiveOrder types used in KDS ticket context
  - phase: 01-foundation
    provides: useSessionStore with Role type including 'Kitchen', auth guard pattern
provides:
  - KdsTicket, RecalledTicket, KdsStage types (kds.store.ts)
  - useKdsStore with full CRUD actions (kds.store.ts)
  - useKdsTimer hook returning MM:SS display + elapsedSeconds (useKdsTimer.ts)
  - (kds) route group layout with no AppShell (src/app/(kds)/layout.tsx)
  - /kds page scaffold with three-column board layout (src/app/(kds)/kds/page.tsx)
  - Kitchen role redirect in (app)/layout.tsx bypassing shift-open
affects: [04-02-board-ui, 04-03-demo-mode]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route group isolation: (kds) group has its own layout that excludes AppShell"
    - "Set immutability: new Set() created in checkItem/uncheckItem, never mutated in place"
    - "Recall tray cap: oldest entry silently shifted when tray exceeds 5 entries"
    - "Kitchen auth bypass: Kitchen role redirected from (app)/layout.tsx before shiftOpen check"

key-files:
  created:
    - src/stores/kds.store.ts
    - src/components/kds/useKdsTimer.ts
    - src/app/(kds)/layout.tsx
    - src/app/(kds)/kds/page.tsx
  modified:
    - src/app/(app)/layout.tsx

key-decisions:
  - "Kitchen role gets a null-guard in (app)/layout.tsx to prevent AppShell flash before redirect fires"
  - "Non-Kitchen roles landing on /kds are redirected to /table-map (their natural home)"
  - "useKdsTimer initializes now with Date.now() at mount — tickets already in flight display correct elapsed time immediately"
  - "ticketId generated as ticket-${Date.now()}-${tableId} — unique enough for wireframe, no UUID dependency needed"

patterns-established:
  - "Route group isolation: separate (kds) layout group for full-screen non-AppShell views"
  - "Zustand Set pattern: always create new Set, never mutate in place (checkedItems)"

requirements-completed: [KDS-01, KDS-02]

# Metrics
duration: 10min
completed: 2026-03-11
---

# Phase 4 Plan 01: KDS Store, Timer Hook, Route Group Summary

**Zustand KDS store with bump/recall state machine, MM:SS timer hook, full-screen (kds) route group, and Kitchen-role auth bypass in (app)/layout.tsx**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-11T04:09:00Z
- **Completed:** 2026-03-11T04:19:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- KDS store with full ticket lifecycle: New → InProgress → Ready → recallTray (capped at 5)
- useKdsTimer hook ticking every 1s, returns MM:SS display + elapsedSeconds for color threshold logic
- (kds) route group with server-component layout that renders children with zero AppShell chrome
- KDS page scaffold: auth guard, DEMO badge, Demo Mode toggle, three-column column labels, recall tray placeholder
- (app)/layout.tsx updated so Kitchen role bypasses shift-open and routes directly to /kds

## Task Commits

Each task was committed atomically:

1. **Task 1: kds.store.ts + useKdsTimer hook** - `60a47dd` (feat)
2. **Task 2: (kds) route group layout + KDS page scaffold + auth guard fixes** - `cec9219` (feat)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `src/stores/kds.store.ts` - KdsTicket, RecalledTicket, KdsStage types + useKdsStore with all actions
- `src/components/kds/useKdsTimer.ts` - 1s interval timer hook returning MM:SS + elapsedSeconds
- `src/app/(kds)/layout.tsx` - Server-component full-screen layout, no AppShell imports
- `src/app/(kds)/kds/page.tsx` - Kitchen-only auth guard, DEMO badge, Demo Mode toggle, three-column scaffold
- `src/app/(app)/layout.tsx` - Kitchen role redirect to /kds before shiftOpen check; null guard includes Kitchen

## Decisions Made

- Kitchen role gets a null-guard (`if (!role || role === 'Kitchen') return null`) in (app)/layout.tsx to prevent AppShell flash before redirect fires
- Non-Kitchen roles landing on /kds are sent to `/table-map` — table-map is their natural home post-login
- `useKdsTimer` initializes `now` with `Date.now()` at mount so tickets already in progress show correct elapsed time immediately
- `ticketId` generated as `ticket-${Date.now()}-${tableId}` — unique enough for wireframe; no UUID dependency added

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- kds.store.ts exports all types and actions Plan 02 (board UI) and Plan 03 (demo mode) depend on
- useKdsTimer is ready for use in KdsTicketCard (Plan 02)
- /kds route renders with no AppShell — full-screen canvas ready for board components
- Kitchen role routing fully wired — browser-testable by selecting Kitchen role at login

---
*Phase: 04-kds*
*Completed: 2026-03-11*
