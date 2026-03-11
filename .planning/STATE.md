---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Bug Fixes + Brand Polish
status: completed
last_updated: "2026-03-11T11:29:36.428Z"
last_activity: 2026-03-11 — completed 08-05 Manager page role guard
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-11
**Session:** Completed 08-05-PLAN.md — Manager page role guard added; Phase 8 complete

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

Phase: 8 of 11 (Bug Fixes) — v1.1 Phase 1 — COMPLETE
Plan: 08-05 complete (all Phase 8 plans done)
Status: Phase 8 complete — ready for Phase 9
Last activity: 2026-03-11 — completed 08-05 Manager page role guard

```
Progress: [██████████] 100%  (Phase 8 complete: all plans done)
```

---

## Accumulated Context

See `.planning/PROJECT.md` for full key decisions log.

### Active for v1.1

- Phase 8 must land before any CSS changes — bugs create conflation risk between visual regressions and bug fixes
- Phase 10 depends on Phase 8 (Toaster dark-mode verification requires Bug 3 fixed first)
- Phase 11 depends on Phase 10 (component polish against correct token baseline)
- Phase 9 (Flow Alignment) depends on Phase 8 but can run before or in parallel with Phase 10

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
