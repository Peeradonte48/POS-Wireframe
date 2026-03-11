---
phase: 9
slug: flow-alignment
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-12
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Hi-Fi wireframe project (no jest/vitest/playwright) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green + manual walkthrough of all five flows
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | FLOW-01 | manual + build | `npm run build` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 1 | FLOW-02 | manual + build | `npm run build` | ✅ | ⬜ pending |
| 09-03-01 | 03 | 1 | FLOW-03 | manual + build | `npm run build` | ✅ | ⬜ pending |
| 09-04-01 | 04 | 1 | FLOW-04 | manual + build | `npm run build` | ✅ | ⬜ pending |
| 09-05-01 | 05 | 1 | FLOW-05 | manual + build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

No test stubs needed — `npm run build` (TypeScript compile) is the automated gate for all tasks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Guest count field starts empty; Confirm button disabled until ≥ 1 entered | FLOW-01 | UI interaction — no test framework | Open table modal, verify field is blank, verify confirm disabled, type "2", verify confirm enabled |
| "Served at HH:MM" appears in TableBottomSheet after Served tapped | FLOW-02 | UI interaction — no test framework | Tap Served on occupied table, open bottom sheet, verify time display |
| Scan button opens camera viewfinder bottom sheet; auto-closes after 1.5s; coupon applied (RAMEN50 / −฿50); button grayed after scan | FLOW-03 | UI interaction with timing — no test framework | Go to payment screen, tap scan button, verify sheet opens, wait 1.5s, verify auto-close + discount applied + button grayed |
| QrPanel shows "฿X (after ฿Y discount)" when PromptPay QR selected and coupon applied | FLOW-04 | UI interaction — no test framework | Apply coupon, select PromptPay, verify discount note in QR panel |
| Loyalty section visible on ReceiptScreen with Gold Member / 1,240 pts / QR placeholder / annotation | FLOW-05 | UI rendering — no test framework | Complete payment, verify receipt shows loyalty section |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
