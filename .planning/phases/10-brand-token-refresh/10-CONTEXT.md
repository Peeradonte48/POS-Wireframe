# Phase 10: Brand Token Refresh - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Make `globals.css` the single authoritative source for design tokens — stronger crimson primary, full semantic status palette for all 5 table states, 3-tier elevation system, and zero hardcoded Tailwind palette classes remaining in `TableTile.tsx`, `KdsTicketCard.tsx`, and `AppSidebar.tsx`.

No new components. No visual redesign beyond what token replacement naturally produces.

</domain>

<decisions>
## Implementation Decisions

### Crimson Primary (TOKEN-01)
- Light mode target: `oklch(0.52 0.26 27)` — chroma bumped from 0.22 → 0.26
- Dark mode target: `oklch(0.63 0.26 27)` — same chroma boost, same L as current dark value
- Both `:root` and `.dark` blocks in `globals.css` must be updated
- Gamut verification is Claude's discretion — planner decides the approach

### Status Hue Palette (TOKEN-02)
- `Occupied` uses a **distinct semantic red** — NOT the brand crimson (`--primary`). Occupied must not visually compete with primary CTA buttons.
- `Cleaning` uses a **warm neutral** — low chroma, warm hue angle (~40–60), not cool gray. Fits the A Ramen warm palette.
- `Open`, `Reserved`, `CheckRequested` keep their current semantic hue families (green, blue, amber) — these are standard semantic signals.
- Token shape: **both bg + fg tokens per status**
  - `--color-status-open` (text/border, full saturation)
  - `--color-status-open-bg` (pill background, muted/light)
  - Same pattern for all 5 states: open, occupied, reserved, check-requested, cleaning
- Dark mode: **independently tuned values** in `.dark` block — muted/matte colors appropriate for dark backgrounds, not just opacity-reduced light values

### Elevation Depth System (TOKEN-03)
- Three tiers: `flat` (menu cards), `raised` (ticket panel, info panels), `floating` (modals/sheets)
- Visual weight: **subtle SaaS-style** — soft, low-contrast shadows (like Notion/Linear). Depth is felt, not seen.
- Floating tier: **shadow only** — `--shadow-floating` token on the panel itself. No additional overlay scrim (Dialog already handles that).
- Token names to follow REQUIREMENTS.md conventions: `--shadow-card`, `--shadow-panel`, with Claude's discretion on `--shadow-floating` name
- Dark mode: **glow/border approach** — in dark mode, shadow tokens resolve to subtle inset border or faint outer glow instead of shadow. Standard dark UI pattern.

### Hardcoded Class Replacement (TOKEN-04)
- Target files confirmed: `TableTile.tsx` (STATUS_CONFIG borderClass + textClass), `KdsTicketCard.tsx` (inline status colors), `AppSidebar.tsx` (inline role-state colors)
- Replace raw Tailwind palette classes (`bg-green-500`, `text-red-600`, `bg-amber-50`, etc.) with semantic token references
- No raw palette classes should remain in these three files after the phase

### Claude's Discretion
- Exact OKLCH values for status token colors (within the chosen hue families and warm/neutral constraints)
- Exact shadow blur/spread/offset values for the three elevation tiers
- Whether to name the floating tier `--shadow-floating` or `--shadow-overlay`
- How to implement dark-mode glow effect (border vs box-shadow with light color)
- sRGB gamut verification approach for the new crimson values

</decisions>

<specifics>
## Specific Ideas

- STATE.md already flagged the 0.26 chroma target before this discussion — confirms the direction
- `@theme inline` rule applies here: all token values must stay in `:root` / `.dark` blocks as CSS vars; the `@theme inline` block only aliases them with `var()` — never put literal OKLCH in `@theme inline` (dark mode silently breaks)
- TableTile's `STATUS_CONFIG` maps `borderClass` and `textClass` strings — the refactor should replace these strings with token-based CSS class names or inline CSS var references

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css` — `@theme` + `@theme inline` + `:root` + `.dark` blocks fully established; add new tokens following existing pattern
- `src/components/table-map/TableTile.tsx` — `STATUS_CONFIG` record maps `TableStatus` → `{ borderClass, textClass, label, Icon }`; this is the integration point for status token replacement

### Established Patterns
- Token architecture: CSS vars defined in `:root` / `.dark`, then aliased in `@theme inline` with `var()` — never literal values in `@theme inline`
- Tailwind v4 CSS-first: no `tailwind.config.js`; all customization is in `globals.css` via `@theme` blocks
- Dark mode via `.dark` class (next-themes) — all dark overrides live in `.dark {}` selector block

### Integration Points
- `globals.css` — all new token definitions go here (`:root`, `.dark`, `@theme inline`)
- `TableTile.tsx` `STATUS_CONFIG` — replace string class values with token-based references
- `KdsTicketCard.tsx` — status color inline classes need token replacement
- `AppSidebar.tsx` — role-state color classes (`bg-amber-50`, `text-amber-700`, `text-red-500`, `bg-green-600`) need token replacement

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-brand-token-refresh*
*Context gathered: 2026-03-12*
