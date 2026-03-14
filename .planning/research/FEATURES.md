# Feature Landscape: Delivery & Takeaway Order Management

**Domain:** Restaurant POS — Delivery Queue (3rd-party platforms) + Takeaway Walk-in Orders
**Project:** A Ramen POS Wireframe (v1.3 milestone)
**Researched:** 2026-03-15
**Overall confidence:** HIGH (patterns well-established across GrabFood, Deliveroo, Lightspeed, Square, Toast, Eats365)

> Note: Previous FEATURES.md (v1.2 — Split Bill, Merge Bill, Digital Order Tracking) is captured in git history.

---

## Existing Foundation (Already Built — Extend, Do Not Rebuild)

| Feature | Where It Lives | How v1.3 Extends It |
|---------|---------------|---------------------|
| Floor plan / table map | `/table-map` | Add Dine-in / Takeaway / Delivery tabs as the primary view switcher |
| KDS with bump/recall + elapsed timers | `/kds` | Add `orderType` badge per ticket card; add KDS filter tabs |
| `OrderStage` lifecycle | `table.store` | Delivery has its own status chain in `delivery.store` |
| Order entry with modifiers | `/order/[tableId]` | Reuse as-is for takeaway order entry |
| Payment / checkout flow | `/payment/[tableId]` | Reuse as-is for takeaway checkout |
| Demo mode (KDS demo tickets) | `kds.store` | Add "Simulate Incoming Order" to delivery queue using same pattern |

---

## Table Stakes

### A. Delivery Order Queue (3rd-party platform orders)

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Incoming order notification — visual alert / tab badge | Staff need to know a new order arrived without watching the screen | Low | `delivery.store` |
| Order card: platform source (Grab / LINE MAN), order number, customer name, items summary, total | Every delivery POS shows this at minimum | Low | `delivery.store` |
| Accept button on incoming order | Industry standard — Grab, Deliveroo, Foodpanda all require explicit accept; auto-routes to KDS | Low | `delivery.store` → `kds.store` |
| Reject button with reason selection | Platforms expect a reason (sold out / too busy); prevents silent drops | Low | `delivery.store` |
| Delivery status lifecycle: Pending → Accepted → Preparing → ReadyForRider → PickedUp | This IS the delivery lifecycle across all major platforms | Medium | `delivery.store` |
| "Mark Ready for Rider" CTA | Staff confirms food is bagged — maps to KDS bump concept | Low | `delivery.store` status write |
| Delivery order auto-routes to KDS on accept | Kitchen needs to see delivery tickets same as dine-in | Low | `kds.store` integration |
| Platform source badge on KDS ticket | Kitchen must know whether to plate (dine-in) or bag (delivery/takeaway) | Low | `kds.store` — `orderType` field |
| Elapsed timer on delivery queue card | Delivery SLAs are tighter than dine-in; timer pressure expected | Low | `delivery.store` — `arrivedAt` timestamp |
| Demo / simulate incoming order button | No real API — mock orders for demos; mirrors existing KDS demo mode | Low | `delivery.store` seeding function |

### B. Takeaway Walk-in Orders

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| "New Takeaway" entry point on floor plan (Takeaway tab) | Staff need a way to start a takeaway order without occupying a physical table | Low | `takeaway.store` |
| Customer name + phone number capture at order creation | Identifies who to call; universally collected in every takeaway POS | Low | `TakeawayRecord` model |
| Sequential order number (TK-001, TK-002, etc.) | Call-out identifier for staff and customer | Low | `takeaway.store` auto-increment |
| Takeaway orders in their own tab on floor plan | Prevents dine-in/takeaway confusion; Lightspeed confirmed this pattern | Low | Floor plan tab switch |
| Takeaway ticket on KDS — visually distinct from dine-in | Kitchen must know to bag, not plate | Low | `kds.store` `orderType` badge |
| "Mark Ready for Pickup" action on takeaway order card | Staff confirms order is at counter | Low | `takeaway.store` status write |
| Takeaway status progression: Taking → Sent → Ready → Collected | Channel-appropriate lifecycle labels | Medium | `takeaway.store` |
| Payment / checkout from takeaway order card | Cashier closes takeaway same as dine-in; reuse existing payment route | Low | Existing payment flow |

### C. Floor Plan Order Type Tabs

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Three tabs on table-map: Dine-in / Takeaway / Delivery | Standard across Lightspeed, Square, Toast | Low | Floor plan layout change |
| Active order count badge on Takeaway and Delivery tabs | At-a-glance load indicator ("3 delivery pending") | Low | Derived count from each store |
| Delivery tab renders queue list (cards), not table grid | Delivery has no physical table — list/card view is correct | Low | Tab-conditional render |
| Takeaway tab renders order card list with name + number | No physical seat — card list correct | Low | Tab-conditional render |
| Dine-in tab is unchanged from current floor plan | Existing table grid must remain intact; tabs are additive | None | No changes to existing table store |

---

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Platform color-coding: Grab = green, LINE MAN = blue/yellow | Instant visual differentiation at queue and KDS level | Low | CSS token per platform |
| Auto-accept toggle (on/off per delivery session) | Operators eliminate the accept tap during rush | Low | Boolean in `delivery.store`; skips Pending state |
| Acceptance countdown timer (ring animation before auto-reject) | Grab/Foodpanda-style urgency — high visual impact in demo | Medium | `setTimeout` + animated SVG ring |
| KDS order type filter tabs (All / Dine-in / Takeaway / Delivery) | Kitchen isolates delivery tickets if packaging station is separate | Low | Filter state in `kds.store` |
| Takeaway pickup notification mock dialog | Shows FIP's future notification layer; purely visual | Low | Existing dialog pattern |
| Delivery count in manager tools / EOD summary | Total deliveries handled; aligns with existing sales snapshot | Low | Aggregate from `delivery.store` |

---

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real GrabFood / LINE MAN API integration | This is a wireframe — no backend | Mock incoming orders via "Simulate Order" button |
| Delivery driver GPS map / tracking | Requires maps API; irrelevant to staff-facing POS wireframe | Show "Rider en route" as a static status label |
| ETA calculation (dynamic) | Requires routing API | Show a static ETA field seeded at order creation |
| Customer-facing pickup display screen | Separate hardware — PROJECT.md explicitly out of scope | Note as future FIP module |
| Menu sync across delivery platforms | Back-office / FIP Inventory concern | Not shown in wireframe |
| Promo / discount codes from delivery platform | Platform applies its own discounts before passing total | Show total as pre-discounted; no coupon entry for delivery |
| Multi-platform aggregation middleware (Deliverect-style) | Infrastructure layer — not UI wireframe scope | Mock orders appear directly in queue |
| Phone order intake (separate channel) | Adds caller ID concerns — out of scope | Takeaway walk-in model supports manually entered orders |

---

## MVP Recommendation

Build in this sequence:

1. **Floor plan tabs** (Dine-in / Takeaway / Delivery) — structural entry point
2. **Delivery store + queue UI** — Pending card, Accept/Reject, rejection reason, auto-route to KDS
3. **Delivery status progression** (Pending → Accepted → Preparing → ReadyForRider → PickedUp)
4. **Takeaway store + New Takeaway flow** — name/phone capture, order number, order entry reuse
5. **Takeaway status progression** (Taking → Sent → Ready → Collected)
6. **KDS order type badge** — minimal change to `KdsTicketCard`; high impact for kitchen clarity

**Differentiators (if time allows):**
7. Platform color-coding (2 CSS tokens, trivial)
8. KDS order type filter tabs
9. Acceptance countdown timer (best demo visual, medium effort)
10. Auto-accept toggle

---

## Confidence Assessment

| Claim | Confidence | Source |
|-------|------------|--------|
| Delivery accept/reject with reason is table stakes | HIGH | Eats365 docs, Deliveroo help, Grab/Deliverect integration docs |
| "Ready for Rider" pattern | HIGH | DoorDash developer docs (Order Ready Signal), Deliveroo FAQ |
| Auto-accept toggle is a real POS feature | HIGH | Deliveroo, Otter, Foodics/Deliverect all document this |
| Takeaway name/phone + sequential number | HIGH | Lightspeed K-Series, TablesReady, eatPOS, Next Order all confirmed |
| Floor plan tabs per order type | HIGH | Lightspeed O-Series, Square, Toast confirmed |
| KDS order type color badge | MEDIUM | Toast KDS + Loman.ai articles confirm color-coding |
| Acceptance countdown timer | MEDIUM | Observed in GrabFood/Foodpanda UX descriptions |

---

*Feature research for: A Ramen POS v1.3 — Delivery & Takeaway Order Management*
*Researched: 2026-03-15*
