---
phase: 25-tech-debt
plan: "02"
subsystem: testing
tags: [e2e, playwright, documentation, tech-debt]
dependency_graph:
  requires: []
  provides: [TD-03]
  affects: []
tech_stack:
  added: []
  patterns: [playwright-serial-describe, role-based-locators, testid-locators]
key_files:
  created: []
  modified:
    - src/__tests__/e2e/dine-in-full-flow.spec.ts
    - src/__tests__/e2e/takeaway-walk-in-flow.spec.ts
    - src/__tests__/e2e/delivery-queue-flow.spec.ts
    - src/__tests__/e2e/split-bill-flow.spec.ts
    - src/__tests__/e2e/merge-bill-flow.spec.ts
decisions:
  - "test.describe.configure({ mode: 'serial' }) added to all 5 describe blocks — tests share browser state, serial order required"
  - "DLVR-04/05 known-issue assertions kept as commented-out code (not executable) — documents expected behavior post-fix"
  - "localStorage assertions in delivery, split, merge files kept as comments — no Playwright context available; documents intended verification"
metrics:
  duration_minutes: 3
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
  completed_date: "2026-03-31"
requirements_completed: [TD-03]
---

# Phase 25 Plan 02: E2E Test Stub Fill-in Summary

**One-liner:** Filled all 5 Playwright E2E stubs with executable page.goto, click, and expect assertions documenting dine-in, takeaway, delivery, split-bill, and merge-bill flows.

---

## What Was Done

Replaced all `// TODO: await ...` comment stubs in 5 E2E test files with real uncommented Playwright calls. The files were created in Phase 22 (AUD-02) as structural placeholders; this plan made them executable documentation artifacts.

**Per D-08:** These tests are NOT run in Phase 25. Playwright is not a dev dependency. The files serve as executable documentation that becomes runnable when `@playwright/test` is added.

---

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Fill dine-in and takeaway E2E stubs | b17f424 |
| 2 | Fill delivery, split-bill, merge-bill E2E stubs | b7db7c0 |

---

## File Changes

### dine-in-full-flow.spec.ts
- 6 tests covering complete dine-in lifecycle: login, open table, add modifiers, send to kitchen, KDS bump, payment
- 7 `page.goto` calls, 27 `await expect` assertions
- `test.describe.configure({ mode: 'serial' })` added

### takeaway-walk-in-flow.spec.ts
- 4 tests covering takeaway lifecycle: create order, add items, send + pay, collected status
- 5 `page.goto` calls, real assertions for all lifecycle steps
- `test.describe.configure({ mode: 'serial' })` added

### delivery-queue-flow.spec.ts
- 4 tests covering delivery lifecycle: simulate order, accept, KDS bump, mark picked up
- 17 `await page` calls
- DLVR-04/05 known-issue assertions preserved as commented-out code with explanatory notes
- `test.describe.configure({ mode: 'serial' })` added

### split-bill-flow.spec.ts
- 6 tests covering both split paths: equal/value split and per-seat item split
- 41 `await page` calls; most comprehensive flow test
- `test.describe.configure({ mode: 'serial' })` added

### merge-bill-flow.spec.ts
- 5 tests covering merge lifecycle: setup both tables, initiate merge, select secondary, verify combined bill, pay and verify cleanup
- 34 `await page` calls
- Bug fix 2026-03-13 (secondary table cleanup) has corresponding regression assertion in step 9
- `test.describe.configure({ mode: 'serial' })` added

---

## Verification Results

```
grep -rc "// TODO:" src/__tests__/e2e/
src/__tests__/e2e/takeaway-walk-in-flow.spec.ts:0
src/__tests__/e2e/split-bill-flow.spec.ts:0
src/__tests__/e2e/merge-bill-flow.spec.ts:0
src/__tests__/e2e/delivery-queue-flow.spec.ts:0
src/__tests__/e2e/dine-in-full-flow.spec.ts:0
```

All 5 files: 0 TODO comments remaining.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

- [x] dine-in-full-flow.spec.ts exists with `await page.goto` lines
- [x] takeaway-walk-in-flow.spec.ts exists with `await page.goto` lines
- [x] delivery-queue-flow.spec.ts exists with `await page.goto` lines
- [x] split-bill-flow.spec.ts exists with `await page.goto` lines
- [x] merge-bill-flow.spec.ts exists with `await page.goto` lines
- [x] Commit b17f424 exists (Task 1)
- [x] Commit b7db7c0 exists (Task 2)
- [x] All 5 files have 0 TODO comments
