---
phase: 16
slug: integration-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework configured |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 16-01-01 | 01 | 1 | TRACK-01, TRACK-03 | build | `npm run build` | ⬜ pending |
| 16-01-02 | 01 | 1 | SPLIT-03 | build | `npm run build` | ⬜ pending |
| 16-01-03 | 01 | 1 | MERGE-01 | build | `npm run build` | ⬜ pending |
| 16-01-04 | 01 | 1 | MERGE-02 | manual | browser verify | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install — project uses `npm run build` as sole automated gate.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TableTile badge cycles blue→amber→green→gray as KDS ticket advances | TRACK-01 | Requires live KDS bump interaction | Open table, send order, bump ticket in KDS, observe tile badge |
| Escalated badge shows correct stage label (not 'Ordered') | TRACK-03 | Requires browser + devtools sentAt patch | Patch sentAt to 16 min ago, verify red badge shows correct stage |
| Split-all seats sets table to Billed state | SPLIT-03 | Requires full split-pay flow in browser | Equal split, pay all seats, verify orderStage is Billed before Cleaning |
| markClean clears merge badge on secondary | MERGE-01 | Requires merge + markClean flow | Merge two tables, go to TableBottomSheet, tap Mark Clean, verify secondary badge clears |
| Revert to Single Bill works, disabled after partial payment | MERGE-02 | Multi-step interaction with state guards | Open split, scroll to Revert button, test enabled/disabled states |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or manual instructions documented
- [ ] Sampling continuity: build after every task
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
