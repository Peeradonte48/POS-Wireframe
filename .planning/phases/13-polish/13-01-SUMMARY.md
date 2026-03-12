---
phase: 13-polish
plan: 01
subsystem: ui
tags: [cva, tailwind, design-tokens, oklch, badge, button]

# Dependency graph
requires: []
provides:
  - "--status-settled and --status-settled-bg OKLCH tokens in :root, .dark, and @theme inline"
  - "Badge variant 'settled' using bg-status-settled-bg / text-status-settled"
  - "Button variant 'option-card' as full-width card with elevation and selected state"
affects: [13-02, 14-merge-bill]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CVA extended in-place — never wrap, never create a new component"
    - "@theme inline aliases only use var(--token), never literal OKLCH values"
    - "[box-shadow:var(--shadow-card)] Tailwind v4 arbitrary property avoids style={} at call sites"

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/components/ui/badge.tsx
    - src/components/ui/button.tsx

key-decisions:
  - "settled hue matches open (145 green) but chroma 0.21 vs 0.18 and lightness 0.48 vs 0.50 — distinguishes terminal/completed state from available"
  - "option-card uses border-2 + hover:border-primary pattern for affordance; data-[selected=true] attributes enable Phase 14 picker reuse without extra JS"
  - "[box-shadow:var(--shadow-card)] used in CVA string via Tailwind v4 arbitrary property — call sites need no style prop"

patterns-established:
  - "Status token three-place edit: :root (light values) + .dark (dark values) + @theme inline (var() aliases only)"
  - "CVA in-place extension: add variant entries directly in existing cva() call, never wrap"

requirements-completed: [POLISH-01]

# Metrics
duration: 1min
completed: 2026-03-12
---

# Phase 13 Plan 01: CVA Variants Foundation Summary

**OKLCH settled status token + Badge settled variant + Button option-card variant added to CVA systems as foundation for SplitSheet conformance**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-12T11:47:40Z
- **Completed:** 2026-03-12T11:48:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `--status-settled` / `--status-settled-bg` OKLCH tokens in all three required locations (`:root`, `.dark`, `@theme inline`)
- Extended `badgeVariants` CVA in-place with `settled` variant — uses token-based Tailwind utilities
- Extended `buttonVariants` CVA in-place with `option-card` variant — full-width card with elevation, hover border, and `data-[selected]` state attributes
- TypeScript build passes cleanly with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add --status-settled tokens to globals.css** - `9c01169` (feat)
2. **Task 2: Add settled Badge variant and option-card Button variant** - `8953515` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/app/globals.css` - Added 6 token lines: 2 in `:root`, 2 in `.dark`, 2 in `@theme inline`
- `src/components/ui/badge.tsx` - Added `settled` variant to `badgeVariants` CVA
- `src/components/ui/button.tsx` - Added `option-card` variant to `buttonVariants` CVA

## Decisions Made
- Settled hue 145 (green) matches `open` but uses chroma 0.21 vs open's 0.18 and lightness 0.48 vs 0.50, making it visually distinct as a "completed/terminal" state
- `option-card` uses `[box-shadow:var(--shadow-card)]` Tailwind v4 arbitrary property syntax — avoids `style={{}}` at call sites
- `data-[selected=true]` attributes baked into `option-card` variant for Phase 14 picker reuse without additional JS

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 13-02 (SplitSheet conformance) can now consume `<Badge variant="settled">` and `<Button variant="option-card">` directly
- All token-based Tailwind utilities (`bg-status-settled-bg`, `text-status-settled`, `border-status-settled`) are available via `@theme inline` aliases

---
*Phase: 13-polish*
*Completed: 2026-03-12*
