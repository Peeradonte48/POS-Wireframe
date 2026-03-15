---
phase: 19
slug: kds-differentiation-combo-flag
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured — TypeScript strict-mode build is the project's verification method |
| **Config file** | none |
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
| 19-01-01 | 01 | 1 | COMBO-01 | build | `npm run build` | N/A (type check) | ⬜ pending |
| 19-01-02 | 01 | 1 | UI-01 | build | `npm run build` | N/A (type check) | ⬜ pending |
| 19-02-01 | 02 | 2 | KDS-01 | build + manual | `npm run build` | N/A | ⬜ pending |
| 19-02-02 | 02 | 2 | KDS-02 | build + manual | `npm run build` | N/A | ⬜ pending |
| 19-02-03 | 02 | 2 | COMBO-02 | build + manual | `npm run build` | N/A | ⬜ pending |
| 19-03-01 | 03 | 2 | COMBO-01 | build + manual | `npm run build` | N/A | ⬜ pending |
| 19-03-02 | 03 | 2 | COMBO-01 | manual | browser at localhost:3000/kds | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

*No test files or framework config needed — `npm run build` provides TypeScript strict-mode verification for all new types and component integration points.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Order type badge shows DIN/TKWY/GRAB/LINE MAN in correct colors | KDS-01 | No test framework; visual color verification | Open `/kds`, enable Demo Mode, verify badge text and colors per ticket |
| Filter tabs hide/show tickets and counts update | KDS-02 | DOM interaction, no test framework | Open `/kds`, click Dine-in/Takeaway/Delivery tabs, verify ticket visibility and counts |
| PACK chip renders on flagged items in KDS | COMBO-02 | Visual rendering, no test framework | Enable Demo Mode, verify PACK badge appears on ticket item rows with packToGo=true |
| Bag toggle on order entry flags items dine-in only | COMBO-01 | UI interaction, no test framework | Open dine-in order entry, verify bag icon appears; open takeaway order, verify bag icon hidden |
| Grab green and LINE MAN blue render in light and dark mode | UI-01 | Color/theme verification, no test framework | Enable Demo Mode, toggle dark mode, verify platform badge colors are correct |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
