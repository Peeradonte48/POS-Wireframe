# Phase 7: Hi-Fi & Brand - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the wireframe to a Hi-Fi, demo-ready product with A Ramen brand identity applied to every screen. No new features — this phase transforms visual quality and completes all cross-cutting concerns (role gating, toasts, touch targets, empty/loading states).

**Phase redefined:** Original scope was "Polish" (POLISH-01–04). User chose to replace it with full Hi-Fi & Brand work, with all 4 POLISH requirements woven into the Hi-Fi implementation.

</domain>

<decisions>
## Implementation Decisions

### Brand Identity
- **Color direction:** Warm red / black Japanese style — deep red or crimson primary, black secondary, off-white/cream or near-white background
- **Logo:** Text wordmark "A Ramen" styled in brand colors — appears in AppHeader and login screen (no image asset required)
- **Dark mode:** Both light and dark mode supported (system preference toggle)

### Visual Style
- **Reference:** Toast POS / Square POS style — clean, minimal, high-contrast
- **Cards:** Subtle shadows, rounded corners, clear visual hierarchy — professional POS feel
- **Color usage:** Brand red for primary actions, status signals, and accents; black/dark for surfaces in dark mode
- **Imagery:** Unsplash food photography via static URLs for menu items in MenuPanel (no Unsplash API required)

### Typography
- Font family sourced from shadcn MCP — researcher should query shadcn MCP for current recommended font pairing
- Claude's discretion on exact pairing, but should match warm red/black brand aesthetic

### Icons
- **Replace Lucide React** with Solar Icon Set from: https://github.com/480-Design/Solar-Icon-Set
- Researcher should determine integration method (npm package vs SVG sprite vs individual SVG imports)
- All existing Lucide icon usages must be mapped to Solar equivalents during execution

### Screens
- **All screens** get full Hi-Fi treatment: Login, Table Map, Order Flow (MenuPanel + ModifierSheet + TicketPanel), KDS, Payment, Receipt, Manager Dashboard (all 4 tabs), Shift Open

### POLISH Requirements (all included)
- **POLISH-01: Role gating audit** — Every action across all screens renders correct state (enabled/disabled/authorize) for every role. Check all interactive elements beyond nav-level gating already done.
- **POLISH-02: Touch targets** — All interactive elements must meet 44px minimum. App must be functional and correct at 375px mobile and 1024×768 tablet. TableTile already has `min-h-[88px]` — audit remaining elements.
- **POLISH-03: Sonner toasts** — Add toasts for key actions beyond the 2 existing ones. At minimum: table seated, table opened, 86'd item toggled, shift closed, manager void approved, payment confirmed (already has one — verify).
- **POLISH-04: Loading + empty states** — Every major screen needs a defined loading state (Skeleton component exists at `src/components/ui/skeleton.tsx`) and empty state (no blank/broken layouts when data is absent).

### Claude's Discretion
- Exact red hex value (choose a warm crimson that reads well at both light and dark mode, high contrast on buttons)
- Specific Unsplash photo IDs to use for each menu item category
- Exact shadcn MCP font pairing selection
- Animation/transition details (keep minimal — POS needs to feel fast)
- Spacing refinements within the Toast POS style reference
- Which additional screens warrant loading skeletons vs simple loading text

</decisions>

<specifics>
## Specific Ideas

- Style reference: Toast POS / Square POS — professional, clean, warm color accents
- Japanese aesthetic via color choice and wordmark, not heavy decoration
- "A Ramen" text wordmark in AppHeader and login — no image asset required to ship
- Solar Icon Set replaces Lucide React throughout — researcher to determine install method
- Unsplash food photos for menu items — static URLs, no API integration needed for wireframe

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/skeleton.tsx` — Skeleton component (animate-pulse) ready for POLISH-04 loading states
- `src/lib/role-permissions.ts` + `canAccess()` — nav-level gating done; needs extension to in-screen action buttons for POLISH-01
- `globals.css` — Tailwind v4 CSS-first config with shadcn CSS vars + `@theme` block; brand color tokens added here
- `toast()` from 'sonner' — already fires in `TicketPanel.tsx` (Order sent) and `PaymentPage` (Receipt sent)

### Established Patterns
- Tailwind v4 CSS variable tokens for theming — add brand colors to `@theme` block in `globals.css`; light/dark handled via `.dark` class selector
- Direct `toast()` import from 'sonner' — no wrapper component, keep this pattern for new toasts
- `disabled:opacity-50` via Button component — leveraged for POLISH-01 role-disabled states

### Integration Points
- `AppHeader.tsx` — add "A Ramen" wordmark/brand text here
- `src/app/layout.tsx` — font family applied at root layout
- All icon imports across `src/components/**/*.tsx` — Solar Icon Set replaces Lucide imports

### Research Needed
- Solar Icon Set: npm package availability and React integration method
- shadcn MCP: recommended font family for this stack
- Unsplash static photo strategy for menu items (photo IDs per category)
- Tailwind v4 dark mode toggle pattern (class-based vs system)

</code_context>

<deferred>
## Deferred Ideas

- Customer-facing app / QR menu — separate product
- Animated transitions between screens — out of scope (POS needs speed, not animation)
- Custom logo SVG/PNG — owner to provide for production; wireframe uses text wordmark

</deferred>

---

*Phase: 07-polish (redefined as Hi-Fi & Brand)*
*Context gathered: 2026-03-11*
