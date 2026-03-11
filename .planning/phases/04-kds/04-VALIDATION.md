---
phase: 4
slug: kds
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — browser-based visual verification (consistent with Phases 1–3) |
| **Config file** | none — TypeScript strict compile is the automated gate |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` + browser verification |
| **Estimated runtime** | ~5–10 seconds (tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (zero errors required)
- **After every plan wave:** Browser-verify each KDS success criterion in order
- **Before `/gsd:verify-work`:** All 4 KDS criteria browser-verified and green
- **Max feedback latency:** ~10 seconds (tsc compile)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | KDS-01 | compile | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 4-01-02 | 01 | 1 | KDS-01 | manual | Browser: `/kds` full-screen, 3 columns, no AppShell | ❌ Wave 0 | ⬜ pending |
| 4-02-01 | 02 | 1 | KDS-02 | compile | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 4-02-02 | 02 | 1 | KDS-02 | manual | Browser: tap BUMP, verify column advance; tap recall | ❌ Wave 0 | ⬜ pending |
| 4-03-01 | 03 | 2 | KDS-03 | compile | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 4-03-02 | 03 | 2 | KDS-03 | manual | Browser: void item → struck-through; special request → allergy badge | ❌ Wave 0 | ⬜ pending |
| 4-04-01 | 04 | 2 | KDS-04 | compile | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 4-04-02 | 04 | 2 | KDS-04 | manual | Browser: demo mode ON → tickets appear at 8–12s cadence | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test framework to install — browser-based verification is the established project pattern
- [ ] TypeScript strict compile must pass clean after each file added: `npx tsc --noEmit`

*This is consistent with Phases 1–3 convention: no automated test suite; verification is visual/interactive in the browser.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full-screen KDS board with 3 columns, no AppShell sidebar | KDS-01 | No test framework; visual layout verification | Navigate to `/kds`, verify three columns (New / In Progress / Ready), confirm no sidebar present |
| BUMP advances ticket stage; recall restores ticket; timer ticks | KDS-02 | Interactive gesture testing | Tap BUMP on ticket item, verify stage change; tap recall tray to restore |
| Voided items struck-through; special requests show allergy badge | KDS-03 | Visual badge/style verification | Place order with customization, void an item after sending, verify at `/kds` |
| Demo mode injects tickets at realistic cadence | KDS-04 | Time-based async behavior | Enable demo mode toggle, wait 30s, verify 2–4 new tickets appear automatically |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (`npx tsc --noEmit`) or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (tsc covers all)
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s (tsc compile)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
