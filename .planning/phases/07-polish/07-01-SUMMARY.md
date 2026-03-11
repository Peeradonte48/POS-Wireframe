---
phase: 07-polish
plan: 01
subsystem: ui
tags: [tailwind, oklch, next-themes, dark-mode, fonts, next-image]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: globals.css with shadcn tokens and @theme block; layout.tsx root structure
provides:
  - OKLCH crimson brand tokens (--color-brand-red, --color-brand-red-hover, --color-brand-red-muted)
  - --primary overridden to oklch(0.52 0.22 27) in :root and oklch(0.63 0.22 27) in .dark
  - Fixed @custom-variant dark using where() selector
  - Inter + Noto Sans JP + Noto Sans Thai font variables in layout.tsx
  - ThemeProvider client wrapper at src/providers/ThemeProvider.tsx
  - ThemeToggle component at src/components/ui/theme-toggle.tsx
  - Unsplash remotePatterns in next.config.ts
affects: [07-02-icons, 07-03-screens, 07-04-toasts, all downstream polish plans]

# Tech tracking
tech-stack:
  added: [next-themes, solar-icon-set, Inter (next/font), Noto Sans JP (next/font), Noto Sans Thai (next/font)]
  patterns: [ThemeProvider client wrapper pattern, OKLCH color token naming convention]

key-files:
  created:
    - src/providers/ThemeProvider.tsx
    - src/components/ui/theme-toggle.tsx
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
    - next.config.ts
    - package.json
    - package-lock.json

key-decisions:
  - "@custom-variant dark uses where(.dark, .dark *) — matches html element itself (next-themes sets class on html, not a parent)"
  - "ThemeToggle uses text symbol placeholders (&#9728;/&#9790;) — Plan 02 replaces with Solar Sun/Moon SVG icons"
  - "--font-mono keeps --font-geist-mono variable (existing mono font from Phase 1) rather than replacing it"
  - "Noto Sans Thai added as third font variable for Thai nameTh fields coverage"

patterns-established:
  - "Brand colors use OKLCH with named semantic tokens (--color-brand-red, --color-brand-red-hover, --color-brand-red-muted)"
  - "ThemeProvider wraps <body> children — not <html> — to work with suppressHydrationWarning on html element"

requirements-completed: [POLISH-01, POLISH-02, POLISH-03, POLISH-04]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 7 Plan 01: Brand Foundation Summary

**OKLCH crimson tokens, Inter/Noto fonts, fixed dark mode selector, and next-themes ThemeProvider — all config/provider files, zero component changes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T10:11:21Z
- **Completed:** 2026-03-11T10:13:01Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Brand color system migrated from blue oklch(0.55 0.18 262) to crimson oklch(0.52 0.22 27) across --primary and named brand tokens
- Dark mode variant selector fixed from `is(.dark *)` to `where(.dark, .dark *)` so next-themes class on html element applies correctly
- Font stack replaced: Geist → Inter + Noto Sans JP + Noto Sans Thai with correct CSS variable names wired into --font-sans cascade
- ThemeProvider and ThemeToggle created; ThemeProvider wraps app root in layout.tsx with suppressHydrationWarning
- Unsplash added to next.config.ts remotePatterns for next/image usage in downstream plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Brand tokens + dark mode fix + Unsplash remotePatterns** - `a545aaf` (feat)
2. **Task 2: Font swap + ThemeProvider + ThemeToggle + install deps** - `ad55145` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/globals.css` - Brand OKLCH tokens, fixed @custom-variant dark selector, --primary overrides, --font-sans cascade
- `next.config.ts` - Added images.unsplash.com to remotePatterns
- `src/providers/ThemeProvider.tsx` - NextThemesProvider client wrapper (attribute=class, enableSystem)
- `src/components/ui/theme-toggle.tsx` - Sun/moon symbol toggle wired to next-themes useTheme
- `src/app/layout.tsx` - Inter + Noto Sans JP + Noto Sans Thai fonts, ThemeProvider wrapping, suppressHydrationWarning, title updated
- `package.json` / `package-lock.json` - next-themes and solar-icon-set added

## Decisions Made

- `@custom-variant dark` uses `where(.dark, .dark *)` instead of `is(.dark *)` — next-themes adds .dark to `<html>`, not a parent, so `is(.dark *)` would not match the element itself
- ThemeToggle uses text character symbols as placeholders (sun/moon unicode) — Plan 02 replaces with Solar icon SVGs once the library integration is tested
- Noto Sans Thai included alongside Noto Sans JP to cover Thai text in nameTh fields used throughout the app
- `--font-mono` retains `--font-geist-mono` reference from Phase 1 foundation (not replaced since no mono font change was specified)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Brand tokens are live in globals.css; all downstream plans can reference `--color-brand-red` and `bg-primary`
- Dark mode infrastructure is ready; Plan 02 can add Solar icons to ThemeToggle immediately
- ThemeProvider exports `ThemeProvider` from `@/providers/ThemeProvider` — consistent import path for any future providers
- Unsplash images loadable via `<Image>` from next/image without runtime errors

---
*Phase: 07-polish*
*Completed: 2026-03-11*
