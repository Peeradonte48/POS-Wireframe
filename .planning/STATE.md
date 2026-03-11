---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Bug Fixes + Brand Polish
status: completed
last_updated: "2026-03-11T20:07:17Z"
last_activity: 2026-03-12 — 11-01 COMP-01/COMP-02 (button cta size + press scale + hover glow; filled status pill badges — TableTile, KdsTicketCard)
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 13
  completed_plans: 13
  percent: 95
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-12
**Session:** Completed 11-01 (COMP-01/COMP-02) — Button cta size, press scale, hover glow; filled status pills on TableTile and KDS

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11 — Milestone v1.1 started)

**Core value:** A restaurant staff member can open a shift, seat a table, take a full ramen order with modifiers, send it to the kitchen, and close the bill — all from a mobile PWA that feels fast enough for real service conditions.

**Current focus:** v1.1 — Phase 8 complete, ready for Phase 9

**Stack:** Next.js 15 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui (Base UI) + Zustand 5 (persist) + Solar icon set

**Deliverable:** Browser-based interactive Hi-Fi wireframe — dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

Phase: 11 of 11 (Component Polish) — v1.1 Phase 4 — Plan 01 COMPLETE
Plan: 11-01 done (COMP-01/COMP-02) — button cta size, press scale, hover glow; filled status pill badges
Status: Phase 11 Plan 01 complete — COMP-01 and COMP-02 requirements satisfied
Last activity: 2026-03-12 — 11-01 COMP-01/COMP-02 (button cta size + press scale + hover glow; filled status pill badges — TableTile, KdsTicketCard)

```
Progress: [██████████] 95% (13/13 plans complete in active phases)
```

---

## Accumulated Context

See `.planning/PROJECT.md` for full key decisions log.

### Active for v1.1

- Phase 8 must land before any CSS changes — bugs create conflation risk between visual regressions and bug fixes
- Phase 10 depends on Phase 8 (Toaster dark-mode verification requires Bug 3 fixed first)
- Phase 11 depends on Phase 10 (component polish against correct token baseline)
- Phase 9 (Flow Alignment) depends on Phase 8 but can run before or in parallel with Phase 10

### Key Decisions (09-01)

- useState<number | ''> union for numeric inputs that must start empty — empty string sentinel enforces forced-entry via disabled prop; typeof guard at callsite ensures number type flows to store
- Served-at paragraph placed after orderStage badge, before action buttons — natural reading order in Occupied sheet; guards on servedAt !== null (null by default until markServed() fires)

### Key Decisions (09-02)

- CameraSheet useEffect cleanup: cancels 1.5s scan timer when user taps X before auto-close fires — prevents phantom coupon application on dismissed sheet
- setCouponApplied propagated as prop to TotalsSection: required for scan callback; onApplyCoupon kept for interface compat
- QrPanel discountApplied prop: optional number, conditionally renders "(after ฿X discount)" when > 0; naming differs from page-local discountAmount intentionally

### Key Decisions (08-05)

- Manager page role guard: useEffect condition is `role !== null && role !== 'Manager'` — null-check prevents redirect before Zustand hydration, avoiding race with (app)/layout.tsx auth guard
- Early return uses `role !== 'Manager'` (covers null) — unauthenticated users see blank while layout redirects to /login; non-manager roles see blank while useEffect fires

### Key Decisions (08-03)

- ThemedToaster pattern: thin 'use client' wrapper around sonner Toaster to enable useTheme in server layout tree — mount once per layout, never on individual pages
- Use resolvedTheme (not theme) from useTheme — sonner does not handle 'system' string correctly; resolvedTheme is always 'light' or 'dark'
- KDS layout confirmed to need its own Toaster (separate route group from (app))

### Key Decisions (08-02)

- KDS role guard uses explicit allowlist `role !== 'Kitchen' && role !== 'Manager'` — prevents accidental access by other roles when new roles are added in future

### Key Decisions (10-01)

- Shadow tokens excluded from @theme inline — multi-value CSS strings incompatible with Tailwind color utility generation; consumed via `style={{ boxShadow: 'var(--shadow-card)' }}` in TSX
- Status occupied uses hue 10 (semantic red) distinct from brand crimson hue 27 — prevents visual collision between brand primary and error-state table indicator
- Dark mode status tokens independently tuned (higher L for fg, lower L for bg) not opacity-reduced — opacity reduction on OKLCH in dark backgrounds creates muddy washed-out colors
- TOKEN-01 RESOLVED: --primary chroma now 0.26 in both :root and .dark; @theme brand-red aliases updated to match

### Key Decisions (10-02)

- border-l-status-* works natively in Tailwind v4 without arbitrary value fallback — directional border colors auto-generated from @theme inline --color-status-* aliases
- BUMP button uses opacity modifier syntax (bg-status-open/80, ring-status-open/60) — avoids adding dedicated hover-state tokens; TOKEN-04 complete

### Key Decisions (11-01)

- active:scale-[0.97] transition-transform added to base CVA string — applies press feedback universally to all buttons (matches TableTile tile pattern already in production)
- Hover glow uses color-mix(in oklch, var(--color-primary) 25%, transparent) — 25% opacity gives visible ring without being aggressive; oklch interpolation preserves color accuracy across light/dark
- KDS_STAGE_CONFIG maps New/InProgress/Ready to existing status-bg tokens — New=open-bg (green=waiting), InProgress=check-requested-bg (amber=active), Ready=reserved-bg (blue=awaiting collection)
- Badge border-0 required on filled pills to suppress default outline border bleeding through colored backgrounds

### Key Patterns from v1.0

- OKLCH primary: `oklch(0.52 0.26 27)` — chroma bumped to 0.26 in Phase 10-01 (TOKEN-01 complete)
- `@theme inline` must use `var(--token)` only — never literal OKLCH values (dark mode breaks silently)
- Solar icon imports: `import { IconNameLinear } from 'solar-icon-set'`
- CVA variants in `button.tsx` and `badge.tsx` — extend in place, never wrap
- Base UI dialogs (`@base-ui/react`) — not Radix

### Blockers / Concerns

- `STATUS_CONFIG` shape in `TableTile.tsx` RESOLVED (10-02) — read and migrated to status tokens; shape confirmed for Phase 11 badge pill refactor
- KDS `(kds)/layout.tsx` Toaster RESOLVED (08-03) — ThemedToaster mounted in KDS layout

---

*State initialized: 2026-03-10 during roadmap creation*
*v1.0 archived: 2026-03-11*
*v1.1 roadmap added: 2026-03-11*
