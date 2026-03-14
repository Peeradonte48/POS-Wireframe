# POS Wireframe — A Ramen / FIP Ecosystem

## What This Is

An interactive Hi-Fi wireframe for a restaurant POS system, built with Next.js 15 + Tailwind CSS 4 + shadcn/ui. Serves dual purposes: a dev-handoff spec for the engineering team building the actual POS, and a stakeholder presentation artifact for business sign-off. This POS is the first module of the Food Intelligent Platform (FIP) — a broader restaurant operating system being developed by TBC x ICWeb.

The wireframe covers the full staff-facing transaction loop: authentication, floor management, order entry with ramen-specific modifiers, kitchen display, payment with camera coupon scanning and dynamic QR, loyalty integration, and manager oversight — all in one cohesive interface running in the browser with a bold A Ramen brand expression.

## Core Value

A restaurant staff member can walk in, open a shift, seat a table, take a full ramen order with modifiers, send it to the kitchen, and close the bill — all in a single, scannable interface that feels fast enough for real service conditions.

## Requirements

### Validated

- ✓ Table map / floor plan with real-time status (Open, Occupied, Reserved, Check Requested, Cleaning) + dwell timers — v1.0
- ✓ Order-taking screen with category navigation, photo grid, ramen modifier sheet (broth, spice level 1–5, toppings, special request) — v1.0
- ✓ Kitchen Display System — full-screen KDS with bump/recall, elapsed timers, allergy flags, demo mode — v1.0
- ✓ Payment / checkout — itemized bill, VAT, coupon, Cash / QR / Card, receipt state, Split Bill v2 placeholder — v1.0
- ✓ Staff role differentiation — Waiter / Cashier / Manager / Kitchen with permission-driven UI states — v1.0
- ✓ Manager tools — EOD summary, sales snapshot, 86'd item toggle, open tickets view — v1.0
- ✓ Shift & session management — open shift (branch + opening cash), role routing, shift close — v1.0
- ✓ Hi-Fi brand — A Ramen OKLCH tokens, Solar icons, dark mode, 44px touch targets, toasts, empty/loading states — v1.0
- ✓ Fix `/orders` sidebar dead link, Manager KDS access, global toasts, void-post-send permissions, manager route guard — v1.1
- ✓ Guest count capture on Open Table, Served-at tracking, camera coupon scan, dynamic QR payment, CRM loyalty receipt — v1.1
- ✓ Bold crimson brand tokens (chroma 0.26), semantic status tokens for 5 table states, 3-tier elevation shadow system — v1.1
- ✓ CTA buttons with press scale + glow, filled status pill badges, hero price readouts, caps utility labels, elevation hierarchy — v1.1
- ✓ Split bill by equal division or per-seat item assignment at checkout — v1.2
- ✓ Merge bill across multiple tables and unsplit previously separated seats — v1.2
- ✓ Digital order tracking — live stage badge on table tiles + per-item timeline detail — v1.2

## Current Milestone: v1.3 Delivery & Takeaway Orders

**Goal:** Add multi-channel order management — third-party delivery queue (Grab/LINE MAN), walk-in takeaway orders, and dine-in + takeaway combo items — to the existing POS core.

**Target features:**
- Floor plan tabs: Dine-in / Takeaway / Delivery with active order count badges
- Delivery order queue — incoming orders from Grab/LINE MAN (simulated), accept/reject, status lifecycle through Ready for Rider
- Takeaway walk-in orders — customer name + auto-number, full order entry + payment reuse
- Dine-in + takeaway combo — item-level "pack to go" flag on dine-in orders
- KDS order type badge + filter tabs so kitchen knows to plate or bag

### Active

- [ ] Floor plan 3 tabs (Dine-in / Takeaway / Delivery) + active count badges
- [ ] Delivery order queue with accept/reject, status lifecycle, demo simulation mode
- [ ] Takeaway walk-in orders with name/number, full order entry and payment flow
- [ ] Dine-in + takeaway combo — "pack to go" item flag on dine-in orders
- [ ] KDS order type badge and filter tabs

### Out of Scope

- FIP ecosystem integration screens (CRM, Inventory, Accounting) — focus is pure POS core
- Backend / real data — wireframe only, no live API
- Mobile native app — browser-based PWA only
- Kitchen hardware integration — KDS is a screen wireframe, not hardware spec
- Admin back office management system — separate deliverable
- Customer POS / receipt tracker — separate deliverable
- Loyalty Type 1 (standalone manual) — deferred to v2, Type 2 (smart CRM QR) shipped in v1.1

## Context

- Part of FIP (Food Intelligent Platform): POS is the transactional core connecting to CRM, Inventory, Cost Management, Accounting, and Analytics in future milestones
- Early adopter: A Ramen restaurant group (scaling, multi-branch)
- v1.0 shipped in 2 days: 7 phases, 28 plans, 5,583 LOC TypeScript/TSX
- v1.1 shipped in 2 days: 4 phases, 13 plans — codebase now 5,762 LOC TypeScript/TSX
- Tech stack finalized: Next.js 15 + Tailwind CSS 4 + shadcn/ui (Base UI dialogs) + Zustand 5 (with persist) + Solar icon set
- Design tooling: shadcn MCP + UI-UX-Pro-Max skill + Figma MCP for reference designs
- A Ramen brand applied: OKLCH crimson `oklch(0.52 0.26 27)` as `--primary`, dark mode via next-themes
- Bold brand expression: semantic status tokens, 3-tier elevation, filled pill badges, hero price readouts, caps utility typography

## Constraints

- **Tech Stack**: Next.js + Tailwind CSS 4 + shadcn/ui — aligns with FIP's eventual production stack
- **Design Tools**: shadcn MCP + UI-UX-Pro-Max skill — must use these for component decisions
- **Visual Style**: A Ramen brand (crimson + warm tones) on clean minimal base — professional SaaS aesthetic with bold, energetic character
- **Deliverable Format**: Browser-based interactive wireframes (not Figma, not static images)
- **Audience**: Dual-use — dev handoff quality AND stakeholder presentation quality

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + shadcn/ui stack | Aligns with FIP production direction; shadcn MCP integration | ✓ Good — zero friction, excellent component availability |
| HTML/CSS wireframe over Figma | Code-based wireframes serve as both design spec and starter code | ✓ Good — stakeholders can interact, devs get starter code |
| POS core only (no FIP integration screens) | Reduce scope, validate core flows first | ✓ Good — kept scope focused; v2 can add FIP integrations |
| Table-based dine-in as primary flow | A Ramen is dine-in focused; most complex flow to validate | ✓ Good — end-to-end flow works correctly |
| Clean minimal + A Ramen brand | SaaS aesthetics + brand identity for stakeholder demos | ✓ Good — OKLCH tokens + Solar icons produce polished result |
| 7 phases (not compressed) | Natural phases map to distinct user audiences and system boundaries | ✓ Good — each phase had clear deliverable and verifiable criteria |
| Zustand persist middleware | (app)/(kds) route group navigation destroys React tree; localStorage persist preserves state across role switches | ✓ Good — essential for multi-role wireframe navigation |
| Solar icon set over Lucide | Brand consistency, richer icon vocabulary, flat named exports | ✓ Good — full migration complete, lucide-react uninstalled |
| Static floor plan (no dnd-kit) | Table repositioning is not a v1 requirement | ✓ Good — saves scope; add drag if needed in v2 |
| spiceLevel as dedicated OrderLineItem field | Clean separation from modifier groups; visual spice selector (5 flame icons) | ✓ Good — modifier summary renders correctly |
| Base UI dialogs over Radix | shadcn/ui in this project uses @base-ui/react not @radix-ui/react | ✓ Good — correct for this project's dependency tree |
| BUMP blocked from InProgress until all items checked | Enforces cook confirmation workflow; prevents premature Ready state | ✓ Good — matches kitchen workflow intent |
| Demo tickets into kds.store only (not order.store) | Avoids polluting floor map during stakeholder demos | ✓ Good — clean demo UX |
| Shadow tokens via inline style prop | Multi-value CSS strings incompatible with Tailwind v4 @theme inline | ✓ Good — `style={{ boxShadow: 'var(--shadow-*)' }}` pattern consistent |
| OKLCH status tokens independently tuned for dark mode | Opacity reduction on OKLCH in dark backgrounds creates muddy colors | ✓ Good — crisp distinct colors in both modes |
| @utility caps via @apply | theme() function not resolvable in Tailwind v4/PostCSS pipeline | ✓ Good — @apply produces identical compiled output |
| useState<number \| ''> for forced-entry numerics | Empty string sentinel enforces guest count entry via disabled prop | ✓ Good — natural UX pattern for mandatory fields |
| ThemedToaster thin client wrapper | Enables useTheme in server layout tree; mount once per layout | ✓ Good — sonner works correctly with resolvedTheme |

---
*Last updated: 2026-03-15 — Milestone v1.3 started*
