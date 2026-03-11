# Feature Research — UI Brand Polish (v1.1)

**Domain:** Bold & Energetic Restaurant POS — Dark-Mode UI Polish for A Ramen
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH — primary evidence from codebase audit + UI design research; competitor POS UI patterns from industry knowledge (Toast, Square, Lightspeed); web search verified for dark-mode semantics, OKLCH, badge/button design patterns.

---

## Research Scope

This file answers the v1.1 milestone question: **what UI component treatments make a restaurant POS feel "bold and energetic" vs. generic?**

The focus is **four component categories**:
1. Button design (primary CTA, icon buttons, destructive)
2. Status badges (table state, order stage)
3. Cards and panels (menu cards, ticket panel, KDS card, info panels)
4. Typography and hierarchy

All findings are anchored to the existing A Ramen brand tokens:
- Primary crimson: `oklch(0.52 0.22 27)` (light) / `oklch(0.63 0.22 27)` (dark)
- Dark mode base: `oklch(0.145 0 0)` background, `oklch(0.205 0 0)` card
- Radius: `0.625rem` base (`--radius`)
- Icon set: Solar (flat, linear style)
- Font: Inter + Noto Sans Thai/JP

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features staff and stakeholders will immediately notice are missing. These are the floor of "competent POS UI" — not having them reads as unfinished or amateurish.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Primary CTA button uses brand color at full saturation | Every premium POS (Toast, Square, Lightspeed) uses their primary brand color — not muted — for the key action. Missing this = the UI feels like a gray generic SaaS template. | LOW | Current `bg-primary` is correct; the gap is no shadow, no pressed-state depth, no 44px enforcement on CTAs |
| Status badges use semantic color (not just border-left accent) | Staff need to read table status at a glance under bright restaurant lighting. Semantic color fill (green/amber/red/blue) in the badge chip itself — not just a border stripe — is expected in any POS floor plan. | LOW | Current TableTile uses `border-l-4` colored stripe + muted icon. Badge chip needs colored bg fill |
| Pressed / active feedback on touch targets | Tablet POS staff tap fast and repeatedly. Active scale (`active:scale-95`, `active:scale-97`) is the tactile signal the tap registered. Missing it = the UI feels unresponsive. | LOW | Already present on MenuPanel cards (`active:scale-[0.98]`). Missing on primary Button, KDS BUMP, ticket qty stepper |
| 44px minimum touch target on ALL interactive elements | iOS HIG and Material Design both mandate 44–48px for touch targets. POS use case (fast service, gloves possible) makes this even more critical. | LOW | Current Button `h-8` (32px) default is under spec. Send to Kitchen has `h-11` — inconsistent |
| Consistent border-radius language | Premium POS systems use one clear radius philosophy. Mixing `rounded-lg`, `rounded-xl`, `rounded-4xl` (current badge) without a rule looks accidental. | LOW | Need to define: CTAs = `rounded-lg`, badges = `rounded-full`, cards = `rounded-xl`, modals = `rounded-2xl` |
| Text hierarchy: 3 clear weight levels | At a glance scannable. Price > item name > modifier detail. Missing clear weight differentiation = staff reads more slowly. | LOW | Current: mix of `font-semibold`, `font-bold`, `font-medium` but not systematized. Prices are inconsistently sized |
| Muted/disabled states visually distinct | Staff must not accidentally tap disabled actions. Opacity alone is insufficient — color shift needed. | LOW | Current `disabled:opacity-50` is the only cue. No color shift or cursor: not-allowed visibility |

### Differentiators (Competitive Advantage)

Features that elevate A Ramen's POS from "competent" to "brand-distinctive." These are what make stakeholders say "this looks like our restaurant" rather than "this looks like a template."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Crimson shadow / glow on primary CTA | The single highest-impact brand expression in dark mode. A `box-shadow: 0 0 12px oklch(0.63 0.22 27 / 40%)` under the "Send to Kitchen" button ties the action to the A Ramen brand viscerally. No generic POS does this. | LOW | Pure CSS — one line per button variant. Tailwind: `shadow-[0_0_12px_oklch(0.63_0.22_27/40%)]` in dark mode. Applies to primary variant only |
| Status badges as filled pills with brand palette | Rather than bare `border-left` stripes, filled color pills (`bg-green-500/20 text-green-400 border border-green-500/30`) for each table status communicate state instantly and look intentional. Industry-standard in premium POS (Square for Restaurants uses colored tiles; Toast uses colored section headers). | LOW | Replace `border-l-4` stripe + text-color pattern in TableTile with a proper badge chip. 5 semantic colors needed: green (Open), crimson (Occupied), blue (Reserved), amber (CheckRequested), gray (Cleaning) |
| Uppercase tracking on section labels | The `text-[10px] font-bold tracking-widest uppercase` pattern in TicketPanel is a premium typographic micro-treatment. Extending this consistently to ALL section headers (KDS card header, manager tabs, payment sections) creates a cohesive brand voice. | LOW | Currently only in TicketPanel round labels. Should be a named pattern: `label-caps` utility |
| KDS BUMP button: full-width, high-contrast, brand green | The BUMP button is the kitchen staff's most-tapped element. Currently uses raw `bg-green-600`. Should be styled with consistent `rounded-lg`, `font-bold`, `active:scale-[0.97]`, and on-brand sizing. "Check all items" blocked state needs a visually distinct treatment (not just grayed out). | LOW | Currently a raw `<button>` with no shadcn variant. Migrate to `<Button>` variant or custom CTA pattern |
| Card elevation tiers: 1-flat / 2-raised / 3-floating | Bold UIs use z-depth to communicate hierarchy. Flat = info display. Raised = interactive element. Floating = active/selected. In dark mode, this is achieved with background lightness steps (`--card` vs `--muted` vs explicit highlight bg), not drop shadows. | MEDIUM | Define 3 tiers: (1) `bg-card` no shadow — base display; (2) `bg-card border-primary/20 shadow-sm` — interactive hover; (3) `bg-primary/10 border-primary/40` — active/selected state |
| Brand-colored nav active state with indicator line | Current sidebar active state is `bg-primary text-primary-foreground` (solid fill). A more refined treatment: thin left-side `border-l-2 border-primary` + `bg-primary/10 text-primary` — more energetic and modern than the flat pill. | LOW | One class change in AppSidebar. Matches Lightspeed's side-nav pattern |
| Price as hero text in ticket/bill | The running total in TicketPanel (`text-xl font-bold`) should be `text-2xl font-black` in dark mode with brand crimson color. Price is the most important number a staff member looks at. Making it look like body text undersells the design. | LOW | Only applies to the "Total" readout in TicketPanel footer and payment totals |
| Spice level selector with colored flame icons | Current implementation exists — this differentiator is about ensuring the flame icons use a gradient from green (1) to crimson (5), making the selector feel branded and intuitive simultaneously. | LOW | The selector exists; add color graduation: L1 `text-green-400` → L3 `text-amber-400` → L5 `text-brand-red` |

### Anti-Features (Commonly Requested, Often Problematic)

Patterns that seem like "making it more bold" but create UX problems in a working POS context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Gradient background on main app shell | "Energetic" brands use gradients. Popular on marketing sites. | Under bright restaurant lighting and on lower-quality tablet screens, gradients on backgrounds make text hard to read and create visual noise during fast-paced service. Dark flat surfaces work better for information density. | Use gradient ONLY on the login/shift-open screen (low-density, one-time view). Keep app shell backgrounds flat `--background`. |
| Animated shimmer / glow pulse on all CTAs | Draws attention. "Feels premium." | On a working POS, continuous animation on buttons distracts staff mid-service. Animation should only appear as a response to interaction (pressed, loading), not ambient. | Use `active:scale` and `transition-transform` for pressed feedback. Reserve pulsing animation for loading states. |
| Full crimson fill on ALL interactive surfaces | Brand consistency. | Saturated crimson everywhere destroys hierarchy — if everything is primary color, nothing is primary color. Staff can't locate the key action. | Reserve `bg-primary` fill for ONE CTA per screen (the next logical action). Secondary actions use `variant="outline"` or `variant="ghost"`. |
| Dense icon decorations on every card | "Character" and brand energy. | Menu cards already have food photos. Adding icon decorations to every card increases visual noise and slows scan speed. | Use icons purposefully: status icons in status rows (already correct), action icons in action buttons, no decorative icons. |
| Heavy drop shadows everywhere (neumorphism) | Depth and premium feel. | In dark mode, neumorphic shadows require light source simulation that is computationally expensive and rarely renders well on tablet GPU. Also physically inconsistent with flat Solar icon style. | Use background lightness steps for elevation, not shadows. `bg-muted/30` vs `bg-card` vs `bg-background` communicates depth without shadows. Reserve `shadow-sm` for floating panels (modifier sheet, modal). |
| Multiple font weights (Thin, Regular, Medium, Semibold, Bold, Black) simultaneously | Rich typographic palette. | More than 3 effective weight levels on one screen creates visual noise, not hierarchy. | Limit to: `font-medium` (body/secondary), `font-semibold` (labels/item names), `font-bold` / `font-black` (prices, primary heading). That is the full hierarchy needed. |

---

## Feature Dependencies

```
Bold & energetic brand expression
    |
    ├── Brand tokens (ALREADY EXISTS)
    │     --primary: oklch(0.63 0.22 27)  [dark mode]
    │     --card, --muted, --background   [surface hierarchy]
    │     --radius: 0.625rem              [radius base]
    │
    ├── Button system redesign
    │     └── requires: Token audit (confirm --primary contrast in dark mode)
    │     └── enables: CTA shadow/glow, pressed feedback, 44px enforcement
    │     └── downstream: All screens that use Button component
    │
    ├── Badge system redesign
    │     └── requires: Semantic color token decisions (green/amber/red/blue/gray)
    │     └── enables: TableTile status pills, order stage indicators
    │     └── note: Do NOT conflict with existing `destructive` semantic in token system
    │
    ├── Card/panel elevation tiers
    │     └── requires: Background token hierarchy exists (bg-card, bg-muted, bg-primary/10)
    │     └── enables: MenuPanel card hover, KDS card active, selected table highlight
    │     └── complexity: MEDIUM — must audit all card usages across 6+ screens
    │
    ├── Typography system
    │     └── requires: Nothing — pure CSS weight/size decisions
    │     └── enables: Section label caps pattern, price hero text, heading scale
    │     └── risk: Changing font weights may break existing line-clamp layouts
    │
    └── Spice selector color graduation
          └── requires: Spice selector component to exist (ALREADY EXISTS)
          └── enables: Branded modifier experience
          └── complexity: LOW — 5 color class assignments
```

### Dependency Notes

- **Button system requires token audit first:** The dark-mode `--primary` at `oklch(0.63 0.22 27)` is lighter than the light-mode version. Before adding shadow/glow, confirm contrast ratio of `--primary-foreground: oklch(0.10 0 0)` against this value passes WCAG AA. If it does not, adjust lightness before adding visual embellishment.
- **Badge system must not conflict with destructive token:** `--destructive: oklch(0.704 0.191 22.216)` in dark mode is already a warm red-orange. The "Occupied" table badge (intended as crimson/red) must be distinct from the destructive token visually. Use `text-red-400 bg-red-500/15` rather than `text-destructive` to avoid semantic confusion.
- **Card elevation tiers enhance all screens:** This is a global pattern change. Apply after button and badge systems are confirmed — so elevation can reference primary-colored borders correctly.
- **Typography changes are lowest risk, highest perceived-polish impact:** Do typography last — it has no component dependencies and produces visible improvement with minimal code surface.

---

## MVP Definition

### This milestone's "launch with" (v1.1 brand polish)

- [ ] Button: primary variant gets `h-11` (44px), crimson glow/shadow in dark mode, `active:scale-[0.97]` pressed feedback
- [ ] Button: destructive variant gets filled treatment (`bg-destructive text-white`) — current 10% opacity is too subtle for a POS void action
- [ ] Status badges: TableTile uses filled pill chips with 5 semantic colors, replacing the `border-l-4` stripe approach
- [ ] KDS BUMP button: migrated to consistent Button component, full-width, 44px, `active:scale` feedback
- [ ] Cards: MenuPanel cards get consistent hover state (`hover:border-primary/40 hover:shadow-sm`) + `active:scale-[0.97]`
- [ ] Typography: Section headers get `label-caps` utility (`text-[10px] font-bold tracking-widest uppercase text-muted-foreground`) applied consistently across all screens
- [ ] Typography: Price readouts (`฿XXXX`) promoted to `text-2xl font-black text-primary` in ticket footer and payment summary

### Add after core is stable (v1.1.x)

- [ ] Nav sidebar: active state refined to indicator-line pattern (`border-l-2 border-primary bg-primary/10 text-primary`)
- [ ] Spice selector: color graduation green → amber → crimson across 5 levels
- [ ] Card elevation: 3-tier system audited and applied across all info panels

### Future consideration (v2+)

- [ ] Animated entrance states for KDS tickets (slide-in from right on new order)
- [ ] Login screen gradient background (brand moment at start of shift)
- [ ] Haptic feedback on bump/send (requires native PWA capabilities)

---

## Feature Prioritization Matrix

| Feature | Staff Value | Implementation Cost | Priority |
|---------|-------------|---------------------|----------|
| CTA button 44px + crimson glow | HIGH — core action clarity | LOW — CSS tokens | P1 |
| Destructive button filled | HIGH — void action legibility | LOW — variant change | P1 |
| TableTile status badge pills | HIGH — floor plan scan speed | LOW-MEDIUM — TableTile + STATUS_CONFIG refactor | P1 |
| KDS BUMP consistency | HIGH — kitchen staff ergonomics | LOW — component migration | P1 |
| Section header caps pattern | MEDIUM — polish, not function | LOW — utility class | P1 |
| Price hero text promotion | MEDIUM — billing moment clarity | LOW — text class change | P1 |
| MenuPanel card hover/active | MEDIUM — order entry fluidity | LOW — class additions | P2 |
| Nav sidebar indicator-line state | LOW-MEDIUM — wayfinding polish | LOW — class change | P2 |
| Spice selector color graduation | MEDIUM — brand moment | LOW — 5 color classes | P2 |
| Card elevation tier system | MEDIUM — depth and hierarchy | MEDIUM — audit all screens | P2 |

**Priority key:**
- P1: Must have for v1.1 — directly addresses the "bold & energetic" milestone goal
- P2: Should have — elevates from good to great
- P3: Nice to have — defer to v1.1.x or v2

---

## Competitor Feature Analysis — UI Design Patterns

| UI Pattern | Toast POS | Square for Restaurants | Lightspeed Restaurant | A Ramen v1.0 (current) | A Ramen v1.1 target |
|------------|-----------|------------------------|----------------------|------------------------|----------------------|
| Primary CTA size | Large (44-52px), brand-colored, full-width on mobile | Large, brand green, full-width | Brand orange, full-width | `h-8` (32px) default — undersized | `h-11` (44px), brand crimson |
| Status badge type | Colored icon chips with text label | Full colored tile (green/red/gray) | Colored border + label | Border-left stripe only | Filled pill with semantic color |
| Dark mode surface depth | 2-3 elevation levels via card bg | Light-dominant, limited dark support | 2-tier (list bg vs card bg) | 2-tier correct, not brand-expressed | 3-tier: flat / raised / floating |
| Section label style | Uppercase, muted, small tracking | Bold, dark, larger | Tab-style, active underline | `tracking-widest uppercase` in ticket only | Consistent caps utility everywhere |
| Price display | Large, bold, right-aligned, prominent | Large amount, total highlighted | Clear hierarchy, total prominent | `text-xl font-bold` — undersized | `text-2xl font-black text-primary` |
| Pressed/active feedback | `active:scale` or background flash | Color darken on press | Subtle background darken | Present on menu cards only | Applied to all interactive elements |
| Icon button size | 44px minimum | 44px+ | 44px+ | `size-8` (32px) — undersized | `size-11` for primary actions |

---

## Sources

- Codebase audit: `/src/components/ui/button.tsx`, `badge.tsx`, `table-map/TableTile.tsx`, `order/TicketPanel.tsx`, `kds/KdsTicketCard.tsx`, `order/MenuPanel.tsx`, `app-shell/AppSidebar.tsx` — HIGH confidence
- Brand token audit: `/src/app/globals.css` — HIGH confidence
- OKLCH accessibility: [OKLCH in CSS — Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl), [LogRocket OKLCH guide](https://blog.logrocket.com/oklch-css-consistent-accessible-color-palettes) — MEDIUM confidence
- Dark mode typography: [Dark Mode UX 2025](https://www.influencers-time.com/dark-mode-ux-in-2025-design-tips-for-comfort-and-control/), [Dark Mode Best Practices 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/) — MEDIUM confidence
- Badge design semantics: [Badge UI Design — Cieden](https://cieden.com/book/atoms/badge/badge-ui-design), [Semantic Color System — DEV Community](https://dev.to/ynab/a-semantic-color-system-the-theory-hk7) — MEDIUM confidence
- Toast POS button color API: [Toast Dev Guide — POS Button Colors](https://doc.toasttab.com/doc/devguide/apiPosButtonColorHexCodesForLightAndDarkMode.html) — MEDIUM confidence (confirms dark mode button theming as a real system concern)
- CTA design best practices: [LogRocket CTA Button Design](https://blog.logrocket.com/ux-design/cta-button-design-best-practices/) — MEDIUM confidence
- POS UI design: [BPA POS — User Interface Design of POS](https://www.bpapos.com/blog/post/2024/10/10/User-Interface-Design-of-POS), [Lightspeed design your POS look](https://o-series-support.lightspeedhq.com/hc/en-us/articles/31329442916891-Design-your-POS-look-and-layout) — MEDIUM confidence
- Training data: Toast, Square for Restaurants, Lightspeed Restaurant UI patterns — MEDIUM confidence (knowledge through mid-2025)

---

*Feature research for: A Ramen POS v1.1 — Bold & Energetic UI Brand Polish*
*Researched: 2026-03-11*
