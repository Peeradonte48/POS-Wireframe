---
phase: 10-brand-token-refresh
plan: "01"
subsystem: ui
tags: [css, design-tokens, oklch, tailwind, dark-mode]

requires:
  - phase: 09-flow-alignment
    provides: stable component baseline — no outstanding visual regressions before token work

provides:
  - globals.css with TOKEN-01 crimson primary at chroma 0.26 in light and dark
  - globals.css with TOKEN-02 10 status color tokens (5 states x fg + bg) across :root, .dark, @theme inline
  - globals.css with TOKEN-03 3-tier elevation shadow tokens in :root and .dark

affects:
  - 10-brand-token-refresh (Plan 02 — component polish consumes these tokens by name)
  - 11-component-polish (TableTile badge pill refactor needs status tokens)

tech-stack:
  added: []
  patterns:
    - "OKLCH token layering: :root has literal values, .dark overrides with independently-tuned L/C, @theme inline has var() aliases only"
    - "Dark mode shadow approach: white inset ring (0 0 0 1px oklch(1 0 0 / alpha)) + deep black blur — avoids invisible drop shadows on dark surfaces"
    - "Shadow tokens excluded from @theme inline — applied via style={{ boxShadow: 'var(--shadow-card)' }} in TSX"

key-files:
  created: []
  modified:
    - src/app/globals.css

key-decisions:
  - "Status token naming uses --color-status-{state} and --color-status-{state}-bg pattern — supports bg-status-open and text-status-occupied Tailwind utilities via @theme inline aliases"
  - "Occupied status uses hue 10 (semantic red) distinct from brand crimson hue 27 — prevents color collision between brand primary and error-state table indicator"
  - "Cleaning status uses low chroma (0.06) warm neutral (hue 50) — visually calm state that reads as neutral/informational, not urgent"
  - "Dark mode status tokens independently tuned (higher L for fg, lower L for bg) rather than opacity-reduced light values — opacity reduction on OKLCH in dark backgrounds creates muddy washed-out colors"
  - "Shadow tokens not in @theme inline by design — they are multi-value strings incompatible with Tailwind's color utility generation; direct var() usage in TSX is the correct pattern"

patterns-established:
  - "Token layering: :root literal → .dark literal override → @theme inline var() alias — all three required for dark-mode-safe Tailwind utility generation"
  - "Never put literal OKLCH in @theme inline — Tailwind bakes the value at compile time, dark block override never fires"

requirements-completed: [TOKEN-01, TOKEN-02, TOKEN-03]

duration: 4min
completed: 2026-03-12
---

# Phase 10 Plan 01: Brand Token Refresh Summary

**OKLCH design token foundation: crimson primary at chroma 0.26, 10 semantic status color tokens (5 table states x fg+bg), and 3-tier elevation shadow system — all dark-mode-safe across :root, .dark, and @theme inline**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-12T18:42:57Z
- **Completed:** 2026-03-12T18:46:33Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- TOKEN-01: Bumped --primary chroma from 0.22 to 0.26 in :root, .dark, and all @theme brand-red aliases — crimson reads visibly bolder in both modes
- TOKEN-02: Added 10 status color tokens covering all 5 table states (Open, Occupied, Reserved, Check Requested, Cleaning), each with fg and bg variant, independently tuned for light and dark surfaces
- TOKEN-03: Added 3-tier elevation shadow system (card/panel/floating) — light mode uses soft multi-layer drop shadows, dark mode uses glow/border approach (white ring + deep black blur)

## Task Commits

Each task was committed atomically:

1. **Task 1: Bump crimson chroma + add status color tokens** - `3118e4f` (feat)
2. **Task 2: Add elevation shadow tokens** - `154ff48` (feat)

## Files Created/Modified

- `src/app/globals.css` — TOKEN-01 chroma bump, 10 status tokens across 3 blocks, 3 shadow tokens in :root and .dark

## Decisions Made

- Shadow tokens deliberately excluded from `@theme inline` — they are multi-value CSS strings and cannot map to Tailwind color utilities; components will consume them via `style={{ boxShadow: 'var(--shadow-card)' }}`
- Occupied status hue 10 (warm red) vs brand primary hue 27 (crimson) — two distinct reds, different semantic meanings, different hues to stay visually separable
- Dark mode status tokens use independently tuned lightness (L 0.70 fg / L 0.22–0.28 bg) rather than opacity reduction on light values — prevents muddy appearance on dark backgrounds

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All design tokens are now authoritative in globals.css
- Plan 02 (component polish) can safely reference --color-status-*, --shadow-*, and --primary tokens by name
- TableTile badge pill refactor (Plan 02) should read STATUS_CONFIG shape before writing — noted as existing blocker in STATE.md

---
*Phase: 10-brand-token-refresh*
*Completed: 2026-03-12*
