# Roadmap: FIP POS Staff App Wireframe

**Project:** POS Wireframe -- A Ramen / FIP Ecosystem
**Current Status:** v1.3 in progress

---

## Milestones

- **v1.0 Staff App Wireframe** -- Phases 1-7 (shipped 2026-03-11)
- **v1.1 Bug Fixes + Brand Polish** -- Phases 8-11 (shipped 2026-03-12)
- **v1.2 Bill Management + Order Tracking** -- Phases 12-16 (shipped 2026-03-13)
- **v1.3 Delivery & Takeaway Orders** -- Phases 17-19 (in progress)

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

<details>
<summary>v1.2 Bill Management + Order Tracking (Phases 12-16) -- SHIPPED 2026-03-13</summary>

- [x] **Phase 12: Split Bill** -- bill.store.ts creation, equal split with VAT rounding, per-seat item assignment, partial payment tracking, split progress badge (completed 2026-03-12)
- [x] **Phase 13: Polish** -- CVA variants, elevation tokens, brand styling, and responsive layout tuning for all new v1.2 screens (completed 2026-03-12)
- [x] **Phase 14: Merge Bill** -- Merge bills across 2+ tables, unsplit previously separated seats, secondary table cleanup (completed 2026-03-13)
- [x] **Phase 15: Order Tracking** -- Live stage badge on table tiles, per-item timeline with timestamps, escalation indicator for delayed orders (completed 2026-03-13)
- [x] **Phase 16: Integration Fix** -- Wire KDS bump → table.store orderStage, fix onAllPaid billed state, dissolveAll on markClean, close MERGE-02 human verify (completed 2026-03-13)

Full archive: `.planning/milestones/v1.2-ROADMAP.md`

</details>

---

### v1.3 Delivery & Takeaway Orders (In Progress)

**Milestone Goal:** Add multi-channel order management — third-party delivery queue (Grab/LINE MAN), walk-in takeaway orders, and dine-in + takeaway combo items — so staff can manage all three channels from one interface and kitchen always knows whether to plate or bag.

- [x] **Phase 17: Queue Store + Floor Plan Tabs** -- queue.store foundation, floor plan 3-tab layout, delivery queue UI with full lifecycle, takeaway order creation (completed 2026-03-15)
- [x] **Phase 18: Order Entry + Payment Pipeline** -- takeaway/delivery orders flow through existing order entry and payment, KDS write-back for non-dine-in channels (completed 2026-03-15)
- [x] **Phase 19: KDS Differentiation + Combo Flag** -- KDS order type badge, filter tabs, pack-to-go item flag, platform OKLCH tokens, CVA badge variants (completed 2026-03-15)

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
- [x] 12-01-PLAN.md -- bill.store.ts creation + amber split color token
- [x] 12-02-PLAN.md -- SplitSheet.tsx + SeatPaymentPanel.tsx (full split bottom sheet UI)
- [x] 12-03-PLAN.md -- TableTile split progress badge
- [x] 12-04-PLAN.md -- Wiring: TotalsSection, payment page, TableBottomSheet + human verify

### Phase 13: Polish
**Goal**: All new split bill, merge bill, and order tracking screens meet the v1.1 quality bar -- consistent CVA variants, elevation tokens, brand styling, and clean responsive layout at tablet and mobile breakpoints
**Depends on**: Phase 12 (split bill screens exist to polish)
**Requirements**: POLISH-01, POLISH-02
**Success Criteria** (what must be TRUE):
  1. Split bill sheet, seat navigator, seat assignment view, merge table picker, and order timeline all use the same CVA variant patterns, elevation shadow tokens, and brand color tokens established in v1.1 -- no raw Tailwind palette classes or hardcoded shadows
  2. All new modals and sheets (split mode selector, merge picker, timeline detail) fit cleanly within the AppShell at both tablet (768px+) and mobile (375px) breakpoints with no horizontal overflow, clipped content, or broken scroll behavior
**Plans**: 3 plans
Plans:
- [x] 13-01-PLAN.md -- Design tokens (--status-settled) + CVA variants (Badge settled, Button option-card)
- [x] 13-02-PLAN.md -- SplitSheet.tsx conformance: replace all POLISH-01 violations + responsive seat picker fix
- [x] 13-03-PLAN.md -- Font swap: Inter → IBM Plex Sans app-wide + font-sans token update

### Phase 14: Merge Bill
**Goal**: Staff can combine bills from multiple tables into a single check for party seating, and reverse a split back to a single bill before any portion is paid
**Depends on**: Phase 12 (bill.store.ts exists with split infrastructure)
**Requirements**: MERGE-01, MERGE-02
**Success Criteria** (what must be TRUE):
  1. Staff can select 2+ occupied tables from a picker and merge them into one combined bill -- the payment page for the primary table shows all items from all merged tables with correct combined subtotal, VAT, and grand total
  2. Secondary tables in a merge group show a "Merged into T[X]" indicator on their table tile and route to the primary table's payment when tapped
  3. Staff can unsplit a previously separated bill back to a single bill, but only when no seats have been paid yet -- attempting to unsplit after partial payment shows a blocking message
**Plans**: 3 plans
Plans:
- [x] 14-01-PLAN.md -- bill.store merges map + --status-merged CSS tokens (foundation)
- [x] 14-02-PLAN.md -- MergeSheet.tsx: table picker bottom sheet component
- [x] 14-03-PLAN.md -- Wiring: TableTile badge, TableBottomSheet, TotalsSection, payment page grouped items, SplitSheet revert + human verify

### Phase 15: Order Tracking
**Goal**: Staff can see live order progress on the floor plan and drill into per-item timelines, with visual escalation for delayed orders
**Depends on**: Phase 12 (bill.store.ts and payment infrastructure stable; KDS item refs wired)
**Requirements**: TRACK-01, TRACK-02, TRACK-03
**Success Criteria** (what must be TRUE):
  1. Each occupied table tile shows a color-coded stage badge (Queued/Cooking/Ready/Served) derived from KDS ticket state and order store data -- the badge updates automatically when the kitchen bumps a ticket without staff intervention
  2. Tapping a table's order section reveals a per-item timeline showing each menu item with its current stage, the timestamp when it was sent to kitchen, and elapsed time since sent
  3. Any item that has been in its current stage for longer than 15 minutes displays a visual escalation warning (color shift to red/amber) on both the table tile badge and the timeline detail view
**Plans**: 3 plans
Plans:
- [x] 15-01-PLAN.md -- CSS token pairs (ordered/cooking/ready/escalated) + Badge CVA variants
- [x] 15-02-PLAN.md -- order-tracking.ts utils + useSentTimer hook + TableTile color-coded badge
- [x] 15-03-PLAN.md -- OrderTimeline component + TableBottomSheet tab wiring + human verify

### Phase 16: Integration Fix
**Goal**: Close 3 integration gaps found in v1.2 audit -- KDS bump writes orderStage to table.store, split onAllPaid sets Billed stage, markClean dissolves merge map, MERGE-02 human verified
**Gap Closure:** Closes gaps from v1.2 audit
**Requirements**: TRACK-01, TRACK-03, SPLIT-03, MERGE-01, MERGE-02
**Success Criteria** (what must be TRUE):
  1. Bumping a KDS ticket from New→InProgress writes orderStage:'Cooking', InProgress→Ready writes 'Ready', ticket removal writes 'Served' to table.store -- TableTile badge color cycles through all 4 stages
  2. Completing all split-bill seat payments sets orderStage:'Billed' on the primary table
  3. Tapping "Mark Clean" on a merged primary table dissolves the merge map -- secondary tiles show no stale merge badge after cleaning
  4. MERGE-02 "Revert to Single Bill" flow verified in browser -- REQUIREMENTS.md checkbox updated to [x]
**Plans**: 1 plan
Plans:
- [x] 16-01-PLAN.md -- KDS orderStage writeback + onAllPaid Billed + markClean dissolveAll + MERGE-02 human verify

### Phase 17: Queue Store + Floor Plan Tabs
**Goal**: Staff can view and manage incoming delivery orders and create takeaway orders from the floor plan, backed by a new queue.store that owns all non-dine-in lifecycle state
**Depends on**: Phase 16 (v1.2 complete -- stable KDS, order, and bill stores)
**Requirements**: NAV-01, NAV-02, DLVR-01, DLVR-02, DLVR-03, DLVR-04, DLVR-05, DLVR-06, DLVR-07, DLVR-08, DLVR-09, TKWY-01
**Success Criteria** (what must be TRUE):
  1. The floor plan shows three tabs -- Dine-in, Takeaway, Delivery -- and the Takeaway and Delivery tabs display a live count badge reflecting the number of active orders in each channel
  2. The Delivery tab shows a queue of incoming orders with platform badge (Grab / LINE MAN), customer name, items summary, and elapsed timer; staff can accept or reject each order (reject requires a reason selection)
  3. An accepted delivery order progresses through Accepted → Preparing → Ready for Rider → Picked Up, and staff can trigger the "Ready for Rider" transition from the delivery queue card
  4. Staff can trigger simulated incoming delivery orders for demo purposes; an auto-accept toggle is available to skip manual confirmation during rush; incoming orders show a countdown timer ring before auto-reject
  5. Staff can open a "New Takeaway" modal from the Takeaway tab, enter customer name and phone, and receive an auto-assigned sequential order number (TK-001, TK-002, …)
**Plans**: 4 plans
Plans:
- [ ] 17-01-PLAN.md -- queue.store + delivery-demo factory + platform tokens + badge CVA variants + role-permissions
- [ ] 17-02-PLAN.md -- DeliveryCard + RejectReasonDialog + DeliveryPanel (all DLVR requirements)
- [ ] 17-03-PLAN.md -- NewTakeawayModal + TakeawayCard + TakeawayPanel (TKWY-01)
- [ ] 17-04-PLAN.md -- table-map page 3-tab wrap + AppSidebar queue badge + human verify

### Phase 18: Order Entry + Payment Pipeline
**Goal**: Takeaway and delivery orders flow through the full existing order entry and payment screens, with KDS write-back so kitchen tickets are correctly wired to queue lifecycle
**Depends on**: Phase 17 (queue.store exists; TK/DL order IDs generated)
**Requirements**: TKWY-02, TKWY-03, TKWY-04, TKWY-05
**Success Criteria** (what must be TRUE):
  1. Tapping a takeaway order in the Takeaway tab opens the existing order entry screen with the header showing the takeaway order number and customer name instead of a table label
  2. A takeaway order progresses from Taking → Sent → Ready → Collected; staff can mark it Collected from the Takeaway tab once kitchen marks it Ready
  3. Staff can complete payment for a takeaway order using the existing Cash/QR/Card payment flow; the back button routes to the Takeaway tab (not the floor plan) and completing payment marks the order Collected in queue.store
**Plans**: 3 plans
Plans:
- [ ] 18-01-PLAN.md -- queue.store Sent→Ready + kds.store orderType + KdsBoard guard + KdsTicketCard write-back (TKWY-03)
- [ ] 18-02-PLAN.md -- order entry onSend redirect to payment + TakeawayCard live itemsSummary (TKWY-02, TKWY-05)
- [ ] 18-03-PLAN.md -- payment page isTakeaway branch: header, Split/Merge hide, handleConfirmPayment + human verify (TKWY-04)

### Phase 19: KDS Differentiation + Combo Flag
**Goal**: Kitchen staff can instantly tell whether to plate or bag every ticket, and dine-in orders can have individual items flagged as pack-to-go; all channel types are visually distinct using brand-consistent OKLCH tokens
**Depends on**: Phase 18 (delivery and takeaway orders appearing on KDS board)
**Requirements**: COMBO-01, COMBO-02, KDS-01, KDS-02, UI-01
**Success Criteria** (what must be TRUE):
  1. Every KDS ticket shows a colored order type badge -- "DINE-IN", "TAKEAWAY", or "DELIVERY + platform" -- in the ticket header so kitchen knows at a glance whether to plate or bag without reading order details
  2. The KDS board has filter tabs (All / Dine-in / Takeaway / Delivery) that hide irrelevant tickets and show only the selected channel
  3. Staff can flag individual items on a dine-in order as "pack to go"; flagged items show a "PACK" indicator on the KDS ticket so kitchen bags them separately on the same order
  4. Grab and LINE MAN platform badges render in distinct brand colors (Grab green, LINE MAN blue) using OKLCH design tokens, consistent with the existing token system in globals.css
**Plans**: 3 plans
Plans:
- [ ] 19-01-PLAN.md -- OrderLineItem packToGo field + togglePackToGo action + order-type badge CVA variants (foundation)
- [ ] 19-02-PLAN.md -- KdsTicketCard order type badge + KdsItemRow PACK chip + KdsBoard filter tabs
- [ ] 19-03-PLAN.md -- TicketLineItem bag toggle + TicketPanel wiring + kds-demo.ts mixed-channel update

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
| 17. Queue Store + Floor Plan Tabs | 4/4 | Complete   | 2026-03-15 | - |
| 18. Order Entry + Payment Pipeline | 3/3 | Complete    | 2026-03-15 | - |
| 19. KDS Differentiation + Combo Flag | 3/3 | Complete   | 2026-03-15 | - |

---

*Roadmap created: 2026-03-10*
*v1.0 completed: 2026-03-11*
*v1.1 completed: 2026-03-12*
*v1.2 completed: 2026-03-13*
*v1.3 roadmap added: 2026-03-15*
*Full v1.0 archive: `.planning/milestones/v1.0-ROADMAP.md`*
*Full v1.1 archive: `.planning/milestones/v1.1-ROADMAP.md`*
*Full v1.2 archive: `.planning/milestones/v1.2-ROADMAP.md`*
