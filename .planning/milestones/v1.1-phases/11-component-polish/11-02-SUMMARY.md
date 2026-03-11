---
phase: 11-component-polish
plan: "02"
subsystem: ui
tags: [tailwind-v4, css-utility, typography, design-system]

requires:
  - phase: 10-brand-token-refresh
    provides: semantic token architecture (@theme inline --color-primary, --muted-foreground)

provides:
  - "@utility caps block in globals.css — shared section label style (text-xs font-semibold uppercase tracking-wide text-muted-foreground)"
  - "Hero grand total text (text-2xl font-black text-primary) in TicketPanel footer and TotalsSection"
  - "All 13 inline caps-pattern occurrences replaced with className=caps across 8 files"

affects:
  - 11-component-polish (11-03 onward)

tech-stack:
  added: []
  patterns:
    - "@utility caps via @apply in Tailwind v4 — theme() references not resolvable in this project setup; @apply is the correct approach"
    - "Hero price: text-2xl font-black text-primary — brand crimson as focal payment amount"

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/components/order/TicketPanel.tsx
    - src/components/payment/TotalsSection.tsx
    - src/components/manager/SalesSnapshotTab.tsx
    - src/components/manager/EodSummaryTab.tsx
    - src/components/manager/EightySixTab.tsx
    - src/components/manager/OpenTicketsTab.tsx
    - src/components/kds/KdsBoard.tsx
    - src/components/kds/KdsRecallTray.tsx
    - src/app/(app)/payment/[tableId]/page.tsx

key-decisions:
  - "@utility caps uses @apply text-xs font-semibold uppercase tracking-wide text-muted-foreground — theme() function not resolvable in this project's Tailwind v4/PostCSS pipeline; @apply is the correct equivalent"
  - "KdsBoard column header: tracking-widest standardized to tracking-wide via caps utility"
  - "KdsRecallTray RECALLED label: /60 opacity modifier dropped — standardized to full muted-foreground per caps spec"
  - "payment/[tableId] Items label: text-sm intentionally regressed to text-xs (caps) per CONTEXT.md"

patterns-established:
  - "Pattern: @utility with @apply inside globals.css for project-wide custom utilities in Tailwind v4"
  - "Pattern: Hero price readout = text-2xl font-black text-primary on grand total amount spans"

requirements-completed:
  - COMP-04
  - COMP-05

duration: 3min
completed: 2026-03-12
---

# Phase 11 Plan 02: Component Polish Summary

**`@utility caps` single-source section label system and `text-2xl font-black text-primary` hero price readouts applied across 9 files, eliminating 13 inline caps-pattern duplications.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T04:44:33Z
- **Completed:** 2026-03-12T04:46:37Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Defined `@utility caps` in globals.css using `@apply` — single authoritative source for all section label styling
- Upgraded TicketPanel footer running total and TotalsSection grand total to `text-2xl font-black text-primary` (brand crimson hero readout)
- Replaced all 13 inline caps-pattern class strings across 8 files with `className="caps"`; build exits 0

## Task Commits

1. **Task 1: Define @utility caps in globals.css** - `05def3e` (feat)
2. **Task 2: Hero price text + caps audit across all files** - `b70f97c` (feat)

## Files Created/Modified

- `src/app/globals.css` — added `@utility caps { @apply ... }` block; fixed to use @apply after build failure with theme()
- `src/components/order/TicketPanel.tsx` — round label and footer Total label → caps; running total → text-2xl font-black text-primary
- `src/components/payment/TotalsSection.tsx` — Total label → caps; grand total amount → text-2xl font-black text-primary
- `src/components/manager/SalesSnapshotTab.tsx` — Top Items label → caps
- `src/components/manager/EodSummaryTab.tsx` — all four section labels → caps
- `src/components/manager/EightySixTab.tsx` — category header → caps
- `src/components/manager/OpenTicketsTab.tsx` — both section labels → caps
- `src/components/kds/KdsBoard.tsx` — column header div → caps (tracking-widest standardized)
- `src/components/kds/KdsRecallTray.tsx` — RECALLED span → caps (opacity modifier dropped)
- `src/app/(app)/payment/[tableId]/page.tsx` — Items label → caps mb-2

## Decisions Made

- `@utility caps` defined with `@apply` rather than `theme()` CSS function references — `theme(--font-size-xs)` and `theme(--tracking-wide)` produced a CSS resolution error at build time in this project's Tailwind v4 + PostCSS setup. Using `@apply text-xs font-semibold uppercase tracking-wide text-muted-foreground` produces identical output and passes the build.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced theme() with @apply in @utility caps**
- **Found during:** Task 1 and caught during build verification in Task 2
- **Issue:** `theme(--font-size-xs)` and `theme(--tracking-wide)` not resolvable in this project's Tailwind v4 PostCSS pipeline — build failed with `CssSyntaxError: Could not resolve value for theme function`
- **Fix:** Changed `@utility caps` body from `theme()` references to `@apply text-xs font-semibold uppercase tracking-wide text-muted-foreground` — semantically equivalent output
- **Files modified:** `src/app/globals.css`
- **Verification:** `npm run build` exits 0 after fix
- **Committed in:** `b70f97c` (Task 2 commit, amended globals.css)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required syntax correction for build compatibility. Output is identical — the utility produces the same compiled CSS properties. No scope change.

## Issues Encountered

- Tailwind v4 `theme()` function inside `@utility` block does not resolve `--font-size-xs` or `--tracking-wide` in this project's setup. Switched to `@apply` which is the correct and supported approach for composing Tailwind utilities inside a `@utility` block.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- COMP-04 and COMP-05 complete — visual hierarchy and hero price readouts are done
- All 9 files updated; build clean
- COMP-01 (cta button size + glow), COMP-02 (status badge pills), COMP-03 (elevation tokens) remain for subsequent plans in phase 11

---
*Phase: 11-component-polish*
*Completed: 2026-03-12*
