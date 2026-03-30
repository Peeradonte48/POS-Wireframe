# Roadmap: FIP POS Staff App Wireframe

**Project:** POS Wireframe -- A Ramen / FIP Ecosystem
**Current Status:** v1.4 in progress (2026-03-30)

---

## Milestones

- ✅ **v1.0 Staff App Wireframe** — Phases 1-7 (shipped 2026-03-11)
- ✅ **v1.1 Bug Fixes + Brand Polish** — Phases 8-11 (shipped 2026-03-12)
- ✅ **v1.2 Bill Management + Order Tracking** — Phases 12-16 (shipped 2026-03-13)
- ✅ **v1.3 Delivery & Takeaway Orders** — Phases 17-21 (shipped 2026-03-16)
- 🔄 **v1.4 Codebase Cleanup** — Phases 22-25 (active)

---

## Phases

<details>
<summary>✅ v1.0 Staff App Wireframe (Phases 1-7) — SHIPPED 2026-03-11</summary>

- [x] **Phase 1: Foundation** — Scaffold, AppShell, PIN login, role routing, shift open (completed 2026-03-10)
- [x] **Phase 2: Table Map** — Floor plan with full table lifecycle state machine (completed 2026-03-10)
- [x] **Phase 3: Order Flow** — Order entry, ramen modifier sheet, void flows (completed 2026-03-10)
- [x] **Phase 4: KDS** — Kitchen display with bump, recall, and demo mode (completed 2026-03-11)
- [x] **Phase 5: Payment** — Bill, payment methods, post-payment table lifecycle (completed 2026-03-11)
- [x] **Phase 6: Manager Layer** — Shift close, EOD summary, sales snapshot, manager tools (completed 2026-03-11)
- [x] **Phase 7: Polish** — Hi-Fi & Brand: brand tokens, Solar icons, dark mode, role gating, toasts, touch targets, empty/loading states (completed 2026-03-11)

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Bug Fixes + Brand Polish (Phases 8-11) — SHIPPED 2026-03-12</summary>

- [x] **Phase 8: Bug Fixes** — 5 navigation, permissions, and toast defects resolved (completed 2026-03-11)
- [x] **Phase 9: Flow Alignment** — Guest count, served state, camera coupon scan, dynamic QR, loyalty receipt (completed 2026-03-12)
- [x] **Phase 10: Brand Token Refresh** — Crimson chroma 0.26, semantic status tokens, elevation shadows (completed 2026-03-11)
- [x] **Phase 11: Component Polish** — CTA buttons, filled status pills, hero prices, caps utility, elevation hierarchy (completed 2026-03-12)

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Bill Management + Order Tracking (Phases 12-16) — SHIPPED 2026-03-13</summary>

- [x] **Phase 12: Split Bill** — bill.store.ts creation, equal split with VAT rounding, per-seat item assignment, partial payment tracking, split progress badge (completed 2026-03-12)
- [x] **Phase 13: Polish** — CVA variants, elevation tokens, brand styling, and responsive layout tuning for all new v1.2 screens (completed 2026-03-12)
- [x] **Phase 14: Merge Bill** — Merge bills across 2+ tables, unsplit previously separated seats, secondary table cleanup (completed 2026-03-13)
- [x] **Phase 15: Order Tracking** — Live stage badge on table tiles, per-item timeline with timestamps, escalation indicator for delayed orders (completed 2026-03-13)
- [x] **Phase 16: Integration Fix** — Wire KDS bump → table.store orderStage, fix onAllPaid billed state, dissolveAll on markClean, close MERGE-02 human verify (completed 2026-03-13)

Full archive: `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 Delivery & Takeaway Orders (Phases 17-21) — SHIPPED 2026-03-16</summary>

- [x] **Phase 17: Queue Store + Floor Plan Tabs** — queue.store foundation, floor plan 3-tab layout, delivery queue UI with full lifecycle, takeaway order creation (completed 2026-03-15)
- [x] **Phase 18: Order Entry + Payment Pipeline** — takeaway/delivery orders flow through existing order entry and payment, KDS write-back for non-dine-in channels (completed 2026-03-15)
- [x] **Phase 19: KDS Differentiation + Combo Flag** — KDS order type badge, filter tabs, pack-to-go item flag, platform OKLCH tokens, CVA badge variants (completed 2026-03-15)
- [x] **Phase 20: Integration Fix + Phase 17 Verification** — Fix acceptOrder→addTicket channel arg drop, fix NAV-02 delivery badge undercount, run gsd-verifier on Phase 17 (completed 2026-03-15)
- [x] **Phase 21: Audit Housekeeping + Nyquist Sign-off** — Fix 18-03-SUMMARY.md TKWY-04 frontmatter, run Nyquist validate-phase for phases 17/18/19 (completed 2026-03-16)

Full archive: `.planning/milestones/v1.3-ROADMAP.md`

</details>

### v1.4 Codebase Cleanup (Phases 22-25)

- [ ] **Phase 22: Codebase Audit** — Written audit map of structural issues, dead code, type errors, and tech debt root causes
- [ ] **Phase 23: TypeScript + Dead Code** — Resolve all any-casts, achieve zero build errors, remove unused imports and unreachable code, enforce naming conventions
- [ ] **Phase 24: Refactor** — Simplify complex components identified in audit, consolidate duplicated patterns
- [ ] **Phase 25: Tech Debt** — Fix DLVR-04/05 KDS desync, TKWY-04 reload edge case, document 5 E2E flows

---

## Phase Details

### Phase 22: Codebase Audit
**Goal**: The team has a written map of every structural problem, dead-code zone, and known bug in the codebase — scoping all subsequent cleanup work
**Depends on**: Nothing (first phase of v1.4)
**Requirements**: AUD-01, AUD-02
**Success Criteria** (what must be TRUE):
  1. A written audit document exists covering all source files with structural issues, dead code, and type errors identified by file
  2. Each known tech debt item (DLVR-04, DLVR-05, TKWY-04, 5 E2E flows) has a documented root cause and a proposed fix approach
  3. The audit document is organized so Phase 23, 24, and 25 work can be scoped directly from it without additional discovery
**Plans:** 1/2 plans executed

Plans:
- [ ] 22-01-PLAN.md — Run automated tooling + manual review, produce audit report organized by Phase 23/24/25 scope
- [x] 22-02-PLAN.md — Create 5 Playwright E2E test stubs for human_needed flows

### Phase 23: TypeScript + Dead Code
**Goal**: The codebase is type-safe and free of dead weight — zero build errors, no unjustified any-casts, no unused imports or unreachable paths, consistent naming throughout
**Depends on**: Phase 22 (audit identifies the scope)
**Requirements**: TS-01, TS-02, DC-01, DC-02
**Success Criteria** (what must be TRUE):
  1. `npm run build` completes with zero TypeScript errors
  2. No `any`-cast remains without an inline justification comment
  3. ESLint reports no unused-imports or unused-variables warnings across all source files
  4. File names, component names, store names, and type names follow a single consistent convention documented or self-evident from existing patterns
**Plans**: TBD

### Phase 24: Refactor
**Goal**: Complex components are simplified and duplicated patterns are consolidated — the codebase is easier to extend without risk of regression
**Depends on**: Phase 23 (clean TypeScript baseline before structural moves)
**Requirements**: REF-01, REF-02
**Success Criteria** (what must be TRUE):
  1. Every component flagged as complex in the Phase 22 audit has been decomposed or simplified, with a comment or plan note explaining the change
  2. Duplicated logic identified in the audit (repeated utility functions, copy-paste JSX blocks, parallel state derivations) is consolidated into shared modules or hooks
  3. `npm run build` still passes with zero errors after all structural changes
**Plans**: TBD

### Phase 25: Tech Debt
**Goal**: The three known runtime defects are fixed and the five untested E2E flows are documented with clear test instructions
**Depends on**: Phase 22 (root cause documentation from audit)
**Requirements**: TD-01, TD-02, TD-03
**Success Criteria** (what must be TRUE):
  1. Bumping a delivery ticket from New to InProgress on KDS automatically mirrors the queue order status from Confirmed to Preparing (DLVR-04/05 resolved)
  2. Browser reload with an empty order.store but a persisted queue.store no longer produces a broken state — the takeaway panel recovers cleanly (TKWY-04 resolved)
  3. Each of the 5 multi-screen E2E flows flagged human_needed has a written test instruction (step-by-step walkthrough) that a human tester can follow in a live browser session
**Plans**: TBD

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 5/5 | Complete | 2026-03-10 |
| 2. Table Map | v1.0 | 4/4 | Complete | 2026-03-10 |
| 3. Order Flow | v1.0 | 4/4 | Complete | 2026-03-10 |
| 4. KDS | v1.0 | 3/3 | Complete | 2026-03-11 |
| 5. Payment | v1.0 | 3/3 | Complete | 2026-03-11 |
| 6. Manager Layer | v1.0 | 4/4 | Complete | 2026-03-11 |
| 7. Polish | v1.0 | 5/5 | Complete | 2026-03-11 |
| 8. Bug Fixes | v1.1 | 5/5 | Complete | 2026-03-11 |
| 9. Flow Alignment | v1.1 | 3/3 | Complete | 2026-03-12 |
| 10. Brand Token Refresh | v1.1 | 2/2 | Complete | 2026-03-11 |
| 11. Component Polish | v1.1 | 3/3 | Complete | 2026-03-12 |
| 12. Split Bill | v1.2 | 4/4 | Complete | 2026-03-12 |
| 13. Polish | v1.2 | 3/3 | Complete | 2026-03-12 |
| 14. Merge Bill | v1.2 | 3/3 | Complete | 2026-03-13 |
| 15. Order Tracking | v1.2 | 3/3 | Complete | 2026-03-13 |
| 16. Integration Fix | v1.2 | 1/1 | Complete | 2026-03-13 |
| 17. Queue Store + Floor Plan Tabs | v1.3 | 4/4 | Complete | 2026-03-15 |
| 18. Order Entry + Payment Pipeline | v1.3 | 3/3 | Complete | 2026-03-15 |
| 19. KDS Differentiation + Combo Flag | v1.3 | 3/3 | Complete | 2026-03-15 |
| 20. Integration Fix + Phase 17 Verification | v1.3 | 2/2 | Complete | 2026-03-15 |
| 21. Audit Housekeeping + Nyquist Sign-off | v1.3 | 2/2 | Complete | 2026-03-16 |
| 22. Codebase Audit | v1.4 | 1/2 | In Progress|  |
| 23. TypeScript + Dead Code | v1.4 | 0/? | Not started | - |
| 24. Refactor | v1.4 | 0/? | Not started | - |
| 25. Tech Debt | v1.4 | 0/? | Not started | - |

---

*Roadmap created: 2026-03-10*
*v1.0 completed: 2026-03-11*
*v1.1 completed: 2026-03-12*
*v1.2 completed: 2026-03-13*
*v1.3 completed: 2026-03-16*
*v1.4 roadmap created: 2026-03-30*
*Full v1.0 archive: `.planning/milestones/v1.0-ROADMAP.md`*
*Full v1.1 archive: `.planning/milestones/v1.1-ROADMAP.md`*
*Full v1.2 archive: `.planning/milestones/v1.2-ROADMAP.md`*
*Full v1.3 archive: `.planning/milestones/v1.3-ROADMAP.md`*
