---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: Completed 02-table-map-03-PLAN.md
last_updated: "2026-03-10T11:21:20.952Z"
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 9
  completed_plans: 7
  percent: 14
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-10
**Session:** Phase 1 complete — verified and closed

---

## Project Reference

**Core value:** A restaurant staff member can open a shift, seat a table, take a full order with ramen-specific modifiers, send it to the kitchen, and close the bill — all from a mobile PWA that feels fast enough for real service conditions.

**Stack:** Next.js 15 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui + Zustand 5 + Lucide React

**Deliverable:** Browser-based interactive wireframe — dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

**Phase:** Phase 2 — Table Map (not started)
**Plan:** N/A — Phase 2 not yet planned
**Status:** Phase 1 complete and verified ✓ — ready for Phase 2

```
Progress: [██░░░░░░░░] 14% (1 of 7 phases)
```

---

## Phase Summary

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation | AUTH-01–05 | Complete ✓ (2026-03-10) |
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
| No Zustand persist middleware | Each page load starts fresh at login — intentional for wireframe simplicity | Phase 1 Plan 01 |
| globals.css preserves shadcn CSS variable tokens + brand @theme block | Both coexist under Tailwind v4 CSS-first config | Phase 1 Plan 01 |
- [Phase 01-foundation]: PinNumpad auto-clear timeout set to 600ms to match shake animation duration before resetting digits
- [Phase 01-foundation]: PinNumpad reusable: no confirm button, 4th digit auto-submits via useEffect (not inline handler)
- [Phase 01-foundation]: Disabled nav items use div elements (not Link) to prevent navigation while preserving visual presence in sidebar
- [Phase 01-foundation]: Soft gate pattern: /shift-open excluded from shift-redirect so authenticated-but-no-shift staff see AppShell with locked sidebar
- [Phase 01-foundation]: ManagerPinModal verifies PIN internally via verifyPin('Manager', pin) keeping parent API minimal
- [Phase 01-foundation]: disablePointerDismissal on Base UI Dialog Root prevents accidental dismissal during PIN entry (Radix onInteractOutside does not exist in Base UI)
- [Phase 02-table-map]: tables.ts uses type-only import from table.store.ts to avoid circular value dependency
- [Phase 02-table-map]: useDwellTimer initializes now with Date.now() so already-open tables display correct elapsed time on mount
- [Phase 02-table-map]: STATUS_CONFIG defined inline in TableTile — 5 statuses small enough, no external file needed
- [Phase 02-table-map]: selectedTable state held at page level — ephemeral UI selection, not domain state
- [Phase 02-table-map]: Bottom sheet implemented as CSS-only slide-up (no library) — translate-y-full/translate-y-0 with fixed positioning sufficient for mobile POS
- [Phase 02-table-map]: Blur-update pattern: local controlled input, onBlur writes to Zustand store to avoid reactive cascade on every keystroke

### Research Flags (validate before the flagged phase begins)

- **Before Phase 3:** Confirm A Ramen actual menu structure (categories, items, modifier tree depth) with operational staff
- **Before Phase 3:** Decide whether items are seat-assignable at order time (affects split bill v2 data model — cannot retrofit easily)
- **Before Phase 4:** Confirm with A Ramen kitchen staff whether they use course/round-based ordering (affects KDS ticket grouping)
- **Before Phase 2:** Obtain rough floor plan sketch from A Ramen (number of tables, zones, booth vs table vs bar)

### Active Todos

- [x] Run `/gsd:plan-phase 1` to create Phase 1 execution plan
- [x] Execute Phase 1 Plan 02 (login UI with PIN pad)
- [x] Execute Phase 1 Plan 03 (AppShell + auth guard)
- [x] Execute Phase 1 Plan 04 (shift-open form)
- [x] Execute Phase 1 Plan 05 (final type check + browser verification)
- [ ] Plan Phase 2 (Table Map)

### Blockers

None.

---

## Performance Metrics

**Requirements coverage:** 34/34 v1 requirements mapped
**Phases defined:** 7
**Plans created:** 5 (Phase 1 complete set)
**Plans complete:** 5

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-foundation | 01 | 7min | 2 | 13 |
| 01-foundation | 02 | 2min | 2 | 3 |
| 01-foundation | 03 | 2min | 2 | 4 |
| 01-foundation | 04 | 5min | 2 | 4 |
| 01-foundation | 05 | —   | 2 | 0 |
| Phase 02-table-map P01 | 4min | 2 tasks | 3 files |
| Phase 02-table-map P02 | 5min | 2 tasks | 3 files |
| Phase 02-table-map P03 | 8min | 2 tasks | 3 files |

## Session Continuity

Last session: 2026-03-10T11:21:20.950Z
Stopped at: Completed 02-table-map-03-PLAN.md
Resume file: None

To resume after any context loss:

1. Read `.planning/ROADMAP.md` for phase structure and success criteria
2. Read `.planning/REQUIREMENTS.md` for requirement details and traceability
3. Read `.planning/STATE.md` (this file) for current position and decisions
4. Run `/gsd:plan-phase 2` to begin Phase 2

---

*State initialized: 2026-03-10 during roadmap creation*
