---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Bug Fixes + Brand Polish
status: executing
last_updated: "2026-03-12T08:11:00.000Z"
last_activity: 2026-03-12 — 09-01 FLOW-01 + FLOW-02 complete (OpenTableModal empty start, TableBottomSheet served-at)
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 9
  completed_plans: 9
  percent: 97
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-12
**Session:** Completed 09-01 (FLOW-01 + FLOW-02) — Phase 9 all 3 plans now executed

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

Phase: 9 of 11 (Flow Alignment) — v1.1 Phase 2 — ALL 3 PLANS COMPLETE
Plan: 09-01 done (FLOW-01, FLOW-02) — Phase 9 fully executed
Status: Phase 9 complete — all 3 plans implemented (09-01, 09-02, 09-03)
Last activity: 2026-03-12 — 09-01 FLOW-01 + FLOW-02 (OpenTableModal forced-entry, served-at display)

```
Progress: [██████████] 97% (35/36 plans complete)
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

### Key Patterns from v1.0

- OKLCH primary: `oklch(0.52 0.22 27)` — chroma increase target is 0.26, verify sRGB gamut at oklch.com
- `@theme inline` must use `var(--token)` only — never literal OKLCH values (dark mode breaks silently)
- Solar icon imports: `import { IconNameLinear } from 'solar-icon-set'`
- CVA variants in `button.tsx` and `badge.tsx` — extend in place, never wrap
- Base UI dialogs (`@base-ui/react`) — not Radix

### Blockers / Concerns

- `STATUS_CONFIG` shape in `TableTile.tsx` not yet read — read before writing badge pill refactor plan in Phase 11
- KDS `(kds)/layout.tsx` Toaster RESOLVED (08-03) — ThemedToaster mounted in KDS layout

---

*State initialized: 2026-03-10 during roadmap creation*
*v1.0 archived: 2026-03-11*
*v1.1 roadmap added: 2026-03-11*
