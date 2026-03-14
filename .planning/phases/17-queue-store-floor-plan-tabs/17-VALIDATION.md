---
phase: 17
slug: queue-store-floor-plan-tabs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler + ESLint (no test framework configured) |
| **Config file** | tsconfig.json / .eslintrc |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | NAV-01, NAV-02 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | DLVR-01, DLVR-02 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | TKWY-01 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 2 | DLVR-03, DLVR-04 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 2 | DLVR-05, DLVR-06 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 17-03-01 | 03 | 3 | DLVR-07, DLVR-08 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 17-03-02 | 03 | 3 | DLVR-09 | build + manual | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/queue.store.ts` — queue store stub (empty state, type stubs) so all import references compile
- [ ] `src/types/queue.ts` — `QueueOrder`, `DeliveryOrder`, `TakeawayOrder` type stubs

*All Wave 0 items are type/stub files only — this project has no test framework.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Countdown ring animates correctly | DLVR-05 | CSS animation, no DOM assertion possible | Open delivery tab, trigger incoming order, verify ring counts down visually |
| Auto-accept toggle skips confirmation | DLVR-06 | Requires UI interaction sequence | Enable auto-accept, trigger incoming order, verify accepted without prompt |
| Reject reason modal appears and submits | DLVR-04 | Multi-step modal interaction | Tap reject on incoming order, verify reason list appears, select reason, confirm |
| "Ready for Rider" transition updates card | DLVR-07 | State progression UX flow | Accept order, advance to Preparing, tap Ready for Rider, verify status badge changes |
| Takeaway modal assigns sequential TK-NNN | TKWY-01 | Stateful counter behavior | Create 3 takeaway orders, verify TK-001, TK-002, TK-003 assigned in order |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
