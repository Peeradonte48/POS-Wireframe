# Phase 10: Brand Token Refresh - Research

**Researched:** 2026-03-12
**Domain:** CSS design tokens, Tailwind v4 CSS-first architecture, OKLCH color space, dark mode token patterns
**Confidence:** HIGH

## Summary

This phase is a pure token hygiene pass — no new components, no behavior changes. The work touches exactly four artifacts: `globals.css` (all new tokens go here), `TableTile.tsx`, `KdsTicketCard.tsx`, and `AppSidebar.tsx` (hardcoded Tailwind palette classes replaced with token references). The project is already on Tailwind v4 with a CSS-first architecture, so all changes are CSS variable declarations and Tailwind class string edits.

The critical architectural constraint is the `@theme inline` rule already established in this codebase: all literal OKLCH values live in `:root` / `.dark` CSS blocks. The `@theme inline` block only contains `var(--token)` aliases — never literal values. Violating this silently breaks dark mode because `@theme inline` does not participate in the cascade the way `:root` / `.dark` do.

The phase breaks into four tightly scoped tasks, each mapping 1:1 to a TOKEN requirement. No third-party libraries are needed. No new files need to be created — all work is edits to existing files.

**Primary recommendation:** Write all new CSS variables in `:root` (light) and `.dark` (dark override), alias them in `@theme inline` with `var()`, then do a mechanical string-replace in the three TSX files. Complete one TOKEN requirement at a time, verify build succeeds between each.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Crimson Primary (TOKEN-01)
- Light mode target: `oklch(0.52 0.26 27)` — chroma bumped from 0.22 to 0.26
- Dark mode target: `oklch(0.63 0.26 27)` — same chroma boost, same L as current dark value
- Both `:root` and `.dark` blocks in `globals.css` must be updated
- Gamut verification is Claude's discretion — planner decides the approach

#### Status Hue Palette (TOKEN-02)
- `Occupied` uses a distinct semantic red — NOT the brand crimson (`--primary`). Occupied must not visually compete with primary CTA buttons.
- `Cleaning` uses a warm neutral — low chroma, warm hue angle (~40–60), not cool gray. Fits the A Ramen warm palette.
- `Open`, `Reserved`, `CheckRequested` keep their current semantic hue families (green, blue, amber) — these are standard semantic signals.
- Token shape: both bg + fg tokens per status
  - `--color-status-open` (text/border, full saturation)
  - `--color-status-open-bg` (pill background, muted/light)
  - Same pattern for all 5 states: open, occupied, reserved, check-requested, cleaning
- Dark mode: independently tuned values in `.dark` block — muted/matte colors appropriate for dark backgrounds, not just opacity-reduced light values

#### Elevation Depth System (TOKEN-03)
- Three tiers: `flat` (menu cards), `raised` (ticket panel, info panels), `floating` (modals/sheets)
- Visual weight: subtle SaaS-style — soft, low-contrast shadows (like Notion/Linear). Depth is felt, not seen.
- Floating tier: shadow only — `--shadow-floating` token on the panel itself. No additional overlay scrim (Dialog already handles that).
- Token names to follow REQUIREMENTS.md conventions: `--shadow-card`, `--shadow-panel`, with Claude's discretion on `--shadow-floating` name
- Dark mode: glow/border approach — in dark mode, shadow tokens resolve to subtle inset border or faint outer glow instead of shadow. Standard dark UI pattern.

#### Hardcoded Class Replacement (TOKEN-04)
- Target files confirmed: `TableTile.tsx` (STATUS_CONFIG borderClass + textClass), `KdsTicketCard.tsx` (inline status colors), `AppSidebar.tsx` (inline role-state colors)
- Replace raw Tailwind palette classes (`bg-green-500`, `text-red-600`, `bg-amber-50`, etc.) with semantic token references
- No raw palette classes should remain in these three files after the phase

### Claude's Discretion
- Exact OKLCH values for status token colors (within the chosen hue families and warm/neutral constraints)
- Exact shadow blur/spread/offset values for the three elevation tiers
- Whether to name the floating tier `--shadow-floating` or `--shadow-overlay`
- How to implement dark-mode glow effect (border vs box-shadow with light color)
- sRGB gamut verification approach for the new crimson values

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOKEN-01 | `--primary` chroma increased and gamut-verified for bold crimson | OKLCH color space analysis; exact current vs target values documented; gamut-check approach identified |
| TOKEN-02 | Semantic status tokens (`--color-status-*`) defined for all 5 table states | All 5 states audited in TableTile STATUS_CONFIG; token shape (fg + bg pair) confirmed; dark mode strategy identified |
| TOKEN-03 | Elevation tokens (`--shadow-card`, `--shadow-panel`) defined for 3-tier depth | Shadow value ranges for subtle SaaS-style confirmed; dark mode glow approach documented |
| TOKEN-04 | Hardcoded Tailwind palette classes in TableTile, KdsTicketCard, AppSidebar replaced with token references | All hardcoded classes enumerated per file; replacement strategy documented |
</phase_requirements>

---

## Standard Stack

### Core — No new dependencies needed

| Technology | Version | Role in Phase |
|------------|---------|---------------|
| Tailwind CSS v4 | `^4` | CSS-first token system already in place |
| CSS custom properties | Native | Token storage: `:root` + `.dark` blocks |
| OKLCH | CSS Color Level 4 | All color values in this codebase use OKLCH |
| next-themes | `^0.4.6` | Dark mode via `.dark` class on `<html>` — already wired |

**No npm installs required.** This phase is pure edits to `globals.css` and three TSX files.

### Alternatives Considered
| Instead of | Could Use | Why Standard Wins |
|------------|-----------|-------------------|
| OKLCH | HSL/HEX | OKLCH already in use project-wide; perceptually uniform; already verified by prior phases |
| CSS custom properties | Tailwind config | Project uses Tailwind v4 CSS-first — no `tailwind.config.js` exists |

---

## Architecture Patterns

### Token Layering (ESTABLISHED — MUST FOLLOW)

The project's `globals.css` already uses a three-block architecture. New tokens MUST follow this pattern exactly:

```
Block 1: @theme { }
  - Literal static values only (brand colors, animations)
  - NOT affected by dark mode

Block 2: @theme inline { }
  - ONLY var() aliases pointing to :root/:dark vars
  - NEVER literal OKLCH values here (dark mode silently breaks)

Block 3: :root { }
  - Light mode token values (literal OKLCH)

Block 4: .dark { }
  - Dark mode overrides (literal OKLCH)
```

**Why this matters:** Tailwind v4's `@theme inline` resolves at build time for its utility class mapping, but CSS variable resolution happens at runtime. If you put `oklch(0.52 0.26 27)` directly in `@theme inline`, the `.dark` block override never fires — Tailwind has already baked the literal value into the utility class.

### Pattern 1: Adding a new CSS token

```css
/* Source: globals.css established pattern in this project */

/* Step 1 — define in :root (light) and .dark (dark) */
:root {
  --color-status-open:    oklch(0.50 0.18 145);
  --color-status-open-bg: oklch(0.95 0.05 145);
}
.dark {
  --color-status-open:    oklch(0.65 0.16 145);
  --color-status-open-bg: oklch(0.25 0.06 145);
}

/* Step 2 — alias in @theme inline so Tailwind utilities work */
@theme inline {
  --color-status-open:    var(--color-status-open);
  --color-status-open-bg: var(--color-status-open-bg);
}
```

### Pattern 2: Using tokens in TSX — two strategies

**Strategy A: Tailwind utility class (preferred for bg/text)**
```tsx
// After token is registered in @theme inline, use as Tailwind class:
className="bg-status-open text-status-open"
```

**Strategy B: Inline CSS var reference (for border-color on arbitrary values)**
```tsx
// For left-border color — Tailwind arbitrary value syntax:
className="border-l-[color:var(--color-status-open)]"
// Or add a Tailwind alias like border-l-status-open via @theme inline
```

**Recommendation for STATUS_CONFIG:** Replace the `borderClass` / `textClass` string values with token-based Tailwind class strings. The `STATUS_CONFIG` shape in `TableTile.tsx` is already a string-keyed record — the strings just need to become token-referencing utility classes instead of palette classes.

### Pattern 3: Shadow tokens in CSS

```css
/* Source: CSS box-shadow spec + Notion/Linear SaaS-style shadow values */

/* Light mode — traditional drop shadow */
:root {
  --shadow-card:    0 1px 3px 0 oklch(0 0 0 / 0.08), 0 1px 2px -1px oklch(0 0 0 / 0.06);
  --shadow-panel:   0 4px 6px -1px oklch(0 0 0 / 0.08), 0 2px 4px -2px oklch(0 0 0 / 0.05);
  --shadow-floating: 0 10px 15px -3px oklch(0 0 0 / 0.10), 0 4px 6px -4px oklch(0 0 0 / 0.07);
}

/* Dark mode — glow/border approach */
.dark {
  --shadow-card:    0 0 0 1px oklch(1 0 0 / 0.06);
  --shadow-panel:   0 0 0 1px oklch(1 0 0 / 0.08), 0 4px 12px oklch(0 0 0 / 0.40);
  --shadow-floating: 0 0 0 1px oklch(1 0 0 / 0.10), 0 8px 24px oklch(0 0 0 / 0.50);
}
```

Shadow tokens do NOT need to be in `@theme inline` unless you want Tailwind utilities like `shadow-card`. They can be applied directly with `style={{ boxShadow: 'var(--shadow-card)' }}` or via a custom `@layer utilities` helper class.

### Anti-Patterns to Avoid

- **Literal values in `@theme inline`:** `--color-primary: oklch(0.52 0.26 27)` in `@theme inline` breaks dark mode silently. Always use `var(--primary)` in `@theme inline`.
- **Opacity-reducing light colors for dark mode:** `oklch(0.50 0.18 145 / 50%)` is not a proper dark mode token. Dark surfaces need independently tuned L values (brighter fg, darker bg).
- **Leaving one file half-done:** If TOKEN-04 replaces classes in TableTile but not KdsTicketCard, the verification check fails. Complete all three files before marking TOKEN-04 done.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| OKLCH gamut checking | Manual arithmetic | Visit oklch.com — paste value, check if "P3" or "sRGB" badge appears |
| Dark mode detection | Manual class watching | next-themes already handles `.dark` class on `<html>` |
| Token namespacing | Custom JS token system | CSS custom properties in `:root`/`.dark` — already the project standard |
| Tailwind custom utility | Custom PostCSS plugin | `@theme inline` alias is sufficient for utility class generation |

---

## Common Pitfalls

### Pitfall 1: `@theme inline` literal value (silent dark mode break)
**What goes wrong:** Chroma-boosted crimson works in light mode but dark mode shows the same bold red instead of the lighter dark-mode value.
**Why it happens:** Developer puts `--primary: oklch(0.52 0.26 27)` in `@theme inline` instead of `--color-primary: var(--primary)`. Tailwind bakes the literal at compile time; `.dark` block override never applies.
**How to avoid:** Keep `@theme inline` as pure aliases. Literals only go in `:root` and `.dark`.
**Warning signs:** Dark mode toggle has no visual effect on primary color.

### Pitfall 2: Status tokens defined but not aliased in `@theme inline`
**What goes wrong:** `bg-status-open` utility class throws a Tailwind "unknown class" warning or resolves to nothing.
**Why it happens:** Token defined in `:root` but not aliased in `@theme inline`, so Tailwind's utility generator doesn't know about it.
**How to avoid:** Every token used as a Tailwind class (bg-X, text-X, border-X) must have a corresponding alias in `@theme inline`.
**Warning signs:** Class appears in code but produces no CSS output; browser DevTools shows no matching rule.

### Pitfall 3: Occupied status using brand crimson hue (~27°)
**What goes wrong:** The Occupied table tile and primary CTA buttons look visually identical. Staff can't distinguish status from action.
**Why it happens:** Developer reuses `--primary` or picks a nearby hue for the Occupied status token.
**How to avoid:** Occupied semantic red must be a clearly distinct hue — use hue ~10–15° (warmer red-orange) or ~350° (cooler true red), not the brand's 27° crimson. The CONTEXT.md explicitly calls this out.
**Warning signs:** Occupied border and a nearby primary button appear the same color on the floor map.

### Pitfall 4: KdsTicketCard timer colors not tokenized
**What goes wrong:** The `timerColorClass` ternary chain (`text-red-500` / `text-amber-500` / `text-green-500`) is missed during TOKEN-04 because it's a computed value, not a static CONFIG object.
**Why it happens:** The STATUS_CONFIG search pattern finds TableTile easily, but KdsTicketCard's timer colors are inline logic at line 21–27.
**How to avoid:** When replacing KdsTicketCard, audit the full file — both the BUMP button colors (lines 72–73) AND the timer color ternary (lines 21–27).
**Warning signs:** After TOKEN-04, grep for `text-red-` in KdsTicketCard still returns a hit.

### Pitfall 5: AppSidebar shift-lock banner uses palette classes
**What goes wrong:** The "Open a shift first" warning banner retains `bg-amber-50 border-amber-200 text-amber-700` in dark mode, making it blindingly light on a dark sidebar.
**Why it happens:** AppSidebar has only ONE palette-class instance (line 53) — easy to miss in a multi-file sweep.
**How to avoid:** Replace with `--color-status-check-requested` (the amber semantic token) and its bg variant. This is a warning/caution signal — CheckRequested amber is semantically appropriate.
**Warning signs:** Shift-lock banner is a bright cream rectangle on an otherwise dark sidebar.

---

## Code Examples

### TOKEN-01: Crimson chroma bump

```css
/* Source: globals.css :root and .dark blocks — edit in place */

/* Current (to be replaced): */
:root  { --primary: oklch(0.52 0.22 27); }
.dark  { --primary: oklch(0.63 0.22 27); }

/* New values (locked in CONTEXT.md): */
:root  { --primary: oklch(0.52 0.26 27); }
.dark  { --primary: oklch(0.63 0.26 27); }

/* @theme inline alias is already correct — no change needed: */
/* --color-primary: var(--primary);  ← this line already exists */
```

**Gamut check:** `oklch(0.52 0.26 27)` — chroma 0.26 at hue 27 is within sRGB gamut for most modern displays. Verify at https://oklch.com/#0.52,0.26,27. The P3 badge confirms wide-gamut; if sRGB clips, reduce chroma to 0.24 and note in plan.

### TOKEN-02: Status token set (recommended OKLCH values for Claude's discretion areas)

```css
/* Source: OKLCH color space — hue families matching semantic conventions */

:root {
  /* Open — green family, hue ~145 */
  --color-status-open:             oklch(0.50 0.18 145);
  --color-status-open-bg:          oklch(0.95 0.05 145);

  /* Occupied — semantic red, distinct from brand crimson (hue ~10) */
  --color-status-occupied:         oklch(0.52 0.20 10);
  --color-status-occupied-bg:      oklch(0.95 0.05 10);

  /* Reserved — blue family, hue ~240 */
  --color-status-reserved:         oklch(0.50 0.18 240);
  --color-status-reserved-bg:      oklch(0.95 0.05 240);

  /* Check Requested — amber family, hue ~75 */
  --color-status-check-requested:  oklch(0.60 0.18 75);
  --color-status-check-requested-bg: oklch(0.97 0.05 75);

  /* Cleaning — warm neutral, low chroma, hue ~50 */
  --color-status-cleaning:         oklch(0.55 0.06 50);
  --color-status-cleaning-bg:      oklch(0.95 0.03 50);
}

.dark {
  /* Open — brighter fg for dark surface */
  --color-status-open:             oklch(0.70 0.16 145);
  --color-status-open-bg:          oklch(0.25 0.06 145);

  /* Occupied */
  --color-status-occupied:         oklch(0.70 0.18 10);
  --color-status-occupied-bg:      oklch(0.25 0.07 10);

  /* Reserved */
  --color-status-reserved:         oklch(0.70 0.16 240);
  --color-status-reserved-bg:      oklch(0.22 0.06 240);

  /* Check Requested */
  --color-status-check-requested:  oklch(0.75 0.16 75);
  --color-status-check-requested-bg: oklch(0.28 0.07 75);

  /* Cleaning */
  --color-status-cleaning:         oklch(0.70 0.05 50);
  --color-status-cleaning-bg:      oklch(0.25 0.03 50);
}
```

### TOKEN-02: `@theme inline` aliases for status tokens

```css
/* Add to existing @theme inline { } block */
@theme inline {
  /* ... existing aliases ... */

  --color-status-open:              var(--color-status-open);
  --color-status-open-bg:           var(--color-status-open-bg);
  --color-status-occupied:          var(--color-status-occupied);
  --color-status-occupied-bg:       var(--color-status-occupied-bg);
  --color-status-reserved:          var(--color-status-reserved);
  --color-status-reserved-bg:       var(--color-status-reserved-bg);
  --color-status-check-requested:   var(--color-status-check-requested);
  --color-status-check-requested-bg: var(--color-status-check-requested-bg);
  --color-status-cleaning:          var(--color-status-cleaning);
  --color-status-cleaning-bg:       var(--color-status-cleaning-bg);
}
```

### TOKEN-04: TableTile STATUS_CONFIG replacement

```tsx
// Source: TableTile.tsx STATUS_CONFIG — current hardcoded values:
// borderClass: 'border-l-green-500'  → 'border-l-status-open'
// textClass:   'text-green-600'      → 'text-status-open'
// (same pattern for all 5 statuses)

const STATUS_CONFIG: Record<TableStatus, { borderClass: string; textClass: string; label: string; Icon: SolarIcon }> = {
  Open:           { borderClass: 'border-l-status-open',           textClass: 'text-status-open',           label: 'Open',            Icon: RadioLinear             },
  Occupied:       { borderClass: 'border-l-status-occupied',       textClass: 'text-status-occupied',       label: 'Occupied',        Icon: UsersGroupRoundedLinear },
  Reserved:       { borderClass: 'border-l-status-reserved',       textClass: 'text-status-reserved',       label: 'Reserved',        Icon: CalendarDateLinear      },
  CheckRequested: { borderClass: 'border-l-status-check-requested',textClass: 'text-status-check-requested',label: 'Check Requested', Icon: WalletLinear            },
  Cleaning:       { borderClass: 'border-l-status-cleaning',       textClass: 'text-status-cleaning',       label: 'Cleaning',        Icon: StarLinear              },
}
```

Note: Tailwind v4 maps `--color-status-open` → utility class `text-status-open` / `bg-status-open` / `border-l-status-open` automatically when the `--color-*` token is aliased in `@theme inline`.

### TOKEN-04: KdsTicketCard timer color replacement

```tsx
// Source: KdsTicketCard.tsx lines 21-27
// Current:
const timerColorClass =
  elapsedSeconds >= 900 ? 'text-red-500'
  : elapsedSeconds >= 600 ? 'text-amber-500'
  : 'text-green-500'

// Replaced:
const timerColorClass =
  elapsedSeconds >= 900 ? 'text-status-occupied'
  : elapsedSeconds >= 600 ? 'text-status-check-requested'
  : 'text-status-open'

// Also KdsTicketCard BUMP button (lines 70-74):
// Current: 'bg-green-600 hover:bg-green-500 active:scale-95 ring-2 ring-green-400'
// Replaced: 'bg-status-open hover:bg-status-open/80 active:scale-95 ring-2 ring-status-open/60'
```

### TOKEN-04: AppSidebar shift-lock banner replacement

```tsx
// Source: AppSidebar.tsx line 53
// Current:
'flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs'

// Replaced:
'flex items-center gap-2 px-3 py-2 bg-status-check-requested-bg border-b border-status-check-requested/30 text-status-check-requested text-xs'
```

---

## Exact Hardcoded Classes Audit

### TableTile.tsx — STATUS_CONFIG record (lines 22–27)
| Current class | Token replacement |
|---------------|-------------------|
| `border-l-green-500` | `border-l-status-open` |
| `text-green-600` | `text-status-open` |
| `border-l-red-500` | `border-l-status-occupied` |
| `text-red-600` | `text-status-occupied` |
| `border-l-blue-500` | `border-l-status-reserved` |
| `text-blue-600` | `text-status-reserved` |
| `border-l-amber-500` | `border-l-status-check-requested` |
| `text-amber-600` | `text-status-check-requested` |
| `border-l-gray-400` | `border-l-status-cleaning` |
| `text-gray-500` | `text-status-cleaning` |

### KdsTicketCard.tsx — computed + inline (lines 21–27, 72–73)
| Current class | Token replacement |
|---------------|-------------------|
| `text-red-500` (timer >=900s) | `text-status-occupied` |
| `text-amber-500` (timer >=600s) | `text-status-check-requested` |
| `text-green-500` (timer fresh) | `text-status-open` |
| `bg-green-600` (BUMP button active) | `bg-status-open` |
| `hover:bg-green-500` | `hover:bg-status-open/80` |
| `ring-green-400` | `ring-status-open/60` |

### AppSidebar.tsx — shift-lock banner (line 53)
| Current class | Token replacement |
|---------------|-------------------|
| `bg-amber-50` | `bg-status-check-requested-bg` |
| `border-amber-200` | `border-status-check-requested/30` |
| `text-amber-700` | `text-status-check-requested` |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| HEX/HSL color values | OKLCH — perceptually uniform | Already adopted in this project; chroma is the direct "saturation" lever |
| `tailwind.config.js` extend | `@theme` / `@theme inline` in CSS | Tailwind v4 CSS-first; no config file exists in this project |
| Global dark mode class toggling | next-themes `.dark` class on `<html>` | Already wired; shadow/color tokens in `.dark {}` automatically apply |

---

## Open Questions

1. **Gamut clipping for `oklch(0.52 0.26 27)`**
   - What we know: chroma 0.22 was chosen originally presumably to stay in sRGB gamut at hue 27
   - What's unclear: whether 0.26 clips on non-P3 displays
   - Recommendation: planner should include a manual verification step (open oklch.com with the value) before finalizing TOKEN-01. If clipped, fall back to 0.24.

2. **Tailwind v4 `border-l-{color}` utility availability**
   - What we know: Tailwind v4 generates color utilities from `--color-*` tokens in `@theme inline`
   - What's unclear: whether `border-l-status-open` (directional border color) is auto-generated or needs explicit definition
   - Recommendation: Verify during TOKEN-04 execution with a build check. Alternative: use `[border-left-color:var(--color-status-open)]` arbitrary value syntax if needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test directories in `/src` |
| Config file | None — Wave 0 gap |
| Quick run command | `next build` (type-check + compile) |
| Full suite command | `next build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOKEN-01 | `--primary` chroma 0.26 in `:root` and `.dark` | manual-visual + build | `next build` (no type errors) | N/A |
| TOKEN-02 | All 10 status tokens defined (5 states × 2 variants) | manual-visual + build | `next build` | N/A |
| TOKEN-03 | 3 shadow tokens in `:root` and `.dark` | manual-visual + build | `next build` | N/A |
| TOKEN-04 | Zero raw palette classes in three files | automated grep | `grep -rn "bg-green-\|bg-red-\|bg-amber-\|bg-gray-\|text-green-\|text-red-\|text-amber-\|text-gray-\|border-l-green\|border-l-red\|border-l-blue\|border-l-amber\|border-l-gray" src/components/table-map/TableTile.tsx src/components/kds/KdsTicketCard.tsx src/components/app-shell/AppSidebar.tsx` | ✅ (existing files) |

**TOKEN-04 is machine-verifiable via grep.** Zero results = requirement met.

**TOKEN-01/02/03 require manual visual verification** — dark mode toggle, both light and dark at final check. Use browser DevTools to confirm no `var()` remains unresolved.

### Sampling Rate
- **Per task commit:** `next build` — confirms no TypeScript errors or Tailwind compilation failures
- **Per wave merge:** `next build` + grep check for TOKEN-04
- **Phase gate:** All four TOKEN requirements verified before `/gsd:verify-work`

### Wave 0 Gaps
- No test framework exists in this project — this is a wireframe; visual verification is the established pattern throughout all prior phases. No gaps to fill; build check + grep is the appropriate bar for this phase.

---

## Sources

### Primary (HIGH confidence)
- Direct source code audit: `src/app/globals.css` — full file read; token architecture confirmed
- Direct source code audit: `src/components/table-map/TableTile.tsx` — STATUS_CONFIG record fully enumerated
- Direct source code audit: `src/components/kds/KdsTicketCard.tsx` — all hardcoded classes identified
- Direct source code audit: `src/components/app-shell/AppSidebar.tsx` — shift-lock banner classes identified
- `.planning/phases/10-brand-token-refresh/10-CONTEXT.md` — all locked decisions read verbatim
- `.planning/STATE.md` — established patterns confirmed (OKLCH, `@theme inline` rule, next-themes `.dark` class)

### Secondary (MEDIUM confidence)
- OKLCH color space properties: perceptual uniformity, chroma as saturation lever, hue angle semantics — well-established CSS Color Level 4 specification behavior
- Tailwind v4 `@theme inline` behavior: confirmed by project's own existing pattern + documented Tailwind v4 CSS-first architecture change

### Tertiary (LOW confidence — flagged)
- Exact OKLCH values for status tokens (Open, Reserved, etc.): proposed values are informed recommendations within the specified hue families; not verified against actual display rendering. Visual verification required during execution.
- `border-l-{color}` Tailwind v4 utility auto-generation: assumed based on v4's pattern for directional utilities, but not verified via Context7 or official docs for this specific case.

---

## Metadata

**Confidence breakdown:**
- TOKEN-01 (crimson bump): HIGH — values locked in CONTEXT.md, pattern established in codebase
- TOKEN-02 (status palette): MEDIUM-HIGH — token shape locked, hue families locked, exact OKLCH values are Claude's discretion
- TOKEN-03 (elevation shadows): MEDIUM — shadow approach and dark mode strategy locked; exact blur/spread values are Claude's discretion
- TOKEN-04 (class replacement): HIGH — all hardcoded classes fully enumerated by direct code audit; replacement class names follow from token names

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain — CSS variables and Tailwind v4 APIs are not fast-moving)
