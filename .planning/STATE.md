---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Bill Management + Order Tracking
status: completed
last_updated: "2026-03-12T09:18:16.287Z"
last_activity: 2026-03-12 -- Completed 12-04 (Split bill wiring + end-to-end verification — SPLIT-01 through SPLIT-04)
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-12
**Session:** 12-04 complete -- Split bill wiring + end-to-end verification (SPLIT-01 through SPLIT-04)

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12 -- Milestone v1.2 started)

**Core value:** A restaurant staff member can open a shift, seat a table, take a full ramen order with modifiers, send it to the kitchen, and close the bill -- all from a mobile PWA that feels fast enough for real service conditions.

**Current focus:** v1.2 -- Bill Management + Order Tracking

**Stack:** Next.js 16 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui (Base UI) + Zustand 5 (persist) + Solar icon set

**Deliverable:** Browser-based interactive Hi-Fi wireframe -- dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

Phase: 12 -- Split Bill (complete)
Plan: 12-04 complete — Phase 12 fully done
Status: Phase 12 complete, Phase 13 next
Last activity: 2026-03-12 -- Completed 12-04 (Split bill wiring + end-to-end verification — SPLIT-01 through SPLIT-04)

```
Progress: ██████████ 100% (Phase 12: 4/4 plans done — COMPLETE)
Phases:   12 [x] | 13 [ ] | 14 [ ] | 15 [ ]
```

---

## Milestone Overview

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 12. Split Bill | Equal split + per-seat assignment + partial payment | SPLIT-01 to SPLIT-04 | Complete (4/4) |
| 13. Polish | CVA variants, elevation, brand styling, responsive layout | POLISH-01, POLISH-02 | Not started |
| 14. Merge Bill | Merge 2+ tables, unsplit seats | MERGE-01, MERGE-02 | Not started |
| 15. Order Tracking | Live stage badge, per-item timeline, escalation | TRACK-01 to TRACK-03 | Not started |

---

## Accumulated Context

See `.planning/PROJECT.md` for full key decisions log.

### Key Architecture Decisions (v1.2)

- **bill.store.ts**: New Zustand store with persist -- handles split/merge as payment-phase concerns separate from order.store
- **Derivation over duplication**: Order tracking stages derived via pure functions from KDS + order stores, never stored redundantly
- **VAT rounding**: floor + remainder-on-last pattern using integer math (satang)
- **Cross-store sync**: KDS bump triggers table.store orderStage update via explicit action calls (not event bus)
- **Zero new npm packages**: Pure state modeling + UI composition on existing stack
- **Shadow tokens via inline style**: `style={{ boxShadow: 'var(--shadow-*)' }}` pattern continues from v1.1
- **Seat assignments in bill.store only**: Not on OrderLineItem -- payment-phase concern stays out of order data model
- **[12-01] useTableStore imported into bill.store.ts**: For canonical guestCount lookup in initPerSeatSplit via getState() (not reactive subscription)
- **[12-01] cancelSplit uses destructuring rest pattern**: `const { [tableId]: _, ...rest } = state.splits` to avoid Zustand mutation
- **[12-02] SplitSheet view resets to mode-select on every open**: via `useEffect([open])` — clean state for each split session
- **[12-02] handleSeatPaid reads fresh state via getState() after recordPayment**: to reliably detect all-paid condition without stale closure
- **[12-03] showSplitBadge guards split! non-null assertion in TableTile**: TypeScript safety without runtime overhead — ternary badge slot prioritises split badge over orderStage badge during payment phase
- **[12-04] onAllPaid uses 'Cash' as placeholder paymentMethod on receipt**: Wireframe receipt shows full grand total regardless of per-seat payment method mix; tracking mixed methods at receipt level is out of scope
- **[12-04] assignItem accumulates qty on existing seat assignment**: Allows splitting same-item quantities across multiple seats — consistent with how restaurants split shared dishes
- **[12-04] Store cleanup before table lifecycle transitions**: cancelSplit called in TableBottomSheet before markClean — establishes the pattern for all future bill.store cleanup on table reset

### Blockers / Concerns

(None -- roadmap created, ready for phase planning)

---

*State initialized: 2026-03-10 during roadmap creation*
*v1.0 archived: 2026-03-11*
*v1.1 archived: 2026-03-12*
*v1.2 roadmap created: 2026-03-12*
