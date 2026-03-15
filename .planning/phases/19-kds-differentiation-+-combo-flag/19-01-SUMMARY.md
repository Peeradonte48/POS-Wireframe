---
phase: 19-kds-differentiation-+-combo-flag
plan: "01"
subsystem: ui
tags: [zustand, badge, cva, order-store, pack-to-go, kds]

# Dependency graph
requires:
  - phase: 18-order-entry-payment-pipeline
    provides: order.store with existing round/item immutable update patterns
provides:
  - OrderLineItem.packToGo optional boolean field (backward-compatible)
  - togglePackToGo action on order.store (immutable, follows voidItem pattern)
  - order-type-din CVA badge variant (indigo via status-ordered tokens)
  - order-type-tkwy CVA badge variant (amber via status-cooking tokens)
  - order-type-dlvr CVA badge variant (neutral muted fallback)
affects:
  - 19-02 (KDS ticket rendering reads OrderLineItem.packToGo and uses order-type-* badge variants)
  - 19-03 (order entry UI uses togglePackToGo action)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "togglePackToGo follows voidItem immutable round-map pattern in order.store"
    - "order-type-* badge variants use semantic @theme inline token classes, not raw OKLCH"

key-files:
  created: []
  modified:
    - src/stores/order.store.ts
    - src/components/ui/badge.tsx

key-decisions:
  - "[19-01] packToGo placed after quantity, before status in OrderLineItem — optional field hydrates safely from existing persisted data without migration"
  - "[19-01] order-type-din reuses status-ordered token family (indigo hue 250) — matches dine-in ordered stage"
  - "[19-01] order-type-tkwy reuses status-cooking token family (amber hue 75) — matches TKWY channel feel"
  - "[19-01] order-type-dlvr uses bg-muted/text-muted-foreground/border-border — neutral fallback for unknown platform"

patterns-established:
  - "togglePackToGo pattern: same immutable round-map as voidItem — rounds.map > items.map > spread with toggled field"

requirements-completed:
  - UI-01
  - KDS-01

# Metrics
duration: 2min
completed: "2026-03-15"
---

# Phase 19 Plan 01: KDS Differentiation Foundation Summary

**packToGo optional field on OrderLineItem + togglePackToGo store action + three order-type badge CVA variants (din/tkwy/dlvr) using semantic status tokens**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T14:07:50Z
- **Completed:** 2026-03-15T14:09:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `packToGo?: boolean` to `OrderLineItem` after `quantity` — optional so existing persisted localStorage data hydrates without errors or migrations
- Implemented `togglePackToGo(tableId, lineId)` using the exact same immutable `rounds.map > items.map` pattern as the existing `voidItem` action
- Added three badge CVA variants (`order-type-din`, `order-type-tkwy`, `order-type-dlvr`) in-place in `badge.tsx`, reusing semantic `@theme inline` token class names for correct dark/light mode behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend OrderLineItem with packToGo field and togglePackToGo action** - `d456cd6` (feat)
2. **Task 2: Add order-type badge CVA variants to badge.tsx** - `e2af214` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/stores/order.store.ts` - Added `packToGo?: boolean` to `OrderLineItem`; added `togglePackToGo` to `OrderStore` interface and implementation
- `src/components/ui/badge.tsx` - Added `order-type-din`, `order-type-tkwy`, `order-type-dlvr` CVA variants after `lineman`

## Decisions Made

- `packToGo` placed after `quantity`, before `status` in `OrderLineItem` — natural grouping of item properties before lifecycle status
- `order-type-din` reuses `status-ordered` token family (indigo) — semantically aligns dine-in with an "ordered" state
- `order-type-tkwy` reuses `status-cooking` token family (amber) — warm channel feel for takeaway
- `order-type-dlvr` uses neutral muted — clean fallback when delivery platform is null or unknown

## Deviations from Plan

None - plan executed exactly as written.

**Note on lint:** Pre-existing lint errors (9 errors in unrelated files: useKdsTimer, ModifierSheet, EditCustomerModal, MergeSheet, OpenTableModal, TableBottomSheet, useDwellTimer, useSentTimer) were present before Phase 19 began. Zero new errors introduced by this plan. Logged to `deferred-items.md` in phase directory.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 19-02 (KDS ticket rendering) can now read `OrderLineItem.packToGo` directly from item prop and use `order-type-*` badge variants for channel display
- Plan 19-03 (order entry pack-to-go toggle) can now call `togglePackToGo(tableId, lineId)` from order entry UI
- Build passes cleanly, TypeScript strict mode satisfied

---
*Phase: 19-kds-differentiation-+-combo-flag*
*Completed: 2026-03-15*
