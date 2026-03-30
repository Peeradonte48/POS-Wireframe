---
phase: 22-codebase-audit
plan: "02"
subsystem: testing
tags: [playwright, e2e, test-stubs, typescript, dine-in, takeaway, delivery, split-bill, merge-bill]

# Dependency graph
requires:
  - phase: 22-codebase-audit
    provides: audit context, D-04 decision (Playwright stubs format), known tech debt registry

provides:
  - 5 Playwright E2E test stub files in src/__tests__/e2e/ documenting all multi-screen flows
  - dine-in-full-flow.spec.ts — 6 test blocks, 58 TODO assertions
  - takeaway-walk-in-flow.spec.ts — 4 test blocks, 43 TODO assertions
  - delivery-queue-flow.spec.ts — 4 test blocks, 44 TODO assertions (includes DLVR-04/05 notes)
  - split-bill-flow.spec.ts — 6 test blocks, 68 TODO assertions (equal + per-seat paths)
  - merge-bill-flow.spec.ts — 5 test blocks, 63 TODO assertions
affects:
  - 25-tech-debt (TD-03 — developer fills in TODO assertions in Phase 25)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Playwright test stub pattern: test() blocks with TODO comments, valid TypeScript, no @playwright/test runtime needed

key-files:
  created:
    - src/__tests__/e2e/dine-in-full-flow.spec.ts
    - src/__tests__/e2e/takeaway-walk-in-flow.spec.ts
    - src/__tests__/e2e/delivery-queue-flow.spec.ts
    - src/__tests__/e2e/split-bill-flow.spec.ts
    - src/__tests__/e2e/merge-bill-flow.spec.ts
  modified: []

key-decisions:
  - "Stubs reference actual app URL paths (/table-map, /order/T1, /payment/T1, /kds) from production routes"
  - "DLVR-04/05 bug documented inline in delivery-queue-flow.spec.ts with comments flagging expected failure points"
  - "Merge bill fix (2026-03-13) regression check included as step 9 in merge-bill-flow — T4 secondary table must return to Open"
  - "Per D-04: stubs are TypeScript with test() blocks and TODO comments, not manual steps, not full automation"

patterns-established:
  - "E2E stub pattern: import from @playwright/test, test.describe() wrapper, individual test() per major step, // TODO: await comments for assertions"

requirements-completed: [AUD-02]

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 22 Plan 02: Playwright E2E Test Stubs Summary

**5 Playwright test stub files documenting all multi-screen flows as TypeScript test() blocks with TODO assertions, covering dine-in, takeaway, delivery, split bill, and merge bill lifecycles**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-31T21:50:00Z
- **Completed:** 2026-03-31T22:02:50Z
- **Tasks:** 1
- **Files modified:** 5 created

## Accomplishments
- Created `src/__tests__/e2e/` directory and 5 Playwright stub files
- All flows reference actual app routes and UI elements from production code
- Known tech debt (DLVR-04/05) and bug fix regression points documented inline
- 276 total TODO assertion markers across all 5 files for Phase 25 fill-in

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Playwright E2E test stubs for all 5 flows** - `034a3c5` (feat)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified
- `src/__tests__/e2e/dine-in-full-flow.spec.ts` — Login -> open table -> order with modifiers -> KDS bump -> payment (6 test blocks)
- `src/__tests__/e2e/takeaway-walk-in-flow.spec.ts` — Create takeaway -> order entry -> send to kitchen -> payment -> collected (4 test blocks)
- `src/__tests__/e2e/delivery-queue-flow.spec.ts` — Simulate delivery -> accept -> KDS -> picked up; DLVR-04/05 flagged (4 test blocks)
- `src/__tests__/e2e/split-bill-flow.spec.ts` — Equal split (value) + per-seat (item) split paths with sequential seat payment (6 test blocks)
- `src/__tests__/e2e/merge-bill-flow.spec.ts` — Merge two tables -> combined bill -> pay -> verify both tables close (5 test blocks)

## Decisions Made
- Stub format follows D-04: TypeScript files with `test()` blocks, TODO comments, not manual steps, not full automation
- Each stub references actual route paths from the app (`/table-map`, `/order/T1`, `/payment/T1`, `/kds`)
- DLVR-04/05 desync issue annotated in `delivery-queue-flow.spec.ts` — the New->InProgress KDS bump assertion explicitly notes it will fail until Phase 25 fix
- Merge bill regression test (T4 secondary table must return to Open) included per 2026-03-13 bug fix history in STATE.md

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Note: `@playwright/test` package is not currently installed. Phase 25 will need to add it (`npm install -D @playwright/test`) before running the stubs.

## Known Stubs
These files are intentionally stubs — all `// TODO:` comments are unfilled assertions left for Phase 25. No stub prevents the plan's goal from being achieved; the goal is documentation of flows, not automation.

## Next Phase Readiness
- AUD-02 E2E portion satisfied: 5 multi-screen flows documented as Playwright test stubs
- Phase 25 (TD-03) can open any stub and fill in TODOs without needing to rediscover the flow
- Phase 25 will need: `npm install -D @playwright/test` and `playwright.config.ts` with `baseURL: 'http://localhost:3000'`

---
*Phase: 22-codebase-audit*
*Completed: 2026-03-31*
