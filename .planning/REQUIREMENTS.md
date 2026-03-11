# Requirements: POS Wireframe — A Ramen / FIP Ecosystem

**Defined:** 2026-03-11
**Milestone:** v1.1 Bug Fixes + Brand Polish
**Core Value:** A restaurant staff member can walk in, open a shift, seat a table, take a full ramen order with modifiers, send it to the kitchen, and close the bill — all in a single, scannable interface that feels fast enough for real service conditions.

## v1.1 Requirements

Requirements for v1.1 release. Each maps to roadmap phases.

### Bug Fixes

- [x] **BUG-01**: Staff can navigate to `/orders` without hitting a 404
- [x] **BUG-02**: Manager role can access the `/kds` route
- [x] **BUG-03**: Toast notifications appear on all pages (floor map, manager, KDS)
- [x] **BUG-04**: `void-post-send` action respects role permissions before showing UI
- [x] **BUG-05**: Direct URL access to `/manager` is blocked for non-Manager roles

### Flow Alignment

- [x] **FLOW-01**: Open Table sheet captures guest count to start table usage tracking
- [x] **FLOW-02**: Staff can tap "Served" on the tablet after delivering food + invoice to record actual service start time
- [x] **FLOW-03**: Payment screen lets staff scan customer QR coupon with back camera, within the POS app (no app switching)
- [x] **FLOW-04**: After coupon scan, system displays a Dynamic QR Code with net amount for customer to scan and pay
- [x] **FLOW-05**: Receipt state shows a smart QR code (CRM loyalty Type 2); POS displays member tier + point balance during checkout

### Brand Tokens

- [x] **TOKEN-01**: `--primary` chroma increased and gamut-verified for bold crimson
- [x] **TOKEN-02**: Semantic status tokens (`--color-status-*`) defined for all 5 table states
- [x] **TOKEN-03**: Elevation tokens (`--shadow-card`, `--shadow-panel`) defined for 3-tier depth
- [x] **TOKEN-04**: Hardcoded Tailwind palette classes in TableTile, KdsTicketCard, AppSidebar replaced with token references

### Component Polish

- [x] **COMP-01**: All primary action buttons are 44px with crimson glow and active press scale
- [x] **COMP-02**: Table status indicators display as filled colored pill chips
- [ ] **COMP-03**: Menu cards, ticket panel, and info panels use the elevation token system
- [x] **COMP-04**: Price totals (฿XXXX) render as hero text — `text-2xl font-black text-primary`
- [x] **COMP-05**: Section labels use caps utility for visual hierarchy throughout

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Loyalty (Type 1 — Standalone)

- **LOYAL-01**: Receipt shows QR link for manual loyalty — customer scans and enters phone/receipt number to record points

### Flow Extensions

- **FLOW-EXT-01**: Digital Order Tracking — real-time order status visible to staff without checking kitchen pass manually

## Out of Scope

| Feature | Reason |
|---------|--------|
| FIP ecosystem integration (CRM, Inventory, Accounting) | Focus is pure POS core; future milestone |
| Backend / real data | Wireframe only — no live API |
| Mobile native app | Browser-based PWA only |
| Kitchen hardware integration | KDS is a screen wireframe, not hardware spec |
| Admin back office | Separate deliverable |
| Customer POS / receipt tracker | Separate deliverable |
| Split bill by seat | v2 placeholder already annotated in payment screen |
| Loyalty Type 1 (standalone manual) | Deferred to v2 — Type 2 (smart CRM QR) is higher value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 8 | Complete |
| BUG-02 | Phase 8 | Complete |
| BUG-03 | Phase 8 | Complete |
| BUG-04 | Phase 8 | Complete |
| BUG-05 | Phase 8 | Complete |
| FLOW-01 | Phase 9 | Complete |
| FLOW-02 | Phase 9 | Complete |
| FLOW-03 | Phase 9 | Complete |
| FLOW-04 | Phase 9 | Complete |
| FLOW-05 | Phase 9 | Complete |
| TOKEN-01 | Phase 10 | Complete |
| TOKEN-02 | Phase 10 | Complete |
| TOKEN-03 | Phase 10 | Complete |
| TOKEN-04 | Phase 10 | Complete |
| COMP-01 | Phase 11 | Complete |
| COMP-02 | Phase 11 | Complete |
| COMP-03 | Phase 11 | Pending |
| COMP-04 | Phase 11 | Complete |
| COMP-05 | Phase 11 | Complete |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-12 — FLOW-01 and FLOW-02 marked complete (09-01 execution)*
