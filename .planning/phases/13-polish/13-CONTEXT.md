# Phase 13: Polish - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply CVA variants, elevation tokens, brand tokens, and responsive breakpoint fixes to all new v1.2 screens — `SplitSheet.tsx`, `SeatPaymentPanel.tsx`, and the `TableTile` split progress badge. Also replace Inter with IBM Plex Sans as the body font across the entire app. No new features — conformance with the v1.1 quality bar.

</domain>

<decisions>
## Implementation Decisions

### Settled Seat Badge
- Add `--status-settled` and `--status-settled-bg` semantic tokens to `globals.css` (cool green, OKLCH hue ~145), independently tuned for light and dark mode — same pattern as `--status-split`, `--status-occupied`, etc.
- Add `variant='settled'` to the `Badge` CVA in `badge.tsx` — `<Badge variant="settled">Settled</Badge>` component API

### Mode-Select Card Style
- Add `variant='option-card'` to the `Button` CVA in `button.tsx` — large card-style button with border, `shadow-card` elevation token, hover:border-primary transition
- Include a selected/active state: `aria-pressed` or `data-selected` triggers `border-primary bg-primary/5`
- Apply this variant to the Equal Split / Per Seat selector cards in `SplitSheet`
- This variant is forward-compatible with the merge bill table picker in Phase 14

### Responsive Seat Layout
- Seat picker buttons (Seat 1, Seat 2…) in per-seat assignment: replace `flex flex-wrap` with a horizontal scroll row (`flex overflow-x-auto gap-2 pb-1 snap-x`) — single row, no reflow regardless of seat count
- SplitSheet panel: keep `max-h-[85vh] overflow-y-auto` — no sticky header needed

### Font Family
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

</decisions>

<specifics>
## Specific Ideas

- The `option-card` Button variant will be reused directly in Phase 14's merge bill table picker — design it generically enough to accept any label/description content
- IBM Plex Sans is "technical humanist" — sharp and structured, fits a POS that needs authority while still feeling branded
- The `caps` utility is already defined in `globals.css` via `@apply` — use it everywhere section labels currently have inline uppercase classes

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/badge.tsx` — CVA `badgeVariants`, extend with `variant='settled'` in-place
- `src/components/ui/button.tsx` — CVA `buttonVariants`, extend with `variant='option-card'` in-place
- `src/app/globals.css` — `@theme` block for all tokens; `:root` + `.dark` sections for status tokens
- `caps` utility — already defined in `globals.css` via `@utility caps { @apply ... }`, use it

### Established Patterns
- Shadow tokens via `style={{ boxShadow: 'var(--shadow-*)' }}` — already used correctly in SplitSheet and SeatPaymentPanel (don't change these)
- OKLCH status tokens independently tuned in `.dark` — `--status-settled` follows same pattern as `--status-split` (lines 126-128 / 182-183 in globals.css)
- CVA extended in-place in `button.tsx` and `badge.tsx` — never wrap these components
- `next/font/google` pattern in `layout.tsx` — swap `Inter` for `IBM_Plex_Sans`, same variable/subset/display pattern

### Violated Patterns (POLISH-01 failures to fix)
- `SplitSheet.tsx` — Settled badge: `bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400` → replace with `<Badge variant="settled">`
- `SplitSheet.tsx` — Mode-select cards: raw `<button className="rounded-xl border-2 border-border hover:border-primary ...">` → `<Button variant="option-card">`
- `SplitSheet.tsx` — Back buttons: raw `<button className="text-sm text-muted-foreground ...">` → `<Button variant="ghost" size="sm">`
- `SplitSheet.tsx` — Section headers: `text-sm font-semibold text-muted-foreground uppercase tracking-wide` → `caps` utility

### Integration Points
- `src/app/layout.tsx` — font import swap (Inter → IBM_Plex_Sans)
- `src/app/globals.css` — new `--status-settled` / `--status-settled-bg` tokens in `:root` and `.dark`
- `src/components/ui/badge.tsx` — add `settled` variant to `badgeVariants`
- `src/components/ui/button.tsx` — add `option-card` variant to `buttonVariants`
- `src/components/payment/SplitSheet.tsx` — consume the new variants, fix all POLISH-01 violations

</code_context>

<deferred>
## Deferred Ideas

- Merge bill table picker (Phase 14 will use `variant='option-card'` — defined here but consumed there)
- Order tracking timeline styling (Phase 15)
- Sticky header inside SplitSheet — deferred, scrollable sheet is sufficient

</deferred>

---

*Phase: 13-polish*
*Context gathered: 2026-03-12*
