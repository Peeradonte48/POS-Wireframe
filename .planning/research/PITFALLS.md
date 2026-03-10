# Domain Pitfalls: Restaurant POS Wireframe

**Domain:** Restaurant POS — Interactive Wireframe (Dev Handoff + Stakeholder Presentation)
**Researched:** 2026-03-10
**Confidence:** HIGH (domain knowledge) — web search unavailable; findings drawn from established POS UX patterns and restaurant operational knowledge

---

## Critical Pitfalls

Mistakes that cause wireframe rejection by stakeholders, rework by engineers, or fundamental misrepresentation of how a restaurant actually operates.

---

### Pitfall 1: Treating the Order as a Single Linear Flow

**What goes wrong:**
The wireframe shows "seat table → take order → send to kitchen → collect payment" as a clean four-step sequence. Real dine-in service is non-linear. Guests arrive in waves, order in rounds (drinks first, then food, then dessert), add items mid-meal, and sometimes pay before others at the same table finish. A wireframe that only models the happy path fails both audiences: engineers have no spec for re-ordering states, and stakeholders catch the gap immediately because it doesn't match their lived reality.

**Why it happens:**
Designers think in task flows. Restaurant operators think in table lifecycles. The two mental models don't naturally overlap unless the designer has observed actual service.

**Consequences:**
- Engineers build an order object that cannot be appended to after initial submission
- KDS shows tickets in arrival order regardless of course sequence
- Stakeholders ask "what happens when table 4 wants another bowl?" and the wireframe has no answer
- Mid-project redesign of the order data model

**Prevention:**
Model the table lifecycle, not just the order flow. The correct state machine for a dine-in table is: Empty → Seated → Order Open → Partial Send → Fully Sent → Add-on Round → Check Requested → Paid → Cleaning. Every state transition needs a wireframe screen or at least a documented note. Show "Add Items" as a primary action on an already-active table, not as an edge case buried in a secondary menu.

**Detection (warning signs):**
- Your table map only distinguishes "open" vs "occupied" — no "check requested" or "partial order" states
- "Add item to existing order" is not a labeled flow in your sitemap
- KDS ticket screen has no "course 2 arriving" concept
- Modifier screen has no "void item" action

**Phase to address:** Phase 1 (Table Map + Order Flow foundation) — if the state machine isn't right here, every downstream screen inherits the mistake.

---

### Pitfall 2: Oversimplifying Role and Permission Boundaries

**What goes wrong:**
The wireframe shows "Manager View," "Waiter View," and "Cashier View" as three completely separate screens. In practice, permissions are action-level, not screen-level. A waiter can see the table map but cannot void items. A cashier can process payment but cannot apply a manager discount without a PIN override. A manager can do everything but still uses the same screens — not a different app. Treating roles as separate apps means the wireframe won't map to any real POS permission system engineers will build, and managers will reject it because it doesn't reflect how they actually grant override access.

**Why it happens:**
It's easier to design three distinct interfaces than one interface with dynamic permission states. Designers take the path of least visual complexity.

**Consequences:**
- Engineers must retrofit a permission layer onto screens designed without it
- Manager override / PIN prompt flow is absent — a critical operational workflow
- Void, discount, and refund actions have no escalation path in the wireframe
- Stakeholders who understand real operations will flag this immediately

**Prevention:**
Design one interface with permission-aware action states. Show the same order screen across roles, but annotate: "Void button — waiter sees disabled state, cashier sees active, manager sees active + can authorize waiter override." Include a PIN/manager-override modal as an explicit wireframe screen. Document at least three permission levels per critical action (view, act, authorize).

**Detection (warning signs):**
- Role switching is represented as a login screen with no shared screens
- "Void item" button exists but has no disabled state shown
- No manager override / PIN prompt wireframe screen exists
- Discount and refund flows only appear in the manager view, not as escalation flows from waiter/cashier views

**Phase to address:** Phase 1 (Role + Permission Layer) — decisions made here affect every subsequent screen.

---

### Pitfall 3: Mock Data That Doesn't Reflect A Ramen's Actual Menu Structure

**What goes wrong:**
The wireframe uses placeholder data like "Item 1 / $10.00" or generic "Burger / Pizza / Pasta" categories. For a ramen restaurant with a structured modifier system (broth type, spice level, protein, toppings, extras), the mock menu must reflect that structure. Stakeholders from A Ramen will immediately disengage if the menu screen doesn't look like their menu. Engineers will underspec the modifier system if they're designing against flat items with no nested options.

**Why it happens:**
Using real menu data feels like "extra work" for a wireframe. Designers defer it, thinking it can be filled in later. It cannot — the modifier architecture is baked into the order screen layout.

**Consequences:**
- Modifier UI is designed for one layer (e.g., "choose size") when A Ramen needs three to four layers (broth, spice, protein, toppings, add-ons)
- Item count per category is underestimated — menu categories with 15+ items need scroll/pagination, not just a 6-item grid
- Stakeholders cannot evaluate whether the UI handles their actual product
- Engineers build a modifier system that handles checkboxes but not required-single-select (broth type) + optional-multi-select (toppings) simultaneously

**Prevention:**
Use actual A Ramen menu data from day one. If the full menu isn't available, construct representative mock data: 3-4 categories, 8-12 items per category, at least one item with a full modifier tree (required single-select + required single-select + optional multi-select + optional free-text for special requests). Show both a simple item and a fully-modified item in the order screen to demonstrate the complexity range.

**Detection (warning signs):**
- Menu items have a single price field and no modifier tree
- Your modifier UI only shows one modifier group at a time
- No "special request / free text" field exists on the order item
- Category grid shows 4-6 items maximum with no scroll behavior indicated

**Phase to address:** Phase 2 (Order-Taking Screen) — but mock data structure must be decided in Phase 1 so it's consistent across all screens.

---

### Pitfall 4: Table Map That Only Shows Status, Not Operability

**What goes wrong:**
The table map is designed as a visual display — a bird's-eye floor plan with color-coded statuses. It looks good in a stakeholder presentation but fails as an operational tool. Staff need to do things from the table map: seat guests, transfer a table, merge tables, see how long a table has been occupied, and navigate directly to that table's active order. A read-only status map is a dashboard, not a POS screen.

**Why it happens:**
Table maps are visually satisfying to design. The layout exercise dominates and the interaction design gets deprioritized.

**Consequences:**
- No "tap table to open order" interaction shown — engineers don't know what the tap target does
- Table transfer and table merge flows are absent — a daily operational necessity
- Time-on-table is not surfaced — waitstaff cannot identify tables approaching turn time
- The floor plan uses a grid layout that doesn't reflect actual restaurant floor geometry (booths, bar, outdoor)

**Prevention:**
Design the table map as a primary action surface, not a display. Every table cell must have a defined tap behavior for each status. Document: Empty → tap opens "Seat Table" modal; Occupied → tap opens active order; Check Requested → tap opens payment screen. Include secondary actions (long press or right-click equivalent) for: transfer table, merge tables, mark as reserved. Show time-on-table as a data point. Reserve one area of the map for "sections" if A Ramen uses section-based service.

**Detection (warning signs):**
- Table cells are visual elements with no interaction annotation
- No "seat guests" modal wireframe exists
- Table merge / table transfer are not in the sitemap
- The floor plan is a perfect grid (never matches reality)
- No time indicator on occupied tables

**Phase to address:** Phase 2 (Table Map screen) — foundational to the entire dine-in flow.

---

### Pitfall 5: KDS Designed Without Understanding Kitchen Workflow Realities

**What goes wrong:**
The Kitchen Display System (KDS) wireframe shows a list of tickets sorted by time. Real kitchen workflows are organized by station (cold station, hot station, noodle station), by course (fire appetizers now, hold mains), and by urgency signals (rush ticket, allergy flag). A flat ticket list doesn't communicate any of this. The KDS wireframe also frequently omits the "bump" action (mark item/ticket complete and remove from screen) and the recall function (retrieve a bumped ticket if needed).

**Why it happens:**
Designers focus on what information to show, not on what actions kitchen staff need to perform and in what sequence.

**Consequences:**
- Kitchen staff cannot use the wireframe to validate whether it reflects their actual workflow
- No course-fire concept means mains print immediately with appetizers — a real operational problem
- Missing bump action means engineers don't spec the ticket state machine correctly
- Allergy and special request flags have no visual treatment — a food safety risk in the real system

**Prevention:**
Show at least two KDS states: active ticket list and a single ticket detail. Annotate every action: "Bump item" (marks one item done), "Bump ticket" (marks whole table done), "Recall" (retrieves last bumped). Include visual differentiation for: rush tickets, allergen flags, special requests. If A Ramen uses course-based ordering (drinks → ramen → dessert), show how courses appear as separate groupings on a ticket, not merged.

**Detection (warning signs):**
- KDS shows information only, no action buttons annotated
- All items on a ticket look identical regardless of urgency or allergy flags
- "Bump" is not a labeled interaction
- No "recall" or "undo bump" state exists
- All tickets are sorted only by time, no grouping by station or course

**Phase to address:** Phase 3 (KDS screen) — can be designed in isolation but must reference order send logic from Phase 2.

---

### Pitfall 6: Payment Screen Underspecifies Split Bill Logic

**What goes wrong:**
The wireframe shows a "Split Bill" button that leads to a screen with no specified behavior. Real split scenarios are: split evenly by number of guests, split by item (each person pays for what they ordered), split into unequal custom amounts, and partial payment (one person pays their portion now, others pay later). Each scenario requires different UI affordances. "Split bill" as a single button with no flow detail is a dev-handoff failure — engineers will guess, and they'll guess the simplest case.

**Why it happens:**
Split bill is the hardest payment flow to design because it has the most combinatorial states. Designers document the easy case and defer the rest.

**Consequences:**
- Engineers implement only even-split, which fails immediately in real service
- Item-based splitting requires knowing which guest ordered what — a data model decision that should be made in the order-taking phase, not the payment phase
- Partial payment state is not handled — the table stays "occupied" even after partial payment
- Discount + split interactions are never modeled (what happens when a 10% discount is applied, then the bill is split?)

**Prevention:**
Design at minimum two split scenarios in full: even split and item-based split. For even split: show the "how many ways?" input, per-person amount, and payment method per person. For item-based split: show the assignment UI (drag item to "Guest 1 / Guest 2" columns or checkbox per guest). Show the combined payment screen state when one person has paid and one hasn't. Annotate discount behavior on split bills explicitly.

**Detection (warning signs):**
- "Split Bill" is a single button with no further flow designed
- No "assign items to guests" UI exists in the order-taking screen
- Payment screen shows only one total, no partial-payment state
- Discount + split interaction is not documented

**Phase to address:** Phase 4 (Payment screen) — but the guest-item assignment data must be accounted for as early as Phase 2.

---

### Pitfall 7: Shift Management Treated as an Admin Afterthought

**What goes wrong:**
Open shift and close shift are placed in a settings menu or an admin panel as secondary flows. In a real restaurant POS, shift management is the first thing a staff member does every morning and the last thing every night. It gates everything else — you cannot take orders without an open shift. Closing a shift triggers an end-of-day summary with cash count, tip reconciliation, and transaction totals. Treating it as an admin flow means it's underspecified and disconnected from the daily operational reality the wireframe is supposed to represent.

**Why it happens:**
Shift management isn't visually interesting. It's backstage infrastructure compared to the table map or order screen. It gets deprioritized in wireframes focused on the "exciting" screens.

**Consequences:**
- No "shift not open" state is shown — engineers don't know what to render when no shift is active
- End-of-day summary screen is absent — a critical screen for managers and accountants
- Cash drawer reconciliation flow (expected vs. actual cash) is never designed
- Multi-branch context means a staff member might work at Branch A but accidentally log into Branch B — no branch-selection-at-shift-open flow

**Prevention:**
Include shift open as the first flow after login: select branch → select role → open shift → confirm opening cash. End-of-day should show: transaction count, payment method breakdown (cash / card / QR), tips collected, voids and discounts applied, net sales. Show the "shift already open" state (someone forgot to close yesterday's shift). For multi-branch context, make branch selection explicit at shift open, not buried in settings.

**Detection (warning signs):**
- Shift open/close is in a settings or admin submenu, not a primary flow
- No "opening cash" input screen exists
- End-of-day summary is absent from the sitemap
- Branch selection has no relationship to shift open
- No "shift not open" zero state for the table map

**Phase to address:** Phase 1 (Authentication + Shift Open) — this is a foundational gate flow, not a supplementary one.

---

### Pitfall 8: Multi-Branch Context Not Surfaced in Navigation

**What goes wrong:**
The wireframe shows the POS interface without any visible indication of which branch the user is operating. With A Ramen scaling to multiple locations, staff members and managers need to see "Branch: Silom" or "Branch: Thonglor" clearly at all times. Managers reviewing cross-branch sales need a branch-switching mechanism. Without this, the wireframe implies a single-location system, and engineers will not architect for multi-tenancy from the start.

**Why it happens:**
Designing for one location is simpler. Multi-branch context feels like a backend concern, not a UX concern. Designers defer it.

**Consequences:**
- No branch selector exists — engineers treat branch as a backend config, not a UI concern
- Manager dashboard shows no branch filter — aggregated data only
- Staff can't tell which branch's menu they're building an order against
- Real-world scenario: manager at HQ wants to see Branch A's current floor plan — no mechanism exists in the wireframe

**Prevention:**
Place branch context in the persistent navigation header — visible on every screen. For staff: read-only (they're assigned to a branch at shift open). For managers: a branch switcher dropdown with "All Branches" aggregate view option. Show branch name in the shift open flow, the table map header, and the end-of-day summary. Make the manager dashboard branch-filterable.

**Detection (warning signs):**
- No branch indicator in the nav header
- Manager dashboard shows one total, no branch breakdown
- Table map has no branch label
- Staff login flow has no branch-selection step

**Phase to address:** Phase 1 (Navigation Shell + Shift Open) — must be in the persistent layout from the start.

---

### Pitfall 9: Void and Error Correction Flows Completely Absent

**What goes wrong:**
The wireframe covers the happy path exclusively. Voids (removing an item before the kitchen sees it), order corrections (removing an item after it's been sent to the kitchen), wrong table corrections, and reprint receipt are not designed. These are not edge cases — they happen every service. A wireframe without these flows fails the dev-handoff purpose because engineers have no spec for error recovery, which is often where the hardest state machine logic lives.

**Why it happens:**
Voids and corrections feel like exceptions. Designers focus on primary flows and leave error states as "to be determined."

**Consequences:**
- Engineers implement the happy path and stub error recovery for "later" — later never comes before launch
- No permission model for voids (anyone can void? manager PIN required?) because the flow isn't designed
- No difference designed between "void before send" (simple) and "void after send" (requires kitchen communication)
- Reprinting a receipt / re-sending a bill has no screen

**Prevention:**
Include void flow as an explicit wireframe: item long-press → void options → reason selection → confirmation → manager PIN (if required). Design two void states: pre-send (item simply removed) and post-send (item voided, kitchen notified, appears as struck-through on KDS). Include "wrong table" correction: transfer active order from Table 4 to Table 7 with confirmation. Show receipt reprint as an accessible action on a closed order.

**Detection (warning signs):**
- No void or correction screen in the sitemap
- Long-press or secondary action on order items is not annotated
- KDS has no visual treatment for voided items
- Closed order history has no "reprint" action

**Phase to address:** Phase 2 (Order-Taking Screen) for pre-send voids; Phase 3 (KDS) for post-send voids; Phase 4 (Payment) for receipt management.

---

### Pitfall 10: Wireframe Designed for Desktop, Ignoring POS Hardware Reality

**What goes wrong:**
The wireframe is designed for a standard laptop viewport (1280x800 or larger). Real POS terminals are often 10-15 inch touchscreens in portrait or landscape orientation, operated with a single finger by staff who are standing, wearing gloves, or moving fast. Touch targets, font sizes, and information density appropriate for a trackpad click are completely wrong for a touchscreen terminal. Even though the brief specifies "browser-based," the usage context is still a restaurant environment, not a desk.

**Why it happens:**
Designers work on their own machines. They design for the viewport they're looking at.

**Consequences:**
- Touch targets are 24px or smaller — untappable without a stylus
- Primary actions (send to kitchen, confirm payment) are in the top right corner — physically awkward on a counter-mounted terminal
- Text is 12-14px — unreadable at arm's length in a bright restaurant
- Stakeholders test on a tablet and find the interface unusable

**Prevention:**
Design with a 15-inch touchscreen context in mind: minimum 44x44px touch targets (prefer 48px), primary actions at bottom or center of screen (thumb zone for standing users), font sizes minimum 16px for body, 20px+ for key figures (table number, price totals). Use shadcn/ui component sizes at "lg" or above for interactive elements. Test the wireframe on an iPad or tablet before any stakeholder presentation.

**Detection (warning signs):**
- Wireframe is only viewable at 1280px+ width
- Button components use default (not large) shadcn/ui size
- Primary "Send to Kitchen" and "Charge" actions are in the top navigation
- No mobile/tablet breakpoint considered

**Phase to address:** Phase 2 (Order-Taking Screen) first — this is where touch interaction is most critical. But the layout system must account for it from Phase 1.

---

## Moderate Pitfalls

---

### Pitfall 11: Menu Category Navigation Not Designed for Speed

**What goes wrong:**
Menu categories are shown as a dropdown or tabbed interface requiring two taps to reach an item. Experienced waitstaff navigate menus from memory at speed — the interface needs to support this. Common pattern: persistent category sidebar (visible at all times) + item grid that updates instantly on category tap, no page transition. If category navigation requires a dropdown interaction, the order screen feels slow even in a wireframe demo.

**Prevention:**
Use a persistent left-column category list (not a dropdown, not a tab bar that scrolls off screen). Items appear in a right-panel grid that updates without page navigation. Highlight the active category. Allow direct item tap to add — no "add to order" confirmation dialog for standard items (confirmation only for items with required modifiers).

**Phase to address:** Phase 2 (Order-Taking Screen).

---

### Pitfall 12: No "Table Notes" or "Reservation Note" Concept

**What goes wrong:**
Real restaurant service involves notes at the table level: "birthday celebration," "allergic to shellfish," "VIP guest," "high chair needed." These notes affect service for the entire table, not a single order item. A wireframe with no table-level note field forces all allergy and preference information into item-level special requests, which gets lost when a new order round is started.

**Prevention:**
Add a table note field accessible from the table detail view (visible when a table is selected on the floor map). Show it prominently in the KDS ticket header. Distinguish table notes (persist for the entire visit) from item notes (apply to one dish).

**Phase to address:** Phase 2 (Table Map + Order-Taking).

---

### Pitfall 13: End State of "Paid" Table Not Designed

**What goes wrong:**
The wireframe shows payment completion but not what happens next: the table should return to "empty" status, appear as "cleaning" briefly, then be available again. If the table goes directly from "paid" to "empty," the floor plan shows incorrect status to staff. The cleaning state also gates: a waiter cannot seat a new party at a table still being cleaned.

**Prevention:**
Design the post-payment table lifecycle: Paid → Cleaning (staff clears table) → Ready (manager/host marks ready) → Empty (available to seat). Even if this is a simple status toggle, it must appear as a wireframe state.

**Phase to address:** Phase 2 (Table Map), cross-referenced with Phase 4 (Payment).

---

### Pitfall 14: Printer and Receipt Interactions Assumed, Not Specified

**What goes wrong:**
"Print receipt" and "print kitchen ticket" are shown as buttons with no specification of what triggers them, when they trigger automatically, and what happens if a printer is offline. In the wireframe context (no real hardware), this is a documentation problem: engineers need to know the intended behavior even though the wireframe can't simulate the printer.

**Prevention:**
Annotate print actions with intended behavior: "On 'Send to Kitchen' confirmation, kitchen ticket prints automatically. If printer offline, show error toast with retry option. Receipt prints on payment confirmation; staff can reprint from order history." This annotation lives in the wireframe as a design note, not a screen.

**Phase to address:** Phase 3 (KDS) and Phase 4 (Payment) — annotation only, no screen required.

---

## Minor Pitfalls

---

### Pitfall 15: Inconsistent Terminology Across Screens

**What goes wrong:**
The wireframe uses "order," "ticket," "bill," and "check" interchangeably. Engineers implement separate concepts. Stakeholders get confused. Restaurant staff use specific terms that differ by region and establishment type.

**Prevention:**
Establish a terminology glossary in Phase 1: "Order" = what the guest requests; "Ticket" = what goes to the kitchen; "Bill/Check" = the payment document presented to the guest. Use these terms consistently across every screen label, button, and annotation.

**Phase to address:** Phase 1 (any phase).

---

### Pitfall 16: Loading and Empty States Absent

**What goes wrong:**
Every screen shows data. No screen shows what happens when there are no open tables, no active orders, or data is loading. Engineers must invent these states, and they usually ship them as invisible or broken.

**Prevention:**
Design one empty state per major screen: Table map with no occupied tables (new day, opening shift), KDS with no active tickets, order history with no past orders. These can be simple — a centered illustration or message — but they must exist.

**Phase to address:** Phase 2-4, one per screen.

---

### Pitfall 17: Color Used as the Only Status Differentiator on the Table Map

**What goes wrong:**
Table statuses are communicated only via color (green = open, red = occupied, yellow = check requested). Color-blind staff members cannot distinguish them. More practically, on a bright restaurant screen in daylight, subtle color differences wash out.

**Prevention:**
Pair every color-based status with a secondary indicator: icon, label, or pattern. "Occupied" tables show a chair count or time-elapsed badge in addition to red fill. "Check requested" tables show a bill icon. Do not rely on color alone.

**Phase to address:** Phase 2 (Table Map).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Auth + Shift Open | Shift open is deprioritized as secondary flow | Design shift open as the entry gate — it must be the first post-login screen |
| Phase 1: Navigation Shell | Branch context absent from persistent nav | Add branch label to header in the layout template before any screen is designed |
| Phase 1: Role/Permission Architecture | Three separate apps instead of one with permission states | Define permission matrix first; design one interface with annotated disabled states |
| Phase 2: Table Map | Read-only status display with no interaction spec | Define tap behavior for every table status before starting visual design |
| Phase 2: Order-Taking | Generic menu data, flat modifier structure | Source A Ramen menu data; design modifier tree for at least one complex item |
| Phase 2: Order Flow | Linear happy path only | Map the full table lifecycle state machine before designing individual screens |
| Phase 2: Void Flow | Void completely absent | Include void pre-send and post-send as explicit flows, with permission annotations |
| Phase 3: KDS | Information display only, no kitchen actions | Annotate every action: bump item, bump ticket, recall, rush flag |
| Phase 4: Payment / Split Bill | Split bill is a single button with no specified behavior | Design at least two split scenarios in full (even split + item split) |
| Phase 4: Post-Payment Table State | Table goes directly from paid to open | Design Paid → Cleaning → Ready → Empty lifecycle |
| All Phases | Desktop-only viewport assumptions | Test every major screen at 1024x768 (tablet landscape) as minimum viable viewport |
| All Phases | Inconsistent terminology | Lock terminology glossary in Phase 1 documentation |

---

## Sources

- Project context: `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/.planning/PROJECT.md`
- Domain knowledge: Restaurant POS operational patterns (dine-in table service, kitchen workflow, payment reconciliation) — HIGH confidence based on established industry patterns
- UX principles: Touch target sizing (44px minimum) — WCAG 2.5.5 / Apple HIG standard — HIGH confidence
- Note: Web search and WebFetch tools were unavailable during research. All findings are based on established domain knowledge. Recommend validating KDS and shift management specifics against A Ramen's actual operational staff before finalizing Phase 3-4 wireframes.
