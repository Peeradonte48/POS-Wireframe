---
phase: 13
slug: polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — TypeScript build + manual browser QA |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | POLISH-01 | build | `npm run build` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | POLISH-01 | build | `npm run build` | ✅ | ⬜ pending |
| 13-01-03 | 01 | 1 | POLISH-01 | build | `npm run build` | ✅ | ⬜ pending |
| 13-02-01 | 02 | 2 | POLISH-02 | build | `npm run build` | ✅ | ⬜ pending |
| 13-02-02 | 02 | 2 | POLISH-02 | build | `npm run build` | ✅ | ⬜ pending |
| 13-02-03 | 02 | 2 | POLISH-02 | manual | visual browser QA | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No framework installation needed — project uses TypeScript build as the primary validation gate.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No horizontal overflow at 375px | POLISH-02 | Requires browser viewport resize | Open each new modal/sheet at 375px width, verify no overflow |
| Status token visual distinction | POLISH-01 | Color differentiation is subjective | Compare `--status-settled` vs `--status-open` badges side by side in light + dark mode |
| Dark mode token rendering | POLISH-01 | Requires theme toggle | Switch to dark mode, verify all CVA variants render correct brand colors with no raw palette values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
