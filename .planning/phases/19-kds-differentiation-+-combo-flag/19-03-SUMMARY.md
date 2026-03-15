---
phase: 19-kds-differentiation-+-combo-flag
plan: 03
subsystem: ui
tags: [zustand, solar-icon-set, order-entry, kds, demo-mode, pack-to-go]

# Dependency graph
requires:
  - phase: 19-01
    provides: packToGo field on OrderLineItem + togglePackToGo action in order.store
  - phase: 19-02
    provides: PACK chip rendering in KdsItemRow (surfaces packToGo badges from demo data)
provides:
  - Bag icon toggle button in TicketLineItem for dine-in order entry rows (sent + unsent)
  - isTakeaway detection via getState() in TicketPanel suppresses toggle on takeaway/delivery panels
  - kds-demo.ts generates mixed-channel tickets (DIN/TKWY/GRAB/LINE MAN) with PACK items
affects: [KDS demo mode, order entry, stakeholder presentation flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-reactive getState() read for stable boolean detection (isTakeaway in TicketPanel)"
    - "Optional prop pair (showPackToGo + onTogglePackToGo) for conditional UI without breaking existing call sites"
    - "Weighted random channel distribution in demo factory (60/25/15 split)"

key-files:
  created: []
  modified:
    - src/components/order/TicketLineItem.tsx
    - src/components/order/TicketPanel.tsx
    - src/lib/mock-data/kds-demo.ts

key-decisions:
  - "[19-03] Bag icon uses status-cooking token family (amber hue 75) for active state — consistent with packToGo being a warm in-progress modifier flag"
  - "[19-03] showPackToGo defaults to false — zero-change for existing TicketLineItem call sites outside TicketPanel"
  - "[19-03] isTakeaway via useQueueStore.getState().orders[tableId] — stable non-reactive read consistent with CLAUDE.md getState() pattern for values static for component lifetime"
  - "[19-03] packToGo demo probability 30% per item on dine-in tickets — low enough to feel realistic, high enough to guarantee visible PACK chips in any demo session"
  - "[19-03] delivery platform split 60% grab / 40% lineman — reflects real Thai delivery market share; produces visible LINE MAN badges in demo"

patterns-established:
  - "Optional toggle pair pattern: showPackToGo + onTogglePackToGo props let parent control feature presence without prop-drilling through intermediate components"
  - "Demo factory channel weighting: weighted Math.random() branches before item map, then use orderType in item factory — clean single-pass factory with zero extra state"

requirements-completed: [COMBO-01]

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 19 Plan 03: Pack-to-Go Toggle + Mixed-Channel Demo Summary

**Dine-in bag icon toggle on order entry item rows (sent + unsent) with isTakeaway suppression; demo factory generates DIN/TKWY/GRAB/LINE MAN tickets with ~30% PACK items**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T14:29:32Z
- **Completed:** 2026-03-15T14:44:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `TicketLineItem` gains `showPackToGo` + `onTogglePackToGo` optional props; amber Bag2Linear icon renders on both sent and unsent rows when flag is true
- `TicketPanel` self-detects `isTakeaway` via non-reactive `getState()` read and passes `showPackToGo={!isTakeaway}` down — no call-site changes required
- `kds-demo.ts` factory now assigns orderType per ticket (60% dine-in / 25% takeaway / 15% delivery) with platform for delivery; ~30% of dine-in demo items get `packToGo: true`

## Task Commits

Each task was committed atomically:

1. **Task 1: Pack-to-go bag toggle in TicketLineItem + TicketPanel wiring** - `4039b13` (feat)
2. **Task 2: Mixed-channel demo tickets with PACK badges in kds-demo.ts** - `0c7b5d2` (feat)

## Files Created/Modified
- `src/components/order/TicketLineItem.tsx` - Added showPackToGo/onTogglePackToGo props; Bag2Linear icon toggle in sent + unsent render paths using status-cooking tokens
- `src/components/order/TicketPanel.tsx` - Added useQueueStore import; isTakeaway detection; togglePackToGo destructure; passes new props to TicketLineItem
- `src/lib/mock-data/kds-demo.ts` - Weighted channel randomization before item map; orderType/platform on returned ticket; packToGo on ~30% of dine-in items

## Decisions Made
- Used `status-cooking` token family (amber) for the active bag icon — consistent with the warm in-progress color language established in Phase 15
- `showPackToGo` defaults to `false` so all existing TicketLineItem usage (outside TicketPanel) is unaffected with zero prop changes
- `isTakeaway` is computed once via `getState()` at render time, not stored in state — the value is stable for the panel's lifetime and this matches the CLAUDE.md non-reactive read pattern
- Demo weight 60/25/15 for dine-in/takeaway/delivery was chosen to feel realistic while ensuring visible minority-channel tickets in a short demo session

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Turbopack `.next` lock/cache conflict after a stash/unstash cycle caused a spurious build error. Resolved by removing stale `.next` directory and rebuilding clean. No code changes required.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 19 complete: all 3 plans done
  - 19-01: data model foundation (packToGo field + badge CVA variants)
  - 19-02: KDS ticket card badges + PACK chip in item rows
  - 19-03: order entry toggle + demo factory channel distribution
- Stakeholder demo now surfaces full channel differentiation (DIN/TKWY/GRAB/LINE MAN) and PACK badges without manual order entry
- No blockers for milestone v1.3 close

---
*Phase: 19-kds-differentiation-+-combo-flag*
*Completed: 2026-03-15*
