---
phase: 10
slug: brand-token-refresh
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no jest/vitest in this wireframe project |
| **Config file** | none — no Wave 0 install needed |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && grep -rn "bg-green-\|bg-red-\|bg-amber-\|bg-gray-\|text-green-\|text-red-\|text-amber-\|text-gray-\|border-l-green\|border-l-red\|border-l-blue\|border-l-amber\|border-l-gray" src/components/table-map/TableTile.tsx src/components/kds/KdsTicketCard.tsx src/components/app-shell/AppSidebar.tsx && echo "TOKEN-04: PASS — no raw palette classes" || echo "TOKEN-04: FAIL — raw palette classes found"` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run full suite command above
- **Before `/gsd:verify-work`:** Full suite must be green + grep returns zero matches
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | TOKEN-01 | manual-visual + build | `npm run build` | ✅ globals.css | ⬜ pending |
| 10-01-02 | 01 | 1 | TOKEN-01 | manual-visual | Dark mode toggle — crimson visually bolder in both modes | ✅ globals.css | ⬜ pending |
| 10-02-01 | 02 | 1 | TOKEN-02 | manual-visual + build | `npm run build` | ✅ globals.css | ⬜ pending |
| 10-02-02 | 02 | 1 | TOKEN-02 | manual-visual | Dark mode toggle — all 5 status tokens render distinctly | ✅ globals.css | ⬜ pending |
| 10-03-01 | 03 | 1 | TOKEN-03 | manual-visual + build | `npm run build` | ✅ globals.css | ⬜ pending |
| 10-03-02 | 03 | 1 | TOKEN-03 | manual-visual | Dark mode toggle — shadows/glows applied on all cards/panels | ✅ globals.css | ⬜ pending |
| 10-04-01 | 04 | 2 | TOKEN-04 | automated grep | `grep -rn "bg-green-\|text-red-\|..." TableTile.tsx KdsTicketCard.tsx AppSidebar.tsx` | ✅ all 3 files | ⬜ pending |
| 10-04-02 | 04 | 2 | TOKEN-04 | build | `npm run build` | ✅ all 3 files | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- None — existing infrastructure covers all phase requirements. Build check (`npm run build`) and grep audit are the appropriate validation bar for this CSS-and-string-replace phase.

*No Wave 0 needed: no test stubs, no framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crimson primary reads as visibly bolder | TOKEN-01 | Color perception requires human judgment | Toggle light/dark — primary buttons should look noticeably richer/bolder than before |
| Occupied status visually distinct from primary crimson | TOKEN-02 | Visual distinctness can't be grepped | On floor map, compare Occupied tile border vs a primary CTA button — must be clearly different hue |
| Five status states each resolve to distinct color | TOKEN-02 | Visual verification needed | Open floor map with all 5 statuses visible — each should have a unique, semantically appropriate color |
| Three elevation tiers feel depth-differentiated | TOKEN-03 | Subtle shadows require human perception | Cards (flat), panels (raised), modals (floating) should have perceptible but not harsh depth difference |
| Dark mode glow/border on shadows | TOKEN-03 | Dark mode appearance needs visual check | Toggle dark mode — shadow tokens should show subtle inner border or glow, not traditional drop shadows |
| No `var()` remains unresolved | All tokens | DevTools required | Open browser DevTools → Computed tab → check `--color-status-*`, `--shadow-*`, `--primary` — no unresolved `var()` strings |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
