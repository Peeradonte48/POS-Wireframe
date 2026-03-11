---
phase: 11
slug: component-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (`tsc --noEmit`) + Next.js build (`next build`) |
| **Config file** | `tsconfig.json` / `next.config.ts` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds (tsc) / ~45 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | COMP-01 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | COMP-02 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-02-01 | 02 | 2 | COMP-03 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-02-02 | 02 | 2 | COMP-04 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-03-01 | 03 | 3 | COMP-05 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-03-02 | 03 | 3 | All | build + visual | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.
- TypeScript compiler and Next.js build are available
- No new test stubs required — this is a visual style refactor with build verification as the primary gate

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crimson glow visible on button hover | COMP-01 | CSS hover state not testable via tsc/build | Open app in browser → hover primary button → confirm glow shadow appears |
| Press scale `active:scale-[0.97]` triggers on tap | COMP-01 | Active CSS state not testable via build | Tap/click primary button → confirm scale animation |
| Status pills visually distinct under dim lighting | COMP-02 | Perceptual design check | Table map → dim screen brightness → all 5 status colors must be distinguishable |
| Elevation tiers create spatial hierarchy | COMP-03 | Perceptual design check | Order screen → menu cards vs ticket panel vs modals — confirm 3 distinct depth levels |
| Hero totals visually dominant | COMP-04 | Perceptual design check | Ticket footer and payment total → `text-2xl font-black text-primary` must feel like the focal point |
| Caps labels consistent across all screens | COMP-05 | Visual audit across 8 files | Navigate each screen — all section headers should look visually identical |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
