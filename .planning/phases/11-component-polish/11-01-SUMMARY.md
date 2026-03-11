---
phase: 11-component-polish
plan: 01
subsystem: ui
tags: [tailwind, cva, button, badge, status-tokens, oklch]

# Dependency graph
requires:
  - phase: 10-brand-token-refresh
    provides: semantic status token aliases (--color-status-*-bg, text-status-*, border-l-status-*)
provides:
  - buttonVariants with cta size (h-11), active:scale-[0.97] press feedback, default hover glow via var(--color-primary)
  - Filled pill Badge render for all five TableTile status states using status-bg tokens
  - KDS stage badge (New/In Progress/Ready) with three distinct color fills in KdsTicketCard header
affects: [12-component-polish, any future phase touching button.tsx or TableTile status display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "cta size variant in buttonVariants: h-11 gap-2 px-6 font-semibold — 44px touch target for primary CTAs"
    - "Hover glow via color-mix(in oklch, var(--color-primary) 25%, transparent) — adapts to dark mode automatically"
    - "KDS_STAGE_CONFIG lookup: New=green, InProgress=amber, Ready=blue using existing status-bg tokens"
    - "Badge border-0 override required to suppress default outline border on filled pill style"

key-files:
  created: []
  modified:
    - src/components/ui/button.tsx
    - src/components/table-map/TableTile.tsx
    - src/components/kds/KdsTicketCard.tsx
    - src/components/table-map/OpenTableModal.tsx
    - src/components/order/TicketPanel.tsx
    - src/app/(app)/payment/[tableId]/page.tsx

key-decisions:
  - "active:scale-[0.97] transition-transform added to base CVA string — affects ALL buttons (matches TableTile pattern already shipping)"
  - "Hover glow uses color-mix(in oklch, ...) at 25% opacity — visible ring without being loud; primary token means dark mode adaptation is automatic"
  - "KDS stage colors reuse existing status tokens (open-bg=green, check-requested-bg=amber, reserved-bg=blue) — no new tokens needed"
  - "Badge border-0 on filled pills prevents default outline border from bleeding through colored backgrounds"

patterns-established:
  - "CTA pattern: size=\"cta\" on all 44px primary action buttons — Open Table, Send to Kitchen, Confirm Payment"
  - "Status pill pattern: <Badge className=\"${bgClass} ${textClass} border-0\"> for all filled status indicators"

requirements-completed: [COMP-01, COMP-02]

# Metrics
duration: 2min
completed: 2026-03-12
---

# Phase 11 Plan 01: Component Polish Summary

**Crimson CTA buttons with press scale and hover glow, plus filled status pill badges on TableTile and KDS using semantic token colors**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-11T20:04:38Z
- **Completed:** 2026-03-11T20:07:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- COMP-01: `buttonVariants` extended with `cta` size (h-11/44px), `active:scale-[0.97]` press animation on all buttons, and `hover:shadow` glow ring on default variant using primary OKLCH token
- COMP-02: All five TableTile status states now render as filled `<Badge>` pills (Open/Occupied/Reserved/Check Requested/Cleaning) with distinct background colors
- COMP-02: KDS ticket card header now shows New/In Progress/Ready stage badge with three distinct color fills between table label and timer

## Task Commits

1. **Task 1: Extend buttonVariants — cta size, press scale, default glow (COMP-01)** - `1eae33e` (feat)
2. **Task 2: Filled status pill badges — TableTile + KdsTicketCard (COMP-02)** - `def5575` (feat)

## Files Created/Modified

- `src/components/ui/button.tsx` — Added `cta` size, `active:scale-[0.97]` to base, hover glow to default variant
- `src/components/table-map/TableTile.tsx` — Added `bgClass` to STATUS_CONFIG; status row replaced with filled Badge
- `src/components/kds/KdsTicketCard.tsx` — Added Badge import, KDS_STAGE_CONFIG, and stage badge in header
- `src/components/table-map/OpenTableModal.tsx` — "Open Table" button upgraded to `size="cta"`
- `src/components/order/TicketPanel.tsx` — "Send to Kitchen" button upgraded to `size="cta"`, removed redundant h-11/px-5 classes
- `src/app/(app)/payment/[tableId]/page.tsx` — "Confirm Payment" button upgraded to `size="cta"`, removed redundant h-12

## Decisions Made

- `active:scale-[0.97] transition-transform` appended to base CVA string (not variant-specific) so press feedback applies universally to all buttons, consistent with existing TableTile tile behavior
- Hover glow shadow uses `color-mix(in oklch, var(--color-primary) 25%, transparent)` — 25% opacity gives a visible but non-aggressive ring; oklch interpolation preserves color accuracy across light/dark modes
- KDS_STAGE_CONFIG maps stages to existing status-bg tokens to avoid adding new tokens: New → open-bg (green = waiting), InProgress → check-requested-bg (amber = active work), Ready → reserved-bg (blue = awaiting collection)
- `border-0` is required on filled pill Badges to prevent the default Badge outline border from overlapping the background color

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- COMP-01 and COMP-02 requirements satisfied; Phase 11 Plan 02 can proceed
- All primary CTAs are now 44px with press scale and hover glow
- Status pills are visually distinct across all five states on both floor plan and KDS

---
*Phase: 11-component-polish*
*Completed: 2026-03-12*
