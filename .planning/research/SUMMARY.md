# Project Research Summary

**Project:** A Ramen POS Wireframe — v1.1 Brand Polish + Bug Fixes
**Domain:** Restaurant POS UI — dark-mode brand refresh on existing Next.js 16 + Tailwind CSS 4 + shadcn/ui stack
**Researched:** 2026-03-11
**Confidence:** HIGH

---

## Executive Summary

This is a focused polish milestone on a feature-complete wireframe — not a greenfield build. The v1.0 stack (Next.js 16, Tailwind CSS 4, shadcn/ui, @base-ui/react, Zustand 5, OKLCH tokens, Sonner) is locked and working. v1.1 has two parallel goals: fix five known bugs that limit functionality correctness, then apply a "bold and energetic" brand polish across four component categories (buttons, status badges, cards/panels, typography). No new dependencies are required for either goal — all capability exists in the installed stack.

The recommended approach is strictly sequential: bugs first, tokens second, component polish third. Architecture research confirms that three of the five bugs have downstream effects on polish validation — the Toaster must be in AppShell before any toast feedback can be tested during polish; the role guards must be corrected before managers can navigate to the screens under review. Bug fixes are isolated one-to-two-file changes with zero visual side effects, making them safe to land atomically before touching any CSS. The brand polish then operates through two controlled surfaces: `globals.css` (token layer) and the CVA variant maps in `src/components/ui/` (component layer). Changes in those surfaces cascade predictably across all routes.

The key risk is the Tailwind CSS 4 `@theme inline` trap: if any token edit writes literal OKLCH values into `@theme inline` instead of `var()` references, the dark mode variable chain silently breaks and only the light-mode state updates. A second systemic risk is hardcoded Tailwind palette classes scattered across `TableTile.tsx`, `KdsTicketCard.tsx`, and `AppSidebar.tsx` — these bypass the token system entirely and will look wrong in dark mode after the brand refresh. Both risks must be addressed in Phase 2 (Token Refresh) before component-level polish begins.

---

## Key Findings

### Recommended Stack

The v1.1 stack requires zero new packages. All capability exists in the installed dependency tree. The work is technique-based, not dependency-based.

**Core technologies:**
- **Tailwind CSS 4 `@theme` block**: register new brand color tokens and custom `@keyframes` — the only mechanism that auto-generates `animate-*` and `bg-*` utilities from inline definitions
- **Tailwind CSS 4 `@theme inline` block**: maps CSS custom properties to Tailwind utility space — must always reference `var(--token)`, never literal OKLCH values; this is the single most dangerous edit surface for v1.1
- **CSS Relative Color Syntax `oklch(from var(--x) l c h)`**: derive hover/active/muted states from a single base token; zero bundle cost, 92%+ browser support; eliminates manual hover token proliferation
- **CVA `cva()` variant extension**: add new button and badge variants by editing the `cva()` call directly in the component file; never create wrapper components
- **`cn()` with `tailwind-merge`**: class conflict resolution at call sites; critical when passing `className` overrides to CVA components — last class wins per CSS property group
- **`tw-animate-css` `animate-in` / `animate-out`**: already installed; compose with `fade-in zoom-in-95 duration-150` for snappy POS micro-interactions; do not use for button press feedback
- **`active:scale-[0.97]` Tailwind utility**: preferred over keyframe animations for button press feedback; must resolve under 80ms to feel tactile on a tablet POS

**Critical constraint:** Do not create `tailwind.config.js` — this project is Tailwind 4 CSS-first; all config lives in `globals.css`.

### Expected Features

**Must have — table stakes (v1.1 launch):**
- Primary CTA button: `h-11` (44px minimum), crimson glow/shadow in dark mode, `active:scale-[0.97]` pressed feedback — currently `h-8` (32px) which fails touch target spec
- Destructive (void) button: filled treatment (`bg-destructive text-white`); current 10% opacity fill is unreadable as a void action
- TableTile status badges: filled pill chips with five semantic colors (green/crimson/blue/amber/gray) replacing the `border-l-4` stripe approach — essential for floor-plan scan speed under restaurant lighting
- KDS BUMP button: migrated to consistent Button component, full-width, 44px, `active:scale` feedback
- Section header caps pattern: `text-[10px] font-bold tracking-widest uppercase text-muted-foreground` applied consistently across all screens (currently only in TicketPanel)
- Price readouts (`฿XXXX`): promoted to `text-2xl font-black text-primary` in ticket footer and payment summary

**Should have — competitive differentiators (v1.1 or v1.1.x):**
- Nav sidebar: active state refined to indicator-line pattern (`border-l-2 border-primary bg-primary/10 text-primary`)
- Spice selector: color graduation green (L1) → amber (L3) → crimson (L5) across five levels
- Card elevation: 3-tier system (flat / raised / floating via background lightness steps, not drop shadows) audited and applied across all info panels
- MenuPanel cards: consistent hover state (`hover:border-primary/40 hover:shadow-sm`) and `active:scale-[0.97]`

**Defer to v2+:**
- Animated entrance states for KDS tickets (slide-in from right on new order)
- Login screen gradient background (brand moment, low-density view)
- Haptic feedback on bump/send (requires native PWA capabilities)

**Anti-features to avoid explicitly:** gradient on main app shell, continuous glow pulse on CTAs (ambient animation distracts staff mid-service), full crimson fill on all surfaces (destroys hierarchy), heavy drop shadows/neumorphism (inconsistent with flat Solar icon style), more than 3 font weight levels simultaneously on one screen.

### Architecture Approach

The project uses a clean five-layer architecture: route groups for layout isolation (`(auth)` / `(app)` / `(kds)`), a single AppShell for all staff-facing routes, a Zustand store layer for in-memory POS state, a single permissions source (`role-permissions.ts` with typed `ActionKey` union), and `globals.css` as the sole design token source. Brand polish flows through one control surface (`globals.css`) and one component override surface (`src/components/ui/`). This architecture is correct and should not be restructured — the five bugs are local defects, not structural problems.

**Major components:**
1. `globals.css` — single token source; `@theme` for brand values, `@theme inline` for Tailwind utility mapping, `:root`/`.dark` for light/dark semantic values
2. `src/components/ui/button.tsx` and `badge.tsx` — CVA variant maps over `@base-ui/react` primitives; all visual variants live in the `cva()` calls in these files
3. `role-permissions.ts` — single permissions source; `ActionKey` union + `ACTION_PERMISSIONS` record; `canAccess()` and `canDoAction()` are the only permission call points throughout the codebase
4. `AppShell.tsx` — the correct home for `<Toaster>` once Bug 3 is fixed; all `(app)` routes share this single instance
5. Page-level `useEffect` guards — enforce route security beyond what the sidebar (UX-only visibility) provides

**Five confirmed bugs requiring fixes before polish:**
1. AppSidebar `/orders` dead link — route does not exist; fix: create a 3-line redirect page at `src/app/(app)/orders/page.tsx`
2. KDS page guard blocks Manager — `role !== 'Kitchen'` is too restrictive; fix: extend to `!['Kitchen', 'Manager'].includes(role)`
3. Toaster not in AppShell — only mounted in the order page; fix: move to `AppShell.tsx`, add `theme={resolvedTheme}` prop from `useTheme()`
4. Missing `void-post-send` ActionKey — add to `ActionKey` union and `ACTION_PERMISSIONS` with `['Manager']` roles
5. Manager page has no role guard — add `useEffect` guard + early return redirecting non-Manager roles to `/table-map`

### Critical Pitfalls

1. **`@theme inline` literal OKLCH severs dark mode chain** — always use `var(--token)` in `@theme inline`; write actual OKLCH values only in `:root` and `.dark`. Verify by inspecting computed `--color-primary` in DevTools after every token change — it must resolve to a color, not show as an unresolved `var()` string.

2. **OKLCH chroma exceeds sRGB gamut silently** — the current `--primary` at chroma 0.22 is near the sRGB ceiling for hue 27 at L=0.52. Pushing to 0.25+ clips on non-P3 displays. Stakeholder review machines are Windows/sRGB. Verify every new token at oklch.com before committing.

3. **Hardcoded Tailwind palette classes are dark-mode blind** — `text-green-600`, `bg-amber-50`, `border-l-green-500`, `bg-green-600` are scattered across `TableTile.tsx`, `KdsTicketCard.tsx`, and `AppSidebar.tsx`. These do not adapt to dark mode. Audit and catalogue before polish begins; decide on either `dark:` variants or semantic tokens per semantic color concept.

4. **CVA base class additions silently override call-site `className` props** — `tailwind-merge` picks last-wins per CSS property group. Adding `font-bold` to a CVA base silently overrides a call site that passes `font-semibold`. After every CVA base change, grep all call sites for conflicting utilities on the same CSS property.

5. **Sonner `<Toaster>` defaults to light regardless of app theme** — pass `theme={resolvedTheme}` from `useTheme()` (next-themes). Verify immediately after mounting by toggling dark mode and firing a toast. `theme="system"` is wrong here — it reads OS preference, not the app toggle state.

6. **Global `--radius` or `--font-sans` changes blast all 30+ components simultaneously** — never change `--radius` globally for a targeted radius change; edit the specific component's CVA base string instead. Never replace `--font-sans` with a display font — it breaks Thai/Japanese script fallback (Noto Sans Thai/JP).

7. **`leading-tight` globally clips Thai tonal marks and Japanese characters** — apply tight leading only to confirmed Latin-only elements (price fields, section counters). Test any leading change by rendering an actual Thai menu item name before committing.

---

## Implications for Roadmap

Based on combined research, three phases are strongly indicated with a strict sequential dependency enforced by the architecture findings.

### Phase 1: Bug Fixes

**Rationale:** Architecture research establishes a clear build-order constraint: Toaster must be in AppShell before polish feedback is testable on all pages; role guards must be correct before managers can review polished screens; `void-post-send` ActionKey must exist before any component can call `canDoAction()` against it. All five bugs are isolated, zero-visual-impact changes — landing them atomically before any CSS changes eliminates the risk of conflating visual regressions with bug fixes.

**Delivers:** A functionally correct navigation and permissions baseline. Dead links resolved, all roles able to reach their authorized screens, toast feedback active on all routes, Sonner correctly themed for dark mode from the first moment.

**Addresses:** AppSidebar `/orders` dead link (Bug 1), KDS guard over-restriction (Bug 2), Toaster placement and dark-mode theming (Bug 3), `void-post-send` ActionKey gap (Bug 4), Manager page missing guard (Bug 5).

**Avoids:** Sonner light-mode-only pitfall (Pitfall 5), Toaster-per-page anti-pattern (ARCHITECTURE Anti-Pattern 4), sidebar-only security anti-pattern (ARCHITECTURE Anti-Pattern 3).

**Files touched:** 6 files maximum, all small diffs, zero CSS changes.

---

### Phase 2: Token Refresh

**Rationale:** Token changes in `globals.css` cascade to the entire UI simultaneously — this is the highest-leverage phase of the polish. Strengthening `--primary` chroma and verifying the `@theme inline` chain before touching any component file means all downstream component work in Phase 3 happens against the correct brand surface. The hardcoded palette class audit must also happen here so Phase 3 component work can introduce proper semantic badge colors without collision with raw palette values already in the files.

**Delivers:** A stronger brand-red primary throughout all routes (chroma tuned and verified against sRGB gamut), verified dark-mode variable chain integrity, `@theme inline` confirmed to use only `var()` references, hardcoded palette usage catalogued across `TableTile.tsx`, `KdsTicketCard.tsx`, `AppSidebar.tsx` with a fix plan ready for Phase 3.

**Addresses:** OKLCH chroma tuning (`0.22` toward `0.26` — gamut-checked), `@theme inline` audit, hardcoded palette audit, dark-mode token pair completeness check (every `:root` token must have a `.dark` counterpart).

**Avoids:** `@theme inline` dark mode break (Pitfall 1), sRGB gamut exceedance (Pitfall 2), hardcoded palette dark-mode failures discovered mid-Phase 3 (Pitfall 3), global radius blast (Pitfall 6).

**Files touched:** `globals.css` primarily; audit output generates a fix checklist consumed by Phase 3.

---

### Phase 3: Component Polish

**Rationale:** With bugs fixed and tokens verified, component-level CVA edits are safe and predictable. This phase applies the six P1 feature changes first (button sizing/glow/press, badge pills, BUMP button, caps labels, price hero, destructive fill), verifies them across all 8 route paths, then applies P2 enhancements (sidebar indicator line, spice selector graduation, card elevation tiers). Typography work comes last — zero component dependencies, lowest risk, high perceived polish impact.

**Delivers:** The "bold and energetic" brand expression across all POS screens. Staff-facing interaction quality improvements: 44px touch targets on all primary actions, tactile `active:scale` press feedback on all interactive elements, readable semantic status colors in dark mode, consistent typographic hierarchy with the caps utility pattern.

**Implements (P1 — must have):** CVA variant additions to `button.tsx` (44px primary sizing, crimson glow in dark mode, `active:scale-[0.97]`), filled `destructive` variant, `badge.tsx` status variants (occupied/reserved/check-requested/cleaning/open), TableTile refactor from `border-l-4` to badge pill chips, KDS BUMP button migration to Button component, `label-caps` utility in `@layer base`, price readout class promotions.

**Implements (P2 — should have):** Sidebar active indicator-line pattern, spice selector color graduation, card elevation 3-tier system audit and application, MenuPanel card hover/active states.

**Avoids:** CVA base class call-site conflicts (Pitfall 4 — grep all call sites after every base change), touch target regression after height changes, Thai/JP line-height clipping (Pitfall 7), template literal class construction for dynamic status colors (fails Tailwind JIT), multiple Toaster instances, inline role arrays in components.

**Files touched:** `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/table-map/TableTile.tsx`, `src/components/kds/KdsTicketCard.tsx`, `src/app/globals.css` (@layer base additions), individual screen components for price and label class updates.

---

### Phase Ordering Rationale

- Bugs before tokens: Toaster dark-mode verification (required during token phase to confirm Sonner respects the dark class) depends on Bug 3 being resolved and the `theme={resolvedTheme}` prop being in place first.
- Tokens before components: Strengthening `--primary` chroma changes button and badge appearance. If component polish is applied first against the weaker token, the visual baseline shifts under completed work and requires re-review.
- P1 component changes before P2: The card elevation tier audit references `border-primary/40` — which depends on the correct primary token being confirmed in Phase 2 and the button primary variant being finalized in P1 of Phase 3.
- Typography last within Phase 3: Zero component dependencies, no risk of breaking other Phase 3 work, produces visible improvement with minimal code surface.

### Research Flags

Phases with well-documented patterns — skip research-phase:
- **Phase 1 (Bug Fixes):** All five bugs are fully documented with exact file paths, line numbers, and fix approaches in ARCHITECTURE.md. Standard patterns (redirect page, role array extension, Toaster mount). No additional research needed.
- **Phase 2 (Token Refresh):** OKLCH token technique and `@theme inline` mechanics are fully covered in STACK.md with official Tailwind 4 source backing. Use oklch.com for gamut verification.

Phases that benefit from a pre-phase file read (not full research-phase):
- **Phase 3 (Component Polish):** The `STATUS_CONFIG` structure in `TableTile.tsx` drives badge rendering via full class-name constants. Before designing the badge pill chip refactor, read `TableTile.tsx` to confirm the existing config map shape so new badge variant names can be slotted in without breaking the full-class-name constant rule (template literal construction fails Tailwind JIT). A 5-minute read replaces a full research phase.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages; all techniques verified against installed source files and official Tailwind 4 docs |
| Features | HIGH | Grounded in direct codebase audit + competitor POS UI pattern analysis; feature gaps are visible in the source and measurable against design benchmarks |
| Architecture | HIGH | All five bugs verified by direct file inspection with exact line numbers; no architectural assumptions made — all claims traceable to a specific file |
| Pitfalls | HIGH | Most pitfalls derived from direct source code read + official docs and GitHub discussions; not speculative or based on single sources |

**Overall confidence:** HIGH

### Gaps to Address

- **`STATUS_CONFIG` shape in `TableTile.tsx`:** ARCHITECTURE.md references this file but does not document the exact data structure of the config object. Before writing the badge pill refactor implementation plan, read the file to confirm existing key names and how they map to badge variant strings. 5-minute read, not a research gap.
- **WCAG contrast for boosted `--primary` chroma:** Research recommends increasing chroma from 0.22 toward 0.26 but notes L ≥ 0.48 is required for WCAG AA with white foreground. The exact safe chroma ceiling depends on the chosen lightness value. Verify the final chosen value with a contrast checker (oklch.com or Chrome DevTools accessibility panel) before locking the token in Phase 2.
- **KDS `(kds)/layout.tsx` Toaster need:** Architecture research flags that KDS may need its own `<Toaster>` in `(kds)/layout.tsx` if kitchen staff need toast feedback. This is not confirmed as a v1.1 requirement — flag for product decision during Phase 1 planning before the AppShell Toaster fix is finalized.

---

## Sources

### Primary (HIGH confidence)
- `src/app/globals.css` — Tailwind CSS 4 token structure, existing OKLCH values, `@theme` / `@theme inline` / `:root` / `.dark` pattern confirmed by direct read
- `src/components/ui/button.tsx`, `badge.tsx` — CVA + @base-ui/react pattern confirmed
- `src/components/app-shell/AppShell.tsx`, `AppSidebar.tsx` — Bug 1 and Bug 3 confirmed
- `src/app/(kds)/kds/page.tsx` — Bug 2 exact lines confirmed
- `src/lib/role-permissions.ts` — Bug 4 missing ActionKey confirmed
- `src/app/(app)/manager/page.tsx` — Bug 5 missing guard confirmed
- `package.json` — full dependency inventory (Next.js 16.1.6, @base-ui/react 1.2.0, sonner 2.0.7, Tailwind CSS 4, Zustand 5.0.11)
- [Tailwind CSS v4 Theme docs](https://tailwindcss.com/docs/theme) — `@theme`, `@theme inline` behavior confirmed
- [Tailwind CSS v4 release blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first architecture
- [Tailwind CSS Dark Mode docs](https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark` behavior
- [Sonner Toaster docs](https://sonner.emilkowal.ski/toaster) — `theme` prop requirement confirmed
- [MDN oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch) — Baseline 2023, 92%+ browser support
- GitHub discussions: Tailwind CSS v4 `@theme inline` vs `@theme` semantics (#18560, #15083, #17810)

### Secondary (MEDIUM confidence)
- [Evil Martians: OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) — chroma ceiling for red hues (~0.23 at L=0.52 for sRGB), perceptual uniformity rationale
- [Chrome for Developers: CSS relative color syntax](https://developer.chrome.com/blog/css-relative-color-syntax) — `oklch(from var(--x) l c h)` pattern and browser support
- [Vercel Academy: Extending shadcn/ui](https://vercel.com/academy/shadcn-ui/extending-shadcn-ui-with-custom-components) — CVA extension patterns
- Toast POS, Square for Restaurants, Lightspeed Restaurant UI patterns — competitor button sizing (44-52px), badge design (colored tiles/chips), dark mode surface depth (2-3 levels); industry knowledge through mid-2025
- [LogRocket: CTA Button Design](https://blog.logrocket.com/ux-design/cta-button-design-best-practices/) — 44px touch target mandate corroboration
- [Sonner styling docs](https://sonner.emilkowal.ski/styling) — portal mounting behavior
- [next-themes repository](https://github.com/pacocoursey/next-themes) — `suppressHydrationWarning` requirement, `resolvedTheme` vs `theme` behavior
- [shadcn/ui Tailwind v4 integration](https://ui.shadcn.com/docs/tailwind-v4) — component token structure

### Tertiary (LOW confidence — directional guidance only)
- Dark Mode UX 2025/2026 articles — general dark mode best practices for surface depth and contrast; validated against actual codebase token structure before inclusion in findings

---

*Research completed: 2026-03-11*
*Ready for roadmap: yes*
