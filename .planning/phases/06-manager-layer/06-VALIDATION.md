---
phase: 6
slug: manager-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Next.js wireframe, no test runner configured |
| **Config file** | none — TypeScript type-check used as proxy |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~15–30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | SHIFT-01 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | SHIFT-01 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 1 | SHIFT-01 | manual | n/a | n/a | ⬜ pending |
| 6-02-01 | 02 | 1 | SHIFT-02 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 6-03-01 | 03 | 2 | SHIFT-03 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 6-03-02 | 03 | 2 | SHIFT-03 | manual | n/a | n/a | ⬜ pending |
| 6-04-01 | 04 | 2 | SHIFT-04 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure is expected for this wireframe project. TypeScript type-check is the automated gate; no stub files needed.

*Existing infrastructure covers all automated verification requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| EOD summary shows revenue, payment breakdown, void count, discount total, net sales, cash reconciliation | SHIFT-01 | UI rendering on mock data — no isolated logic unit testable | Open /manager as Manager, verify all card sections render with non-zero values (after placing orders), type into closing cash field and verify Over/Short variance updates reactively |
| Close Shift confirm dialog → summary becomes read-only with Shift Closed banner | SHIFT-01 | UI state machine — dialog, banner, disabled inputs | Tap Close Shift, confirm in dialog, verify banner appears and inputs are disabled; verify Logout button appears |
| Sales snapshot displays revenue, cover count, top items as numbers | SHIFT-02 | UI rendering — numbers from store aggregation | Open Sales Snapshot tab, verify numbers match expected totals from orders placed during test session |
| 86'd toggle in manager tab immediately greys out item in order menu | SHIFT-03 | Cross-component reactive state via Zustand store | Toggle an item as 86'd in /manager, navigate to order screen, verify item appears greyed with 86'd badge and is not tappable |
| 86'd state persists across navigation (survives route change) | SHIFT-03 | Browser localStorage persistence | Toggle item 86'd, navigate away, navigate back to order screen — verify item still shows as 86'd |
| Open tickets list shows all occupied tables with correct info | SHIFT-04 | UI rendering from table.store | Open Open Tickets tab with tables occupied, verify table ID, waiter, cover count, order stage, estimated total all display; tap row and verify navigation to /order/[tableId] |
| Staff list renders name, role badge, assigned tables | SHIFT-04 | UI rendering from mock staff data | Verify Staff List section below Open Tickets shows all shift staff with role badges |
| Manager nav item is hidden for non-Manager roles | All | Role-gated navigation — visual check | Login as Staff role, verify /manager nav item does not appear in sidebar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
