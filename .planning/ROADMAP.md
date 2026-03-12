# Roadmap: FIP POS Staff App Wireframe

**Project:** POS Wireframe -- A Ramen / FIP Ecosystem
**Current Status:** v1.2 in progress

---

## Milestones

- **v1.0 Staff App Wireframe** -- Phases 1-7 (shipped 2026-03-11)
- **v1.1 Bug Fixes + Brand Polish** -- Phases 8-11 (shipped 2026-03-12)
- **v1.2 Bill Management + Order Tracking** -- Phases 12-15 (in progress)

---

## Phases

<details>
<summary>v1.0 Staff App Wireframe (Phases 1-7) -- SHIPPED 2026-03-11</summary>

- [x] **Phase 1: Foundation** -- Scaffold, AppShell, PIN login, role routing, shift open (completed 2026-03-10)
- [x] **Phase 2: Table Map** -- Floor plan with full table lifecycle state machine (completed 2026-03-10)
- [x] **Phase 3: Order Flow** -- Order entry, ramen modifier sheet, void flows (completed 2026-03-10)
- [x] **Phase 4: KDS** -- Kitchen display with bump, recall, and demo mode (completed 2026-03-11)
- [x] **Phase 5: Payment** -- Bill, payment methods, post-payment table lifecycle (completed 2026-03-11)
- [x] **Phase 6: Manager Layer** -- Shift close, EOD summary, sales snapshot, manager tools (completed 2026-03-11)
- [x] **Phase 7: Polish** -- Hi-Fi & Brand: brand tokens, Solar icons, dark mode, role gating, toasts, touch targets, empty/loading states (completed 2026-03-11)

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v1.1 Bug Fixes + Brand Polish (Phases 8-11) -- SHIPPED 2026-03-12</summary>

- [x] **Phase 8: Bug Fixes** -- 5 navigation, permissions, and toast defects resolved (completed 2026-03-11)
- [x] **Phase 9: Flow Alignment** -- Guest count, served state, camera coupon scan, dynamic QR, loyalty receipt (completed 2026-03-12)
- [x] **Phase 10: Brand Token Refresh** -- Crimson chroma 0.26, semantic status tokens, elevation shadows (completed 2026-03-11)
- [x] **Phase 11: Component Polish** -- CTA buttons, filled status pills, hero prices, caps utility, elevation hierarchy (completed 2026-03-12)

Full archive: `.planning/milestones/v1.1-ROADMAP.md`

</details>

---

### v1.2 Bill Management + Order Tracking (In Progress)

**Milestone Goal:** Add split bill, merge bill, and real-time digital order tracking to complete the payment and service monitoring story. Staff can divide a check by equal shares or per-seat items, merge party tables into one bill, and see live order progress on the floor plan -- all built on a new `bill.store.ts` and pure derivation functions with zero new npm packages.

- [ ] **Phase 12: Split Bill** -- bill.store.ts creation, equal split with VAT rounding, per-seat item assignment, partial payment tracking, split progress badge
- [ ] **Phase 13: Polish** -- CVA variants, elevation tokens, brand styling, and responsive layout tuning for all new v1.2 screens
- [ ] **Phase 14: Merge Bill** -- Merge bills across 2+ tables, unsplit previously separated seats, secondary table cleanup
- [ ] **Phase 15: Order Tracking** -- Live stage badge on table tiles, per-item timeline with timestamps, escalation indicator for delayed orders

---

## Phase Details

### Phase 12: Split Bill
**Goal**: Staff can split any table's bill by equal shares or per-seat item assignment, pay each portion independently, and see split progress at a glance
**Depends on**: Phase 11 (v1.1 complete -- stable payment page, brand tokens, elevation system)
**Requirements**: SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04
**Success Criteria** (what must be TRUE):
  1. Staff can tap "Split Bill" on the payment screen, choose equal split, enter a guest count N, and see the total divided into N shares where all shares sum exactly to the original grand total (floor + remainder-on-last rounding in satang)
  2. Staff can switch to per-seat mode and tap individual menu items to assign them to numbered seats -- each seat shows its own subtotal with correct VAT, and unassigned items remain in a shared bucket
  3. Staff can pay any single seat/share independently using Cash, QR, or Card -- paid seats show a settled state and cannot be paid again, while unpaid seats remain actionable
  4. The table tile on the floor plan shows a split progress badge (e.g. "2/4 paid") whenever a bill is partially settled, and the badge disappears when all seats are paid and the table transitions to Cleaning
**Plans**: 4 plans
Plans:
- [ ] 12-01-PLAN.md — bill.store.ts creation + amber split color token
- [ ] 12-02-PLAN.md — SplitSheet.tsx + SeatPaymentPanel.tsx (full split bottom sheet UI)
- [ ] 12-03-PLAN.md — TableTile split progress badge
- [ ] 12-04-PLAN.md — Wiring: TotalsSection, payment page, TableBottomSheet + human verify

### Phase 13: Polish
**Goal**: All new split bill, merge bill, and order tracking screens meet the v1.1 quality bar -- consistent CVA variants, elevation tokens, brand styling, and clean responsive layout at tablet and mobile breakpoints
**Depends on**: Phase 12 (split bill screens exist to polish)
**Requirements**: POLISH-01, POLISH-02
**Success Criteria** (what must be TRUE):
  1. Split bill sheet, seat navigator, seat assignment view, merge table picker, and order timeline all use the same CVA variant patterns, elevation shadow tokens, and brand color tokens established in v1.1 -- no raw Tailwind palette classes or hardcoded shadows
  2. All new modals and sheets (split mode selector, merge picker, timeline detail) fit cleanly within the AppShell at both tablet (768px+) and mobile (375px) breakpoints with no horizontal overflow, clipped content, or broken scroll behavior
**Plans**: TBD

### Phase 14: Merge Bill
**Goal**: Staff can combine bills from multiple tables into a single check for party seating, and reverse a split back to a single bill before any portion is paid
**Depends on**: Phase 12 (bill.store.ts exists with split infrastructure)
**Requirements**: MERGE-01, MERGE-02
**Success Criteria** (what must be TRUE):
  1. Staff can select 2+ occupied tables from a picker and merge them into one combined bill -- the payment page for the primary table shows all items from all merged tables with correct combined subtotal, VAT, and grand total
  2. Secondary tables in a merge group show a "Merged into T[X]" indicator on their table tile and route to the primary table's payment when tapped
  3. Staff can unsplit a previously separated bill back to a single bill, but only when no seats have been paid yet -- attempting to unsplit after partial payment shows a blocking message
**Plans**: TBD

### Phase 15: Order Tracking
**Goal**: Staff can see live order progress on the floor plan and drill into per-item timelines, with visual escalation for delayed orders
**Depends on**: Phase 12 (bill.store.ts and payment infrastructure stable; KDS item refs wired)
**Requirements**: TRACK-01, TRACK-02, TRACK-03
**Success Criteria** (what must be TRUE):
  1. Each occupied table tile shows a color-coded stage badge (Queued/Cooking/Ready/Served) derived from KDS ticket state and order store data -- the badge updates automatically when the kitchen bumps a ticket without staff intervention
  2. Tapping a table's order section reveals a per-item timeline showing each menu item with its current stage, the timestamp when it was sent to kitchen, and elapsed time since sent
  3. Any item that has been in its current stage for longer than 15 minutes displays a visual escalation warning (color shift to red/amber) on both the table tile badge and the timeline detail view
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
| 12. Split Bill | v1.2 | 0/4 | Not started | - |
| 13. Polish | v1.2 | 0/? | Not started | - |
| 14. Merge Bill | v1.2 | 0/? | Not started | - |
| 15. Order Tracking | v1.2 | 0/? | Not started | - |

---

*Roadmap created: 2026-03-10*
*v1.0 completed: 2026-03-11*
*v1.1 completed: 2026-03-12*
*v1.2 roadmap added: 2026-03-12*
*Full v1.0 archive: `.planning/milestones/v1.0-ROADMAP.md`*
*Full v1.1 archive: `.planning/milestones/v1.1-ROADMAP.md`*
