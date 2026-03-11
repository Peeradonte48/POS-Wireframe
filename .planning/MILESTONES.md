# Milestones

## v1.1 Bug Fixes + Brand Polish (Shipped: 2026-03-12)

**Phases completed:** 4 phases (8–11), 13 plans
**Timeline:** 2026-03-10 → 2026-03-12 (2 days)
**Codebase:** 5,762 lines TypeScript/TSX
**Files modified:** 68

**Key accomplishments:**
1. Bug Fixes — 5 navigation, permission, and toast defects resolved (dead links, role guards, toast infrastructure)
2. Flow Alignment — Guest count capture, Served-at tracking, camera coupon scan, dynamic QR payment, and CRM loyalty receipt wired
3. Brand Token Refresh — OKLCH crimson at 0.26 chroma, 10 semantic status tokens, 3-tier elevation shadows, all dark-mode-safe
4. Component Polish — CTA buttons with press scale + glow, filled status pill badges, hero price readouts, caps utility labels, elevation hierarchy across all screens

**Archive:**
- Roadmap: `.planning/milestones/v1.1-ROADMAP.md`
- Requirements: `.planning/milestones/v1.1-REQUIREMENTS.md`

---

## v1.0 Staff App Wireframe (Shipped: 2026-03-11)

**Phases completed:** 7 phases, 28 plans
**Timeline:** 2026-03-10 → 2026-03-11 (2 days)
**Codebase:** 5,583 lines TypeScript/TSX
**Git commits:** 137

**Key accomplishments:**
1. Full staff authentication flow — PIN login with role-based routing (Waiter / Cashier / Manager / Kitchen) and shift-open gating
2. Interactive floor plan — 12-table digital map with real-time status (Open, Occupied, Reserved, Check Requested, Cleaning) and live dwell timers
3. Complete order flow — 3-column ordering screen with photo menu grid, ramen modifier sheet (broth, spice, toppings, special request), void + manager PIN override
4. Kitchen Display System — full-screen KDS with bump/recall, elapsed timers, allergy flags, and demo mode auto-injection
5. Payment & checkout — itemized bill with VAT, coupon, QR/Cash/Card payment methods, receipt state, and table cleanup wiring
6. Manager layer — shift close + EOD summary, sales snapshot, 86'd item toggle, open tickets view across all tables
7. Hi-Fi brand polish — A Ramen OKLCH brand tokens, Solar icon set, dark mode, role gating on 10 actions, Sonner toasts, 44px touch targets, loading skeletons + empty states

**Known gaps (accepted as tech debt):**
- Phase 2 VERIFICATION.md artifact missing (implementation verified via 02-04-SUMMARY.md human sign-off)
- `/orders` sidebar link leads to 404 (order entry reachable only from table bottom sheet at `/order/[tableId]`)
- Manager blocked from `/kds` route (KDS page guard contradicts role permissions)
- `<Toaster>` not in AppShell (toasts silently dropped on table-map, manager, KDS pages)

**Archive:**
- Roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`

---
