---
phase: 2
slug: table-map
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed (TypeScript strict mode only) |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~5 seconds (tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit` + manual browser walkthrough of happy-path flows
- **Before `/gsd:verify-work`:** All 5 success criteria verified manually in browser
- **Max feedback latency:** ~5 seconds (tsc only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | FLOOR-01–05 | tsc | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | FLOOR-01–05 | tsc | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | FLOOR-01 | tsc + manual | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | FLOOR-02, FLOOR-04 | tsc + manual | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 3 | FLOOR-02, FLOOR-03 | tsc + manual | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 3 | FLOOR-02, FLOOR-05 | tsc + manual | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 4 | all FLOOR | manual | visual browser walkthrough | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/table.store.ts` — state machine covering FLOOR-01 through FLOOR-05
- [ ] `src/lib/mock-data/tables.ts` — 12-table fixture with 2 pre-seeded Reserved
- [ ] `src/components/table-map/TableGrid.tsx` — grid render for FLOOR-01
- [ ] `src/components/table-map/TableTile.tsx` — covers FLOOR-01, FLOOR-02, FLOOR-04
- [ ] `src/components/table-map/useDwellTimer.ts` — covers FLOOR-04
- [ ] `src/components/table-map/TableBottomSheet.tsx` — covers FLOOR-02, FLOOR-05
- [ ] `src/components/table-map/OpenTableModal.tsx` — covers FLOOR-03
- [ ] Framework install: none required (TypeScript type check uses existing `tsc`)

*All files are new — created in Wave 1 of planning.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 12 tiles render with correct color+icon per status | FLOOR-01 | Visual/interactive — no test runner | Open `/table-map`; confirm each status has distinct border color and icon |
| Tap Open tile → bottom sheet → Open Table modal | FLOOR-02 | UI interaction flow | Tap an Open table; confirm bottom sheet appears; tap [Open Table]; confirm Dialog opens |
| Guest count ≥ 1 updates tile to Occupied | FLOOR-03 | Form interaction + state update | Enter `2`, click "Open Table"; verify tile changes to red Occupied with guest count |
| Dwell timer increments live | FLOOR-04 | Timer animation | Wait 3–5 seconds; verify timer changes on Occupied tile |
| Waiter name + note persist on blur | FLOOR-05 | Inline edit flow | Type waiter name in sheet; click elsewhere; reopen sheet; verify value persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
