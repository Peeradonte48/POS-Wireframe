---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 6 context gathered
last_updated: "2026-03-11T06:52:38.872Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 19
  completed_plans: 18
  percent: 95
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-11
**Session:** Phase 5 complete — all 5 PAY requirements browser-verified

---

## Project Reference

**Core value:** A restaurant staff member can open a shift, seat a table, take a full order with ramen-specific modifiers, send it to the kitchen, and close the bill — all from a mobile PWA that feels fast enough for real service conditions.

**Stack:** Next.js 15 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui + Zustand 5 + Lucide React

**Deliverable:** Browser-based interactive wireframe — dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

**Phase:** Phase 5 — Payment (complete)
**Plan:** 05-03 complete — full payment flow browser-verified (all 5 PAY criteria)
**Status:** Ready to plan

```
Progress: [█████████░] 95% (18 of 19 plans)
```

---

## Phase Summary

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation | AUTH-01–05 | Complete ✓ (2026-03-10) |
| 2 | Table Map | FLOOR-01–05 | Complete ✓ (2026-03-10) |
| 3 | Order Flow | ORDER-01–07 | Complete ✓ (2026-03-11) |
| 4 | KDS | KDS-01–04 | Complete ✓ (2026-03-11) |
| 5 | Payment | PAY-01–05 | Complete ✓ (2026-03-11) |
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
| Zustand persist middleware added (reversed Phase 1 decision) | (app)/(kds) route group navigation destroys React tree, resetting in-memory stores; localStorage persist is minimal fix; wireframe intent preserved since logout clears state | Phase 5 Plan 03 |
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
- [Phase 03-order-flow]: 'use client' kept on order.store.ts matching table.store.ts actual pattern
- [Phase 03-order-flow]: RAMEN_MODIFIER_GROUPS shared const referenced by all 4 ramen items to avoid duplication
- [Phase 03-order-flow]: spiceLevel as dedicated OrderLineItem field, not a modifier group in menu data
- [Phase 03-order-flow]: Tabs without TabsContent: category selection drives MENU_ITEMS.filter() directly rather than rendering TabsContent slots
- [Phase 03-order-flow]: selectedMenuItemId and editingLineId declared in OrderPage but not wired — Plan 03 adds ModifierSheet
- [Phase 03-order-flow]: Native checkbox with accent-primary used in ModifierSheet toppings — @radix-ui/react-checkbox not installed, project uses @base-ui/react
- [Phase 03-order-flow]: ModifierSheet sticky footer uses fixed z-[51] so Add/Update button stays visible while panel content scrolls within 70vh constraint
- [Phase 03-order-flow]: buildModifierSummary defined inline in TicketLineItem — single-file locality, not shared util
- [Phase 03-order-flow]: computeTotal skips topping priceAdj since ModifierSelection lacks priceAdj field — basePrice x qty only for wireframe
- [Phase 03-order-flow]: Add Items button is cosmetic — store addItem auto-creates new unsent round when all rounds are sent
- [Phase 04-kds]: Kitchen role null-guard in (app)/layout.tsx prevents AppShell flash before /kds redirect fires
- [Phase 04-kds]: (kds) route group uses separate server-component layout with no AppShell — full-screen canvas for KDS
- [Phase 04-kds]: Modifier summary built inline in KdsItemRow — mirrors TicketLineItem pattern from Phase 3, no shared util needed
- [Phase 04-kds]: KdsBoard auto-registers tickets in render body (not useEffect) to avoid one-render delay when orders are sent
- [Phase 04-kds]: Demo tickets injected into kds.store only (not order.store) — avoids polluting floor map during stakeholder demos
- [Phase 04-kds]: BUMP blocked from InProgress until all items checked — enforces cook confirmation workflow before marking Ready
- [Phase 04-kds]: Item checkboxes active only when ticket.stage === InProgress — prevents accidental pre-checks in New stage
- [Phase 05-payment]: VAT applied to post-discount subtotal: Math.round((subtotal - discountAmount) * 0.07) — coupon reduces tax base before VAT calculation
- [Phase 05-payment]: Confirm button disabled: null payment method OR Cash entered but insufficient; cashReceived===0 (untouched) does not block
- [Phase 05-payment]: PaymentPage receipt view is a stub in Plan 01 — Plan 02 builds the full receipt screen
- [Phase 05-payment]: toast import kept in PaymentPage (not ReceiptScreen) — keeps ReceiptScreen a pure display component with callbacks only
- [Phase 05-payment]: useRouter already imported in TableBottomSheet from Phase 2 — no duplicate import needed for Go to Payment activation
- [Phase 05-payment]: Zustand persist middleware adopted (reversed Phase 1 decision) — required for state to survive (app)/(kds) route group navigation on role switch; localStorage storage with named keys per store

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
- [x] Plan Phase 2 (Table Map)
- [x] Execute Phase 2 (Table Map) — all 5 FLOOR criteria verified
- [x] Plan Phase 3 (Order Flow)
- [x] Execute Phase 3 (Order Flow) — all 7 ORDER criteria verified

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
| Phase 02-table-map P04 | — | 2 tasks | 0 files (verification) |
| Phase 03-order-flow P01 | 5min | 2 tasks | 4 files |
| Phase 03-order-flow P02 | 5min | 2 tasks | 3 files |
| Phase 03-order-flow P03 | 2min | 1 task | 1 file |
| Phase 03-order-flow P04 | 6min | 2 tasks | 4 files |
| Phase 04-kds P01 | 10min | 2 tasks | 5 files |
| Phase 04-kds P02 | 8min | 2 tasks | 5 files |
| Phase 04-kds P03 | 20min | 2 tasks | 4 files |
| Phase 05-payment P01 | 2min | 2 tasks | 7 files |
| Phase 05-payment P02 | 2min | 2 tasks | 3 files |
| Phase 05-payment P03 | 10min | 2 tasks | 2 files |

## Session Continuity

Last session: 2026-03-11T06:52:38.864Z
Stopped at: Phase 6 context gathered
Resume file: .planning/phases/06-manager-layer/06-CONTEXT.md

To resume after any context loss:

1. Read `.planning/ROADMAP.md` for phase structure and success criteria
2. Read `.planning/REQUIREMENTS.md` for requirement details and traceability
3. Read `.planning/STATE.md` (this file) for current position and decisions
4. Run `/gsd:discuss-phase 3` or `/gsd:plan-phase 3` to begin Phase 3
5. Read `.claude/CLAUDE.md` for high-level user flow

---

*State initialized: 2026-03-10 during roadmap creation*
