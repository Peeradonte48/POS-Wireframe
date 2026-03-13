---
phase: 15
slug: order-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project uses TypeScript build for correctness |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green + manual browser verification
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | TRACK-01 | build | `npm run build` | N/A | ⬜ pending |
| 15-01-02 | 01 | 1 | TRACK-01 | build | `npm run build` | N/A | ⬜ pending |
| 15-02-01 | 02 | 2 | TRACK-01 | build | `npm run build` | N/A | ⬜ pending |
| 15-02-02 | 02 | 2 | TRACK-01 | build | `npm run build` | N/A | ⬜ pending |
| 15-03-01 | 03 | 3 | TRACK-02 | build | `npm run build` | N/A | ⬜ pending |
| 15-03-02 | 03 | 3 | TRACK-02 | build | `npm run build` | N/A | ⬜ pending |
| 15-03-03 | 03 | 3 | TRACK-02 | build | `npm run build` | N/A | ⬜ pending |
| 15-04-01 | 04 | 3 | TRACK-03 | build | `npm run build` | N/A | ⬜ pending |
| 15-04-02 | 04 | 3 | TRACK-03 | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure is needed. The project has no test framework by design. TypeScript strict mode via `npm run build` is the sole automated correctness gate.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Color-coded stage badge appears on Occupied/CheckRequested tiles with correct color | TRACK-01 | Visual UI — no test framework | Open floor plan, occupy a table, send order via KDS demo mode, verify badge color matches stage (blue=Ordered, amber=Cooking, green=Ready, gray=Served) |
| Badge updates automatically when KDS ticket is bumped | TRACK-01 | Real-time reactive UI | Open two windows (floor plan + KDS), bump a ticket, verify floor plan badge updates without page refresh |
| Timeline tab renders round-grouped items with elapsed time | TRACK-02 | Visual UI | Tap occupied table → Timeline tab → verify items grouped by round with `● STAGE  Item Name  N min` format |
| Elapsed time updates every 60 seconds | TRACK-02 | Timer-driven UI | Wait >60s with timeline open, verify minute counter increments |
| Escalated badge overrides to red on tile | TRACK-03 | Visual — requires 15-min wait or mock sentAt | Set a round's `sentAt` to `Date.now() - 16*60*1000` in store devtools, verify badge turns red |
| Escalated timeline rows show red tint + red elapsed text | TRACK-03 | Visual | Same setup as above, open timeline, verify escalated rows have red background tint and red elapsed text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
