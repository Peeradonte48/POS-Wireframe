# POS Wireframe — A Ramen / FIP Ecosystem

## What This Is

An interactive HTML/CSS wireframe for a restaurant POS system, built with Next.js + Tailwind + shadcn/ui. Designed to serve dual purposes: a dev-handoff spec for the engineering team building the actual POS, and a stakeholder presentation artifact for business sign-off. This POS is the first module of the Food Intelligent Platform (FIP) — a broader restaurant operating system being developed by TBC x ICWeb.

## Core Value

A restaurant staff member can walk in, open a shift, seat a table, take a full order with modifiers, send it to the kitchen, and close the bill — all in a single, scannable interface that feels fast enough for real service conditions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Table map / floor plan view showing real-time table status (open, occupied, reserved)
- [ ] Order-taking screen with menu category navigation, item selection, and modifier support (broth, spice level, add-ons)
- [ ] Kitchen order management / KDS view showing active tickets and status updates
- [ ] Payment / checkout screen with bill summary, split bill, and payment method selection
- [ ] Multi-branch / location support reflected in UI navigation and data context
- [ ] Staff role differentiation: cashier, waiter, and manager views/permissions
- [ ] Shift & session management: open/close shift, end-of-day summary
- [ ] Clean light / minimal visual style using shadcn/ui components

### Out of Scope

- FIP ecosystem integration screens (CRM, Inventory, Accounting) — focus is pure POS core
- Backend / real data — wireframe only, no live API
- Mobile native app — browser-based only for this phase
- Kitchen hardware integration — KDS is a screen wireframe, not hardware spec

## Context

- Part of FIP (Food Intelligent Platform) ecosystem: POS is the transactional core that will eventually connect to CRM, Inventory, Cost Management, Accounting, and Analytics
- Early adopter target: A Ramen restaurant group (scaling, multi-branch)
- Existing systems (FCM, CRM) are not scalable across companies and have no POS channel — this POS fills that gap
- The wireframe must serve two audiences simultaneously: engineers (component structure, flows, states) and business stakeholders (UX clarity, operational realism)
- Design tooling: shadcn MCP for component selection + UI-UX-Pro-Max skill for design direction
- A Ramen-specific nuances to reflect: customizable ramen orders (broth, spice, toppings), multi-location context, shift-based operations

## Constraints

- **Tech Stack**: Next.js + Tailwind CSS + shadcn/ui — aligns with FIP's eventual production stack
- **Design Tools**: shadcn MCP + UI-UX-Pro-Max skill — must use these for component decisions
- **Visual Style**: Clean light / minimal — professional SaaS aesthetic, not skeuomorphic
- **Deliverable Format**: Browser-based interactive wireframes (not Figma, not static images)
- **Audience**: Dual-use — dev handoff quality AND stakeholder presentation quality

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + shadcn/ui stack | Aligns with FIP production direction; shadcn MCP integration | — Pending |
| HTML/CSS wireframe over Figma | Code-based wireframes serve as both design spec and starter code | — Pending |
| POS core only (no FIP integration screens) | Reduce scope, validate core flows first before designing integrations | — Pending |
| Table-based dine-in as primary flow | A Ramen is dine-in focused; this is the most complex flow to nail | — Pending |
| Clean light / minimal design | SaaS-standard aesthetics; easier for stakeholders to evaluate UX without being distracted by style | — Pending |

---
*Last updated: 2026-03-10 after initialization*
