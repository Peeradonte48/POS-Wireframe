---
phase: 12
slug: split-bill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project uses `npm run build` (TypeScript compiler) as the only automated verification |
| **Config file** | tsconfig.json |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must be green + manual browser walkthrough of both split modes
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04 | build | `npm run build` | ✅ | ⬜ pending |
| 12-01-02 | 01 | 1 | SPLIT-01 | build + manual | `npm run build` | ✅ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | SPLIT-02 | build + manual | `npm run build` | ✅ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | SPLIT-01, SPLIT-02 | build + manual | `npm run build` | ✅ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | SPLIT-03 | build + manual | `npm run build` | ✅ W0 | ⬜ pending |
| 12-02-03 | 02 | 2 | SPLIT-04 | build + manual | `npm run build` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* No test framework to configure — `npm run build` (TypeScript strict mode) is the existing verification mechanism and requires no setup.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Equal split N seats sums to grandTotal (floor + remainder rounding) | SPLIT-01 | No unit test framework | Open payment page → tap Split Bill → choose Equal → enter N → verify all share totals sum to grandTotal |
| Per-seat assignment: items assigned to seats, unassigned in shared bucket, VAT correct per seat | SPLIT-02 | No unit test framework | Open payment page → tap Split Bill → choose Per Seat → assign all items → verify each seat subtotal includes correct 7% VAT |
| Independent seat payment; paid seat shows settled state; last seat triggers table → Cleaning | SPLIT-03 | No unit test framework | Pay each seat independently with Cash/QR/Card → verify paid seats disabled → pay last seat → verify table transitions to Cleaning |
| Table tile shows "X/N paid" split progress badge; badge gone when all paid | SPLIT-04 | No unit test framework | Start split → pay one seat → observe floor plan tile shows e.g. "1/4 paid" → pay all → verify badge disappears and table shows Cleaning |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
