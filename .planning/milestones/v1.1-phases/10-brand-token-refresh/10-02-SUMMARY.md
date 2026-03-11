---
phase: 10-brand-token-refresh
plan: "02"
subsystem: ui
tags: [tailwind, tokens, design-system, css-variables, oklch]

# Dependency graph
requires:
  - phase: 10-01
    provides: "Semantic status token definitions in globals.css @theme inline (--color-status-*, --color-status-check-requested-bg)"
provides:
  - "TOKEN-04 complete: TableTile STATUS_CONFIG uses border-l-status-* and text-status-* token classes"
  - "KdsTicketCard timer ternary uses text-status-occupied / text-status-check-requested / text-status-open"
  - "KdsTicketCard BUMP button uses bg-status-open / hover:bg-status-open/80 / ring-status-open/60"
  - "AppSidebar shift-lock banner uses bg-status-check-requested-bg / border-status-check-requested/30 / text-status-check-requested"
  - "Zero raw palette classes in all three component files"
affects:
  - phase-11-component-polish
  - any future refactor touching table status rendering or KDS ticket display

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status color rendering via semantic token classes (text-status-*, border-l-status-*, bg-status-*) — palette classes banned from component layer"
    - "Tailwind v4 @theme inline tokens auto-generate utility classes, including directional border colors (border-l-status-open)"
    - "BUMP button enabled state uses opacity modifier syntax for hover/ring (bg-status-open/80, ring-status-open/60)"

key-files:
  created: []
  modified:
    - src/components/table-map/TableTile.tsx
    - src/components/kds/KdsTicketCard.tsx
    - src/components/app-shell/AppSidebar.tsx

key-decisions:
  - "Token classes used directly as Tailwind utility strings — no CSS-in-JS or style props; globals.css @theme inline generates the utilities at build time"
  - "border-l-status-* confirmed working in Tailwind v4 without arbitrary value fallback — directional border color auto-generated from --color-status-* aliases"
  - "BUMP button active state uses opacity modifier (bg-status-open/80) rather than a distinct token, keeping token count lean"

patterns-established:
  - "STATUS_CONFIG record: all borderClass and textClass values must use status token names, never raw palette strings"
  - "KDS timer urgency tiers map to semantic status tokens: critical=occupied, warning=check-requested, ok=open"

requirements-completed:
  - TOKEN-04

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 10 Plan 02: Brand Token Refresh Summary

**Three TSX components fully migrated to semantic status tokens — zero raw Tailwind palette classes remain in TableTile, KdsTicketCard, or AppSidebar**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T19:12:29Z
- **Completed:** 2026-03-12T19:17:45Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- STATUS_CONFIG in TableTile.tsx: all 10 borderClass/textClass values replaced with border-l-status-* and text-status-* token strings
- KdsTicketCard.tsx timer ternary and BUMP button: 6 palette class strings replaced with status token equivalents
- AppSidebar.tsx shift-lock banner: 3 amber palette classes replaced with check-requested token classes
- next build passes cleanly after all replacements — Tailwind v4 auto-generates border-l-status-* utilities without arbitrary value fallback needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hardcoded classes in TableTile.tsx and KdsTicketCard.tsx** - `d905f3e` (feat)
2. **Task 2: Replace hardcoded classes in AppSidebar.tsx** - `35b8c37` (feat)

## Files Created/Modified

- `src/components/table-map/TableTile.tsx` - STATUS_CONFIG uses border-l-status-* and text-status-* tokens exclusively
- `src/components/kds/KdsTicketCard.tsx` - Timer ternary and BUMP button use status token classes
- `src/components/app-shell/AppSidebar.tsx` - Shift-lock banner uses check-requested token classes

## Decisions Made

- border-l-status-* works natively in Tailwind v4 — no arbitrary value fallback (`border-l-[color:var(...)]`) required; the plan's fallback note was not needed
- BUMP button hover/ring use opacity modifier syntax (bg-status-open/80, ring-status-open/60) — avoids adding dedicated hover-state tokens to the token system

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Tailwind v4 directional border color generation from @theme inline tokens worked as expected without the fallback the plan anticipated might be needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TOKEN-04 complete: all four TOKEN requirements (01-04) are now satisfied
- Phase 11 (Component Polish) can proceed — it has a correct, complete semantic token baseline to reference
- No blockers

---
*Phase: 10-brand-token-refresh*
*Completed: 2026-03-12*

## Self-Check: PASSED

- FOUND: src/components/table-map/TableTile.tsx
- FOUND: src/components/kds/KdsTicketCard.tsx
- FOUND: src/components/app-shell/AppSidebar.tsx
- FOUND: .planning/phases/10-brand-token-refresh/10-02-SUMMARY.md
- FOUND: commit d905f3e (Task 1)
- FOUND: commit 35b8c37 (Task 2)
