# Requirements: FIP POS Staff App -- v1.2

**Defined:** 2026-03-12
**Core Value:** A restaurant staff member can split bills, merge party seating, and track order progress in real time -- completing the payment and service monitoring story.

## v1.2 Requirements

Requirements for v1.2 release. Each maps to roadmap phases.

### Split Bill

- [x] **SPLIT-01**: Staff can split bill equally by N guests -- system divides total / N with correct VAT rounding (floor + remainder-on-last in satang)
- [x] **SPLIT-02**: Staff can split bill per-seat by assigning items to individual seats -- each seat sub-bill totals correctly with VAT
- [x] **SPLIT-03**: Each seat can be paid independently (Cash/QR/Card) with paid seats showing settled state; table closes only when all seats paid
- [x] **SPLIT-04**: Table tile shows split progress badge (e.g. "2/4 paid") when bill is partially settled

### Polish

- [ ] **POLISH-01**: Split bill UI, merge bill UI, and order tracking timeline use consistent CVA variants, elevation tokens, and brand styling matching v1.1 quality bar
- [ ] **POLISH-02**: All new screens (split/merge modals, tracking timeline) fit cleanly in AppShell at tablet and mobile breakpoints with no overflow or clipping

### Merge Bill

- [ ] **MERGE-01**: Staff can merge bills across 2+ tables into a combined bill showing all items with correct totals; source tables link to merged bill
- [ ] **MERGE-02**: Staff can unsplit previously separated seats back into a single bill before any seat is paid

### Order Tracking

- [ ] **TRACK-01**: Table tile shows live order stage badge (Queued -> Cooking -> Ready -> Served) derived from KDS + order store state
- [ ] **TRACK-02**: Tapping a table's order shows per-item timeline with timestamp trail (ordered -> cooking -> ready -> served)
- [ ] **TRACK-03**: Items exceeding time threshold (e.g. 15 min) show visual escalation warning on both table tile and timeline view

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Payment

- **PAY-01**: Split bill by custom amount (arbitrary baht per person)
- **PAY-02**: Split bill by percentage (e.g. 60/40)

### Loyalty

- **LOYAL-01**: Standalone manual loyalty (Type 1) -- static QR on receipt for web portal point claim

## Out of Scope

| Feature | Reason |
|---------|--------|
| FIP ecosystem integration screens | Focus is pure POS core |
| Backend / real data | Wireframe only, no live API |
| Mobile native app | Browser-based PWA only |
| Kitchen hardware integration | KDS is a screen wireframe, not hardware spec |
| Admin back office | Separate deliverable |
| Customer POS / receipt tracker | Separate deliverable |
| Real-time WebSocket sync | Wireframe uses in-memory state only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPLIT-01 | Phase 12 | Complete |
| SPLIT-02 | Phase 12 | Complete |
| SPLIT-03 | Phase 12 | Complete |
| SPLIT-04 | Phase 12 | Complete |
| POLISH-01 | Phase 13 | Pending |
| POLISH-02 | Phase 13 | Pending |
| MERGE-01 | Phase 14 | Pending |
| MERGE-02 | Phase 14 | Pending |
| TRACK-01 | Phase 15 | Pending |
| TRACK-02 | Phase 15 | Pending |
| TRACK-03 | Phase 15 | Pending |

**Coverage:**
- v1.2 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation -- all 11 requirements mapped*
