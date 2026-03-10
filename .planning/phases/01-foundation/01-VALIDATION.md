---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (`tsc --noEmit`) — primary automated check; no DOM test framework needed for this wireframe phase |
| **Config file** | `tsconfig.json` — created by `create-next-app --yes` (verify `strict: true`) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run lint` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green + all 5 success criteria verified manually in browser
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-scaffold | 01 | 0 | AUTH-01–05 | build | `npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 1-store | 01 | 0 | AUTH-04, AUTH-05 | type-check | `npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 1-permissions | 01 | 0 | AUTH-02 | type-check | `npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 1-mock-data | 01 | 0 | AUTH-01 | type-check | `npx tsc --noEmit` | Wave 0 | ⬜ pending |
| 1-login | 01 | 1 | AUTH-01 | manual | Browser visual check | N/A | ⬜ pending |
| 1-appshell | 01 | 1 | AUTH-02, AUTH-05 | manual + type | `npx tsc --noEmit` + browser | N/A | ⬜ pending |
| 1-shift-open | 01 | 1 | AUTH-04 | manual + type | `npx tsc --noEmit` + browser | N/A | ⬜ pending |
| 1-manager-pin | 01 | 2 | AUTH-03 | manual | Browser visual check | N/A | ⬜ pending |
| 1-role-gating | 01 | 2 | AUTH-02 | manual + type | `npx tsc --noEmit` + browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tsconfig.json` with `"strict": true` — verify `create-next-app --yes` enables strict mode; add manually if not
- [ ] `src/stores/session.store.ts` — typed `useSessionStore` with `Role`, `login`, `openShift`, `logout` — covers AUTH-04, AUTH-05
- [ ] `src/lib/role-permissions.ts` — `ROLE_NAV_ACCESS` map covering all 4 roles — covers AUTH-02
- [ ] `src/lib/mock-data/staff.ts` — `MOCK_STAFF` fixture + `verifyPin(role, pin)` — covers AUTH-01

*All Wave 0 items are TypeScript source files that `tsc --noEmit` will validate structurally.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PIN screen shake + red flash + auto-clear on wrong PIN | AUTH-01 | DOM animation behavior | Enter wrong PIN → verify shake animation plays, input turns red, then clears automatically |
| Manager PIN override modal stays on current screen | AUTH-03 | No route change = can't be automated | On any screen, trigger manager PIN override → verify modal overlays without navigating away |
| Shift Open soft gate: sidebar visible with locked sections | AUTH-04 | Visual state rendering | Log in, skip shift open → verify sidebar shows all items but non-shift sections appear locked/disabled |
| Kitchen role sees only KDS enabled in sidebar | AUTH-02 | Role-specific visual state | Log in as Kitchen → verify Table Map, Orders, Payment, Manager nav items are visually disabled |
| Role routing: Waiter vs Manager see different enabled actions | AUTH-02 | UI state difference | Log in as Waiter, note enabled actions; log in as Manager, verify more actions are enabled |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
