# Phase 11: Component Polish - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply bold brand expression to interactive surfaces throughout all screens — touch-target buttons with glow and press scale, filled status pill badges using Phase 10 semantic tokens, elevation on cards and panels, hero price readouts, and consistent caps section labels via a shared utility class.

No new features. No layout changes beyond what component-level styling naturally produces.

</domain>

<decisions>
## Implementation Decisions

### Button sizing & glow (COMP-01)
- Add a `cta` size variant to `buttonVariants` in `button.tsx`: `h-11` (44px) with appropriate horizontal padding
- Existing sizes (`xs`, `sm`, `default`, `lg`) remain unchanged — no regressions
- Primary CTAs across all screens (Send to Kitchen, Confirm Payment, Open Table, etc.) explicitly opt in with `size="cta"`
- Crimson glow shadow: CSS `box-shadow` with primary color, appears **on hover/active only** (not at rest)
- Press scale: `active:scale-[0.97]` added to Button base `cva` classes — matches TableTile's existing press behavior
- Glow scope: all `variant="default"` buttons get the hover glow — lives in the `default` variant style, no manual opt-in required

### Status badge pills (COMP-02)
- **Implementation:** Add `bgClass` to `STATUS_CONFIG` in `TableTile.tsx` alongside existing `textClass` and `borderClass`
- Render status as `<Badge>` component with `className={bgClass + ' ' + textClass}` — reuses existing badge.tsx, minimal new code
- Background fills use Phase 10 `--color-status-*-bg` tokens (e.g., `bg-[var(--color-status-open-bg)]`)
- **Icon stays inside the pill** — icon + label inside the filled chip for readability under dim restaurant lighting
- **Auto-width** based on label length — natural pill sizing, no fixed min-width
- **KDS included:** Same filled pill badge style applies to KDS ticket status badges (New / InProgress / Ready) using the same status-bg token approach

### Price hero readouts (COMP-04)
- **Hero treatment applies to grand totals only** — not subtotals, VAT, or line item prices
  - `TicketPanel` footer running total: `text-xl font-bold` → `text-2xl font-black text-primary`
  - `TotalsSection` grand total: `font-bold text-base` → `text-2xl font-black text-primary`
- **Layout unchanged** — TicketPanel footer keeps existing flex row (total left, button right); `text-2xl` accommodates without layout change
- **Grand total in crimson** (`text-primary`) — makes the payment amount the brand moment on both order and payment screens
- **Line item prices** stay `text-sm` normal weight — supporting information, not competing with the hero total

### Caps section labels (COMP-05)
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

</decisions>

<specifics>
## Specific Ideas

- Button press scale `active:scale-[0.97]` is already the TableTile pattern — match it exactly for visual consistency across all tappable surfaces
- The crimson grand total is intended as a brand moment: the number the customer pays. It should feel bold and intentional, not alarming
- Status pills with filled backgrounds will dramatically improve the table map's readability under dim restaurant lighting — redundant cues (color + icon + label) reinforce status for busy staff

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — `buttonVariants` cva; add `cta: "h-11 gap-2 px-6 ..."` to `size` variants; add `active:scale-[0.97]` to base; add hover glow to `default` variant
- `src/components/ui/badge.tsx` — Badge component accepts `className` override; use for status pills with bgClass from STATUS_CONFIG
- `src/components/table-map/TableTile.tsx` — `STATUS_CONFIG` record maps `TableStatus` → `{ borderClass, textClass, label, Icon }`; add `bgClass` here
- `src/app/globals.css` — Define `.caps` here as `@utility` block; Phase 10 token architecture already in place
- `src/components/order/TicketPanel.tsx:145` — `text-xl font-bold` → `text-2xl font-black text-primary`
- `src/components/payment/TotalsSection.tsx:97` — `font-bold text-base` → `text-2xl font-black text-primary`

### Established Patterns
- `active:scale-[0.97] transition-transform` — already in TableTile button; replicate in Button base cva
- Token architecture: CSS vars in `:root`/`.dark`, aliased in `@theme inline` — status-bg tokens follow this pattern
- `@utility` Tailwind v4 syntax for custom utilities in globals.css
- Inline caps pattern (existing): `text-xs font-semibold text-muted-foreground uppercase tracking-wide` — multiple occurrences to replace

### Integration Points
- `button.tsx` buttonVariants — add `cta` size + `active:scale-[0.97]` base + hover glow in `default` variant
- `badge.tsx` — no changes to variants; STATUS_CONFIG drives className
- `TableTile.tsx` STATUS_CONFIG — add `bgClass` field per status; render `<Badge>` instead of colored `<span>`
- `KdsTicketCard.tsx` — update status color inline classes to use Badge + status-bg tokens
- `globals.css` — add `.caps` utility block
- All files with inline caps pattern — replace with `caps` className

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-component-polish*
*Context gathered: 2026-03-12*
