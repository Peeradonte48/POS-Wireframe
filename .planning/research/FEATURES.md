# Feature Landscape

**Domain:** Dine-in Restaurant POS — Table Service (Ramen, Multi-Branch)
**Researched:** 2026-03-10
**Confidence Note:** Web search tools unavailable this session. Findings based on training-data knowledge of Toast, Square for Restaurants, Lightspeed Restaurant, and Revel POS (all widely documented through mid-2025). Confidence: MEDIUM-HIGH for industry-standard features; LOW-MEDIUM for cutting-edge differentiators. Validate against current vendor docs before finalizing wireframe scope.

---

## Table Stakes

Features users expect in any dine-in POS. Missing = staff refuses adoption, stakeholders reject the wireframe as unrealistic.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Floor plan / table map | Core mental model for waitstaff; every dine-in POS has it (Toast, Square, Lightspeed, Revel) | Medium | Must show table status at a glance: Open, Occupied, Reserved, Needs Attention |
| Table status indicators | Waitstaff needs to know occupancy and order stage without asking | Low | Color-coded: green (open), amber (occupied/ordering), red (bill pending), grey (reserved) |
| Seat / cover count on table | Kitchen and billing need cover count | Low | Set when seating, affects split-bill math |
| Order-taking screen with menu categories | Core transaction screen; category tabs (e.g. Broth, Toppings, Drinks, Sides) | Medium | Must support rapid tapping for fast service |
| Item modifier flow | Ramen is inherently modifier-heavy; no modifier support = unusable for this domain | High | Broth type, spice level, noodle doneness, add-ons — structured as required vs optional groups |
| Add / remove / edit items on open ticket | Waitstaff must correct mistakes before sending | Medium | Edit until "Send to Kitchen" is tapped |
| Send to Kitchen action | Core event that fires the KDS ticket | Low | Confirmation state to prevent accidental sends |
| Kitchen Display System (KDS) view | Kitchen cannot operate on paper in a modern ramen shop | Medium | Shows ticket queue, item details with modifiers, elapsed time |
| Mark items / tickets as ready | Kitchen staff closes the loop to waitstaff | Low | Per-item or whole-ticket "Ready" toggle |
| Bill / check screen | Every POS has a checkout view with itemized summary | Low | Shows items, modifiers, subtotal, tax, total |
| Payment method selection | Cash, credit/debit card, QR/PromptPay (Thailand context) | Medium | Must be selectable; amounts clearly shown |
| Print receipt / bill | Legal requirement in Thailand; operational expectation everywhere | Low | Wireframe: show print action state, not actual printer integration |
| Void / cancel order or item | Mistakes happen; voiding is a daily operation | Medium | Requires manager confirmation for post-send voids |
| Staff login / PIN entry | Role-based access is a POS baseline; prevents unauthorized transactions | Low | PIN pad UI; role determines which views are accessible |
| Cashier view | Dedicated billing-focused view for cashier role | Medium | Bill queue, payment processing, receipt — no table assignment |
| Waiter view | Table-centric order-taking view | Medium | Floor plan, order entry, modifier flow, send to kitchen |
| Manager view | Operational oversight and overrides | High | Voids, shift summary, sales snapshot, user management |
| Shift open / close | Session management is standard in every POS | Medium | Open shift: assign staff, starting float. Close shift: sales summary, cash reconciliation |
| Menu navigation (categories + items) | Foundational to order entry | Low-Medium | Category tabs, item grid, item detail with modifiers |
| Item availability toggle | Items sell out; marking 86'd is a real operation | Low | Per-item on/off; reflects immediately on order screen |
| Order queue / ticket list | View all open tickets across tables | Medium | Useful for both manager and kitchen; shows table, time open, order status |
| Multi-branch location context | Project explicitly requires it; multi-branch groups need this | Medium | Branch selector at login or in nav; data scoped to selected branch |

---

## Differentiators

Features not universally expected but that add real competitive or operational value. These distinguish a thoughtful wireframe from a generic template.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Ramen modifier presets / quick combos | A Ramen staff knows regulars order "Tonkotsu, level 2, extra noodles" — preset combos save 5+ taps per order | Medium | Saved modifier combinations per item; shown as quick-select chips |
| Visual spice level selector | Spice is a key modifier in ramen; a 1–5 flame icon selector is faster and more intuitive than a dropdown | Low | Replace text dropdown with icon-based selector; high UX clarity |
| Table timer / dwell time | Shows how long a table has been occupied; helps manage table turns in busy service | Low | Elapsed time badge on table map tiles; color shifts at threshold |
| Order stage tracking per table | "Ordered → Cooking → Ready → Billed" shown on floor plan; reduces waiter-kitchen communication | Medium | Requires KDS state to propagate to floor plan view |
| Split bill by seat | Common in group dining; reduces end-of-meal friction | High | Assign items to seats at order time OR split evenly at checkout |
| Course / round management | For multi-round ramen service (e.g., add-on noodles, refills); allows sending items in stages | High | Mark items for Round 1 / Round 2; send sequentially |
| Manager sales snapshot dashboard | Real-time sales total, covers served, top items — useful for shift reviews | Medium | Simple numbers view, not full analytics |
| End-of-day summary screen | Shift close report: revenue, payment method breakdown, voids, covers | Medium | Replaces manual reconciliation; high value for manager role |
| Waiter assignment to table | Track which waiter owns which table; accountability and tip tracking | Low | Assign on seating; visible on floor plan and ticket |
| Staff performance per shift | Orders per hour, covers served, voids — for manager review | High | Defer to v2 but worth noting as a differentiator |
| Quick note / special request field | Free text on order item for allergy or preference notes | Low | Single text input field per item; passes to KDS display |
| Reservation indicator on table | Show reserved status with time and name; reduces seating conflicts | Medium | Static state in wireframe; integration with reservation system is out of scope |

---

## Anti-Features

Features to explicitly NOT build in the v1 wireframe. Either out of scope, premature, or harmful to focus.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Online ordering / delivery screens | Out of scope for this POS phase; completely different flow and UX | Keep a placeholder navigation item labeled "Online Orders" — disabled, greyed out |
| Inventory management screens | Belongs to FIP Inventory module, not POS core | Reference inventory in PROJECT.md as future FIP integration; no screens in this wireframe |
| CRM / loyalty program screens | FIP CRM module scope; not a POS core flow | Same: greyed nav item if needed for context |
| Full accounting / reporting dashboard | Belongs to FIP Accounting module | End-of-day summary (differentiator above) is sufficient for POS scope |
| Employee scheduling | Out of scope for POS; HR/scheduling module | Not referenced in this wireframe at all |
| Multi-currency support | Premature complexity; A Ramen operates in THB | Hard-code THB; internationalization is a later concern |
| Table reservation booking flow | Reservation management is its own system | Show reserved status on table map only; no booking UI |
| Menu builder / admin editor | Backend CMS for menu is not a POS screen | Assume menu is configured; show a read-only menu settings view at most |
| Customer-facing display | Second-screen customer confirmation is hardware-dependent | Out of scope for browser wireframe |
| Tip management | Less common in Thai restaurant context; adds billing complexity | Omit entirely in v1 |
| Complex discount engine | Promotional rules engine is complex and context-specific | Show a single "Discount %" input field on the bill screen; no rule builder |
| Real-time multi-device sync indicators | Actual sync is backend; wireframe doesn't simulate live data conflicts | Static state is fine; no sync conflict UI needed |

---

## Feature Dependencies

```
PIN Login → Role-determined view (Waiter / Cashier / Manager)
  |
  ├── Waiter view
  │     Floor Plan → Select Table → Set Cover Count → Order Screen
  │     Order Screen → Browse Menu → Select Item → Modifier Flow → Add to Ticket
  │     Ticket → Send to Kitchen → KDS ticket created
  │     KDS → Mark Ready → Waiter notified (state on floor plan changes)
  │     Table → Request Bill → Bill Screen
  │
  ├── Cashier view
  │     Bill Queue → Select Table/Bill → Payment Screen → Method Selection → Confirm → Receipt
  │     Void Item → Manager approval required
  │
  └── Manager view
        Shift Open → (all waiter/cashier functions unlocked)
        Void approval → Required before cashier/waiter can void post-send item
        Sales Snapshot → Live during shift
        Shift Close → End-of-day summary → Cash reconciliation input

Item modifier flow (dependency chain):
  Select Item → Required modifiers must be answered before Add to Ticket
  (e.g., Broth type required → Spice level required → Add-ons optional)

Send to Kitchen:
  Requires at least 1 item on ticket
  Triggers KDS ticket creation
  Locks sent items from edit (void required to change)

Bill screen:
  Requires table to have active order
  Requires all items to be in "sent" or "ready" state
  Discount applied before tax calculation
  Split bill (if implemented) must resolve before payment
```

---

## Screens Inventory

A complete list of distinct screens the wireframe must include. Derived from table stakes + selected differentiators.

| Screen | Role Access | Priority |
|--------|-------------|----------|
| PIN Login | All | P0 |
| Branch Selector | All (manager auto-selects or picks) | P0 |
| Floor Plan / Table Map | Waiter, Manager | P0 |
| New Table / Seat Count Modal | Waiter, Manager | P0 |
| Order Entry (Menu + Ticket) | Waiter | P0 |
| Item Detail + Modifier Flow | Waiter | P0 |
| Send to Kitchen Confirmation | Waiter | P0 |
| KDS / Kitchen Display | Kitchen (view-only role or manager) | P0 |
| Bill / Check Summary | Cashier, Waiter, Manager | P0 |
| Payment Screen | Cashier, Manager | P0 |
| Receipt Confirmation | Cashier | P0 |
| Void / Cancel Item | Waiter (request), Manager (approve) | P0 |
| Shift Open Screen | Manager | P0 |
| Shift Close / EOD Summary | Manager | P0 |
| Manager Sales Snapshot | Manager | P1 |
| Order Queue / Ticket List | Manager, (Cashier) | P1 |
| Item Availability Toggle | Manager | P1 |
| Staff / User List | Manager | P1 |

---

## MVP Recommendation

For the wireframe to be credible as a dev-handoff spec and stakeholder artifact, prioritize:

1. **Floor plan with table status** — the visual anchor of the entire POS
2. **Order entry with modifier flow** — the most complex and most ramen-specific screen
3. **KDS ticket view** — proves the kitchen integration story
4. **Bill + payment screen** — closes the transaction loop
5. **PIN login with role routing** — demonstrates role-based access without building auth
6. **Shift open/close** — operational completeness for manager sign-off
7. **Manager sales snapshot** — enough for stakeholders to see the oversight layer

**Defer to v2 wireframe or production design:**
- Split bill by seat (complex, not blocking validation)
- Course / round management (A Ramen-specific but adds significant flow complexity)
- Staff performance per shift (analytics layer; belongs after core is validated)
- Full reservation integration (separate system)

---

## Sources

- Training data: Toast POS, Square for Restaurants, Lightspeed Restaurant, Revel POS feature documentation (knowledge through mid-2025). Confidence: MEDIUM.
- Project context: `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/.planning/PROJECT.md`
- Recommended validation: https://pos.toasttab.com/restaurant-pos/features, https://squareup.com/us/en/point-of-sale/restaurants, https://www.lightspeedhq.com/pos/restaurant/
- Thailand-specific payment context (PromptPay QR): industry common knowledge for Thai F&B market. Confidence: MEDIUM.
