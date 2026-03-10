# Roadmap: FIP POS Staff App Wireframe

**Project:** POS Wireframe — A Ramen / FIP Ecosystem
**Created:** 2026-03-10
**Granularity:** Coarse (7 phases — natural delivery boundaries; compression below 7 would create incoherent phase goals across distinct user audiences)
**Coverage:** 34/34 v1 requirements mapped

---

## Phases

- [ ] **Phase 1: Foundation** — Scaffold, AppShell, PIN login, role routing, shift open
- [ ] **Phase 2: Table Map** — Floor plan with full table lifecycle state machine
- [ ] **Phase 3: Order Flow** — Order entry, ramen modifier sheet, void flows
- [ ] **Phase 4: KDS** — Kitchen display with bump, recall, and demo mode
- [ ] **Phase 5: Payment** — Bill, payment methods, post-payment table lifecycle
- [ ] **Phase 6: Manager Layer** — Shift close, EOD summary, sales snapshot, manager tools
- [ ] **Phase 7: Polish** — Role gating audit, touch targets, toasts, empty/loading states

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/5 | In Progress|  |
| 2. Table Map | 0/? | Not started | - |
| 3. Order Flow | 0/? | Not started | - |
| 4. KDS | 0/? | Not started | - |
| 5. Payment | 0/? | Not started | - |
| 6. Manager Layer | 0/? | Not started | - |
| 7. Polish | 0/? | Not started | - |

---

## Phase Details

### Phase 1: Foundation
**Goal:** Staff can authenticate, select a branch, and open a shift before touching any POS screen
**Depends on:** Nothing (first phase)
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05

**Success Criteria** (what must be TRUE when this phase completes):
1. Staff member can open the app, enter a PIN, and be routed to the correct interface for their role (Waiter / Cashier / Manager / Kitchen)
2. Manager can authorize a restricted action (void, discount) by entering a manager PIN in an overlay modal without leaving the current screen
3. After login, staff must complete shift open — selecting a branch and entering opening cash — before the main POS is accessible
4. The branch name and role badge are visible in the persistent navigation header on every screen throughout the session
5. A second staff member logging in with a different role sees a meaningfully different set of enabled/disabled actions within the same interface — not a different app

**Plans:** 4/5 plans executed

Plans:
- [ ] 01-01-PLAN.md — Scaffold + Tailwind v4 config + route groups + Zustand store + role-permissions + mock data
- [ ] 01-02-PLAN.md — PinNumpad component + RoleSelector + login page (AUTH-01)
- [ ] 01-03-PLAN.md — AppShell: AppHeader + AppSidebar + (app)/layout.tsx auth guard (AUTH-02, AUTH-05)
- [ ] 01-04-PLAN.md — ShiftOpenForm + shift-open page + ManagerPinModal (AUTH-04, AUTH-03)
- [ ] 01-05-PLAN.md — Final type check + visual checkpoint: verify all 5 success criteria in browser

---

### Phase 2: Table Map
**Goal:** Staff can view every table's current status, seat a new party, and navigate to the right next action from the floor plan
**Depends on:** Phase 1
**Requirements:** FLOOR-01, FLOOR-02, FLOOR-03, FLOOR-04, FLOOR-05

**Success Criteria** (what must be TRUE when this phase completes):
1. Staff can scan the floor plan and immediately identify each table's state (Open, Occupied, Reserved, Check Requested, Cleaning) via color and icon — not color alone
2. Tapping a table performs the status-appropriate action: empty table opens the "Seat Table" modal; occupied table opens the active order; Check Requested table routes to the payment screen
3. Staff can enter seat/cover count in the "Seat Table" modal and see it reflected on the table tile
4. Every occupied table displays a live dwell timer badge showing how long the party has been seated
5. Staff can assign a waiter to a table and add a table-level note that persists for the full visit

**Plans:** TBD

---

### Phase 3: Order Flow
**Goal:** Staff can take a full ramen order with modifiers, send it to the kitchen, and manage the ticket through the full order lifecycle
**Depends on:** Phase 2
**Requirements:** ORDER-01, ORDER-02, ORDER-03, ORDER-04, ORDER-05, ORDER-06, ORDER-07

**Success Criteria** (what must be TRUE when this phase completes):
1. Staff can browse menu categories, select an item, and configure all modifiers — required single-select (broth type, visual spice level 1–5 icon selector), optional multi-select (toppings, add-ons), and free-text special request — before adding to the ticket
2. Staff can edit or remove any item on an open ticket before sending; after sending, removing an item shows a manager PIN override prompt
3. Staff can send the ticket to the kitchen and see a confirmation state; the table tile on the floor map updates to reflect the order stage (Ordered / Cooking / Ready / Billed)
4. Staff can return to a table that already has an open order and add additional items without disrupting the existing ticket
5. A Ramen-specific menu data (real categories, items, and at least one full modifier tree) is used throughout — no generic placeholder menu

**Plans:** TBD

---

### Phase 4: KDS
**Goal:** Kitchen staff can view, action, and clear tickets on a full-screen display that auto-populates with new orders in demo mode
**Depends on:** Phase 3
**Requirements:** KDS-01, KDS-02, KDS-03, KDS-04

**Success Criteria** (what must be TRUE when this phase completes):
1. Kitchen staff see a full-screen, high-contrast ticket board with three columns (New / In Progress / Ready) and no POS sidebar visible
2. Kitchen staff can bump an individual item to mark it done, bump an entire ticket to advance its status, and recall a previously bumped ticket — all with a single tap
3. Every ticket displays an elapsed timer; allergy flags and special requests are visually distinct from regular item lines; post-send voided items appear struck-through
4. In demo mode, new mock tickets appear automatically at a realistic cadence via setInterval without any manual input

**Plans:** TBD

---

### Phase 5: Payment
**Goal:** Staff can close a bill, collect payment by method, and return the table to a clean state for the next party
**Depends on:** Phase 3
**Requirements:** PAY-01, PAY-02, PAY-03, PAY-04, PAY-05

**Success Criteria** (what must be TRUE when this phase completes):
1. Staff can view a fully itemized bill with line items, modifier details, an editable discount field, tax calculation, and a final total
2. Staff can select a payment method (Cash / QR PromptPay / Card) and confirm payment; confirmation triggers the table status to change to Cleaning on the floor map
3. After payment, staff can access a receipt action state (print annotation visible; no real printer required) and reprint from a closed order
4. The payment screen contains a clearly annotated placeholder indicating where split bill functionality will attach in v2

**Plans:** TBD

---

### Phase 6: Manager Layer
**Goal:** Managers can close a shift with a full financial summary and perform operational overrides that staff cannot
**Depends on:** Phase 1, Phase 3, Phase 5
**Requirements:** SHIFT-01, SHIFT-02, SHIFT-03, SHIFT-04

**Success Criteria** (what must be TRUE when this phase completes):
1. Manager can close the shift and review an end-of-day summary showing revenue, payment method breakdown, void count, discount total, net sales, and a cash reconciliation input field
2. Manager can view a sales snapshot dashboard with revenue, cover count, and top-selling items displayed as numbers (no charts required)
3. Manager can toggle item availability (mark as 86'd) from within the Staff POS app — change is immediately reflected in the order-taking menu
4. Manager can view all open tickets across all tables and a staff/user list for the current shift

**Plans:** TBD

---

### Phase 7: Polish
**Goal:** The wireframe is demo-ready — role gating is complete, all screens handle edge states, and the interface meets touch target standards at tablet viewport
**Depends on:** Phases 1–6
**Requirements:** POLISH-01, POLISH-02, POLISH-03, POLISH-04

**Success Criteria** (what must be TRUE when this phase completes):
1. Every action across all screens renders in the correct state (enabled / disabled / authorize) for every role — no action is incorrectly available or incorrectly blocked for any role
2. All interactive elements meet 44px minimum touch target size; the app is functional and visually correct at both 375px mobile and 1024×768 tablet viewports
3. Sonner toast notifications appear for key actions ("Order sent to kitchen", "Payment received") on every applicable screen
4. Every major screen has a defined loading state and empty state — no screen ever shows a blank or broken layout when data is absent

**Plans:** TBD

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| AUTH-04 | Phase 1 |
| AUTH-05 | Phase 1 |
| FLOOR-01 | Phase 2 |
| FLOOR-02 | Phase 2 |
| FLOOR-03 | Phase 2 |
| FLOOR-04 | Phase 2 |
| FLOOR-05 | Phase 2 |
| ORDER-01 | Phase 3 |
| ORDER-02 | Phase 3 |
| ORDER-03 | Phase 3 |
| ORDER-04 | Phase 3 |
| ORDER-05 | Phase 3 |
| ORDER-06 | Phase 3 |
| ORDER-07 | Phase 3 |
| KDS-01 | Phase 4 |
| KDS-02 | Phase 4 |
| KDS-03 | Phase 4 |
| KDS-04 | Phase 4 |
| PAY-01 | Phase 5 |
| PAY-02 | Phase 5 |
| PAY-03 | Phase 5 |
| PAY-04 | Phase 5 |
| PAY-05 | Phase 5 |
| SHIFT-01 | Phase 6 |
| SHIFT-02 | Phase 6 |
| SHIFT-03 | Phase 6 |
| SHIFT-04 | Phase 6 |
| POLISH-01 | Phase 7 |
| POLISH-02 | Phase 7 |
| POLISH-03 | Phase 7 |
| POLISH-04 | Phase 7 |

**Total mapped: 34/34. No orphaned requirements.**

---

## Dependency Graph

```
Phase 1 (Foundation)
  └── Phase 2 (Table Map)
        └── Phase 3 (Order Flow)
              ├── Phase 4 (KDS)
              └── Phase 5 (Payment)
                    └── Phase 6 (Manager Layer) ← also depends on Phase 1, Phase 3
                          └── Phase 7 (Polish)
```

Phase 4 (KDS) and Phase 5 (Payment) are independent of each other — both depend on Phase 3. Either can be built in parallel or in sequence.

---

*Roadmap created: 2026-03-10*
*Updated: 2026-03-10 — Phase 1 plans created (5 plans, 4 waves)*
