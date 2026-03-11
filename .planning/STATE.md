---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Bug Fixes + Brand Polish
status: in_progress
stopped_at: ~
last_updated: "2026-03-11T00:00:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-11
**Session:** v1.1 milestone started — defining requirements

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11 — Milestone v1.1 started)

**Core value:** A restaurant staff member can open a shift, seat a table, take a full ramen order with modifiers, send it to the kitchen, and close the bill — all from a mobile PWA that feels fast enough for real service conditions.

**Current focus:** v1.1 — Bug Fixes + Brand Polish

**Stack:** Next.js 15 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui (Base UI) + Zustand 5 (persist) + Solar icon set

**Deliverable:** Browser-based interactive Hi-Fi wireframe — dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-11 — Milestone v1.1 started

```
Progress: [░░░░░░░░░░] 0%
```

---

## Known Tech Debt (v1.1 candidates)

| Issue | Severity | Files |
|-------|----------|-------|
| `/orders` sidebar link → 404 | HIGH | `src/components/app-shell/AppSidebar.tsx` |
| Manager blocked from `/kds` | HIGH | `src/app/(kds)/kds/page.tsx` |
| `<Toaster>` missing from AppShell | MEDIUM | `src/components/app-shell/AppShell.tsx` |
| No `void-post-send` in ACTION_PERMISSIONS | LOW | `src/lib/role-permissions.ts` |
| `/manager` page unguarded (URL-bar access) | LOW | `src/app/(app)/manager/page.tsx` |

---

## Accumulated Context

See `.planning/PROJECT.md` for full key decisions log.

Key patterns established in v1.0:
- 3-column POS layout: category sidebar + menu grid + ticket panel
- OKLCH brand tokens: `--primary: oklch(0.52 0.22 27)` (A Ramen crimson)
- Solar icon imports: `import { IconNameLinear } from 'solar-icon-set'`
- 44px touch targets: `min-h-[44px] min-w-[44px]` or `-m-2 p-2` trick
- Zustand persist required for (app)/(kds) route group navigation
- Blur-update pattern for inline editable fields

---

*State initialized: 2026-03-10 during roadmap creation*
*v1.0 archived: 2026-03-11*
