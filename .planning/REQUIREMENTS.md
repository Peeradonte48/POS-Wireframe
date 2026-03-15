# Requirements: FIP POS Staff App -- v1.3

**Defined:** 2026-03-15
**Core Value:** A restaurant staff member can manage dine-in, walk-in takeaway, and third-party delivery orders from a single interface -- with clear channel separation so kitchen staff always knows whether to plate or bag.

## v1.3 Requirements

### Navigation

- [x] **NAV-01**: Staff can switch between Dine-in, Takeaway, and Delivery views via tabs on the floor plan
- [x] **NAV-02**: Takeaway and Delivery tabs show a live badge count of active orders

### Delivery Queue

- [x] **DLVR-01**: Staff can view incoming delivery orders from Grab/LINE MAN in a queue (simulated)
- [x] **DLVR-02**: Staff can accept an incoming delivery order (auto-routes to KDS)
- [x] **DLVR-03**: Staff can reject an incoming delivery order with a reason
- [x] **DLVR-04**: Accepted delivery orders progress through: Accepted → Preparing → Ready for Rider → Picked Up
- [x] **DLVR-05**: Staff can mark a delivery order "Ready for Rider" when kitchen completes
- [x] **DLVR-06**: Staff can trigger simulated incoming delivery orders for demo (mirrors existing KDS demo mode)
- [x] **DLVR-07**: Delivery order cards show platform badge (Grab / LINE MAN), customer name, items summary, and elapsed timer
- [x] **DLVR-08**: Staff can enable auto-accept to skip the manual accept tap during rush
- [x] **DLVR-09**: Incoming delivery orders show a countdown timer ring before auto-reject

### Takeaway Orders

- [x] **TKWY-01**: Staff can create a takeaway order with customer name, phone, and auto-assigned order number (TK-001…)
- [x] **TKWY-02**: Takeaway orders route through the existing order entry flow (menu, modifiers, KDS)
- [x] **TKWY-03**: Takeaway orders progress through: Taking → Sent → Ready → Collected
- [x] **TKWY-04**: Staff can complete payment for a takeaway order using the existing payment flow (cash/QR/card)
- [x] **TKWY-05**: Staff can mark a takeaway order as collected

### Dine-in + Takeaway Combo

- [ ] **COMBO-01**: Staff can flag individual items on a dine-in order as "pack to go" -- flagged items appear on the same bill but are packed separately
- [x] **COMBO-02**: KDS tickets show a "PACK" indicator on flagged items so kitchen knows to bag them, not plate them

### KDS

- [x] **KDS-01**: KDS tickets show an order type badge (Dine-in / Takeaway / Delivery + platform) so kitchen knows to plate or bag
- [x] **KDS-02**: KDS board can be filtered by order type (All / Dine-in / Takeaway / Delivery)

### Visual Polish

- [x] **UI-01**: Delivery platform colors -- Grab green and LINE MAN blue -- applied as OKLCH design tokens and CVA badge variants

## Future Requirements (v2+)

### Delivery Platform Integration

- **DLVR-F01**: Real GrabFood / LINE MAN API integration (requires OAuth2 + backend)
- **DLVR-F02**: Delivery driver GPS map / rider tracking
- **DLVR-F03**: Dynamic ETA calculation (requires routing API)
- **DLVR-F04**: Menu sync across delivery platforms (FIP Inventory concern)

### Customer-Facing

- **CUST-F01**: Customer-facing pickup display screen -- separate hardware deliverable
- **CUST-F02**: Takeaway pickup SMS / LINE notification (real send)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real delivery platform API integration | No backend in wireframe; OAuth2/webhook is production FIP concern |
| Delivery driver GPS / rider tracking | Requires maps API; rider-side UX is not staff POS territory |
| Customer-facing pickup display | Separate hardware product -- PROJECT.md explicit out of scope |
| Multi-platform aggregation middleware (Deliverect-style) | Infrastructure layer, not UI wireframe scope |
| Phone order intake channel | Adds caller ID concerns; out of scope for this milestone |
| Promo / discount codes from delivery platform | Platform applies its own discounts before passing total |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 17 | Complete |
| NAV-02 | Phase 17 | Complete |
| DLVR-01 | Phase 17 | Complete |
| DLVR-02 | Phase 17 | Complete |
| DLVR-03 | Phase 17 | Complete |
| DLVR-04 | Phase 17 | Complete |
| DLVR-05 | Phase 17 | Complete |
| DLVR-06 | Phase 17 | Complete |
| DLVR-07 | Phase 17 | Complete |
| DLVR-08 | Phase 17 | Complete |
| DLVR-09 | Phase 17 | Complete |
| TKWY-01 | Phase 17 | Complete |
| TKWY-02 | Phase 18 | Complete |
| TKWY-03 | Phase 18 | Complete |
| TKWY-04 | Phase 18 | Complete |
| TKWY-05 | Phase 18 | Complete |
| COMBO-01 | Phase 19 | Pending |
| COMBO-02 | Phase 19 | Complete |
| KDS-01 | Phase 19 | Complete |
| KDS-02 | Phase 19 | Complete |
| UI-01 | Phase 19 | Complete |

**Coverage:**
- v1.3 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 -- traceability populated during roadmap creation*
