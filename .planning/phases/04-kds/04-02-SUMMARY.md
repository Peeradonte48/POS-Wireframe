---
phase: 04-kds
plan: 02
subsystem: ui
tags: [zustand, next-app-router, kds, typescript, react, tailwind]

# Dependency graph
requires:
  - phase: 04-kds plan 01
    provides: useKdsStore (tickets, bumpTicket, checkItem, uncheckItem, recallTicket, recallTray), useKdsTimer hook, KdsStage/KdsTicket/RecalledTicket types, (kds) route group
  - phase: 03-order-flow
    provides: OrderLineItem, OrderRound, ActiveOrder types and useOrderStore
  - phase: 02-table-map
    provides: useTableStore with tables[tableId].label for ticket registration
provides:
  - KdsItemRow component (void/active/allergy item row display)
  - KdsTicketCard component (ticket card with timer, item rows, BUMP button)
  - KdsBoard component (three-column grid auto-registering tickets from order store)
  - KdsRecallTray component (horizontal recall pill strip)
  - /kds page wired with real components (replaced Plan 01 scaffold)
affects: [04-03-demo-mode, 05-payment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auto-register pattern: KdsBoard derives tables with sent orders from useOrderStore on each render and calls addTicket for any not yet tracked in kdsStore"
    - "Render-time side effects contained: addTicket calls happen during render body — safe in Zustand because they only mutate external store state, not component state"
    - "Modifier summary built inline in KdsItemRow — mirrors TicketLineItem pattern from Phase 3"

key-files:
  created:
    - src/components/kds/KdsItemRow.tsx
    - src/components/kds/KdsTicketCard.tsx
    - src/components/kds/KdsBoard.tsx
    - src/components/kds/KdsRecallTray.tsx
  modified:
    - src/app/(kds)/kds/page.tsx

key-decisions:
  - "Modifier summary built inline in KdsItemRow — broth from modifiers[0], spice level as 'Spice N', remaining modifiers joined with bullet separator"
  - "Auto-register in KdsBoard render body (not useEffect) to avoid one-render delay between order send and ticket appearance"
  - "allNonVoidedChecked ring signal on BUMP button uses nonVoidedItems.every check — voided items never block the ring"

patterns-established:
  - "KdsBoard owns auto-registration: no other component calls addTicket — single responsibility for ticket lifecycle entry"
  - "KdsItemRow owns item display state: void/active/allergy are mutually exclusive branches, not layered flags"

requirements-completed: [KDS-01, KDS-02, KDS-03]

# Metrics
duration: 8min
completed: 2026-03-11
---

# Phase 4 Plan 02: KDS Board UI Summary

**Three-column KDS board with bump interactions, item-level void/allergy display, and recall tray — replacing Plan 01 scaffold with fully interactive kitchen display**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-11T04:21:38Z
- **Completed:** 2026-03-11T04:29:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- KdsItemRow: renders voided items (struck-through + VOID badge), active items (checkbox + modifier summary), and allergy items (orange ALLERGY badge + request text); checked items dim to opacity-50
- KdsTicketCard: table label header, MM:SS timer (green/amber/red by threshold), item rows via KdsItemRow, BUMP button with ring-2 ring-green-400 when all non-voided items are checked
- KdsBoard: three scrollable columns (New / In Progress / Ready), auto-registers KDS tickets on render by comparing order store to kds store, empty column placeholder
- KdsRecallTray: thin strip when empty, horizontal pill scroll when recalled tickets exist; tapping pill calls recallTicket() to restore to Ready column
- KDS page.tsx: scaffold replaced with KdsBoard + KdsRecallTray; header retains demo badge and toggle button

## Task Commits

Each task was committed atomically:

1. **Task 1: KdsItemRow + KdsTicketCard components** - `dd998b2` (feat)
2. **Task 2: KdsBoard + KdsRecallTray + wire page.tsx** - `5876ca2` (feat)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `src/components/kds/KdsItemRow.tsx` - Item row with void/active/allergy states, checkbox, modifier summary
- `src/components/kds/KdsTicketCard.tsx` - Ticket card with timer, item list, and BUMP footer button
- `src/components/kds/KdsBoard.tsx` - Three-column grid, auto-ticket registration from order store
- `src/components/kds/KdsRecallTray.tsx` - Horizontal recall strip with pill buttons per recalled ticket
- `src/app/(kds)/kds/page.tsx` - Full-screen KDS layout wiring KdsBoard + KdsRecallTray

## Decisions Made

- Modifier summary built inline in KdsItemRow: broth from `modifiers[0].optionLabel`, spice as "Spice N", remaining modifiers joined with " • " — mirrors the TicketLineItem pattern established in Phase 3
- Auto-register runs in KdsBoard render body (not useEffect) to avoid a one-render gap between an order being sent and the ticket appearing on the KDS
- The BUMP button ring-2 signal checks `nonVoidedItems.every(item => checkedItems.has(item.lineId))` — voided items do not block the ring from showing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript passed clean after both tasks with zero errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- KDS board is fully interactive: tickets auto-appear, bump through stages, and recall works
- Plan 03 (demo mode) can inject synthetic tickets into useKdsStore; KdsBoard will render them immediately
- npx tsc --noEmit passes clean — Phase 5 (Payment) can begin in parallel

---
*Phase: 04-kds*
*Completed: 2026-03-11*
