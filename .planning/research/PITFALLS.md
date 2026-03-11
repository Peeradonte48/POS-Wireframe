# Pitfalls Research

**Domain:** Brand polish pass on existing Tailwind CSS 4 + shadcn/ui + Base UI app (v1.1 milestone)
**Researched:** 2026-03-11
**Confidence:** HIGH (codebase read directly; findings verified against official Tailwind 4 docs, GitHub discussions, and Sonner docs)

---

## Critical Pitfalls

### Pitfall 1: Mutating `@theme inline` Tokens Breaks the Dark Mode Variable Chain

**What goes wrong:**
`globals.css` uses a two-layer pattern: raw OKLCH values live in `:root` / `.dark` as CSS custom properties (e.g. `--primary: oklch(0.52 0.22 27)`), and `@theme inline` maps them to Tailwind color tokens (`--color-primary: var(--primary)`). If a brand-polish change writes literal OKLCH values directly into `@theme inline` instead of keeping them as `var(--*)` references, the runtime dark-mode override on `.dark` no longer reaches the generated utilities. The crimson updates in light mode; dark mode keeps the old value because the `var()` chain is severed.

**Why it happens:**
Developers copy an OKLCH value from a color picker and paste it directly into `@theme inline` for convenience. In Tailwind 4, `@theme inline` generates utilities that resolve at build time — not at CSS variable runtime. The `:root` / `.dark` swap only works when the utility references a CSS custom property via `var()`.

**How to avoid:**
Never write literal OKLCH values in `@theme inline`. Change brand values only in `:root` and `.dark` blocks. The `@theme inline` section must always say `--color-primary: var(--primary)` — not `--color-primary: oklch(0.52 0.22 27)`. After every token change, toggle dark mode in the browser and confirm the color changes.

**Warning signs:**
- Primary buttons look correct in light mode but use the wrong shade in dark mode.
- Toggling the theme switch shows no color change on primary-colored elements.
- DevTools computed value for `--color-primary` shows a literal OKLCH string rather than a resolved variable reference.

**Phase to address:** Phase 1 (Token Refresh) — establish the rule before touching any value.

---

### Pitfall 2: OKLCH Chroma Exceeds sRGB Gamut, Causing Silent Browser Clipping

**What goes wrong:**
The existing `--primary` is `oklch(0.52 0.22 27)` — chroma 0.22 is near the sRGB gamut boundary for red hues (approximately 0.22–0.23 at L=0.52). Pushing "bolder" by raising chroma to 0.25+ produces an out-of-gamut color on non-P3 displays. Browsers silently clip it to the nearest in-gamut sRGB equivalent, which may differ in hue and saturation from the intended value. The design looks one way in a P3-capable browser (Safari on M-series Mac) and differently on the stakeholder's Windows machine — the exact device used for final sign-off.

**Why it happens:**
OKLCH's gamut is not a uniform shape. The chroma ceiling for red (hue ~27) at L=0.52 is ~0.23 in sRGB. Design tools that display OKLCH values may not warn about gamut exceedance. Designers push chroma for vibrancy without a gamut check.

**How to avoid:**
Use the OKLCH gamut-check tool at oklch.com to plot all new token values before committing. The point must fall inside the sRGB gamut triangle. For dark-mode primary `oklch(0.63 0.22 27)`, verify the higher L value does not push chroma past the sRGB ceiling at that lightness. Safe rule: if changing chroma, verify on oklch.com; do not rely on a wide-gamut monitor to catch this.

**Warning signs:**
- A color looks vivid in Chrome/Safari on Mac but washed-out or hue-shifted on Windows Chrome.
- DevTools shows the browser's computed `color` value differs from the declared OKLCH literal.
- The plotted point on oklch.com's sRGB triangle sits outside or on the boundary.

**Phase to address:** Phase 1 (Token Refresh) — verify every new token against sRGB gamut before applying.

---

### Pitfall 3: Hardcoded Tailwind Palette Classes Bypass the Token System and Are Dark-Mode Blind

**What goes wrong:**
Status color logic in `TableTile.tsx`, timer urgency logic in `KdsTicketCard.tsx`, and the shift-open lock banner in `AppSidebar.tsx` all use hardcoded Tailwind palette classes: `border-l-green-500`, `text-red-600`, `bg-amber-50`, `bg-green-600`, `text-amber-700`. These classes are not connected to any CSS custom property. When the brand token values change, or when dark mode is active, these palette classes do not adapt. The KDS BUMP button (`bg-green-600 ring-2 ring-green-400`) becomes visually jarring against a refined dark card surface. The sidebar lock banner (`bg-amber-50 border-amber-200`) becomes nearly invisible in dark mode because `amber-50` is almost white.

**Why it happens:**
Status indicators are added with semantic intent ("green = available") using raw palette because there is no `--color-status-open` token. This is fast and works well in light-mode-only development. The problem only surfaces when dark mode is tested or when a brand pass introduces new surface colors that create contrast clashes.

**How to avoid:**
Before the brand polish pass, grep `src/` for raw Tailwind palette classes that carry semantic meaning. Decide on one of two approaches: (a) introduce `--color-status-*` semantic tokens in `:root` / `.dark` and map through `@theme inline` — more scalable but requires touching `globals.css`; or (b) add `dark:` variants explicitly to each hardcoded class — faster for a wireframe. Either approach must be applied consistently across all instances of each semantic color. Do not mix (a) and (b) for the same semantic concept.

**Warning signs:**
- Status badges and BUMP button look dramatically different brightness between light and dark mode.
- Brand audit in dark mode reveals green/amber elements that appear neon or nearly invisible against the refined palette.
- `grep -r "text-green-\|bg-amber-\|border-l-red-\|bg-green-" src/` returns more than 5 files.

**Phase to address:** Phase 1 (Token Refresh) — audit and catalogue all hardcoded palette usage. Phase 2 (Component Polish) — fix during component redesign.

---

### Pitfall 4: CVA Base Class Additions During Polish Silently Override Call-Site `className` Props

**What goes wrong:**
Button and Badge are CVA-based components using `cn(buttonVariants({ variant, size, className }))`. `tailwind-merge` resolves conflicts by keeping the last class controlling each CSS property. When `TicketPanel.tsx` passes `className="h-11 px-5"` on `<Button>`, this correctly overrides the variant's `h-8`. However, if the brand polish pass adds `font-bold` to the CVA base string while the call site passes `font-semibold`, `tailwind-merge` picks `font-bold` (last wins by property group) and silently drops the caller's intent. This is invisible at the TypeScript level and only manifests as a visual regression that is easy to miss in review.

**Why it happens:**
Adding a new utility class to a shared CVA base feels like a safe system-wide change. Developers do not think to check all call sites for conflicting props on the same CSS property because the component still compiles and renders.

**How to avoid:**
When adding any class to a CVA base string during polish, grep all call sites of that component for `className` props containing utilities in the same CSS property group (font weight, height, padding, color, border). If a conflict exists, use a CVA variant instead of a base class modification. Example: add a `weight` variant (`bold: "font-bold"`) rather than hardcoding `font-bold` in the base.

**Warning signs:**
- Removing a `className` prop from a call site makes no visual difference — the prop was silently overridden.
- A new CVA base class looks correct in isolation but overrides existing call-site intent on specific screens.
- Grepping call sites after a CVA base change reveals the same CSS property appearing in both the base and a `className` prop.

**Phase to address:** Phase 2 (Component Polish) — every CVA base change must be accompanied by a grep of all call sites.

---

### Pitfall 5: Sonner `<Toaster>` Does Not Inherit Dark Mode from the `html.dark` Class Without Explicit Configuration

**What goes wrong:**
The v1.1 goal is to mount `<Toaster>` in `AppShell`. Sonner's `<Toaster>` has its own `theme` prop (`"light" | "dark" | "system"`). Without this prop it defaults to `"light"`, rendering toasts with a white background even when the rest of the app is in dark mode. Sonner's toast portal is injected at the document body level and may appear outside the `.dark` ancestor scope that `@custom-variant dark (&:where(.dark, .dark *))` relies on — making the `dark:` utilities in Sonner's built-in styles inactive.

**Why it happens:**
Developers mount `<Toaster />` without reading the next-themes `resolvedTheme` value because the component looks correct during light-mode development. Dark mode is only tested afterward, sometimes never during a wireframe project.

**How to avoid:**
Pass the resolved theme explicitly: `<Toaster theme={resolvedTheme as "light" | "dark" | "system"} />`. Use `useTheme()` from `next-themes` to read `resolvedTheme` in the component that mounts `<Toaster>`. Do not use `theme="system"` — this reads `prefers-color-scheme` from the OS and can desynchronize from the manual toggle in `ThemeToggle`. The explicit `resolvedTheme` pass is the correct approach for a next-themes-controlled dark mode.

**Warning signs:**
- Toasts appear with a white background in dark mode.
- Toggling the theme switch does not change toast appearance without a page reload.
- Sonner's built-in `dark:` classes are present in the rendered DOM but have no effect.

**Phase to address:** Phase 1 (Bug Fixes) — mount `<Toaster>` with the correct `theme` prop from the start. Do not add it as a follow-up.

---

### Pitfall 6: Changing `--radius` or `--font-sans` Globally Changes Every Component Simultaneously

**What goes wrong:**
`@theme inline` maps `--radius-sm` through `--radius-4xl` from the single `--radius: 0.625rem` base using `calc()`. Button sm/xs sizes use `rounded-[min(var(--radius-md),12px)]`. Badge uses `rounded-4xl`. KDS cards use `rounded-lg`. Dialog and Select use derived radius tokens in their shadcn/ui internals. Changing `--radius` from `0.625rem` to `0.75rem` for "punchier" brand expression simultaneously changes the shape of 30+ components across 8 route paths. Similarly, prepending a display typeface to `--font-sans` changes every body text element globally — including the PIN numpad, manager tab labels, and payment receipt text.

**Why it happens:**
Global tokens are powerful precisely because they cascade everywhere. During a brand polish pass, the temptation is to make one global change and see the entire UI update. The problem is "the entire UI" is larger than expected after 5,583 LOC.

**How to avoid:**
For radius changes: Rather than changing `--radius`, add targeted `rounded-*` overrides directly to the specific component's CVA base or via a scoped CSS rule. Only change `--radius` if the intent is a true global radius shift, and budget time to review all 8 route paths. For typography: Introduce a `--font-display` token and apply it only to heading elements that need it. Never replace `--font-sans` with a display typeface — it will break Thai/Japanese script rendering which requires `Noto Sans Thai` / `Noto Sans JP` as font-stack fallbacks.

**Warning signs:**
- After changing `--radius`, Dialogs, Selects, Badges, and KDS cards all change shape together.
- After changing `--font-sans`, all body labels shift appearance including the KDS timer and PIN numpad.
- Thai and Japanese characters (menu item names, table labels) render with incorrect font-stack after a `--font-sans` change.

**Phase to address:** Phase 1 (Token Refresh) — document which tokens are safe for global change vs. which require scoped application before any edits are made.

---

### Pitfall 7: Line-Height Changes Break Thai and Japanese Script Rendering

**What goes wrong:**
The project loads three Google Fonts: Inter, Noto Sans JP, and Noto Sans Thai. Adding `leading-tight` globally to improve visual density — a common brand-polish move — clips Thai descenders and stacks Japanese characters awkwardly. Thai script has tonal marks and vowel symbols that extend significantly above and below the baseline. A `line-height` below 1.5 for Thai text causes visual overlap between lines.

**Why it happens:**
Designers set line-height for Latin text readability, then apply it globally without testing multilingual content. The POS has Thai content throughout (menu item names, table labels, manager notes) that is easy to miss when developing in English.

**How to avoid:**
Never set `leading-tight` or any `line-height < 1.5` globally via `@layer base` or a body rule. Apply tighter leading only to specific elements that are guaranteed to render Latin text only: currency amounts (`text-xl font-bold` price fields), section headers like "New Items" / "Round 1". Test any leading change by rendering an actual Thai-language menu item name and checking for clipping.

**Warning signs:**
- Thai vowel marks (sara, mai, wunagu) visually overlap with the line above after a line-height change.
- Japanese characters appear cramped or overlapping in multi-line contexts.
- The effect is invisible during English-only development and only appears with real menu data.

**Phase to address:** Phase 2 (Typography Hierarchy) — apply leading only to scoped Latin-only elements.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded palette classes for status colors (`text-green-600`, `border-l-red-500`) | Fast semantic clarity | Does not adapt to dark mode; breaks if brand palette shifts; bypasses token system | v1.0 wireframe only; must be resolved before stakeholder dark-mode demo |
| Inline `className` overrides on Button instances (`h-11 px-5`) instead of CVA variants | One-off sizing without touching shared code | Silent merge conflicts when CVA base is later modified | One-off instances; never for patterns repeated 3+ times across the codebase |
| `font-bold` vs `font-semibold` scattered inconsistently across same text roles | Quick visual hierarchy decisions | Typography hierarchy breaks under a global font weight audit; hard to normalize | Never — lock a role-to-weight map during the polish phase |
| `opacity-30` / `opacity-40` for disabled/empty states with no shared token | Rapid implementation | Muted states look different brightness in dark mode depending on the background surface | v1.0 wireframe only; define a shared muted-state pattern during polish |
| `bg-muted/30` on KDS card header as a surface treatment | Avoids over-engineering | Opacity over dark backgrounds produces different effective colors than intended; check contrast | Acceptable for v1.0; verify contrast ratio during dark-mode polish pass |

---

## Integration Gotchas

Common mistakes when connecting the styling system to external components.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sonner `<Toaster>` | Mount without `theme` prop; toasts default to light regardless of app theme | Pass `theme={resolvedTheme}` from `useTheme()` from next-themes; verify by toggling dark mode and firing a toast |
| next-themes `ThemeProvider` | Removing `suppressHydrationWarning` from `<html>` during a layout refactor | `suppressHydrationWarning` is already present in `layout.tsx` and must be retained — next-themes modifies the html element's `class` attribute server-to-client |
| Base UI dialog portals | Assuming portal inherits `.dark` class from ancestor tree automatically | Base UI and Sonner portals mount at the document body level; they inherit `.dark` only if the `<html>` element carries the class, which next-themes (attribute="class") correctly provides — do not move the `ThemeProvider` below the body level |
| Tailwind 4 `@theme inline` | Writing literal OKLCH values instead of `var()` references | Always `var(--token-name)` in `@theme inline`; write actual OKLCH values only in `:root` and `.dark` |
| Solar icons in STATUS_CONFIG | Hardcoding icon `size` as a pixel integer in the config object | Already using `size={12}` / `size={18}` consistently — do not change to dynamic sizing without updating all call sites |

---

## Performance Traps

In a browser wireframe, "performance" during a polish pass means development velocity and review accuracy, not runtime performance.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Changing a global CSS variable and checking all screens by eye only | Missing one screen; stakeholder finds the regression | Enumerate all 8 route paths as a checklist; check each one after every global token change | Every global token change |
| Template literal class construction for conditional styles | Tailwind JIT fails to detect dynamically constructed class names; classes disappear from compiled CSS | `STATUS_CONFIG` in `TableTile.tsx` already uses the correct full-class-name constant map pattern — do not change to template literals during polish | Any time dynamic class string construction is introduced |
| Adding `transition-all` to elements with OKLCH color changes | Janky animation on tablet; transitions trigger on layout properties | Use `transition-colors` for color-only; `transition-transform` for scale; never `transition-all` on interactive POS elements | During fast, repeated tablet interactions |
| Adding `font-bold` or heavier font weights to Google Font declarations without updating the `weight` array in `layout.tsx` | The bold weight silently falls back to the next available weight; the intended visual impact does not appear | When adding a new font weight to a component, verify the weight is declared in the `Noto_Sans_Thai`, `Noto_Sans_JP`, or `Inter` config in `layout.tsx` | Any new font weight reference in the codebase |

---

## UX Pitfalls

Common user experience mistakes during a brand polish pass on a POS interface.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Increasing primary button font size for visual boldness | May break the 44px touch target if height is not also adjusted; text can overflow on short button labels | Increase weight (`font-extrabold`) and letter-spacing (`tracking-wide`) instead of font-size to add character without changing layout |
| Using crimson fill at L < 0.45 for primary button background | White foreground text contrast drops below 4.5:1 — WCAG AA failure on a POS device that must be readable at arm's length under restaurant lighting | Stay at L ≥ 0.48 for primary fill backgrounds; current `oklch(0.52 0.22 27)` is safe; verify any change with a contrast checker |
| Animating status badge transitions between table states | Distracts staff reading the floor map during active service; animated changes create motion noise | Keep status badge updates instant; reserve CSS transitions for user-initiated interactions like button press or sheet open |
| Making destructive (void) buttons more visually prominent during polish | Increases risk of accidental void taps on a touchscreen POS | Destructive actions must be visually distinct but not dominant; use outline/ghost style with destructive color, not filled primary-weight style |
| Applying `leading-tight` globally to improve typographic density | Thai tonal marks and Japanese characters clip or overlap with adjacent lines | Apply tight leading only to confirmed Latin-only contexts: price fields, section counters, Latin-only labels |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in light mode or in isolation but have hidden failures.

- [ ] **Token dark mode pair:** Every new OKLCH token in `:root` must have a corresponding value in `.dark` — the dark-mode value is the one most often forgotten.
- [ ] **Toaster dark mode:** After mounting `<Toaster>`, fire a `toast()` call in dark mode — background must be dark, not white.
- [ ] **Sidebar lock banner:** The shift-not-open banner uses `bg-amber-50 border-amber-200 text-amber-700` with no `dark:` variant — must be checked in dark mode; currently near-invisible against a dark background.
- [ ] **Table status colors in dark mode:** `text-green-600`, `text-red-600`, `text-blue-600`, `text-amber-600` in `TableTile.tsx` — check contrast against the dark card background for each status.
- [ ] **KDS BUMP button in dark mode:** `bg-green-600 ring-2 ring-green-400` in `KdsTicketCard.tsx` — check whether the green ring appears garish against a refined dark card in the new brand.
- [ ] **Touch targets:** After any button height change, measure rendered height in DevTools — all primary CTAs (Send to Kitchen, BUMP, payment confirm) must remain ≥ 44px.
- [ ] **Font weight loading:** After referencing a new font weight, verify it is listed in the `weight` array of the appropriate `next/font/google` config in `layout.tsx`.
- [ ] **Dialog and Select radius:** After any `--radius` token change, open the Manager PIN modal (Dialog) and the Branch selector (Select in ShiftOpen) to confirm shape changes are acceptable.
- [ ] **`@theme inline` chain integrity:** After any token change, open DevTools and inspect the computed `--color-primary` value — it should resolve to an OKLCH color, not show `var(--primary)` as an unresolved string.
- [ ] **Thai/Japanese text rendering:** After any `leading-*` change, render a Thai-language menu item name and confirm no character clipping.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| OKLCH chroma exceeds sRGB gamut | LOW | Open oklch.com, reduce chroma until point is inside the sRGB triangle, update `:root` and `.dark`, re-verify across displays |
| `@theme inline` literal value severs dark mode chain | LOW | Replace literal with `var(--token-name)` in `@theme inline`; confirm corresponding property exists in `.dark`; hard-refresh browser to clear Tailwind dev cache |
| Global `--radius` change reshaped all components unexpectedly | MEDIUM | Revert `--radius` in `globals.css`; apply the targeted radius change directly to the specific component's CVA base string instead |
| Sonner `<Toaster>` renders wrong theme | LOW | Add `theme={resolvedTheme}` prop; use `useTheme()` from next-themes to read `resolvedTheme`; verify by toggling dark mode and firing a toast |
| Hardcoded palette classes fail contrast in dark mode | MEDIUM | Grep all instances; apply `dark:` variants consistently across all matching components; or introduce semantic tokens in `:root` / `.dark` if the same semantic color appears in 5+ places |
| `leading-tight` applied globally clips Thai text | LOW | Remove the global leading rule from `@layer base`; re-apply `leading-tight` only to scoped Latin-only selectors |
| New font weight referenced in a component but missing from `layout.tsx` weight array | LOW | Add the weight string to the corresponding font config object in `layout.tsx`; Next.js will reload with the correct weight |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `@theme inline` literal vs `var()` chain | Phase 1: Token Refresh | DevTools computed value shows resolved color, not an unresolved `var()` string |
| OKLCH gamut exceedance | Phase 1: Token Refresh | All new tokens plotted on oklch.com and confirmed inside sRGB triangle |
| Hardcoded palette classes — audit | Phase 1: Token Refresh | `grep -r "text-green-\|bg-amber-\|border-l-" src/` catalogued and plan decided |
| Hardcoded palette classes — fix | Phase 2: Component Polish | Each hardcoded semantic color has either a `dark:` variant or a semantic token; visual check in dark mode per component |
| CVA base class conflict with call-site props | Phase 2: Component Polish | After each CVA base change, grep call sites; no silent property conflicts |
| Sonner `theme` prop missing | Phase 1: Bug Fixes | Mount Toaster, toggle dark mode, fire toast, verify background color matches theme |
| Global radius blast radius | Phase 1: Token Refresh | After any `--radius` change, open all 8 route paths; screenshot before/after |
| Touch target regression | Phase 2: Component Polish | DevTools measured height ≥ 44px on all primary CTAs after any padding/size change |
| Thai/JP line-height clipping | Phase 2: Typography Hierarchy | Render Thai menu item name after any `leading-` change; confirm no descender clipping |
| Sidebar lock banner dark mode | Phase 2: Component Polish | Open with shift closed, toggle dark mode, verify banner is readable |
| Font weight not loaded | Phase 2: Typography Hierarchy | Check `layout.tsx` `weight` array includes any new weight after referencing it in a component |

---

## Sources

- Tailwind CSS v4 official docs, Theme variables: https://tailwindcss.com/docs/theme
- Tailwind CSS v4 official docs, Dark mode: https://tailwindcss.com/docs/dark-mode
- GitHub Discussion: `@theme` vs `@theme inline` semantics (v4): https://github.com/tailwindlabs/tailwindcss/discussions/18560
- GitHub Discussion: CSS variables for dark/light mode in v4: https://github.com/tailwindlabs/tailwindcss/discussions/15083
- GitHub Issue: Dark mode browser preference override in Tailwind v4: https://github.com/tailwindlabs/tailwindcss/discussions/17810
- Evil Martians: OKLCH in CSS — gamut mapping, sRGB ceiling explanation: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- LogRocket: OKLCH accessibility, consistent palettes, contrast: https://blog.logrocket.com/oklch-css-consistent-accessible-color-palettes
- Sonner styling and theming docs: https://sonner.emilkowal.ski/styling
- Sonner Toaster component docs: https://sonner.emilkowal.ski/toaster
- shadcn/ui Tailwind v4 integration: https://ui.shadcn.com/docs/tailwind-v4
- Vercel Academy — Overriding Tailwind styles in shadcn components: https://vercel.com/academy/shadcn-ui/overriding-styles-with-tailwind
- next-themes repository — suppressHydrationWarning, theme prop behavior: https://github.com/pacocoursey/next-themes
- Paul Serban — 5 Critical shadcn/ui Pitfalls: https://www.paulserban.eu/blog/post/5-critical-shadcnui-pitfalls-that-break-production-apps-and-how-to-avoid-them/
- Codebase direct read: `globals.css`, `button.tsx`, `badge.tsx`, `TableTile.tsx`, `KdsTicketCard.tsx`, `AppSidebar.tsx`, `TicketPanel.tsx`, `AppShell.tsx`, `layout.tsx`, `ThemeProvider.tsx`

---

*Pitfalls research for: brand polish pass on Tailwind CSS 4 + shadcn/ui + Base UI + OKLCH token system*
*Researched: 2026-03-11*
