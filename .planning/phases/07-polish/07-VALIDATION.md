---
phase: 7
slug: polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js build + browser visual check (no jest/vitest — wireframe project) |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~30 seconds (tsc), ~90 seconds (next build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next build`
- **Before `/gsd:verify-work`:** Full suite must be green + browser visual check
- **Max feedback latency:** 30 seconds (tsc only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | POLISH-01,02,03,04 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 7-02-01 | 02 | 2 | POLISH-02 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 7-03-01 | 03 | 3 | POLISH-03 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 7-04-01 | 04 | 4 | POLISH-04 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 7-05-01 | 05 | 5 | ALL | build | `npx tsc --noEmit && npx next build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements (TypeScript strict mode already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Brand colors visually correct in light mode | POLISH-01 | Visual inspection only | Open app in browser, verify crimson primary on buttons/accents |
| Dark mode toggle works across all screens | POLISH-01 | Visual inspection | Toggle dark mode, check all screens for correct theme |
| Solar icons rendered correctly | POLISH-02 | Visual inspection | Check icon rendering on all screens |
| 44px touch targets on mobile | POLISH-02 | Browser DevTools | Use DevTools at 375px to verify tap targets |
| Toasts fire for all 10 defined actions | POLISH-03 | Manual trigger | Execute each action and confirm toast appears |
| Empty states visible on fresh store | POLISH-04 | Manual test | Clear localStorage, reload — check empty state screens |
| Unsplash images load in MenuPanel | POLISH-02 | Visual inspection | Open order flow, verify food photos appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
