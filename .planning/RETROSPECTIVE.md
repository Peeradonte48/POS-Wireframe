# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Staff App Wireframe

**Shipped:** 2026-03-11
**Phases:** 7 | **Plans:** 28 | **Timeline:** 2 days

### What Was Built
- Full staff authentication — PIN login, role routing (4 roles), shift open with branch selection
- Digital floor plan — 12-table map with live dwell timers, status state machine, waiter assignment
- 3-column order entry — category sidebar + Unsplash photo grid + ticket panel with ramen modifier sheet
- Full-screen KDS — bump/recall flow, elapsed timers, allergy flags, demo mode auto-injection
- Payment flow — itemized bill with VAT, coupon, 3 payment methods, receipt state, table lifecycle wiring
- Manager layer — EOD summary, sales snapshot, 86'd item toggle, cross-table open tickets view
- Hi-Fi brand polish — A Ramen OKLCH tokens, Solar icon migration, dark mode, role gating, Sonner toasts, 44px touch targets

### What Worked
- **GSD wave-based execution** — parallel plan execution made multi-plan phases feel fast; each wave completed independently
- **Verification agents** — the verifier caught a real regression (stepper buttons 32px, below 44px minimum) that human review would have missed without explicit measurement
- **3-source cross-reference in audit** — VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md traceability caught gaps in documentation completeness
- **Role-gated UI with canDoAction()** — shipping 10 role-gated actions via a single `ACTION_PERMISSIONS` map made the policy explicit and auditable
- **OKLCH color tokens** — defining brand as named OKLCH variables made dark mode and color variants trivial

### What Was Inefficient
- **Unsplash photo ID verification** — had to curl-test all 12 IDs after discovering 5 invalid ones; should verify IDs at the data fixture stage before committing
- **SUMMARY frontmatter completeness** — phases 4, 5, 6 had incomplete `requirements-completed` arrays, requiring manual cross-reference during audit; the gsd-executor should enforce this
- **No AppShell-level `<Toaster>`** — mounting Toaster per-page meant 4 pages silently dropped toasts; a global mount in AppShell would have been obvious
- **Phase 2 missing VERIFICATION.md** — execution completed without creating the phase-level artifact; the gsd-verifier should run automatically after each phase's last plan

### Patterns Established
- **3-column POS layout** — category sidebar (w-32/44) + menu grid (flex-1) + ticket panel (w-56/80) is the right structure for tablet-first POS
- **OKLCH brand tokens** — `--primary: oklch(0.52 0.22 27)` pattern with full brand family in `:root` + dark mode overrides in `.dark`
- **Solar icon import pattern** — `import { IconNameLinear } from 'solar-icon-set'` with style suffix in name (not iconStyle prop)
- **44px touch target patterns** — `min-h-[44px] min-w-[44px]` for standalone buttons; `-m-2 p-2` for small inline buttons; `label` wrapper with `-m-3 p-3` for checkboxes
- **Zustand persist for route groups** — `(app)` and `(kds)` route groups destroy React tree on navigation; `persist` middleware with localStorage is required for state to survive
- **Blur-update pattern** — local controlled input + `onBlur` writes to Zustand store (not `onChange`) prevents reactive cascade on every keystroke

### Key Lessons
1. **Verify CDN asset IDs before committing** — test Unsplash photo IDs with curl before adding to fixtures; a 404 image is invisible in code review but obvious in the browser
2. **Mount `<Toaster>` globally** — put it in the closest layout component that wraps all pages; per-page mounting is fragile and silently fails
3. **Route guards need role whitelist, not blacklist** — KDS page guard blocked Manager because it checked `=== 'Kitchen'` rather than `!== ['Kitchen', 'Manager']`; whitelists are safer
4. **VERIFICATION.md is mandatory per phase** — the audit artifact should be created as part of every phase's final plan, not optionally; a phase without it cannot be formally audited
5. **`requirements-completed` frontmatter should be exhaustive** — the gsd-executor should require listing ALL requirements satisfied, not just the ones the plan explicitly targeted

### Cost Observations
- Model mix: ~80% sonnet, ~20% haiku (research/explore agents)
- Sessions: 3 (initialization + execution + polish + audit/complete)
- Notable: 7 phases shipped in 2 calendar days; GSD parallelism was the primary accelerant

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Learning |
|-----------|----------|--------|--------------|
| v1.0 | 2 days | 7 | GSD wave execution + verification agents; touch target regression caught by verifier |

### Top Lessons (Verified Across Milestones)

1. Trust the verifier — it catches regressions that human review misses without explicit measurement criteria
2. Documentation completeness matters — incomplete SUMMARY frontmatter creates audit debt that requires manual reconstruction
