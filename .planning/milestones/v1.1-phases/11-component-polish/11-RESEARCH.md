# Phase 11: Component Polish - Research

**Researched:** 2026-03-12
**Domain:** Tailwind CSS v4 utility authoring, CVA variant extension, CSS custom properties, component-level style refactoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Button sizing & glow (COMP-01)**
- Add a `cta` size variant to `buttonVariants` in `button.tsx`: `h-11` (44px) with appropriate horizontal padding
- Existing sizes (`xs`, `sm`, `default`, `lg`) remain unchanged — no regressions
- Primary CTAs across all screens (Send to Kitchen, Confirm Payment, Open Table, etc.) explicitly opt in with `size="cta"`
- Crimson glow shadow: CSS `box-shadow` with primary color, appears **on hover/active only** (not at rest)
- Press scale: `active:scale-[0.97]` added to Button base `cva` classes — matches TableTile's existing press behavior
- Glow scope: all `variant="default"` buttons get the hover glow — lives in the `default` variant style, no manual opt-in required

**Status badge pills (COMP-02)**
- **Implementation:** Add `bgClass` to `STATUS_CONFIG` in `TableTile.tsx` alongside existing `textClass` and `borderClass`
- Render status as `<Badge>` component with `className={bgClass + ' ' + textClass}` — reuses existing badge.tsx, minimal new code
- Background fills use Phase 10 `--color-status-*-bg` tokens (e.g., `bg-[var(--color-status-open-bg)]`)
- **Icon stays inside the pill** — icon + label inside the filled chip for readability under dim restaurant lighting
- **Auto-width** based on label length — natural pill sizing, no fixed min-width
- **KDS included:** Same filled pill badge style applies to KDS ticket status badges (New / InProgress / Ready) using the same status-bg token approach

**Price hero readouts (COMP-04)**
- **Hero treatment applies to grand totals only** — not subtotals, VAT, or line item prices
  - `TicketPanel` footer running total: `text-xl font-bold` → `text-2xl font-black text-primary`
  - `TotalsSection` grand total: `font-bold text-base` → `text-2xl font-black text-primary`
- **Layout unchanged** — TicketPanel footer keeps existing flex row (total left, button right); `text-2xl` accommodates without layout change
- **Grand total in crimson** (`text-primary`) — makes the payment amount the brand moment on both order and payment screens
- **Line item prices** stay `text-sm` normal weight — supporting information, not competing with the hero total

**Caps section labels (COMP-05)**
- Define a `.caps` utility class in `globals.css`:
  - `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
  - Matches the most common existing inline pattern across manager tabs, KDS, TicketPanel
- **Full app audit** — replace all inline occurrences with `className="caps"` across all screens:
  - Manager tabs (EightySixTab, OpenTicketsTab, EodSummaryTab)
  - KDS (KdsBoard, KdsRecallTray)
  - TicketPanel, OrderFlow
  - Any other section label occurrences in Login, Table Map, Payment, Receipt
- **KDS included** — KdsBoard's `text-xs font-semibold uppercase tracking-widest` and KdsRecallTray convert to `.caps`
  - Note: `tracking-widest` → `tracking-wide` (standardize to the defined utility)

### Claude's Discretion
- Exact CSS box-shadow value for the primary button glow (primary color at ~20–30% opacity, appropriate blur/spread)
- Which specific button instances across each screen to upgrade to `size="cta"` (use judgment: primary action per screen = cta, secondary utility buttons = default/lg)
- Exact `bgClass` token reference syntax for STATUS_CONFIG (`bg-[var(--color-status-*-bg)]` or Tailwind token alias if available)
- KDS order status badge token mapping (New → open-bg? InProgress → occupied-bg? Ready → open-bg with different hue?)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | All primary action buttons are 44px with crimson glow and active press scale | CVA `cta` size variant; `active:scale-[0.97]` in base; `hover:shadow-[...]` in `default` variant |
| COMP-02 | Table status indicators display as filled colored pill chips | `bgClass` field in STATUS_CONFIG; Badge component with `className` override; status-bg token aliases confirmed in @theme |
| COMP-03 | Menu cards, ticket panel, and info panels use the elevation token system | `--shadow-card/panel/floating` tokens confirmed in globals.css; consumed via `style={{ boxShadow: 'var(--shadow-*)' }}` per Phase 10 decision |
| COMP-04 | Price totals (฿XXXX) render as hero text — `text-2xl font-black text-primary` | Two specific lines identified: TicketPanel.tsx:145 and TotalsSection.tsx:96-97 |
| COMP-05 | Section labels use caps utility for visual hierarchy throughout | 14 inline occurrences identified across 8 files; utility definition in globals.css via `@utility` block |
</phase_requirements>

---

## Summary

Phase 11 is a surgical, file-by-file style refactor with zero feature additions and zero layout changes. All the infrastructure it depends on — semantic status tokens, elevation shadow variables, and the token architecture — was laid in Phase 10. This phase only wires those tokens to the visible component layer.

The work divides cleanly into five independent tasks matching the five COMP requirements. COMP-01 and COMP-05 are cross-cutting (they touch many files), while COMP-02, COMP-03, and COMP-04 are highly targeted (2–3 files each). No new npm dependencies are required. No route or data-model changes occur.

The primary technical judgment calls are: (a) the exact box-shadow value for the crimson glow on `default` buttons, (b) which button instances warrant `size="cta"` vs staying at `lg` or `default`, (c) the `bgClass` token syntax for STATUS_CONFIG, and (d) the token mapping for KDS ticket status badges. All four are within Claude's discretion as scoped by the decisions document.

**Primary recommendation:** Execute as five discrete waves in dependency order — COMP-05 first (pure text replacement, zero risk), then COMP-04 (two-line change), then COMP-02 (STATUS_CONFIG extension), then COMP-01 (CVA + button audit), then COMP-03 (elevation application).

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^4 | Utility classes, `@utility` directive, `@theme inline` aliases | Project foundation; v4 `@utility` block is the correct way to define custom utilities |
| class-variance-authority (CVA) | installed | Button/Badge variant management | Already powering `buttonVariants` and `badgeVariants` |
| @base-ui/react | installed | ButtonPrimitive foundation | Existing; Button wraps this; no changes to base component |

### Key Tailwind v4 Constraints

| Pattern | Correct v4 Syntax | Notes |
|---------|------------------|-------|
| Custom utility | `@utility caps { ... }` inside `globals.css` | NOT `@layer utilities { .caps { ... } }` — that is v3 syntax |
| Arbitrary CSS var | `bg-[var(--color-status-open-bg)]` | Works in v4 for values not aliased in `@theme inline` |
| Token alias utility | `bg-status-open-bg` | Works ONLY if alias exists in `@theme inline`; confirmed: `--color-status-open-bg` aliased |
| Shadow tokens | `style={{ boxShadow: 'var(--shadow-card)' }}` | Multi-value strings excluded from `@theme inline` per Phase 10 decision; MUST use inline style prop |
| Opacity modifier | `bg-status-open/80` | Works on `@theme inline` aliased tokens; confirmed used in BUMP button |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended File Touch Order

```
1. src/app/globals.css               — COMP-05: add @utility caps block
2. src/components/order/TicketPanel.tsx    — COMP-04 + COMP-05: hero total + caps
3. src/components/payment/TotalsSection.tsx — COMP-04: hero grand total
4. src/components/table-map/TableTile.tsx  — COMP-02: STATUS_CONFIG bgClass + Badge render
5. src/components/kds/KdsTicketCard.tsx    — COMP-02: KDS status badge pill
6. src/components/ui/button.tsx            — COMP-01: cta size + active scale + hover glow
7. Screen files (Button audit)             — COMP-01: swap to size="cta"
8. Remaining caps files                    — COMP-05: replace inline patterns
```

### Pattern 1: Tailwind v4 @utility Block

**What:** Registers a custom class that Tailwind recognizes and includes in the generated CSS.
**When to use:** Shared presentation patterns that appear across 5+ files; reduces drift between occurrences.

```css
/* src/app/globals.css */
@utility caps {
  font-size: theme(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: theme(--tracking-wide);
  color: var(--muted-foreground);
}
```

Note: An alternative is using `@apply` inside `@utility`, but direct CSS properties are more explicit and easier to read in a design-focused codebase.

### Pattern 2: CVA Size Variant Addition

**What:** Extend `buttonVariants` `size` record with a `cta` key. Never remove or mutate existing keys.
**When to use:** Any new canonical button size that must be referenced by name across screens.

```typescript
// src/components/ui/button.tsx — cta addition to size variants
cta: "h-11 gap-2 px-6 text-sm font-semibold",
```

The base `cva` string gets `active:scale-[0.97] transition-transform` appended. The `default` variant gets `hover:shadow-[0_0_0_3px_oklch(0.52_0.26_27_/_0.25)]` (or equivalent — exact value is Claude's discretion).

### Pattern 3: STATUS_CONFIG bgClass Extension

**What:** Add a `bgClass` field to every entry in the STATUS_CONFIG record. The existing `borderClass` and `textClass` pattern is the template.
**When to use:** Any per-status visual attribute that maps cleanly to a Tailwind utility.

```typescript
// src/components/table-map/TableTile.tsx
const STATUS_CONFIG: Record<TableStatus, {
  borderClass: string
  textClass: string
  bgClass: string      // NEW
  label: string
  Icon: SolarIcon
}> = {
  Open: {
    borderClass: 'border-l-status-open',
    textClass:   'text-status-open',
    bgClass:     'bg-status-open-bg',   // or bg-[var(--color-status-open-bg)]
    label: 'Open',
    Icon: RadioLinear,
  },
  // ... repeat for all 5 statuses
}
```

The status row `<span>` becomes a `<Badge>` with the combined classes:
```tsx
<Badge className={`${bgClass} ${textClass} flex items-center gap-1`}>
  <Icon size={12} />
  {label}
</Badge>
```

### Pattern 4: Elevation via Inline Style Prop

**What:** Apply shadow tokens to cards and panels using the `style` prop, not Tailwind classes.
**When to use:** COMP-03 elevation application — always, because multi-value `box-shadow` strings are incompatible with Tailwind `@theme inline` (confirmed Phase 10 decision).

```tsx
// Menu card elevation — bg-card is "flat" (no shadow), style prop adds raised tier
<button
  style={{ boxShadow: 'var(--shadow-card)' }}
  className="bg-card rounded-xl ..."
>

// Ticket panel — panel tier
<div
  style={{ boxShadow: 'var(--shadow-panel)' }}
  className="w-56 ... border-l border-border flex flex-col bg-card shrink-0"
>

// Bottom sheet (floating tier) — TableBottomSheet already uses shadow-lg;
// replace with floating token
<div style={{ boxShadow: 'var(--shadow-floating)' }} className="fixed bottom-0 ...">
```

### Anti-Patterns to Avoid

- **Adding glow to button base** (not in `default` variant): The glow belongs in `variant.default`, not the base `cva` string. Base gets only `active:scale-[0.97] transition-transform`.
- **Hardcoding OKLCH color in box-shadow**: Use `var(--primary)` or `var(--color-primary)` in the shadow so it automatically responds to dark mode token swap.
- **Forgetting `transition-all`/`transition-transform`**: Scale and shadow animations need transition. `transition-all` is already in the base cva; adding `transition-transform` for scale is sufficient.
- **`@layer utilities` for `.caps`**: v3 syntax. In Tailwind v4, use `@utility caps { }` at top level inside the CSS file.
- **Fixing tracking-widest inline** by only updating `tracking-wide` in some places: The `.caps` utility standardizes on `tracking-wide`. All occurrences of `tracking-widest` in section labels must convert to `.caps`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom utility class registration | Manual CSS class outside Tailwind | `@utility` block in globals.css | Tailwind v4's purpose-built mechanism; participates in purging and autocomplete |
| Status color lookups | Switch statement per status | STATUS_CONFIG record | Already the project pattern; adding `bgClass` extends it cleanly |
| Per-file glow implementation | Inline style on each button | `default` variant in `buttonVariants` CVA | Single source of truth; all `variant="default"` buttons inherit automatically |
| New badge component for status pills | Custom `<StatusPill>` component | `<Badge className={bgClass + ' ' + textClass}>` | Badge already handles sizing, rounded corners, icon sizing |

**Key insight:** Every pattern in this phase reuses existing infrastructure. New code is additive to existing records and variants, not net-new components.

---

## Common Pitfalls

### Pitfall 1: Status-bg token alias syntax
**What goes wrong:** Using `bg-status-open-bg` when Tailwind did not generate that utility, or using `bg-[var(--color-status-open-bg)]` when the alias does exist and the shorter form works.
**Why it happens:** Tailwind v4 generates utilities from `--color-*` aliases in `@theme inline`. The alias is `--color-status-open-bg`, so `bg-status-open-bg` DOES work (the `--color-` prefix is stripped).
**How to avoid:** Use the short alias form `bg-status-open-bg` — this is consistent with how `bg-status-open` is used for border and text in the existing codebase. Verify each token exists in the `@theme inline` block in globals.css.
**Warning signs:** If the pill background is not rendering in dev, check that the alias name matches exactly (no double-`bg`, correct hyphen position).

### Pitfall 2: Box-shadow glow breaking dark mode
**What goes wrong:** Glow color is a hardcoded OKLCH literal that doesn't adapt to dark-mode's lighter `--primary` value.
**Why it happens:** Dark mode changes `--primary` from `oklch(0.52 0.26 27)` to `oklch(0.63 0.26 27)`. A hardcoded OKLCH in the shadow ignores this.
**How to avoid:** Reference `var(--color-primary)` in the `box-shadow` value so it picks up whichever `--primary` is active. In Tailwind arbitrary syntax: `hover:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_25%,transparent)]` — or use a simpler HSL-style approach. Alternatively apply the glow via a `@layer components` rule that uses `color-mix` or CSS `color()`.
**Warning signs:** Glow looks correct in light mode but is either invisible or wrong-colored in dark mode.

### Pitfall 3: TicketPanel "Send to Kitchen" already has h-11 inline
**What goes wrong:** The TicketPanel footer `<Button>` at line 148 already has `className="h-11 px-5 font-semibold"` applied inline, which currently overrides the `default` size height. When `size="cta"` is added, the inline `h-11` becomes redundant.
**Why it happens:** This button was manually sized before the `cta` variant existed.
**How to avoid:** When upgrading this button to `size="cta"`, remove the inline `h-11 px-5` — they're now provided by the variant. Keep only `font-semibold` if it differs from the variant's value.

### Pitfall 4: KdsRecallTray caps inconsistency
**What goes wrong:** KdsRecallTray uses `text-[10px]` (not `text-xs`) and `text-muted-foreground/60` (with opacity modifier). The `.caps` utility defines `text-xs` and `text-muted-foreground` without opacity.
**Why it happens:** The recalled tray label was styled as a visually subdued secondary label and manually tuned.
**How to avoid:** Apply `.caps` and drop the opacity modifier — the `text-muted-foreground` token at full opacity matches the caps spec. The `text-[10px]` → `text-xs` upgrade is intentional (standardization). Verify the visual result is acceptable.

### Pitfall 5: Payment page "Items" section label not matching caps spec
**What goes wrong:** The Items section label in `payment/[tableId]/page.tsx:165` uses `text-sm font-medium text-muted-foreground uppercase mb-2 tracking-wide` — `text-sm` instead of `text-xs`, and `font-medium` instead of `font-semibold`.
**Why it happens:** This label was authored separately from the manager tab labels and drifted in size and weight.
**How to avoid:** When replacing with `.caps`, the label visually becomes smaller. Verify with stakeholder that `text-xs` is acceptable at this viewport position. If not, consider leaving this one instance with a slightly larger cap style or documenting it as an intentional exception.

### Pitfall 6: KDS DEMO badge is a special case
**What goes wrong:** The amber-colored "DEMO" badge at `kds/page.tsx:57` also uses `uppercase tracking-wide font-semibold text-[11px]` — it looks like a caps label but it's a status indicator, not a section label.
**Why it happens:** Visually it resembles a caps label but semantically it's an inline status chip.
**How to avoid:** Do NOT apply `.caps` here. This badge has its own specific background/foreground colors (`bg-amber-100 text-amber-700`). It is already a pill shape and serves a different purpose. Leave it as-is.

---

## Code Examples

Verified patterns from codebase inspection:

### Existing active:scale pattern to replicate (TableTile)
```tsx
// src/components/table-map/TableTile.tsx:42
className={`... active:scale-[0.97] transition-transform ...`}
```
Add the same two classes to the base cva string in `button.tsx`.

### Existing button default variant (current state)
```typescript
// src/components/ui/button.tsx:13
default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
```
After COMP-01: add hover glow shadow to this string.

### Existing TicketPanel running total (current state)
```tsx
// src/components/order/TicketPanel.tsx:145
<p className="text-xl font-bold leading-tight">฿{runningTotal.toFixed(0)}</p>
```
After COMP-04: `text-2xl font-black text-primary` (drop `leading-tight` or keep — won't affect layout).

### Existing TotalsSection grand total (current state)
```tsx
// src/components/payment/TotalsSection.tsx:95-97
<div className="flex justify-between border-t pt-3">
  <span className="font-bold text-base">Total</span>
  <span className="font-bold text-base">฿{grandTotal.toLocaleString()}</span>
</div>
```
After COMP-04: the amount `<span>` becomes `text-2xl font-black text-primary`. The label `"Total"` stays as-is or gets `.caps`.

### All confirmed inline caps occurrences to replace

| File | Line | Current Classes | Replace With |
|------|------|----------------|--------------|
| `TicketPanel.tsx` | 119 | `text-[10px] font-bold tracking-widest uppercase text-muted-foreground` | `caps` |
| `TicketPanel.tsx` | 144 | `text-[11px] text-muted-foreground uppercase tracking-wide font-medium` | `caps` (this is the "Total" label — keep or make `caps`) |
| `SalesSnapshotTab.tsx` | 53 | `text-xs font-semibold text-muted-foreground uppercase tracking-wide` | `caps` |
| `KdsBoard.tsx` | 60 | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` | `caps` (tracking-widest → tracking-wide via utility) |
| `KdsRecallTray.tsx` | 18 | `text-[10px] font-semibold text-muted-foreground/60 uppercase` | `caps` (drop opacity; text-xs) |
| `payment/[tableId]/page.tsx` | 165 | `text-sm font-medium text-muted-foreground uppercase mb-2 tracking-wide` | `caps mb-2` (size change: sm→xs — verify visually) |
| `EodSummaryTab.tsx` | 110 | `text-xs font-semibold text-muted-foreground uppercase tracking-wide` | `caps` |
| `EodSummaryTab.tsx` | 121 | same | `caps` |
| `EodSummaryTab.tsx` | 131 | same | `caps` |
| `EodSummaryTab.tsx` | 140 | same | `caps` |
| `EightySixTab.tsx` | 28 | `text-xs font-semibold text-muted-foreground uppercase tracking-wide` | `caps` |
| `OpenTicketsTab.tsx` | 42 | `text-xs font-semibold text-muted-foreground uppercase tracking-wide` | `caps` |
| `OpenTicketsTab.tsx` | 95 | same | `caps` |

Note: `KdsItemRow.tsx:73` has `uppercase font-semibold` on a modifier badge — this is NOT a section label. Leave as-is.

### Elevation application targets (COMP-03)

| Component | Current | Target Elevation Tier | Method |
|-----------|---------|----------------------|--------|
| Menu cards (MenuPanel) | `border border-border` only | Flat → raised (`--shadow-card`) | `style={{ boxShadow: 'var(--shadow-card)' }}` |
| TicketPanel column | `border-l border-border` only | Raised (`--shadow-panel`) | `style={{ boxShadow: 'var(--shadow-panel)' }}` on the column div |
| TableBottomSheet panel | `shadow-lg` (Tailwind default) | Floating (`--shadow-floating`) | Replace `shadow-lg` with `style={{ boxShadow: 'var(--shadow-floating)' }}` |
| EodSummaryTab cards | `rounded-lg border bg-card` | Flat (`--shadow-card`) | `style={{ boxShadow: 'var(--shadow-card)' }}` |
| SalesSnapshotTab StatCards | `rounded-lg border bg-card` | Flat (`--shadow-card`) | `style={{ boxShadow: 'var(--shadow-card)' }}` |
| ReceiptScreen details card | `rounded-xl border bg-card` | Raised (`--shadow-panel`) | `style={{ boxShadow: 'var(--shadow-panel)' }}` |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@layer utilities { .cls { @apply ... } }` | `@utility cls { ... }` | Tailwind v4 | v3 syntax silently produces no output in v4 |
| Arbitrary shadow: `shadow-[0_4px_6px_...]` | `style={{ boxShadow: 'var(--shadow-panel)' }}` | Phase 10 decision | Dark mode shadow adapts automatically |
| Hardcoded palette in STATUS_CONFIG | `--color-status-*` token references | Phase 10 (TOKEN-04) | Tokens already migrated; Phase 11 only adds bgClass |

---

## Open Questions

1. **Exact box-shadow value for primary button glow**
   - What we know: Primary color is `oklch(0.52 0.26 27)` in light, `oklch(0.63 0.26 27)` in dark. 20–30% opacity spread glow is the target feel.
   - What's unclear: Whether `color-mix(in oklch, var(--color-primary) 25%, transparent)` is supported in the target browsers (modern WebKit/Blink — yes; older Safari — may need fallback).
   - Recommendation: Use `oklch(0.52 0.26 27 / 0.25)` as the fallback hardcode in light, but test dark mode. If the CSS `var()` in `box-shadow` works (it should in all target browsers for a PWA), use `var(--color-primary)` with opacity modifier syntax inside the shadow.

2. **KDS ticket status badge token mapping**
   - What we know: KDS stages are `New`, `InProgress`, `Ready`. No KDS-specific status tokens exist.
   - What's unclear: Whether to map to table status tokens (New→open-bg, InProgress→check-requested-bg, Ready→cleaning-bg) or define KDS-specific tokens.
   - Recommendation: Reuse table status tokens. `New` → `open-bg` (green = awaiting action), `InProgress` → `check-requested-bg` (amber = active work), `Ready` → `reserved-bg` (blue = done/waiting collection). This avoids new token definitions and the semantic meaning is close enough for a wireframe.

3. **Payment page "Items" section label size regression**
   - What we know: Currently `text-sm`, `.caps` would make it `text-xs`.
   - What's unclear: Whether this visual regression is acceptable in the payment context.
   - Recommendation: Apply `.caps` and flag in the plan for visual verification. The payment screen is staff-facing and uses a fixed max-width container, so the text size reduction is not a readability concern.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — this is a browser-based Hi-Fi wireframe with no automated test suite |
| Config file | None |
| Quick run command | `npm run build` (TypeScript compilation + Tailwind CSS generation) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | `cta` size variant renders at 44px, `default` variant has hover glow | Manual visual + TypeScript compile | `npm run build` | N/A — no test file |
| COMP-02 | Status pills render with filled background, all 5 states distinguishable | Manual visual | `npm run build` | N/A |
| COMP-03 | Cards/panels/floating sheets show distinct elevation tiers | Manual visual | `npm run build` | N/A |
| COMP-04 | Grand total renders as `text-2xl font-black text-primary` | Manual visual + TypeScript compile | `npm run build` | N/A |
| COMP-05 | All inline caps patterns replaced; `.caps` utility compiles correctly | TypeScript compile + visual grep | `npm run build` | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (confirms TypeScript and Tailwind compilation)
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build passes and all 5 requirements verified visually at `/table-map`, `/order/[tableId]`, `/payment/[tableId]`, `/kds`, `/manager` before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure is expected for this wireframe project. TypeScript strict mode (`tsconfig.json`) and build-time Tailwind compilation serve as the primary automated checks.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — all source files read at time of research
- `src/app/globals.css` — confirmed `@theme inline` aliases for all `--color-status-*-bg` tokens; confirmed shadow token values
- `src/components/ui/button.tsx` — confirmed CVA structure, existing size variants, no `active:scale` in base
- `src/components/table-map/TableTile.tsx` — confirmed STATUS_CONFIG shape (borderClass, textClass, label, Icon — no bgClass yet)
- `src/components/order/TicketPanel.tsx` — confirmed line 145 as `text-xl font-bold`
- `src/components/payment/TotalsSection.tsx` — confirmed lines 96–97 as `font-bold text-base`
- `.planning/phases/11-component-polish/11-CONTEXT.md` — locked decisions and discretion areas
- `.planning/config.json` — `nyquist_validation: true`

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 `@utility` directive behavior — inferred from the `@source not` and `@theme inline` patterns already in use in the project; consistent with Tailwind v4 documentation patterns

### Tertiary (LOW confidence)
- `color-mix()` browser support for box-shadow opacity — behavior in older Safari; modern PWA target should be safe

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; verified from package.json and existing usage
- Architecture: HIGH — all patterns directly verified from source files and existing Phase 10 decisions
- Pitfalls: HIGH — all identified from direct code inspection, not speculation
- Inline caps audit: HIGH — grep confirmed all 13 occurrences with exact file + line numbers

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable codebase; only risk is if Tailwind v4 minor update changes `@utility` behavior)
