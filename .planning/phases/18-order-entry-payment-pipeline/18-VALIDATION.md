---
phase: 18
slug: order-entry-payment-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured — TypeScript strict mode via `npm run build` |
| **Config file** | N/A — no test framework |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | TKWY-02, TKWY-03 | build | `npm run build` | ✅ existing | ⬜ pending |
| 18-01-02 | 01 | 1 | TKWY-02, TKWY-03 | build | `npm run build` | ✅ existing | ⬜ pending |
| 18-01-03 | 01 | 1 | TKWY-03 | build | `npm run build` | ✅ existing | ⬜ pending |
| 18-02-01 | 02 | 1 | TKWY-04 | build | `npm run build` | ✅ existing | ⬜ pending |
| 18-02-02 | 02 | 1 | TKWY-04 | build | `npm run build` | ✅ existing | ⬜ pending |
| 18-02-03 | 02 | 1 | TKWY-04 | build | `npm run build` | ✅ existing | ⬜ pending |
| 18-03-01 | 03 | 2 | TKWY-02 | build | `npm run build` | ✅ existing | ⬜ pending |
| 18-04-01 | 04 | 2 | TKWY-05 | manual smoke | `npm run build` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework is configured in this project — `npm run build` (TypeScript strict mode) and `npm run lint` are the automated validation gates. All behavioral verification is manual smoke testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tapping a TK order in Takeaway tab opens order entry with correct header | TKWY-02 | No E2E framework | 1. Open Takeaway tab. 2. Tap any TK order. 3. Verify header shows `TK-xxx · [name]` not a table label |
| onSend navigates to payment page (not table map) | TKWY-02 | No E2E framework | 1. Enter order entry for a TK order. 2. Add items. 3. Tap Send. 4. Verify navigation goes to `/payment/TK-xxx` |
| KDS bump (InProgress→Ready) advances queue status to Ready | TKWY-03 | No E2E framework | 1. Complete payment for TK order. 2. Open KDS. 3. Bump ticket to Ready. 4. Go back to Takeaway tab. 5. Verify card shows Ready status |
| Payment page hides Split Bill and Merge Bill for takeaway | TKWY-04 | No E2E framework | 1. Open payment for TK order. 2. Verify Split Bill / Merge Bill controls are NOT rendered |
| Payment page shows `TK-001 · Name` header | TKWY-04 | No E2E framework | 1. Open payment for TK order. 2. Verify header label matches `TK-xxx · [customerName]` |
| Completing payment routes back to Takeaway tab (not floor plan) | TKWY-04 | No E2E framework | 1. Complete payment for TK order. 2. Verify navigation lands on `/table-map` with Takeaway tab active |
| Mark Collected CTA visible when queue status is Ready | TKWY-05 | No E2E framework | 1. Advance TK order to Ready. 2. Verify TakeawayCard shows "Mark Collected" CTA |
| Marking Collected sets queue status to Collected | TKWY-05 | No E2E framework | 1. With TK order in Ready state. 2. Tap "Mark Collected". 3. Verify card moves to Collected state / disappears from active list |
| No receipt screen flash for takeaway after payment | TKWY-04 | Visual regression | Complete payment for TK order — verify no receipt screen appears before table-map renders |
| Dine-in KDS bump still updates table.store (no regression) | TKWY-03 | No E2E framework | 1. Bump a dine-in table KDS ticket. 2. Verify table floor plan updates OrderStage correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
