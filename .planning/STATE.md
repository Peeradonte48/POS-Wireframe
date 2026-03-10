# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-10
**Session:** Roadmap creation

---

## Project Reference

**Core value:** A restaurant staff member can open a shift, seat a table, take a full order with ramen-specific modifiers, send it to the kitchen, and close the bill — all from a mobile PWA that feels fast enough for real service conditions.

**Stack:** Next.js 15 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui + Zustand 5 + Lucide React

**Deliverable:** Browser-based interactive wireframe — dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

**Phase:** Phase 1 — Foundation (not started)
**Plan:** None yet
**Status:** Roadmap approved, ready to plan Phase 1

```
Progress: [░░░░░░░] 0% — 0 of 7 phases complete
```

---

## Phase Summary

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation | AUTH-01–05 | Not started |
| 2 | Table Map | FLOOR-01–05 | Not started |
| 3 | Order Flow | ORDER-01–07 | Not started |
| 4 | KDS | KDS-01–04 | Not started |
| 5 | Payment | PAY-01–05 | Not started |
| 6 | Manager Layer | SHIFT-01–04 | Not started |
| 7 | Polish | POLISH-01–04 | Not started |

---

## Accumulated Context

### Decisions Made

| Decision | Rationale | Phase |
|----------|-----------|-------|
| 7 phases retained despite coarse granularity | Natural phases map to distinct user audiences (kitchen staff, cashier, manager); compression below 7 creates incoherent phase goals | Roadmap |
| Phase 4 (KDS) and Phase 5 (Payment) are independent | Neither depends on the other; both depend on Phase 3; can be parallelized | Roadmap |
| Static floor plan (no dnd-kit) assumed for Phase 2 | Manager-driven table repositioning is not an explicit v1 requirement; add dnd-kit only if required | Roadmap |
| A Ramen actual menu data required before Phase 3 | Mock menu must reflect real categories/items/modifier trees or modifier UI will be underspecced | Roadmap |
| Tailwind v3 vs v4 compatibility must be verified at init | Tailwind v4 introduced breaking changes to config format | Roadmap |

### Research Flags (validate before the flagged phase begins)

- **Before Phase 3:** Confirm A Ramen actual menu structure (categories, items, modifier tree depth) with operational staff
- **Before Phase 3:** Decide whether items are seat-assignable at order time (affects split bill v2 data model — cannot retrofit easily)
- **Before Phase 4:** Confirm with A Ramen kitchen staff whether they use course/round-based ordering (affects KDS ticket grouping)
- **Before Phase 2:** Obtain rough floor plan sketch from A Ramen (number of tables, zones, booth vs table vs bar)

### Active Todos

- [ ] Run `/gsd:plan-phase 1` to create Phase 1 execution plan

### Blockers

None.

---

## Performance Metrics

**Requirements coverage:** 34/34 v1 requirements mapped
**Phases defined:** 7
**Plans created:** 0
**Plans complete:** 0

---

## Session Continuity

To resume after any context loss:

1. Read `.planning/ROADMAP.md` for phase structure and success criteria
2. Read `.planning/REQUIREMENTS.md` for requirement details and traceability
3. Read `.planning/STATE.md` (this file) for current position and decisions
4. Check which phase plans exist under `.planning/plans/` (if any)
5. Run `/gsd:plan-phase [N]` for the next unstarted phase

---

*State initialized: 2026-03-10 during roadmap creation*
