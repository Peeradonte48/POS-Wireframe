---
phase: 13-polish
plan: 02
subsystem: ui
tags: [cva, tailwind, splitsheet, payment, responsive, caps-utility]

# Dependency graph
requires:
  - phase: 13-01
    provides: "Badge variant 'settled' + Button variant 'option-card' from Plan 01 CVA foundation"
provides:
  - "SplitSheet.tsx fully conformant — no raw green palette, no bespoke button elements, no inline caps clusters, no flex-wrap seat reflow"
affects: [13-03, 14-merge-bill]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "caps utility class replaces inline text-sm font-semibold text-muted-foreground uppercase tracking-wide clusters"
    - "overflow-x-auto snap-x pb-1 horizontal scroll row replaces flex-wrap for seat pickers"

key-files:
  created: []
  modified:
    - src/components/payment/SplitSheet.tsx

key-decisions:
  - "snap-x added to seat picker scroll container for snappier touch feel; pb-1 gives scrollbar breathing room"
  - "justify-center removed from seat picker when switching to overflow-x-auto — centering is irrelevant in horizontal scroll context"
  - "[13-02] option-card variant height override: !h-auto required in CVA string to override default Button h-8 size — auto-fixed post human-verify checkpoint"

patterns-established:
  - "Horizontal scroll seat picker: overflow-x-auto gap-2 pb-1 snap-x — single-row, no wrapping at any viewport"

requirements-completed: [POLISH-01, POLISH-02]

# Metrics
duration: 2min
completed: 2026-03-12
---

# Phase 13 Plan 02: SplitSheet Conformance Summary

**All 8 POLISH-01/02 violations removed from SplitSheet.tsx — CVA variants, caps utility, and horizontal scroll seat picker replace raw palette classes, bespoke buttons, and flex-wrap**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-12T11:51:31Z
- **Completed:** 2026-03-12T11:53:58Z
- **Tasks:** 2 auto + 1 checkpoint (human-verify)
- **Files modified:** 1

## Accomplishments
- Replaced 2x raw `bg-green-*`/`text-green-*` Settled badges with `<Badge variant="settled">`
- Replaced 2x raw `<button>` mode-select cards with `<Button variant="option-card">`
- Replaced 2x raw `<button>` Back links with `<Button variant="ghost" size="sm">`
- Replaced 2x inline caps clusters (`text-sm font-semibold text-muted-foreground uppercase tracking-wide`) with `caps` utility
- Replaced 2x `flex flex-wrap` seat pickers with `overflow-x-auto gap-2 pb-1 snap-x` horizontal scroll row

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace POLISH-01 violations in SplitSheet.tsx** — `3012202` (feat)
2. **Task 2: Fix responsive seat picker layout (POLISH-02)** — `24ee1cb` (feat)
3. **Post-checkpoint fix: force !h-auto on option-card variant** — `42fa134` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/payment/SplitSheet.tsx` — All 8 violations resolved across both tasks
- `src/components/ui/button.tsx` — Added `!h-auto` to option-card variant (post-checkpoint auto-fix)

## Decisions Made
- `snap-x` added to seat picker scroll row — CSS scroll snapping gives a snappier feel on touch devices without JS
- `justify-center` removed from seat picker when switching to `overflow-x-auto` — centering is inapplicable for horizontal scroll contexts; seats start at left edge

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] option-card variant height collapsed due to h-8 default size override**
- **Found during:** human-verify checkpoint (visual inspection)
- **Issue:** Button component applies `h-8` from the default size variant, which overrode the `h-auto` implied by the multi-line `flex-col items-start` option-card content. Mode-select cards rendered as small collapsed strips rather than full card height.
- **Fix:** Added `!h-auto` to the option-card CVA variant string in `src/components/ui/button.tsx`
- **Files modified:** `src/components/ui/button.tsx`
- **Commit:** `42fa134`

## Issues Encountered
Pre-existing lint errors in 6 unrelated files (`payment/[tableId]/page.tsx`, `useKdsTimer.ts`, `ModifierSheet.tsx`, `OpenTableModal.tsx`, `TableBottomSheet.tsx`, `useDwellTimer.ts`) — all outside this plan's scope. Build (TypeScript) passes cleanly. Deferred to `deferred-items.md`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SplitSheet.tsx is fully conformant — ready for Phase 14 merge-bill work
- `<Button variant="option-card">` used in mode-select cards can accept `data-[selected=true]` for Phase 14 table merge picker without additional changes
- Human verification checkpoint approved — all visual checks passed (settled badge, option-card buttons, seat picker scroll, caps labels)

---
*Phase: 13-polish*
*Completed: 2026-03-12*
