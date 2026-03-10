---
phase: 3
slug: order-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No automated test runner — browser-based verification (established pattern from Phases 1 & 2) |
| **Config file** | none — Wave 0 note: vitest + @testing-library/react if test runner desired (out of scope for wireframe) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` + browser walkthrough of all 5 success criteria |
| **Estimated runtime** | ~10 seconds (tsc) + ~5 minutes (browser walkthrough) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit` + browser walkthrough of wave success criteria
- **Before `/gsd:verify-work`:** Full suite must be green (tsc clean + all 5 success criteria verified in browser at 1024px viewport)
- **Max feedback latency:** 10 seconds (tsc)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | ORDER-01 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | ORDER-01 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | ORDER-02 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | ORDER-02 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | ORDER-03 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | ORDER-04 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | ORDER-05 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 2 | ORDER-06, ORDER-07 | tsc + browser | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install `sonner` toast library (`npm install sonner`) — absent from package.json, required by ORDER-04 send confirmation
- [ ] Verify `npx tsc --noEmit` passes clean before any Phase 3 work begins

*Note: No test file stubs needed — consistent with wireframe-only scope established in Phases 1 and 2. TypeScript + browser is the established Nyquist pattern for this project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Category tabs render + item list filters | ORDER-01 | No test runner installed | Open `/order/[tableId]`, tap each category tab, verify item list updates |
| Modifier sheet opens, required validation fires | ORDER-02 | No test runner installed | Tap menu item, leave required group empty, tap [Add to Order], verify red highlight + scroll |
| Edit pre-fills modifier sheet | ORDER-03 | No test runner installed | Add item to ticket, tap line to edit, verify modifier sheet opens with previous values |
| Pre-send remove is instant (no confirm) | ORDER-03 | No test runner installed | Tap trash on unsent item, verify instant removal |
| Send toast + read-only sent items | ORDER-04 | No test runner installed | Tap [Send to Kitchen], verify Sonner toast + sent items lose qty/trash controls |
| Manager PIN on void | ORDER-05 | Auth modal interaction | After sending, tap void on sent item, verify ManagerPinModal opens |
| Post-send add item + second send | ORDER-06 | Multi-round flow | After sending, tap item to add, verify new [Add Items] button + second round sends |
| Floor map badge updates to Ordered | ORDER-07 | Cross-screen state | Navigate back to `/table-map`, verify table tile shows Ordered stage badge |
| Spice level 1–5 icon selector UX | ORDER-02 | Visual interaction | Tap each chili icon, verify fill/dim state updates correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s (tsc)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
