---
phase: 14
slug: merge-bill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — TypeScript via `npm run build` |
| **Config file** | tsconfig.json (strict mode) |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-01-02 | 01 | 1 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-01-03 | 01 | 1 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-02-01 | 02 | 2 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-02-02 | 02 | 2 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-02-03 | 02 | 2 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-03-01 | 03 | 3 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-03-02 | 03 | 3 | MERGE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 14-04-01 | 04 | 3 | MERGE-02 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

*No test framework install needed. `npm run build` is the project's verification standard (documented in CLAUDE.md).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| bill.store `merges` map updates correctly on initMerge/dissolveAll | MERGE-01 | No unit test framework — runtime state only observable in browser | Open floor plan, merge 2 tables, check primary payment shows both tables' items |
| Secondary tile shows "Merged→T[X]" badge and routes to primary payment | MERGE-01 | Visual + routing — requires browser interaction | Merge tables, tap secondary tile, verify navigation to primary's /payment/[id] |
| Combined bill totals = sum of all table items with correct VAT | MERGE-01 | Arithmetic verified by inspection in browser with known mock data | Add 2 items to T2, 3 items to T3, merge T2→T3, verify combined total and VAT in primary payment |
| Split Bill button hidden/disabled while merge is active | MERGE-01 | Conditional render — visual verification | Merge active on primary table payment page; confirm Split Bill button absent |
| Revert to Single Bill disabled when ≥1 seat already paid | MERGE-02 | Runtime guard — requires browser interaction with mock payment state | Open SplitSheet with 1 paid seat; confirm Revert button disabled + inline message shown |
| Revert to Single Bill confirm dialog clears split and closes sheet | MERGE-02 | User interaction flow | Open SplitSheet, no seats paid, tap Revert, confirm dialog, verify split cleared |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
