---
phase: 19-kds-differentiation-+-combo-flag
plan: 02
subsystem: ui
tags: [kds, react, zustand, tailwind, badge, filter-tabs]

# Dependency graph
requires:
  - phase: 19-01
    provides: order-type-din/tkwy/dlvr badge CVA variants + packToGo field on OrderLineItem
  - phase: 18-01
    provides: KdsTicket orderType/platform fields
provides:
  - Order type badge (DIN/TKWY/GRAB/LINE MAN/DLVR) in every KDS ticket header
  - PACK amber chip in KDS item rows for packToGo items
  - Channel filter tab row (All/Dine-in/Takeaway/Delivery) in KdsBoard with live counts
affects:
  - 19-03

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useMemo on raw tickets record for channel counts (CLAUDE.md infinite-loop guard)
    - ChannelFilter const-array + typeof union type pattern (matches Phase 15 tab pattern)
    - co-located helper functions getOrderTypeBadgeVariant + getOrderTypeLabel near KDS_STAGE_CONFIG

key-files:
  created: []
  modified:
    - src/components/kds/KdsTicketCard.tsx
    - src/components/kds/KdsItemRow.tsx
    - src/components/kds/KdsBoard.tsx

key-decisions:
  - "[19-02] getOrderTypeBadgeVariant/getOrderTypeLabel as co-located helpers in KdsTicketCard: small, file-local, no need for a shared util; badge string cast via Parameters<typeof Badge>[0]['variant'] keeps TypeScript happy without hard-coding the union"
  - "[19-02] PACK chip uses bg-status-cooking-bg/text-status-cooking tokens: amber family signals handle-differently; consistent with order-type-tkwy variant and distinct from ALLERGY orange-500 hardcode"
  - "[19-02] channelCounts computed in useMemo([tickets]) not inside selector: follows CLAUDE.md Zustand selector infinite-loop prevention rule; tickets Record is stable reference when no mutation"
  - "[19-02] effectiveType fallback to dine-in for undefined orderType: demo tickets and legacy dine-in tickets have no orderType field; treating undefined as dine-in matches badge label DIN shown by getOrderTypeLabel"
  - "[19-02] Channel filter applied as second pass in stageTickets filter: single filter chain; no new derived state; empty columns handled by existing No tickets placeholder — zero layout shift"

patterns-established:
  - "Channel filter tabs: CHANNEL_FILTERS const array + ChannelFilter type + useState + useMemo counts — reusable pattern for any board that needs channel segmentation"
  - "Order type badge helpers: two small co-located functions (variant + label) covering orderType x platform matrix cleanly"

requirements-completed: [KDS-01, KDS-02, COMBO-02]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 19 Plan 02: KDS Differentiation — Order Type Badges + Channel Filter Tabs Summary

**KDS ticket headers show DIN/TKWY/GRAB/LINE MAN/DLVR badges per ticket; PACK amber chip on packToGo items; channel filter tabs above the 3-column board with live counts and per-channel filtering.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-15T14:10:38Z
- **Completed:** 2026-03-15T14:16:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Order type badge renders in every KDS ticket header between table label and stage badge — kitchen can identify plate-vs-bag instantly without reading item details
- PACK amber chip appears inline in KdsItemRow when item.packToGo is true — signals "bag this item" at item level, not just ticket level
- Channel filter tab row (All / Dine-in / Takeaway / Delivery) with live counts sits above the 3-column grid; selecting a tab filters all three stage columns simultaneously; empty columns fall through to existing No tickets placeholder with zero layout shift

## Task Commits

Each task was committed atomically:

1. **Task 1: Order type badge in KdsTicketCard + PACK chip in KdsItemRow** - `11db26c` (feat)
2. **Task 2: Channel filter tabs in KdsBoard** - `3ee6583` (feat)

## Files Created/Modified
- `src/components/kds/KdsTicketCard.tsx` - Added getOrderTypeBadgeVariant + getOrderTypeLabel helpers; inserted order type badge between table label and stage badge in header JSX
- `src/components/kds/KdsItemRow.tsx` - Added PACK amber chip after modifierSummary, before specialRequest block
- `src/components/kds/KdsBoard.tsx` - Added CHANNEL_FILTERS const, ChannelFilter type, useState activeChannelFilter, useMemo channelCounts, second-pass channel filter in stageTickets, flex-col wrapper + tab row above ticket board columns

## Decisions Made
- Badge cast via `Parameters<typeof Badge>[0]['variant']` — keeps TypeScript happy with the CVA union without hard-coding variant strings or using `as any`
- PACK chip uses amber tokens from status-cooking family — distinct from ALLERGY orange-500, consistent with order-type-tkwy coloring, signals "handle differently" without adding a new hue
- `effectiveType = t.orderType ?? 'dine-in'` — ensures legacy dine-in tickets (undefined orderType) pass through the Dine-in tab filter correctly, matching the DIN badge label

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- ESLint auto-formatter ran during `npm run lint` and reverted KdsBoard.tsx to its pre-edit state mid-execution. Re-applied changes via full Write (the linter removed the new imports and code block). Build confirmed passing before commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- KDS differentiation surface is complete for Plan 02
- Plan 19-03 (combo flag toggle in order entry) can proceed — no blockers from this plan
- All badge variants (order-type-din/tkwy/dlvr, grab, lineman) used correctly; channel filter established for any future board feature needing segmentation

---
*Phase: 19-kds-differentiation-+-combo-flag*
*Completed: 2026-03-15*
