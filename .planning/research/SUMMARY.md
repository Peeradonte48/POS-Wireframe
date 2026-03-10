# Project Research Summary

**Project:** POS Wireframe — A Ramen / FIP Ecosystem
**Domain:** Dine-in Restaurant POS (Table Service, Multi-Branch, Ramen Specialty)
**Researched:** 2026-03-10
**Confidence:** HIGH (stack + architecture), MEDIUM-HIGH (features + pitfalls)

## Executive Summary

This project is a browser-based interactive POS wireframe targeting dine-in ramen restaurant operations, purpose-built as a dev-handoff artifact and stakeholder presentation tool. Experts build this class of wireframe with a Next.js 15 App Router shell, shadcn/ui components, and Zustand for in-memory state — the stack is unambiguous and well-validated. The architecture follows a role-aware, route-driven SPA pattern where each major POS workflow maps to a top-level route, wrapped in a persistent shell that maintains session and branch context across navigation. All data is mock (TypeScript fixtures in `/lib/mock/`), meaning no backend, no API calls, and no authentication complexity — only simulated state transitions.

The recommended approach is to build in 7 phases ordered by architectural dependency: scaffold and shell first, then table map (the visual anchor for stakeholders), then the order-taking flow (the most complex UX and the ramen-specific differentiator), then KDS and payment (which depend on order state), then shift management, and finally a polish pass for demo realism. This order ensures every phase produces a demonstrable artifact and that no downstream screen inherits upstream design mistakes.

The dominant risk for this project is not technical — it is designing for the happy path and ignoring operational reality. Dine-in POS is non-linear: guests add items mid-meal, waitstaff void orders after sending, tables need a cleaning state between guests, and managers need to authorize actions that waitstaff cannot perform unilaterally. The wireframe must model these states explicitly or it will fail both audiences: engineers will underspec the state machine, and restaurant operators will reject it as unrealistic. Address this by establishing the table lifecycle state machine, role permission matrix, and terminology glossary in Phase 1 before any screen design begins.

---

## Key Findings

### Recommended Stack

The stack is specified in PROJECT.md and fully corroborated by shadcn/ui and Next.js documentation. Next.js 15 with App Router is the canonical choice — Pages Router is maintenance-only. React 19 is required by Next.js 15 and its concurrent features improve responsiveness on interaction-heavy POS screens. shadcn/ui is not a packaged library but a code-generation pattern that copies components into `components/ui/` for full ownership — critical for POS-specific customizations like large touch targets and semantic status colors. Zustand (not React Context) is recommended for state management because Context does not survive route transitions in App Router without careful provider placement, which would reset role state mid-demo.

**Core technologies:**
- Next.js 15 (App Router): Application shell and routing — canonical standard, RSC support aligns with FIP production direction
- React 19: UI runtime — required by Next.js 15, concurrent features help interaction-heavy screens
- TypeScript 5.x (strict): Type safety — types document component contracts for engineering handoff
- Tailwind CSS 4.x: Utility styling — first-class shadcn/ui integration; verify Tailwind v3 vs v4 at `npx shadcn@latest init` time
- shadcn/ui: Component library (code-gen pattern) — Badge, Button, Card, Dialog, Sheet, Tabs, Table, ScrollArea, Sonner, Command, DropdownMenu, RadioGroup, Checkbox; owned by project for full customization
- Lucide React: Iconography — shadcn/ui's default; do not mix other icon libraries
- Zustand 5.x: Global state — survives route transitions, no Provider boilerplate, maps cleanly to POS domain slices
- Recharts (via shadcn Chart): Charts — manager dashboard and end-of-day summary only; do not use in core POS flows
- TypeScript const fixtures in `/lib/mock/`: All data — typed mock data doubles as data model documentation

**Do not use:** MUI, Chakra UI, Redux Toolkit, react-beautiful-dnd, Framer Motion, Prisma, NextAuth, react-hook-form+Zod, or Storybook. These either conflict with the design system, over-engineer the scope, or add complexity without commensurate wireframe value.

### Expected Features

**Must have (table stakes) — wireframe is not credible without these:**
- Floor plan / table map with color-coded table status (Open, Occupied, Reserved, Needs Attention, Check Requested, Cleaning)
- Seat / cover count entry on table seating
- Order-taking screen with category tabs + item grid
- Item modifier flow: required single-select (broth, spice) + optional multi-select (toppings, add-ons) + optional free text (special requests)
- Add / remove / edit items on open ticket before and after kitchen send (with different permission levels)
- Send to Kitchen action with confirmation state
- Kitchen Display System (KDS) view: ticket queue, bump item, bump ticket, recall, elapsed time, allergy flags
- Bill / check screen: itemized summary, discount field, tax, total
- Payment method selection: Cash, card, QR/PromptPay (Thailand context)
- Print receipt action state (annotation only — no real printer integration)
- Void / cancel flow: pre-send (simple remove) and post-send (requires manager authorization)
- PIN login with role routing (Waiter, Cashier, Manager, Kitchen)
- Cashier view and Waiter view as permission-aware states of the same interface — not separate apps
- Manager view with override capabilities
- Shift open (branch selection, opening cash input) and shift close (end-of-day summary)
- Multi-branch context visible in persistent navigation header at all times
- Item availability toggle (86'd)

**Should have (differentiators for A Ramen specificity):**
- Visual spice level selector (icon-based 1-5 scale, not a dropdown)
- Table timer / dwell time badge on floor map tiles
- Order stage tracking per table propagated to floor plan (Ordered → Cooking → Ready → Billed)
- Waiter assignment to table (visible on floor plan and ticket)
- Quick note / special request field per order item surfaced on KDS
- Manager sales snapshot dashboard (revenue, covers, top items — numbers, not charts)
- End-of-day summary screen (revenue, payment method breakdown, voids, covers)
- Reservation indicator on table (static status only)
- Table notes field (persist for full visit, distinct from item-level notes)
- Post-payment table lifecycle: Paid → Cleaning → Ready → Empty

**Defer to v2+:**
- Split bill by seat (complex flow, not blocking first stakeholder validation)
- Course / round management (significant flow complexity)
- Staff performance analytics per shift
- Full reservation booking integration
- Ramen modifier presets / quick combos (nice-to-have, add only if time permits)

**Anti-features (explicitly out of scope):** Online ordering, inventory management, CRM/loyalty, full accounting dashboard, employee scheduling, multi-currency, menu builder/admin editor, customer-facing display, tip management, complex discount rule engine, real-time sync conflict UI.

### Architecture Approach

The wireframe is a role-aware, route-driven SPA shell built on Next.js App Router. A persistent `AppShell` (sidebar + topbar) wraps all POS views except `/login`, achieved via Next.js route groups. Each major workflow maps to a dedicated route (`/floor`, `/order/[tableId]`, `/kds`, `/payment/[orderId]`, `/shift`, `/manager`). The component hierarchy follows a strict View → Section → Atom pattern: Views are thin orchestrators that read Zustand stores and pass data as props; Sections are feature regions with no store access; Atoms are pure display primitives. Mock data lives exclusively in `src/lib/mock/` and is consumed only by Zustand stores at module initialization — never imported directly into components.

**Major components:**
1. AppShell (Shell Layer) — persistent sidebar with branch selector, role badge, nav links; topbar with shift status and clock
2. TableMapView + TableCard (Floor Layer) — primary action surface; every table status has a defined tap behavior; not a read-only display
3. OrderScreen + MenuPanel + OrderPanel + ModifierSheet (Order Layer) — split-panel layout with persistent category nav left, item list center, order ticket right; Sheet drawer for modifier flow
4. KitchenDisplayView + TicketBoard + TicketCard (KDS Layer) — full-screen, no sidebar, dark/high-contrast variant; columns by status (New / In Progress / Ready); explicit bump and recall actions
5. PaymentScreen + BillSummary + PaymentMethodSelector (Payment Layer) — closes transaction loop; annotated for split bill v2
6. ShiftManagementView + EndOfDaySummary (Shift Layer) — entry gate flow post-login; cash reconciliation; branch-scoped
7. Zustand Store Slices — sessionStore, tableStore, orderStore, kdsStore; each maps to a POS domain; initialized from fixtures at module load time

**Key patterns to follow:**
- Route group `(pos)/` isolates the shell from `/login`
- Zustand stores hydrated from fixtures at module definition time (not useEffect)
- shadcn Sheet (not Dialog) for modifier flows — preserves menu context
- KDS as independent full-screen context with mock setInterval for demo ticket simulation
- Role gating via `useSession()` hook — conditional rendering, no auth middleware

### Critical Pitfalls

1. **Treating order flow as linear happy path** — Model the full table lifecycle state machine (Empty → Seated → Order Open → Partial Send → Fully Sent → Add-on Round → Check Requested → Paid → Cleaning) before designing any screen. "Add items to existing order" must be a primary action, not an edge case.

2. **Three separate apps for three roles instead of one permission-aware interface** — Design one interface with annotated disabled/enabled/authorize states per action. Include an explicit manager PIN override modal. Define a permission matrix (view / act / authorize) for void, discount, and refund before any screen work begins.

3. **Mock data that doesn't reflect A Ramen's menu structure** — Use real A Ramen menu data from day one. At minimum, build representative mock data with 3-4 categories, 8-12 items per category, and at least one item with a full modifier tree (required single-select + required single-select + optional multi-select + optional free text).

4. **Table map designed as a read-only status display** — Every table cell must have defined tap behavior for every status. Empty → "Seat Table" modal; Occupied → active order; Check Requested → payment screen. Include secondary actions (transfer table, merge tables, mark reserved). Show time-on-table. Never use a perfect grid layout — reflect actual restaurant geometry.

5. **KDS designed as information display with no kitchen actions** — Annotate every action: bump item, bump ticket, recall, rush flag. Show visual differentiation for allergen flags and special requests. Show how courses appear as separate groupings if A Ramen uses multi-round ordering.

6. **Void flows completely absent** — Include pre-send void (simple remove) and post-send void (kitchen notification, struck-through on KDS, manager PIN) as explicit wireframe flows. These are daily operations, not edge cases.

7. **Wireframe designed for desktop viewport only** — Design for 15-inch touchscreen: minimum 44x44px touch targets (prefer 48px), primary actions in thumb zone (bottom/center), body text minimum 16px, key figures 20px+. Use shadcn/ui `size="lg"` for all interactive elements. Test on tablet before any stakeholder presentation.

---

## Implications for Roadmap

Based on research, the architecture file's 7-phase build order is well-founded and should serve as the roadmap backbone. The pitfalls analysis reinforces that Phases 1 and 2 carry the highest design risk — architectural decisions made there propagate to every downstream phase.

### Phase 1: Foundation — Scaffold, Shell, Auth Entry, Shift Open

**Rationale:** Everything else depends on this. Shell layout, Zustand store structure, mock data schema, role permission matrix, terminology glossary, and branch context in the nav header must all be established before any feature screen is designed. Shift open is the operational entry gate — it must be the first post-login screen, not a settings afterthought.

**Delivers:** Working Next.js + shadcn/ui project, AppShell with sidebar and topbar, `/login` RoleSelectorView, `/shift` ShiftManagementView (open flow), mock fixture structure for tables/menu/orders/staff/branches, Zustand store slices (session, table, order, kds), terminology glossary, and permission matrix documentation.

**Addresses (from FEATURES.md):** PIN login, branch selector, role routing, shift open, multi-branch nav context.

**Avoids (from PITFALLS.md):** Role permission oversimplification (Pitfall 2), branch context absent from nav (Pitfall 8), shift management deprioritized (Pitfall 7), inconsistent terminology (Pitfall 15).

---

### Phase 2: Table Map — Floor Plan + Table Lifecycle

**Rationale:** The table map is the visual anchor for stakeholder demos and the "home screen" of every dine-in POS. It must be built early for maximum stakeholder impact. It also defines the table state machine that all downstream flows (order, payment, shift) reference. Building it second forces the full lifecycle to be designed before order-taking begins.

**Delivers:** `/floor` TableMapView with FloorGrid, TableCard (all status variants), StatusLegend, tap interactions for every table status, "Seat Table" modal with cover count input, time-on-table badge, table notes field, post-payment lifecycle (Paid → Cleaning → Ready → Empty), empty state (no occupied tables), accessible status indicators (icon + color, not color alone).

**Addresses (from FEATURES.md):** Floor plan, table status indicators, cover count, item availability toggle, waiter assignment, reservation indicator, table timer.

**Avoids (from PITFALLS.md):** Read-only table map (Pitfall 4), linear order flow (Pitfall 1 — table state machine locked in here), color-only status differentiation (Pitfall 17), post-payment table state not designed (Pitfall 13), table notes absent (Pitfall 12).

---

### Phase 3: Order Flow — Order Entry, Modifier Sheet, Void Flow

**Rationale:** The heaviest UX lift in the entire wireframe. Depends on the table store from Phase 2 (table must exist before an order can be attached). The modifier flow is the most ramen-specific screen and the most critical proof-of-concept for stakeholders evaluating whether this wireframe understands the domain. Void flows are included here (not deferred) because pre-send void is part of order-taking.

**Delivers:** `/order/[tableId]` OrderScreen with MenuPanel (persistent category sidebar + item grid), OrderPanel (line items, quantities, subtotal), ModifierSheet (broth, spice, protein, toppings, add-ons — multi-layer required + optional), Send to Kitchen confirmation, pre-send void flow, "Add items to existing table" flow (not just initial order), order stage tracking state on table (propagated back to floor plan), empty state (no items on ticket), touch-optimized targets throughout.

**Addresses (from FEATURES.md):** Order-taking screen, item modifier flow, add/remove/edit items, send to kitchen, void/cancel (pre-send), order queue, ramen modifier specifics, quick note / special request field.

**Avoids (from PITFALLS.md):** Generic menu data (Pitfall 3), linear happy path (Pitfall 1), menu category navigation not designed for speed (Pitfall 11), desktop viewport assumptions (Pitfall 10), void flows absent (Pitfall 9).

---

### Phase 4: KDS — Kitchen Display System

**Rationale:** KDS is designed as an isolated, independent screen (mirrors real hardware positioning). It depends on order send state from Phase 3. Modeled as a full-screen view with no sidebar and high-contrast styling to differentiate it visually from front-of-house screens.

**Delivers:** `/kds` KitchenDisplayView with TicketBoard (columns: New / In Progress / Ready), TicketCard (table ref, items with modifiers, course grouping, elapsed timer badge), bump item action, bump ticket action, recall action, allergy/special request flag visual treatment, post-send void treatment (struck-through item), mock setInterval for demo ticket simulation, empty state (no active tickets), print annotation (design note, no screen required).

**Addresses (from FEATURES.md):** KDS view, mark items/tickets as ready, order stage tracking, special request surfacing.

**Avoids (from PITFALLS.md):** KDS designed without kitchen workflow understanding (Pitfall 5), void flows absent in KDS (Pitfall 9, post-send dimension), printer interactions unspecified (Pitfall 14 — annotation here).

---

### Phase 5: Payment — Bill, Payment Methods, Post-Payment

**Rationale:** Natural end-of-flow; depends on order state existing from Phase 3. Payment screen closes the transaction loop for stakeholders. Split bill is deferred to v2 but the screen must be annotated to indicate where it will attach.

**Delivers:** `/payment/[orderId]` PaymentScreen with BillSummary (line items, modifiers, discount input field, tax, total), PaymentMethodSelector (Cash / QR / Card with RadioGroup), payment confirmation, receipt action state, receipt reprint from closed order, split bill annotation (v2 placeholder with UX note), partial payment state annotation, discount + split interaction documented as design note, post-payment trigger returning table to "Cleaning" state.

**Addresses (from FEATURES.md):** Bill/check screen, payment method selection, print receipt, void/cancel (post-payment dimension), receipt confirmation.

**Avoids (from PITFALLS.md):** Split bill underspecified (Pitfall 6), post-payment table state not designed (Pitfall 13), printer interactions unspecified (Pitfall 14 — annotation).

---

### Phase 6: Manager Layer — Shift Close, Sales Snapshot, User Management

**Rationale:** Least dependent on other flows — shift management and manager views can be built in relative isolation once the session store is solid. Shift close is a mirror of shift open (Phase 1) and naturally follows the full operational cycle. Sales snapshot is the stakeholder-facing "oversight layer" that justifies the manager role.

**Delivers:** Shift close / end-of-day summary (transaction count, payment method breakdown, voids, discounts, net sales, cash reconciliation input), manager sales snapshot dashboard (numbers view: revenue, covers, top items), order queue / ticket list (all open tickets across tables), item availability toggle screen, staff/user list view, branch-filterable manager views, "shift already open" state.

**Addresses (from FEATURES.md):** Shift close/EOD summary, manager sales snapshot, order queue, item availability toggle, staff list, manager view.

**Avoids (from PITFALLS.md):** Shift management as admin afterthought (Pitfall 7), end-of-day summary absent, branch context absent from manager views (Pitfall 8).

---

### Phase 7: Polish — Role Gating, Demo Mode, Accessibility, Viewport

**Rationale:** Makes the wireframe demo-ready. Adds narrative coherence for stakeholder walkthrough. Addresses cross-cutting concerns that can only be fully evaluated once all screens exist.

**Delivers:** Role-conditional rendering audit (confirm all actions have correct disabled/enabled/authorize states per role), branch switching smoke test across all views, loading and empty states for all major screens (Pitfall 16), color + icon status redundancy audit (Pitfall 17), viewport / touch target audit at 1024x768 tablet landscape, KDS auto-update via setInterval in demo mode, terminology consistency audit against glossary, Sonner toast notifications ("Order sent to kitchen," "Payment received").

**Addresses (from FEATURES.md):** Demo realism, stakeholder presentation quality.

**Avoids (from PITFALLS.md):** Desktop viewport assumptions (Pitfall 10), color-only status (Pitfall 17), loading/empty states absent (Pitfall 16), inconsistent terminology (Pitfall 15).

---

### Phase Ordering Rationale

- Shell before features: AppShell, Zustand stores, mock data schema, and the permission matrix are shared infrastructure. Any feature screen built before these exist will need retrofitting.
- Table map before order: The table state machine defined in Phase 2 is the data contract for Phase 3 (order) and Phase 5 (payment). Build the model before building the screens that depend on it.
- Order before KDS: KDS displays the result of "Send to Kitchen" — the KDS ticket state is derived from order send state. Phase 3 defines what Phase 4 displays.
- KDS before payment: Not a hard dependency, but payment is the final step of the transaction lifecycle. Completing KDS first means the full kitchen-to-table loop is demonstrable before closing with payment.
- Manager layer last: Most manager views aggregate data from all previous phases. Building last means the data they aggregate exists.
- Polish phase last: Cross-cutting concerns (role gating audit, viewport audit, demo mode) can only be fully evaluated when all screens are in place.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (Order Flow + Modifier Sheet):** The multi-layer modifier system (required single-select + optional multi-select + free text) is architecturally the most complex screen. Confirm actual A Ramen menu structure and modifier tree depth with A Ramen operational staff before finalizing screen design. The modifier data model in `src/lib/mock/menu.ts` is load-bearing for the entire order flow.
- **Phase 5 (Payment — Split Bill):** Split bill by seat is deferred to v2 but the data model decision (whether items are assigned to seats at order time) must be made in Phase 3. Validate with A Ramen whether seat-based splitting is a real operational need before Phase 3 begins.
- **Phase 4 (KDS — Course/Round Management):** If A Ramen uses multi-round service (drinks → ramen → dessert as separate sends), course-based KDS grouping needs to be designed. Confirm with kitchen staff whether they use round-based ordering.

Phases with standard patterns (skip dedicated research-phase):

- **Phase 1 (Scaffold + Shell):** Next.js 15 + shadcn/ui + Zustand setup is fully documented with no ambiguity. Follow the installation sequence in STACK.md directly.
- **Phase 2 (Table Map):** CSS Grid + Zustand table store is a well-understood pattern. The design decisions (tap behaviors, state machine) are documented in PITFALLS.md.
- **Phase 7 (Polish):** Checklist-driven audit work. No novel patterns required.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | PROJECT.md specifies the stack; shadcn/ui and Next.js docs corroborate. One MEDIUM caveat: Tailwind v3 vs v4 compatibility with shadcn/ui — verify at `npx shadcn@latest init` time. |
| Features | MEDIUM-HIGH | Industry-standard features (table stakes) are HIGH confidence from established POS vendor documentation. Ramen-specific differentiators are MEDIUM — validate with A Ramen operational staff. Thailand payment context (PromptPay) is MEDIUM. |
| Architecture | HIGH | All patterns from stable, widely-adopted APIs (Next.js App Router route groups, Zustand store slices, shadcn/ui component patterns). No speculative claims. |
| Pitfalls | HIGH | Domain pitfalls are based on established restaurant POS operational knowledge and POS UX patterns. Technical pitfalls (Context vs Zustand, monolithic components) are HIGH based on documented Next.js App Router behavior. |

**Overall confidence:** HIGH for stack and architecture. MEDIUM-HIGH for feature scope and domain specifics.

### Gaps to Address

- **A Ramen actual menu data:** The mock menu in `src/lib/mock/menu.ts` must reflect A Ramen's real menu structure (categories, items per category, modifier trees). Source this from A Ramen before Phase 3 begins or the modifier UI will be underspecced.
- **Multi-round ordering confirmation:** Confirm with A Ramen kitchen staff whether they use course/round-based sending (affects KDS design in Phase 4 and potentially order panel in Phase 3).
- **Seat-based split bill decision:** Decide in Phase 3 planning (not Phase 5) whether items will be assignable to individual seats at order time. This is a data model decision that cannot be retrofitted easily.
- **Floor plan geometry:** The actual floor layout of A Ramen branches (number of tables, zones, booth vs. table vs. bar seating) should inform the FloorGrid design in Phase 2. A rough sketch or seating chart from the restaurant is sufficient.
- **Tailwind v3 vs v4:** Verify shadcn/ui version compatibility with Tailwind at project initialization. STACK.md notes that v4 introduced breaking changes to config format.
- **dnd-kit scope decision:** Static floor plan (CSS absolute positioning) vs. editable floor plan (dnd-kit) must be decided before Phase 2. Static is recommended as the default; only add dnd-kit if manager-driven table repositioning is an explicit requirement.

---

## Sources

### Primary (HIGH confidence)
- `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/.planning/PROJECT.md` — project constraints, scope, and stack specification
- shadcn/ui documentation (ui.shadcn.com) — component catalog, installation patterns, Recharts chart wrapper
- Next.js documentation (nextjs.org/docs) — App Router, route groups, dynamic segments, layout patterns
- Zustand documentation (zustand.docs.pmnd.rs) — store patterns and slice architecture
- Lucide React documentation (lucide.dev) — React package and icon catalog

### Secondary (MEDIUM confidence)
- Toast POS, Square for Restaurants, Lightspeed Restaurant, Revel POS feature documentation (training data through mid-2025) — industry-standard POS feature landscape
- WCAG 2.5.5 / Apple HIG — touch target sizing standards (44px minimum)
- Thailand F&B market: PromptPay QR payment as standard — industry common knowledge

### Tertiary (LOW-MEDIUM confidence — validate before finalizing)
- dnd-kit documentation (dndkit.com) — React 18/19 compatibility; verify current version at install time
- Ramen-specific operational patterns (course management, modifier depth) — validate with A Ramen operational staff before Phase 3 design
- Thailand restaurant POS operational norms — validate with A Ramen management during Phase 1 kickoff

---

*Research completed: 2026-03-10*
*Ready for roadmap: yes*
