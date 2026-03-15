---
phase: 18-order-entry-payment-pipeline
plan: 01
subsystem: ui
tags: [zustand, kds, queue, takeaway, delivery, typescript]

# Dependency graph
requires:
  - phase: 17-queue-store-floor-plan-tabs
    provides: queue.store with QueueOrderStatus, advanceStatus, takeaway/delivery order lifecycle
  - phase: 16-kds
    provides: kds.store KdsTicket type, addTicket, bumpTicket; KdsBoard auto-register useEffect; KdsTicketCard handleBump
provides:
  - queue.store.advanceStatus Sent→Ready transition (completes takeaway KDS lifecycle)
  - KdsTicket interface extended with optional orderType and platform fields (Phase 19 reads these with zero store changes)
  - addTicket accepts 4 params — orderType and platform are optional, all existing 2-arg callers unaffected
  - KdsBoard auto-register loop guards against queue orders — takeaway/delivery tickets created only via explicit addTicket call
  - KdsTicketCard.handleBump writes back to queue.store.advanceStatus on InProgress bump for non-dine-in tickets
affects: [19-kds-differentiation-combo-flag]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-store write-back via getState() at callsite — no circular module dependency, consistent with CLAUDE.md pattern"
    - "Non-reactive guard in useEffect via useQueueStore.getState() — not added to dependency array, avoids Zustand selector loop"

key-files:
  created: []
  modified:
    - src/stores/queue.store.ts
    - src/stores/kds.store.ts
    - src/components/kds/KdsBoard.tsx
    - src/components/kds/KdsTicketCard.tsx

key-decisions:
  - "[18-01] queue.store Sent→Ready added between Taking→Sent and Ready→Collected in transitions map — declarative single-map pattern preserved"
  - "[18-01] KdsTicket orderType/platform optional fields — additive only, zero impact on existing dine-in code paths"
  - "[18-01] KdsBoard guard uses useQueueStore.getState() inside useEffect — non-reactive read, NOT in dependency array"
  - "[18-01] KdsTicketCard queue write-back fires only on InProgress bump — New→InProgress bump does not advance queue status"

patterns-established:
  - "Queue write-back pattern: useQueueStore.getState().orders[ticket.tableId] guard before advanceStatus call in handleBump"
  - "KDS auto-register guard: check queue.store.orders before addTicket to prevent double-registration"

requirements-completed: [TKWY-03]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 18 Plan 01: KDS-to-Queue Write-back + Store Extensions Summary

**KDS InProgress bump now writes back to queue.store.advanceStatus for takeaway (Sent→Ready) and delivery (Preparing→ReadyForRider) orders; KdsTicket extended with orderType/platform fields for Phase 19 reads**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T09:56:49Z
- **Completed:** 2026-03-15T09:58:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Completed the missing `Sent: 'Ready'` transition in queue.store.advanceStatus — takeaway KDS lifecycle is now fully wired
- Extended KdsTicket with `orderType?` and `platform?` optional fields; addTicket accepts them as optional 3rd/4th params — Phase 19 can read these with zero additional store changes
- KdsBoard auto-register useEffect now guards against queue orders, preventing phantom dine-in registrations for takeaway/delivery orders
- KdsTicketCard.handleBump adds a parallel queue write-back — an InProgress→Ready bump on a queue order advances its QueueOrderStatus automatically

## Task Commits

Each task was committed atomically:

1. **Task 1: queue.store Sent→Ready transition + kds.store orderType extension** - `185d758` (feat)
2. **Task 2: KdsBoard auto-register guard + KdsTicketCard queue write-back** - `918aaa6` (feat)

## Files Created/Modified
- `src/stores/queue.store.ts` - Added `Sent: 'Ready'` entry to advanceStatus transitions map
- `src/stores/kds.store.ts` - Added optional `orderType` and `platform` fields to KdsTicket interface; extended addTicket signature to 4 params
- `src/components/kds/KdsBoard.tsx` - Added useQueueStore import; guard in auto-register useEffect to skip queue orders
- `src/components/kds/KdsTicketCard.tsx` - Added useQueueStore import; queue write-back in handleBump on InProgress bump

## Decisions Made
- KdsBoard guard uses `useQueueStore.getState()` inside the useEffect body and is intentionally NOT added to the dependency array — consistent with the CLAUDE.md non-reactive read pattern
- Queue write-back is gated on `currentStage === 'InProgress'` only — the New→InProgress bump does not advance queue status (kitchen hasn't finished yet)
- Both store changes are purely additive — all existing 2-arg addTicket callers (e.g. `acceptOrder`) continue to work unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Running `npm run lint` revealed 10 pre-existing lint errors in unrelated files (payment page, useKdsTimer, ModifierSheet, EditCustomerModal, MergeSheet, OpenTableModal, TableBottomSheet, TableTile, useDwellTimer, useSentTimer). None are in the four files modified in this plan. Logged as out-of-scope per deviation rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Store layer foundation complete: queue.store has full takeaway lifecycle, kds.store carries orderType/platform for Phase 19 to read
- Phase 19 can read `ticket.orderType` and `ticket.platform` from existing KdsTicket objects with zero store changes
- KDS bump→queue status advancement is live — a bump on a takeaway KDS ticket advances it from Sent to Ready automatically

---
*Phase: 18-order-entry-payment-pipeline*
*Completed: 2026-03-15*
