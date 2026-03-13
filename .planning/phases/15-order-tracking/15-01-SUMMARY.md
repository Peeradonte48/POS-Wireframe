---
phase: 15-order-tracking
plan: "01"
subsystem: ui
tags: [css-tokens, oklch, tailwind, cva, badge, design-system]

requires:
  - phase: 14-merge-bill
    provides: settled and merged badge variants — established the pattern this plan extends

provides:
  - 4 new CSS token pairs (ordered/cooking/ready/escalated fg+bg) in @theme inline, :root, .dark
  - 4 new CVA badge variants: ordered, cooking, ready, escalated
  - Utility classes bg-status-ordered-bg, text-status-ordered, bg-status-cooking-bg, text-status-cooking, bg-status-ready-bg, text-status-ready, bg-status-escalated-bg, text-status-escalated available globally

affects:
  - 15-02-PLAN.md (order stage badge needs variant="ordered"|"cooking"|"ready"|"escalated")
  - 15-03-PLAN.md (per-item timeline badges)

tech-stack:
  added: []
  patterns:
    - "Order-tracking badge variant pattern: bg-status-{stage}-bg text-status-{stage} border-status-{stage}/30"
    - "OKLCH token tuning: ordered=hue250(blue), cooking=hue75(amber), ready=hue155(green), escalated=hue27(brand-red)"

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/components/ui/badge.tsx

key-decisions:
  - "cooking tokens reuse hue 75 (amber family) shared with check-requested — semantically 'in progress' states share warm amber; differentiated by lighter chroma at 0.18 vs check-requested context"
  - "escalated tokens use brand red hue 27 — consistent with destructive/primary brand color, signals urgency without introducing a new hue"
  - "Pre-existing lint errors in unrelated files (payment, kds, table-map components) are out of scope — logged to deferred-items.md, not fixed"

patterns-established:
  - "Order-stage OKLCH hue assignments: ordered=250(indigo), cooking=75(amber), ready=155(green), escalated=27(crimson)"

requirements-completed:
  - TRACK-01
  - TRACK-03

duration: 2min
completed: 2026-03-13
---

# Phase 15 Plan 01: Order-Tracking Token Foundations Summary

**4 OKLCH order-stage token pairs added to globals.css (ordered/cooking/ready/escalated) and 4 matching CVA badge variants added to badge.tsx, providing bg-status-* utility classes for Plans 02 and 03.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T03:13:22Z
- **Completed:** 2026-03-13T03:15:14Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Added 8 CSS custom property entries to `@theme inline` (var() references only — no literal OKLCH values)
- Added 8 OKLCH raw values to `:root` (light mode, independently tuned per hue)
- Added 8 OKLCH raw values to `.dark` (dark mode, not opacity reductions of light values)
- Added 4 CVA variants (`ordered`, `cooking`, `ready`, `escalated`) to `badgeVariants` in badge.tsx following the `settled` pattern

## Task Commits

1. **Task 1: Add order-tracking token pairs to globals.css** - `cf64bb7` (feat)
2. **Task 2: Add ordered, cooking, ready, escalated variants to badge.tsx** - `d861e0d` (feat)

## Files Created/Modified

- `src/app/globals.css` - 24 new lines: 8 in `@theme inline` (var() refs), 8 in `:root` (light OKLCH), 8 in `.dark` (dark OKLCH)
- `src/components/ui/badge.tsx` - 4 new CVA variant entries after `settled`

## Decisions Made

- cooking tokens reuse hue 75 (amber) shared with check-requested — semantically "in progress" states share warm amber family
- escalated tokens use brand red hue 27 — consistent with destructive/primary, signals urgency without a new hue family
- Pre-existing lint errors in unrelated files logged to deferred-items.md, not fixed (out of scope per deviation rules)

## Deviations from Plan

None — plan executed exactly as written.

The full lint pass revealed 7 pre-existing ESLint errors in unrelated files (payment page, kds timer, modifier sheet, merge sheet, open table modal, table bottom sheet, dwell timer). These predate Phase 15 and are not caused by this plan's changes. Logged to `deferred-items.md`.

## Issues Encountered

None — `npm run build` passed after each task. Lint errors are pre-existing in unrelated files.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plans 15-02 and 15-03 can now use `<Badge variant="ordered" />`, `<Badge variant="cooking" />`, `<Badge variant="ready" />`, `<Badge variant="escalated" />` without TypeScript errors
- All `bg-status-ordered-bg`, `text-status-ordered` (and cooking/ready/escalated equivalents) utility classes are available globally via Tailwind
- No blockers

---
*Phase: 15-order-tracking*
*Completed: 2026-03-13*
