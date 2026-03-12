# Phase 13: Polish - Research

**Researched:** 2026-03-12
**Domain:** CVA variant extension, CSS design token authoring (OKLCH), Next.js font swap, responsive layout — all within an existing codebase
**Confidence:** HIGH

## Summary

Phase 13 is a pure conformance pass: no new features, no new stores, no new routes. Every change is mechanical — replace raw Tailwind palette classes and bare `<button>` elements in `SplitSheet.tsx` with tokens and CVA variants that already have established authoring patterns in this project. Two new CVA variants must be added in-place (`option-card` on Button, `settled` on Badge), two new CSS token groups must be added to `globals.css` following the exact same OKLCH pattern already used for `--status-split`, and the font import in `layout.tsx` must swap `Inter` for `IBM_Plex_Sans`.

The entire scope is fully audited from source: all violation sites are known, all target patterns are verified in the codebase, and the CONTEXT.md decisions remove all ambiguity. There are no dependencies on external libraries beyond what is already installed.

**Primary recommendation:** Work file-by-file in this order — `globals.css` (tokens first), `badge.tsx`, `button.tsx`, `SplitSheet.tsx`, `layout.tsx`. Each file is an isolated change with no cross-file coordination risk except that `SplitSheet.tsx` consumes the variants added in the prior steps.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Settled Seat Badge**
- Add `--status-settled` and `--status-settled-bg` semantic tokens to `globals.css` (cool green, OKLCH hue ~145), independently tuned for light and dark mode — same pattern as `--status-split`, `--status-occupied`, etc.
- Add `variant='settled'` to the `Badge` CVA in `badge.tsx` — `<Badge variant="settled">Settled</Badge>` component API

**Mode-Select Card Style**
- Add `variant='option-card'` to the `Button` CVA in `button.tsx` — large card-style button with border, `shadow-card` elevation token, hover:border-primary transition
- Include a selected/active state: `aria-pressed` or `data-selected` triggers `border-primary bg-primary/5`
- Apply this variant to the Equal Split / Per Seat selector cards in `SplitSheet`
- This variant is forward-compatible with the merge bill table picker in Phase 14

**Responsive Seat Layout**
- Seat picker buttons (Seat 1, Seat 2…) in per-seat assignment: replace `flex flex-wrap` with a horizontal scroll row (`flex overflow-x-auto gap-2 pb-1 snap-x`) — single row, no reflow regardless of seat count
- SplitSheet panel: keep `max-h-[85vh] overflow-y-auto` — no sticky header needed

**Font Family**
- Replace `Inter` with `IBM Plex Sans` as the primary body font (imported via `next/font/google`)
- Keep `Noto Sans JP` + `Noto Sans Thai` as fallbacks — font stack: IBM Plex Sans → Noto Sans JP → Noto Sans Thai → system-ui
- Single font family only — no condensed variant
- Update `--font-sans` token in `globals.css` to reference `--font-ibm-plex-sans`
- Update `layout.tsx` to import `IBM_Plex_Sans` instead of `Inter`, keeping the same subsets/weights pattern

### Claude's Discretion
- Back buttons in SplitSheet (raw `<button>` elements) → replace with `<Button variant="ghost" size="sm">` for consistent CVA usage
- Section labels using inline `text-sm font-semibold text-muted-foreground uppercase tracking-wide` → replace with the `caps` utility class
- IBM Plex Sans weight config: load 400, 500, 600, 700 weights (covers body, medium, semibold, bold usage)
- OKLCH values for `--status-settled` tokens (target: readable green that contrasts clearly with amber split badge and crimson primary)

### Deferred Ideas (OUT OF SCOPE)
- Merge bill table picker (Phase 14 will use `variant='option-card'` — defined here but consumed there)
- Order tracking timeline styling (Phase 15)
- Sticky header inside SplitSheet — deferred, scrollable sheet is sufficient
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POLISH-01 | Split bill UI, merge bill UI, and order tracking timeline use consistent CVA variants, elevation tokens, and brand styling matching v1.1 quality bar | All violation sites identified (see Violations Audit). CVA extension pattern verified in badge.tsx and button.tsx. OKLCH token pattern verified in globals.css. |
| POLISH-02 | All new screens fit cleanly in AppShell at tablet and mobile breakpoints with no overflow or clipping | Responsive fix is a single `flex-wrap` → `flex overflow-x-auto gap-2 pb-1 snap-x` swap at the seat picker. SplitSheet panel already has `max-h-[85vh] overflow-y-auto` — no other structural changes needed. |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new packages)
| Library | Version | Purpose | Relevant to this phase |
|---------|---------|---------|----------------------|
| class-variance-authority | installed | CVA variant system | Adding `option-card` + `settled` variants in-place |
| next/font/google | Next.js built-in | Google font loading with variable CSS custom properties | Swapping Inter → IBM Plex Sans |
| Tailwind CSS 4 | installed | Utility classes | `@utility caps` already defined; no new utilities needed |
| @base-ui/react | installed | Headless primitives under Badge + Button | No changes to primitive layer |

### No New Packages
This phase installs nothing. IBM Plex Sans is loaded from Google Fonts via `next/font/google` exactly the same as Inter is today.

## Architecture Patterns

### Pattern 1: CVA variant extension in-place
**What:** Add a new key to the `variants.variant` object inside an existing `cva()` call. Never create a wrapper component.

**When to use:** All variant additions in this project — both `badge.tsx` and `button.tsx`.

**Example (Badge — adding `settled`):**
```tsx
// src/components/ui/badge.tsx
// Source: existing badgeVariants in badge.tsx (lines 7-28)
const badgeVariants = cva(
  "group/badge ...",
  {
    variants: {
      variant: {
        default: "...",
        // ...existing variants...
        settled: "bg-status-settled-bg text-status-settled border-status-settled/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
)
```

**Example (Button — adding `option-card`):**
```tsx
// src/components/ui/button.tsx
// Source: existing buttonVariants in button.tsx (lines 8-44)
const buttonVariants = cva(
  "group/button ...",
  {
    variants: {
      variant: {
        // ...existing variants...
        "option-card":
          "h-auto w-full flex-col items-start rounded-xl border-2 border-border bg-background p-4 text-left space-y-1 hover:border-primary transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary/5",
      },
      // size variants unchanged
    },
  }
)
```

### Pattern 2: OKLCH status token authoring
**What:** Each new table/payment state gets two independently-tuned OKLCH values in `:root` and `.dark`. Tokens are also aliased in `@theme inline` so Tailwind can generate utility classes (`bg-status-settled-bg`, `text-status-settled`).

**Three-place edit:** `:root` block, `.dark` block, and `@theme inline` block — all in `globals.css`.

**Example (settled — hue ~145, cool green, distinct from amber split badge at hue ~60):**
```css
/* :root (light mode) */
--status-settled:    oklch(0.48 0.18 145);
--status-settled-bg: oklch(0.94 0.05 145);

/* .dark (independently tuned for dark surfaces) */
--status-settled:    oklch(0.68 0.16 145);
--status-settled-bg: oklch(0.23 0.06 145);
```

```css
/* @theme inline — enables Tailwind utility classes */
--color-status-settled:    var(--status-settled);
--color-status-settled-bg: var(--status-settled-bg);
```

**Reference:** `--status-open` (hue 145) is already in the codebase at the same hue. The `settled` badge color should be a slightly different lightness/chroma to be distinguishable. Current `--status-open` light: `oklch(0.50 0.18 145)` / dark: `oklch(0.70 0.16 145)`. Settled should read as "completion" — recommend slightly higher chroma and/or darker in light mode to differentiate from Open. Suggested values above are `oklch(0.48 0.18 145)` light / `oklch(0.68 0.16 145)` dark — fractionally darker than open.

**Discretion note:** The planner should check that `--status-settled` and `--status-open` are visually distinguishable. If they appear identical, nudge chroma higher on settled (e.g. `0.21 145`) or adjust lightness by ≥0.04.

### Pattern 3: Shadow tokens via inline style
**What:** Elevation shadows MUST use `style={{ boxShadow: 'var(--shadow-*)' }}`, never Tailwind classes. This is a hard project rule — multi-value CSS strings are incompatible with Tailwind v4 `@theme inline`.

**Status in SplitSheet:** Already followed correctly (lines 336, 452, 539, 694). Do not change these.

**The `option-card` Button variant exception:** The `shadow-card` inside the `option-card` variant will need to be applied via inline style at the call site in `SplitSheet`, NOT inside the CVA class string. This is the same constraint as all other shadow usages.

**Alternative:** Include shadow via CVA using `[box-shadow:var(--shadow-card)]` arbitrary property syntax. This is Tailwind v4 compatible and avoids requiring inline style at every call site. Recommend the planner evaluate this and pick one approach consistently.

### Pattern 4: next/font/google swap
**What:** Replace `Inter` import with `IBM_Plex_Sans`. Keep same variable/subset/display pattern. Update class body composition string. Update `@theme inline --font-sans` token.

**Exact current pattern (layout.tsx lines 6-10):**
```tsx
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})
// Used as: className={`${inter.variable} ${notoSansJP.variable} ${notoSansThai.variable} antialiased`}
```

**Target pattern:**
```tsx
import { IBM_Plex_Sans, Noto_Sans_JP, Noto_Sans_Thai } from 'next/font/google'

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
// Used as: className={`${ibmPlexSans.variable} ${notoSansJP.variable} ${notoSansThai.variable} antialiased`}
```

**globals.css `@theme inline` change:**
```css
/* Before */
--font-sans: var(--font-inter), var(--font-noto-jp), system-ui, sans-serif;

/* After */
--font-sans: var(--font-ibm-plex-sans), var(--font-noto-jp), var(--font-noto-thai), system-ui, sans-serif;
```

Note: `var(--font-noto-thai)` was missing from the original font-sans stack. The `layout.tsx` already injects `--font-noto-thai` as a CSS variable via the body className, so it should be included in the stack.

### Pattern 5: `caps` utility class
**What:** Replace all inline `text-sm font-semibold text-muted-foreground uppercase tracking-wide` (or similar) with the single `caps` utility. The utility is defined at line 218-220 of `globals.css` as `@utility caps { @apply text-xs font-semibold uppercase tracking-wide text-muted-foreground; }`.

**Note — `text-xs` vs `text-sm`:** The existing inline violations use `text-sm`, but `caps` uses `text-xs`. This is intentional — the `caps` utility enforces the correct scale. The violations in SplitSheet should be corrected to `caps` (smaller, which is correct for section labels).

### Anti-Patterns to Avoid
- **Wrapping Badge or Button:** Never create `<SettledBadge>` or `<OptionCard>` wrapper components — extend CVA in-place
- **Hardcoded OKLCH in @theme inline:** Must be `var(--token)` references only — never literal values (dark mode breaks silently)
- **Shadow in Tailwind class string:** Multi-value box-shadow breaks in Tailwind v4 `@theme inline` — always inline style or `[box-shadow:...]` arbitrary property
- **Raw green palette classes:** `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` — must become `<Badge variant="settled">` consuming the new tokens

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Green "Settled" badge color | Custom opacity-reduced palette classes | `--status-settled` / `--status-settled-bg` OKLCH tokens | Dark mode needs independent values, not opacity hacks |
| Section heading style | Inline uppercase class cluster | `caps` utility | Already defined, consistent across the app |
| Option card button | Raw `<button>` with bespoke border/hover classes | `<Button variant="option-card">` | Phase 14 also needs this; CVA ensures consistency |
| Font registration | Manual CSS @font-face | `next/font/google` | Handles preload, font-display, variable name injection automatically |

---

## Common Pitfalls

### Pitfall 1: settled vs open badge indistinguishable
**What goes wrong:** `--status-settled` at hue 145 collides visually with `--status-open` which is also hue 145 in `:root`.
**Why it happens:** Both represent positive states and green is the obvious choice.
**How to avoid:** Tune lightness or chroma to create visible separation. Settled is a "completed" terminal state — it should feel more saturated/definitive than "open." Recommend `oklch(0.48 0.21 145)` light vs open's `oklch(0.50 0.18 145)`. Alternatively, shift hue slightly (e.g. 150 vs 145).
**Warning signs:** Badges look identical in a side-by-side visual check.

### Pitfall 2: Missing third location in OKLCH token edit
**What goes wrong:** Token added in `:root` and `.dark` but forgot `@theme inline` — Tailwind utility classes (`bg-status-settled-bg`) don't generate.
**Why it happens:** Three-place edit required; easy to miss the third.
**How to avoid:** After writing tokens, grep for `--color-status-split` to confirm the `@theme inline` alias exists, then mirror that pattern for settled.

### Pitfall 3: option-card shadow not rendered
**What goes wrong:** Shadow token inside CVA class string fails to apply because of Tailwind v4 `@theme inline` incompatibility with multi-value values.
**Why it happens:** This is a known project constraint explicitly documented in CLAUDE.md.
**How to avoid:** Either pass `style={{ boxShadow: 'var(--shadow-card)' }}` at every `<Button variant="option-card">` call site, or use the Tailwind arbitrary property syntax `[box-shadow:var(--shadow-card)]` inside the CVA class string (this works in Tailwind v4).

### Pitfall 4: IBM Plex Sans missing weights
**What goes wrong:** 600 weight used for `font-semibold` but only 400/500/700 loaded — browser falls back to a synthesized bold that looks wrong.
**Why it happens:** `Inter` doesn't need explicit weights (variable font), but `IBM_Plex_Sans` is a static font requiring explicit weight list.
**How to avoid:** Load `['400', '500', '600', '700']` as specified in CONTEXT.md decisions.

### Pitfall 5: caps utility changes visual size of section labels
**What goes wrong:** SplitSheet section labels change from `text-sm` to `text-xs` when switching to `caps` utility.
**Why it happens:** The inline violations use `text-sm` but `caps` is defined with `text-xs`.
**How to avoid:** This is intentional and correct — `text-xs` is the right size for caps labels per the design system. Accept the size change.

### Pitfall 6: Noto Sans Thai missing from font-sans stack
**What goes wrong:** Thai text falls through to system-ui instead of Noto Sans Thai because `--font-noto-thai` wasn't in the original `--font-sans` declaration.
**Why it happens:** Original `globals.css` line 29 only includes `var(--font-inter), var(--font-noto-jp)` — Thai font variable is registered in layout.tsx body className but not in the font-sans CSS token.
**How to avoid:** When updating `--font-sans`, include all three: `var(--font-ibm-plex-sans), var(--font-noto-jp), var(--font-noto-thai), system-ui, sans-serif`.

---

## Code Examples

### Exact violation sites in SplitSheet.tsx (all 7)

**1. Equal-seats Settled badge (line 342):**
```tsx
// BEFORE
<Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
  Settled
</Badge>

// AFTER
<Badge variant="settled">Settled</Badge>
```

**2. Per-seat-pay Settled badge (line 624):**
```tsx
// BEFORE — identical pattern, same fix
<Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
  Settled
</Badge>

// AFTER
<Badge variant="settled">Settled</Badge>
```

**3. Equal Split mode-select card (line 221):**
```tsx
// BEFORE
<button
  onClick={() => setView('equal-config')}
  className="rounded-xl border-2 border-border hover:border-primary transition-colors p-4 text-left space-y-1 focus:outline-none focus-visible:ring-2"
>

// AFTER
<Button
  variant="option-card"
  onClick={() => setView('equal-config')}
>
```

**4. Per Seat mode-select card (line 230):**
```tsx
// BEFORE
<button
  onClick={() => { initPerSeatSplit(tableId, defaultGuestCount); setView('per-seat-assign') }}
  className="rounded-xl border-2 border-border hover:border-primary transition-colors p-4 text-left space-y-1 focus:outline-none focus-visible:ring-2"
>

// AFTER
<Button
  variant="option-card"
  onClick={() => { initPerSeatSplit(tableId, defaultGuestCount); setView('per-seat-assign') }}
>
```

**5. Back button in equal-config (line 253):**
```tsx
// BEFORE
<button onClick={() => setView('mode-select')} className="text-sm text-muted-foreground hover:text-foreground">
  ← Back
</button>

// AFTER
<Button variant="ghost" size="sm" onClick={() => setView('mode-select')}>← Back</Button>
```

**6. Back button in per-seat-assign (line 415):**
```tsx
// Same pattern as #5, same fix
```

**7. Section labels (lines 426, 505) — per-seat-assign view:**
```tsx
// BEFORE
<p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
  Unassigned ({unassignedItems.length})
</p>

// AFTER
<p className="caps">Unassigned ({unassignedItems.length})</p>
```

**8. Seat picker responsive fix (line 478):**
```tsx
// BEFORE
<div className="flex flex-wrap gap-2 justify-center">

// AFTER
<div className="flex overflow-x-auto gap-2 pb-1 snap-x">
```
Note: Both seat picker locations in `renderPerSeatAssign` need this fix — the unassigned assignment picker (line 478) and the reassign picker (line 542).

---

## State of the Art

| Old Approach | Current Approach | Impact for this phase |
|--------------|------------------|----------------------|
| Raw palette classes for one-off badge colors | OKLCH semantic tokens in globals.css | Requires adding `--status-settled` tokens following the established pattern |
| `Inter` variable font | `IBM_Plex_Sans` static font | Must declare explicit weights array |
| `flex flex-wrap` for seat buttons | `flex overflow-x-auto snap-x` horizontal scroll | Prevents reflow at mobile/tablet breakpoints |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no test runner configured |
| Config file | N/A |
| Quick run command | `npm run build` (TypeScript + lint gate) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLISH-01 | No raw Tailwind palette classes in SplitSheet.tsx | manual-only (visual review + grep) | `grep -n "bg-green-\|text-green-" src/components/payment/SplitSheet.tsx` (expect 0 results) | n/a |
| POLISH-01 | CVA variants compile without TS errors | build | `npm run build` | ✅ |
| POLISH-02 | No `flex flex-wrap` in seat pickers | manual-only (visual + grep) | `grep -n "flex-wrap" src/components/payment/SplitSheet.tsx` (expect 0 results) | n/a |
| POLISH-02 | Sheet renders at mobile viewport | manual-only (browser DevTools 375px) | N/A | n/a |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing build infrastructure covers TypeScript validation. Manual visual verification is the primary gate for this phase.

---

## Open Questions

1. **`option-card` shadow delivery mechanism**
   - What we know: Shadow tokens cannot be Tailwind utility classes in this project (multi-value string incompatibility)
   - What's unclear: Whether to use `[box-shadow:var(--shadow-card)]` arbitrary Tailwind syntax inside the CVA string, or require `style={{}}` at every call site
   - Recommendation: Use `[box-shadow:var(--shadow-card)]` arbitrary property inside the CVA variant class string. Tailwind v4 arbitrary properties do support `var()` references. Validate with `npm run build` — if TypeScript/Tailwind complains, fall back to inline style at the call site.

2. **`--status-settled` vs `--status-open` visual differentiation**
   - What we know: Both use hue 145 (green). Current `--status-open` light values: `oklch(0.50 0.18 145)` / `oklch(0.95 0.05 145)` bg
   - What's unclear: Whether the suggested `oklch(0.48 0.21 145)` for settled provides enough visual separation
   - Recommendation: After adding tokens, do a side-by-side check of `<Badge variant="settled">Settled</Badge>` next to `<Badge variant="secondary">Open</Badge>` in both light and dark modes. Adjust chroma up (0.24) or shift hue to 148 if too similar.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/components/ui/badge.tsx` — CVA variant structure confirmed
- Direct codebase read: `src/components/ui/button.tsx` — CVA variant structure confirmed
- Direct codebase read: `src/app/globals.css` — Full token inventory confirmed, all OKLCH values and shadow tokens verified, `caps` utility verified at line 218
- Direct codebase read: `src/components/payment/SplitSheet.tsx` — All 7 violation sites enumerated with exact line numbers
- Direct codebase read: `src/app/layout.tsx` — Font import pattern confirmed
- Direct codebase read: `.planning/phases/13-polish/13-CONTEXT.md` — All decisions locked

### Secondary (MEDIUM confidence)
- CLAUDE.md project instructions — shadow token constraint, CVA extension rule, `@theme inline` literal OKLCH prohibition

---

## Metadata

**Confidence breakdown:**
- Violation inventory: HIGH — all sites read directly from source
- CVA extension pattern: HIGH — existing variants in badge.tsx and button.tsx confirm the exact authoring pattern
- OKLCH token values: MEDIUM — light/dark values are recommended starting points; visual QA may require ±0.02 lightness tuning
- Font swap: HIGH — next/font/google pattern fully visible in existing layout.tsx
- Responsive fix: HIGH — single line change, pattern confirmed in CONTEXT.md

**Research date:** 2026-03-12
**Valid until:** Stable (no fast-moving dependencies — all changes are within the local codebase)
