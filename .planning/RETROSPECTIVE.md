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

## Milestone: v1.1 — Bug Fixes + Brand Polish

**Shipped:** 2026-03-12
**Phases:** 4 | **Plans:** 13 | **Timeline:** 2 days

### What Was Built
- 5 bug fixes — /orders 404, Manager KDS access, global toasts, void-post-send permissions, manager route guard
- 5 flow alignment features — guest count capture, served-at tracking, camera coupon scan, dynamic QR payment, CRM loyalty receipt
- OKLCH brand token refresh — crimson chroma 0.26, 10 semantic status tokens (5 table states x fg+bg), 3-tier elevation shadow system
- Component polish — CTA buttons with press scale + glow, filled status pill badges, hero price readouts, caps utility labels, elevation hierarchy

### What Worked
- **Bug-first sequencing** — shipping all 5 bug fixes before any CSS changes (Phase 8 before 10/11) prevented conflation of bug regressions with visual changes
- **Token-first design system** — defining all tokens in Phase 10 before consuming them in Phase 11 meant zero rework; the component polish phase was purely application, not definition
- **Forced-entry pattern (useState<number|''>)** — empty string sentinel for guest count worked cleanly; disabled confirm until valid input is natural UX
- **Camera scan UX** — simulated camera sheet with auto-close timer gave stakeholders a realistic interaction flow without actual camera hardware

### What Was Inefficient
- **COMP-03 left unchecked in REQUIREMENTS.md** — 11-03-SUMMARY confirmed completion but the traceability table wasn't updated; milestone completion had to fix this manually
- **Roadmap progress table drift** — Phase 10 and 11 rows had formatting issues (missing milestone column, wrong plan counts); manual table maintenance is error-prone
- **Visual sign-off checkpoints** — 3 separate human-verify checkpoints across Phase 11 plans created context-switching overhead; a single end-of-phase visual review would be more efficient

### Patterns Established
- **Shadow token consumption** — `style={{ boxShadow: 'var(--shadow-*)' }}` inline prop pattern for multi-value CSS strings incompatible with Tailwind v4 @theme inline
- **@utility caps** — single-source section label utility via `@apply` in globals.css; replaces 13+ inline caps pattern duplications
- **Semantic status tokens** — `--color-status-{state}-{fg|bg}` naming for all 5 table states; independently tuned for dark mode (not opacity-reduced)
- **ThemedToaster wrapper** — thin 'use client' component enabling useTheme in server layout tree; mount once per route group layout

### Key Lessons
1. **Update traceability table atomically with SUMMARY** — when a plan marks a requirement complete, the REQUIREMENTS.md traceability row should be updated in the same commit
2. **Collapse human-verify to phase level** — individual plan checkpoints create overhead; a single visual sign-off after the last plan in a phase is more efficient
3. **Token definition before token consumption** — the Phase 10→11 dependency worked perfectly; this pattern should be repeated for any design system changes
4. **Bug fixes before polish** — Phase 8→10/11 ordering prevented debugging visual regressions vs functional bugs; maintain this sequencing in future milestones

### Cost Observations
- Model mix: ~70% sonnet, ~20% opus (planning/verification), ~10% haiku (explore agents)
- Sessions: 4 (bugs → flow alignment → tokens → component polish)
- Notable: 13 plans across 4 phases shipped in 2 days; token-first approach eliminated rework

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Learning |
|-----------|----------|--------|--------------|
| v1.0 | 2 days | 7 | GSD wave execution + verification agents; touch target regression caught by verifier |
| v1.1 | 2 days | 4 | Bug-first sequencing + token-first design system; traceability table drift caught at milestone completion |

### Top Lessons (Verified Across Milestones)

1. Trust the verifier — it catches regressions that human review misses without explicit measurement criteria
2. Documentation completeness matters — incomplete SUMMARY frontmatter creates audit debt that requires manual reconstruction
3. Sequence dependencies deliberately — bug fixes before polish (v1.1), token definitions before consumption (v1.1); prevents debugging regressions across concerns
4. Update traceability atomically — both v1.0 and v1.1 had documentation drift that required manual correction at milestone completion
