---
phase: 13-polish
plan: "03"
subsystem: ui
tags: [fonts, next-font, ibm-plex-sans, tailwind-css, css-tokens]

# Dependency graph
requires:
  - phase: 13-01
    provides: CVA variants foundation and globals.css token structure this plan targets
provides:
  - IBM Plex Sans as primary body font replacing Inter app-wide
  - --font-sans CSS token updated to reference ibm-plex-sans + noto-thai fallback
  - Thai text fallback chain fixed (Noto Sans Thai now in CSS font stack)
affects: [14-merge, 15-order-tracking, any future UI work consuming --font-sans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IBM_Plex_Sans registered as static font in next/font/google with explicit weight array (no variable font)"
    - "--font-sans @theme inline token references CSS variables injected by layout.tsx body className"

key-files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "IBM Plex Sans requires explicit weight array ['400','500','600','700'] because it is a static font (not variable font like Inter)"
  - "600 weight explicitly included to support font-semibold usage throughout app UI"
  - "Noto Sans Thai added to --font-sans CSS token stack — variable was already injected into DOM via body className but was missing from the token declaration"

patterns-established:
  - "Static Google fonts: use IBM_Plex_Sans pattern with explicit weight array, not variable font config"

requirements-completed: [POLISH-01]

# Metrics
duration: 2min
completed: "2026-03-12"
---

# Phase 13 Plan 03: Font Swap Summary

**IBM Plex Sans replaces Inter as primary body font via next/font/google, with Noto Sans Thai added to the --font-sans CSS token stack to fix the missing Thai text fallback**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-12T11:51:37Z
- **Completed:** 2026-03-12T11:53:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced Inter with IBM_Plex_Sans in layout.tsx with correct static-font weight array (400/500/600/700)
- Updated --font-sans CSS token in globals.css @theme inline to reference --font-ibm-plex-sans
- Fixed pre-existing Thai text fallback gap by adding var(--font-noto-thai) to --font-sans before system-ui
- TypeScript/build passes cleanly with 0 errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap Inter for IBM Plex Sans in layout.tsx** - `7c6194f` (feat)
2. **Task 2: Update --font-sans token in globals.css** - `9905f6e` (feat)

**Plan metadata:** committed with docs commit following

## Files Created/Modified
- `src/app/layout.tsx` - IBM_Plex_Sans imported, ibmPlexSans registered with 4 weights, body className updated
- `src/app/globals.css` - --font-sans token updated from var(--font-inter) to var(--font-ibm-plex-sans) + var(--font-noto-thai) added

## Decisions Made
- IBM Plex Sans is a static font family (not a variable font), so `weight: ['400', '500', '600', '700']` is required. Omitting 600 would break all `font-semibold` usages across the app.
- Noto Sans Thai was already registered in layout.tsx and its CSS variable injected into the DOM, but was absent from the --font-sans token declaration. Adding it here is a correctness fix, not a new feature.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` shows 6 pre-existing errors in unrelated files (payment page, kds timer, modifier sheet, table bottom sheet, etc.). These are out of scope — not caused by this plan's changes and were present before execution. Deferred per scope boundary rule.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Font swap is complete and visible app-wide on dev server start
- No blockers for Phase 14 (Merge Bill) or Phase 15 (Order Tracking)
- Pre-existing lint errors in unrelated files remain deferred

---
*Phase: 13-polish*
*Completed: 2026-03-12*
