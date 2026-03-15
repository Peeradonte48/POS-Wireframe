---
phase: 20
slug: integration-fix-phase17-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler + ESLint (no test framework per CLAUDE.md) |
| **Config file** | `tsconfig.json` / `.eslintrc` |
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
| 20-01-01 | 01 | 1 | DLVR-02 | build (type-check) | `npm run build` | ✅ `src/stores/queue.store.ts` | ⬜ pending |
| 20-01-02 | 01 | 1 | NAV-02 | build + manual | `npm run build` | ✅ `src/app/(app)/table-map/page.tsx` | ⬜ pending |
| 20-01-03 | 01 | 1 | KDS-01 | manual | stakeholder demo | N/A | ⬜ pending |
| 20-01-04 | 01 | 1 | KDS-02 | manual | stakeholder demo | N/A | ⬜ pending |
| 20-02-01 | 02 | 2 | DLVR-02, KDS-01, KDS-02, NAV-02 | gsd-verifier | Phase 17 VERIFICATION.md | `.planning/phases/17-.../17-VERIFICATION.md` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

No new test files or framework installation needed. Both fix locations are existing files (`queue.store.ts` and `table-map/page.tsx`). Phase 17 verification uses `gsd-verifier` subagent, not a test file.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live delivery KDS tickets show GRAB/LINE MAN badge (not DIN) | KDS-01 | UI visual check — badge rendering requires runtime interaction | Accept delivery order from queue → navigate to `/kds` → verify ticket shows `GRAB` or `LINE MAN` badge |
| KDS Delivery filter tab counts live-accepted delivery orders | KDS-02 | UI state check — requires runtime order acceptance | Accept delivery order → verify KDS Delivery tab count increments |
| Delivery badge counts Accepted/Preparing/ReadyForRider orders | NAV-02 | UI visual check post-fix | Accept delivery order → verify floor plan Delivery tab badge is > 0 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
