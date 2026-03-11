---
phase: 8
slug: bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — this is a Hi-Fi wireframe; manual browser verification is the established approach |
| **Config file** | none |
| **Quick run command** | Manual browser walkthrough (per-bug steps below) |
| **Full suite command** | Manual browser walkthrough (all 5 bugs) |
| **Estimated runtime** | ~5 minutes for full manual pass |

---

## Sampling Rate

- **After every task commit:** Manually verify the specific bug scenario in browser
- **After every plan wave:** Run full 5-bug manual walkthrough
- **Before `/gsd:verify-work`:** All 5 manual checks must pass
- **Max feedback latency:** Immediate (browser reload)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Verification Step | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 8-01-01 | 01 | 1 | BUG-01 | manual-smoke | Log in as Waiter, open shift, tap Orders in sidebar → no 404, lands on table-map or stub redirect page | ⬜ pending |
| 8-02-01 | 02 | 1 | BUG-02 | manual-smoke | Log in as Manager, open shift, navigate to `/kds` in URL bar → KDS renders, no redirect to /table-map | ⬜ pending |
| 8-03-01 | 03 | 1 | BUG-03 | manual-smoke | Log in as Waiter, tap table, tap Mark Reserved → toast banner appears on table map screen | ⬜ pending |
| 8-03-02 | 03 | 1 | BUG-03 | manual-smoke | Log in as Manager, close shift via EOD tab → success toast appears | ⬜ pending |
| 8-04-01 | 04 | 1 | BUG-04 | manual-smoke | Log in as Waiter, add item, send to kitchen → sent item's void/trash button is hidden or disabled | ⬜ pending |
| 8-04-02 | 04 | 1 | BUG-04 | manual-smoke | Log in as Manager, add item, send to kitchen → sent item's void/trash button is visible and enabled | ⬜ pending |
| 8-05-01 | 05 | 1 | BUG-05 | manual-smoke | Log in as Waiter, open shift, type `/manager` in URL bar → redirected to `/table-map` | ⬜ pending |
| 8-05-02 | 05 | 1 | BUG-05 | manual-smoke | Log in as Manager, open shift, type `/manager` in URL bar → manager page renders normally | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test framework detected — all validation is manual browser verification
- [ ] Consider Playwright smoke tests in a future phase for regression coverage

*Manual browser verification is appropriate and established for this Hi-Fi wireframe project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Orders sidebar link resolves | BUG-01 | No test infra; routing behavior | Log in as Waiter → open shift → tap Orders in sidebar → verify no 404 |
| Manager accesses /kds | BUG-02 | No test infra; role guard behavior | Log in as Manager → open shift → navigate to `/kds` → verify KDS renders |
| Toast appears on table map | BUG-03 | No test infra; runtime DOM behavior | Log in as Waiter → open shift → tap table → Mark Reserved → verify toast banner |
| Toast appears on manager page | BUG-03 | No test infra; runtime DOM behavior | Log in as Manager → close shift via EOD tab → verify success toast |
| void-post-send hidden from Waiter | BUG-04 | No test infra; permission-gated UI | Log in as Waiter → add item → send to kitchen → verify void button absent/disabled on sent item |
| void-post-send visible to Manager | BUG-04 | No test infra; permission-gated UI | Log in as Manager → add item → send to kitchen → verify void button present on sent item |
| /manager redirect for non-Manager | BUG-05 | No test infra; role guard behavior | Log in as Waiter → type `/manager` in URL bar → verify redirect to `/table-map` |
| /manager loads for Manager | BUG-05 | No test infra; role guard behavior | Log in as Manager → type `/manager` in URL bar → verify manager page loads |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps defined
- [ ] Sampling continuity: verify in browser after each plan execution
- [ ] Wave 0: No automated stubs needed — manual verification is the established approach
- [ ] No watch-mode flags
- [ ] Feedback latency: immediate (browser reload after each fix)
- [ ] `nyquist_compliant: true` set in frontmatter when sign-off complete

**Approval:** pending
