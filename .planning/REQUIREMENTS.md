# Requirements: FIP POS — Staff App Wireframe

**Defined:** 2026-03-10
**Core Value:** A restaurant staff member can open a shift, seat a table, take a full order with ramen-specific modifiers, send it to the kitchen, and close the bill — all from a mobile PWA that feels fast enough for real service conditions.

## v1 Requirements

Requirements for the FIP POS Staff App interactive wireframe (mobile PWA). Each maps to a roadmap phase.

### Authentication & Session

- [x] **AUTH-01**: Staff can log in via PIN with role routing to the appropriate view (Waiter / Cashier / Manager / Kitchen)
- [x] **AUTH-02**: One role-aware interface — permission-driven enabled/disabled/authorize states per action (not separate apps per role)
- [x] **AUTH-03**: Manager can authorize restricted actions (void, discount) via an in-app PIN override modal
- [x] **AUTH-04**: Staff can open a shift with branch selection and opening cash input before accessing the main POS
- [x] **AUTH-05**: Multi-branch context is visible in the persistent navigation header throughout the session

### Floor Management

- [x] **FLOOR-01**: Staff can view a floor plan with color + icon status per table (Open, Occupied, Reserved, Check Requested, Cleaning)
- [x] **FLOOR-02**: Staff can tap a table to perform the status-appropriate action (Empty → seat modal, Occupied → open order, Check Requested → payment screen)
- [x] **FLOOR-03**: Staff can enter seat/cover count when seating a table via a "Seat Table" modal
- [x] **FLOOR-04**: Time-on-table dwell timer badge is visible on each occupied table tile
- [x] **FLOOR-05**: Staff can assign a waiter to a table and add a table-level notes field (persists for the full visit)

### Order Flow

- [x] **ORDER-01**: Staff can browse menu by category tabs and add items to an active order
- [x] **ORDER-02**: Staff can configure item modifiers — required single-select (broth type, visual spice level 1–5 icon selector), optional multi-select (toppings, add-ons), and free text (special request)
- [x] **ORDER-03**: Staff can add, edit, or remove items from an open ticket before sending to the kitchen
- [x] **ORDER-04**: Staff can send order to the kitchen with a confirmation state
- [x] **ORDER-05**: Staff can void items pre-send (simple remove) and post-send (requires manager PIN override)
- [x] **ORDER-06**: Staff can add items to an existing open order (mid-meal add-on round)
- [x] **ORDER-07**: Table tile on floor map updates to reflect order stage (Ordered → Cooking → Ready → Billed)

### Kitchen Display System

- [x] **KDS-01**: Kitchen staff can view a full-screen KDS (no sidebar, high-contrast) with ticket columns (New / In Progress / Ready)
- [x] **KDS-02**: Kitchen staff can bump items and tickets, recall tickets, with elapsed timer per ticket
- [x] **KDS-03**: Allergy/special request flags and post-send voided items (struck-through) are visible on KDS tickets
- [x] **KDS-04**: KDS auto-updates with mock new tickets in demo mode via setInterval

### Payment & Checkout

- [ ] **PAY-01**: Staff can view an itemized bill with line items, modifier details, discount input field, tax, and total
- [ ] **PAY-02**: Staff can select payment method (Cash / QR PromptPay / Card) and confirm payment
- [ ] **PAY-03**: Payment confirmation triggers table status → Cleaning and shows a receipt action state (annotated — no real printer)
- [ ] **PAY-04**: Staff can reprint a receipt from a closed/paid order
- [ ] **PAY-05**: Split bill v2 placeholder is annotated on the payment screen with a design note

### Shift & Manager (Staff POS Layer)

- [ ] **SHIFT-01**: Manager can close shift and view an end-of-day summary (revenue, payment method breakdown, voids, discounts, net sales, cash reconciliation input)
- [ ] **SHIFT-02**: Manager can view a sales snapshot dashboard (revenue, covers, top items — numbers view, not charts)
- [ ] **SHIFT-03**: Manager can toggle item availability (86'd) from within the Staff POS app
- [ ] **SHIFT-04**: Manager can view all open tickets across tables and a staff/user list

### Polish & Demo Readiness

- [ ] **POLISH-01**: Role gating audit — all actions have correct disabled/enabled/authorize states per role across every screen
- [ ] **POLISH-02**: All interactive elements meet 44px+ touch targets; app tested at mobile (375px) and tablet (1024×768) viewports
- [ ] **POLISH-03**: Sonner toast notifications appear for key actions ("Order sent to kitchen", "Payment received")
- [ ] **POLISH-04**: Loading and empty states are defined for all major screens (no blank screens)

## v2 Requirements

### Payment

- **PAY-V2-01**: Staff can split bill by seat (items assigned to individual seats at order time)

### Order Flow

- **ORDER-V2-01**: Course/round management — multi-send ordering with kitchen grouping by course
- **ORDER-V2-02**: Modifier presets / quick combos for frequent ramen customizations

### Manager (Admin Back Office — separate project)

- **MGR-V2-01**: Full admin back office web application with advanced analytics, staff management, and multi-branch configuration
- **MGR-V2-02**: Customer POS / receipt tracker system (customer-facing web app)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin Back Office Management System | Separate deliverable — future project |
| Customer POS / receipt tracker | Separate deliverable — future project |
| FIP ecosystem integrations (CRM, Inventory, Accounting) | POS core only for this wireframe |
| Real backend / API | Wireframe only — all data is mock TypeScript fixtures |
| React Native / native mobile app | PWA wireframe only |
| Online ordering | Different product surface |
| Inventory management | FIP module, not POS scope |
| Loyalty / CRM | FIP module, not POS scope |
| Employee scheduling | FIP module, not POS scope |
| Real-time sync conflict UI | Not applicable to wireframe |
| Menu builder / admin editor | Admin Back Office scope |
| Complex discount rule engine | v2+ |
| Multi-currency | v2+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| FLOOR-01 | Phase 2 | Complete |
| FLOOR-02 | Phase 2 | Complete |
| FLOOR-03 | Phase 2 | Complete |
| FLOOR-04 | Phase 2 | Complete |
| FLOOR-05 | Phase 2 | Complete |
| ORDER-01 | Phase 3 | Complete |
| ORDER-02 | Phase 3 | Complete |
| ORDER-03 | Phase 3 | Complete |
| ORDER-04 | Phase 3 | Complete |
| ORDER-05 | Phase 3 | Complete |
| ORDER-06 | Phase 3 | Complete |
| ORDER-07 | Phase 3 | Complete |
| KDS-01 | Phase 4 | Complete |
| KDS-02 | Phase 4 | Complete |
| KDS-03 | Phase 4 | Complete |
| KDS-04 | Phase 4 | Complete |
| PAY-01 | Phase 5 | Pending |
| PAY-02 | Phase 5 | Pending |
| PAY-03 | Phase 5 | Pending |
| PAY-04 | Phase 5 | Pending |
| PAY-05 | Phase 5 | Pending |
| SHIFT-01 | Phase 6 | Pending |
| SHIFT-02 | Phase 6 | Pending |
| SHIFT-03 | Phase 6 | Pending |
| SHIFT-04 | Phase 6 | Pending |
| POLISH-01 | Phase 7 | Pending |
| POLISH-02 | Phase 7 | Pending |
| POLISH-03 | Phase 7 | Pending |
| POLISH-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
\*Last updated: 2026-03-10 after roadmap creation — traceability confirmed 34/34\*
