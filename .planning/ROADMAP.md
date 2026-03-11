# Roadmap: FIP POS Staff App Wireframe

**Project:** POS Wireframe — A Ramen / FIP Ecosystem
**Current Status:** v1.1 in progress

---

## Milestones

- ✅ **v1.0 Staff App Wireframe** — Phases 1–7 (shipped 2026-03-11)
- 🚧 **v1.1 Bug Fixes + Brand Polish** — Phases 8–11 (in progress)

---

## Phases

<details>
<summary>✅ v1.0 Staff App Wireframe (Phases 1–7) — SHIPPED 2026-03-11</summary>

- [x] **Phase 1: Foundation** — Scaffold, AppShell, PIN login, role routing, shift open (completed 2026-03-10)
- [x] **Phase 2: Table Map** — Floor plan with full table lifecycle state machine (completed 2026-03-10)
- [x] **Phase 3: Order Flow** — Order entry, ramen modifier sheet, void flows (completed 2026-03-10)
- [x] **Phase 4: KDS** — Kitchen display with bump, recall, and demo mode (completed 2026-03-11)
- [x] **Phase 5: Payment** — Bill, payment methods, post-payment table lifecycle (completed 2026-03-11)
- [x] **Phase 6: Manager Layer** — Shift close, EOD summary, sales snapshot, manager tools (completed 2026-03-11)
- [x] **Phase 7: Polish** — Hi-Fi & Brand: brand tokens, Solar icons, dark mode, role gating, toasts, touch targets, empty/loading states (completed 2026-03-11)

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

### 🚧 v1.1 Bug Fixes + Brand Polish (In Progress)

**Milestone Goal:** Close all known v1.0 tech debt and elevate the UI to a bold, energetic brand expression with polished components throughout.

- [x] **Phase 8: Bug Fixes** — Resolve all five navigation, permissions, and toast defects before any CSS changes land (completed 2026-03-11)
- [x] **Phase 9: Flow Alignment** — Wire the five user-facing interactions missing from v1.0 (guest count, served state, camera coupon scan, dynamic QR, loyalty receipt) (completed 2026-03-12)
- [x] **Phase 10: Brand Token Refresh** — Strengthen the crimson primary token, define semantic status and elevation tokens, and eliminate all hardcoded palette classes (completed 2026-03-11)
- [ ] **Phase 11: Component Polish** — Apply the bold brand expression to buttons, badges, cards, price readouts, and typography throughout all screens

---

## Phase Details

### Phase 8: Bug Fixes
**Goal**: All five known v1.0 defects are resolved — navigation dead links eliminated, role routing correct, toast infrastructure active on every page, and permission keys complete
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05
**Success Criteria** (what must be TRUE):
  1. Staff can tap the Orders link in the sidebar and reach the order screen without a 404
  2. A Manager role can navigate to `/kds` and see the kitchen display without being redirected
  3. A toast notification fired from the table map, manager page, or KDS screen appears on screen
  4. The void-after-send action is visible only to roles with permission — non-permitted roles see no void UI
  5. Navigating directly to `/manager` in the URL bar while logged in as a non-Manager role redirects to the table map
**Plans**: 5 plans

Plans:
- [ ] 08-01-PLAN.md — Create /orders stub redirect page (BUG-01)
- [ ] 08-02-PLAN.md — Expand KDS role guard to allow Manager (BUG-02)
- [ ] 08-03-PLAN.md — Mount ThemedToaster in AppShell and KDS layout (BUG-03)
- [ ] 08-04-PLAN.md — Add void-post-send to permissions and wire to TicketLineItem (BUG-04)
- [ ] 08-05-PLAN.md — Add role guard to manager page (BUG-05)

### Phase 9: Flow Alignment
**Goal**: The five staff-facing interactions described in the v1.1 user flow spec are wired and visible in the wireframe
**Depends on**: Phase 8
**Requirements**: FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05
**Success Criteria** (what must be TRUE):
  1. Opening a table presents a guest count field that staff must fill before the table enters Occupied state
  2. Staff can tap a "Served" button after delivering food, and the table record reflects the service start time
  3. Staff can initiate a camera scan for a customer coupon QR code from within the payment screen — no app switching required
  4. After a valid coupon scan, the payment screen displays a Dynamic QR code showing the net amount for the customer to scan
  5. The receipt state shows a smart loyalty QR code and displays the customer's member tier and point balance to staff during checkout
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md — Fix guest count empty state and Served-at display (FLOW-01, FLOW-02)
- [x] 09-02-PLAN.md — Camera scan coupon flow and QrPanel discount note (FLOW-03, FLOW-04)
- [x] 09-03-PLAN.md — Add loyalty section to ReceiptScreen (FLOW-05)

### Phase 10: Brand Token Refresh
**Goal**: The design token layer in globals.css is authoritative, complete, and correct — stronger crimson primary, full semantic status palette, elevation depth system, and zero hardcoded color classes remaining in the three flagged files
**Depends on**: Phase 8
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04
**Success Criteria** (what must be TRUE):
  1. The primary crimson reads as visibly bolder across all screens in both light and dark mode with no sRGB gamut clipping
  2. All five table states (Open, Occupied, Reserved, Check Requested, Cleaning) each resolve to a distinct semantic token — no raw palette classes in TableTile, KdsTicketCard, or AppSidebar
  3. Three elevation tiers (flat, raised, floating) are defined as CSS tokens and consistently applied to cards and panels across all screens
  4. Dark mode toggles correctly throughout — no token resolves to an unresolved var() string and no surface retains light-mode colors in dark mode
**Plans**: 2 plans

Plans:
- [ ] 10-01-PLAN.md — Define all new tokens in globals.css (TOKEN-01, TOKEN-02, TOKEN-03)
- [ ] 10-02-PLAN.md — Replace hardcoded palette classes in TableTile, KdsTicketCard, AppSidebar (TOKEN-04)

### Phase 11: Component Polish
**Goal**: Every interactive surface across the POS wireframe expresses the bold, energetic A Ramen brand — correct touch targets, semantic status colors on badges, elevation on cards, hero price readouts, and consistent typographic hierarchy
**Depends on**: Phase 10
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. All primary action buttons are 44px tall with a crimson glow shadow in dark mode and a visible press scale on tap
  2. Table status indicators appear as filled colored pill chips — each of the five states is immediately distinguishable under dim restaurant lighting
  3. Menu cards, the ticket panel, and info panels each use a visibly different elevation tier — flat, raised, or floating — creating clear spatial hierarchy
  4. Price totals throughout the app (ticket footer, payment summary) render as large, bold, primary-colored hero text
  5. Section labels across all screens use the caps utility pattern consistently — visually lighter than body text and clearly delineated from content beneath
**Plans**: 3 plans

Plans:
- [ ] 11-01-PLAN.md — Button cta variant + glow, filled status pill badges (COMP-01, COMP-02)
- [ ] 11-02-PLAN.md — Hero price totals, caps utility + full 13-file audit (COMP-04, COMP-05)
- [ ] 11-03-PLAN.md — Three-tier elevation system on cards, panels, sheets (COMP-03)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 5/5 | Complete ✅ | 2026-03-10 |
| 2. Table Map | v1.0 | 4/4 | Complete ✅ | 2026-03-10 |
| 3. Order Flow | v1.0 | 4/4 | Complete ✅ | 2026-03-10 |
| 4. KDS | v1.0 | 3/3 | Complete ✅ | 2026-03-11 |
| 5. Payment | v1.0 | 3/3 | Complete ✅ | 2026-03-11 |
| 6. Manager Layer | v1.0 | 4/4 | Complete ✅ | 2026-03-11 |
| 7. Polish | v1.0 | 5/5 | Complete ✅ | 2026-03-11 |
| 8. Bug Fixes | v1.1 | 5/5 | Complete ✅ | 2026-03-11 |
| 9. Flow Alignment | v1.1 | 3/3 | Complete ✅ | 2026-03-12 |
| 10. Brand Token Refresh | 2/2 | Complete    | 2026-03-11 | - |
| 11. Component Polish | 2/3 | In Progress|  | - |

---

*Roadmap created: 2026-03-10*
*v1.0 completed: 2026-03-11*
*v1.1 phases added: 2026-03-11*
*Full v1.0 archive: `.planning/milestones/v1.0-ROADMAP.md`*
