# Technology Stack

**Project:** POS Wireframe — A Ramen / FIP Ecosystem
**Researched:** 2026-03-10
**Research mode:** Ecosystem
**Overall confidence:** HIGH for core stack, MEDIUM for complementary libraries

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Application shell, routing, page structure | App Router is the current standard; RSC support aligns with FIP production direction. Pages Router is in maintenance mode as of 2024. |
| React | 19.x | UI runtime | Required by Next.js 15; concurrent features improve responsiveness on interaction-heavy POS screens. |
| TypeScript | 5.x | Type safety | Non-negotiable for dev-handoff quality; types document component contracts for the engineering team receiving the wireframe. |
| Tailwind CSS | 4.x | Utility styling | First-class shadcn/ui integration; v4 switches to CSS-native config (no more tailwind.config.js) — verify whether your shadcn/ui version targets v3 or v4 before init. |

**Confidence:** HIGH — This is the canonical stack specified in PROJECT.md and corroborated by shadcn/ui's own documentation.

**Tailwind version note (MEDIUM confidence):** shadcn/ui's CLI (`npx shadcn@latest init`) auto-detects Tailwind version. As of shadcn/ui 2.x, Tailwind v4 is supported but Tailwind v3 remains the safer default for stability. Check `npx shadcn@latest --version` output at init time.

---

### Component Library — shadcn/ui

shadcn/ui is not a packaged library — it's a code-generation pattern. Components are copied into `components/ui/` and owned by the project. This is intentional: it means you can modify components freely, which is critical for POS-specific needs (large touch targets, custom badge colors for table status, etc.).

**Confidence:** HIGH

#### shadcn/ui Components Directly Relevant to This POS

| Component | POS Use Case | Notes |
|-----------|-------------|-------|
| `Badge` | Table status indicators (Open / Occupied / Reserved / Needs Attention) | Customize `variant` colors to match status semantics; add to `components/ui/badge.tsx` directly |
| `Button` | Every interactive element — menu items, table cells, order actions, payment methods | Use `size="lg"` for touch targets; POS screens are often tapped not clicked |
| `Card` | Table card on floor plan, menu category panels, order summary card | Core layout primitive throughout the app |
| `Dialog` | Modifier selection (broth, spice level, add-ons), split-bill confirmation, shift close confirmation | Modal interactions are the primary way POS handles secondary decisions without leaving context |
| `Sheet` | Order sidebar on order-taking screen, cart drawer | Slides in from edge — better than Dialog for persistent panels that stay open while user continues selecting |
| `Tabs` | Menu category navigation (Bowls / Sides / Drinks / Extras), role switching in manager view | Tab-based nav is the POS standard for menu browsing |
| `Table` | Bill summary, shift end-of-day report, order history | Use shadcn Table + TanStack Table underneath for sortable/filterable tables in manager views |
| `Select` | Dropdown for branch/location selector, staff role selector | Keep as Select (not Combobox) for simplicity in wireframe |
| `Separator` | Visual dividers in order summary, bill breakdown | Minor but consistent with shadcn design system |
| `Avatar` | Staff identifier in header (waiter/cashier/manager) | Useful for role context in header |
| `ScrollArea` | Menu item list, long order lists | Prevents native scrollbar inconsistency across OS |
| `Skeleton` | Loading states in KDS ticket list | Makes wireframe feel more production-realistic for stakeholders |
| `Toast / Sonner` | "Order sent to kitchen", "Payment received" confirmations | shadcn now recommends Sonner (by emilkowalski) over its own Toast primitive |
| `Command` | Menu item search on order screen | If search is in scope; Command palette pattern works well for fast lookup |
| `Alert` | KDS — alert for long-wait tickets, payment errors | Use `variant="destructive"` for critical states |
| `Progress` | KDS ticket timing bar (optional visual) | Low priority but adds realism |
| `DropdownMenu` | Context actions on table cards (View, Transfer, Void), staff quick actions | 3-dot / kebab menu pattern on table map |
| `Popover` | Tooltip/detail on hover for table occupancy info | Lightweight, non-blocking |
| `RadioGroup` | Payment method selection (Cash / QR / Card), spice level selection | Better than Select for small N options that should be visible at once |
| `Checkbox` | Add-on toppings in modifier dialog | Multi-select add-ons (extra noodles, extra broth, etc.) |
| `Label` | Form labels in modifier dialog, shift open/close form | Always pair with form inputs for accessibility |
| `Input` | Cover count input on table seat, manual discount input | Minimal use — POS is mostly tap, not type |
| `Switch` | Feature toggles in manager settings (e.g., "Accept new orders") | Settings panel |

**Install pattern:**
```bash
npx shadcn@latest add badge button card dialog sheet tabs table select separator avatar scroll-area skeleton sonner command alert progress dropdown-menu popover radio-group checkbox label input switch
```

---

### Icons

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Lucide React | 0.400+ | All iconography | Ships as shadcn/ui's default icon set. Consistent stroke-width, tree-shakeable, typed. Do not mix in other icon libraries — visual inconsistency is death to a wireframe meant for stakeholder review. |

**Confidence:** HIGH

**Key Lucide icons for POS:**
- `UtensilsCrossed` — restaurant/order context
- `ChefHat` — KDS / kitchen
- `Receipt` — bill / payment
- `Users` — table / covers
- `MapPin` — branch/location
- `Clock` — shift / timing
- `CreditCard`, `Banknote`, `QrCode` — payment methods
- `Plus`, `Minus`, `Trash2` — order quantity controls
- `CheckCircle2`, `Circle`, `AlertCircle` — status indicators
- `LogIn`, `LogOut` — shift open/close
- `Store` — multi-branch selector
- `LayoutGrid` — floor plan / table map view

---

### Charts / Analytics

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Recharts | 2.x | Sales summary charts, shift-end report graphs | shadcn/ui's `chart` component is built on top of Recharts — use shadcn Chart wrapper, not raw Recharts, to stay within the design system. Only needed for manager/shift-summary views. |

**Confidence:** HIGH

**When to use:** Only in end-of-day summary and manager dashboard screens. Do not add charts to core POS flows (table map, order taking, KDS, payment) — they add complexity without adding to the primary wireframe narrative.

**Install:** The shadcn `chart` component wraps Recharts. Add with:
```bash
npx shadcn@latest add chart
```

---

### Drag-and-Drop (Floor Plan Editor)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @dnd-kit/core + @dnd-kit/sortable | 6.x | Draggable table placement on floor plan | dnd-kit is the current React standard (displacing react-beautiful-dnd which is unmaintained). Accessibility-first, touch-friendly, works with React 19 concurrent mode. |

**Confidence:** MEDIUM — dnd-kit is established and well-regarded, but drag-drop on a wireframe may be over-engineering. See note below.

**Scope note:** The PROJECT.md specifies "table map / floor plan view showing real-time table status" but does NOT specify that the floor plan is editable (drag to reposition tables). For a wireframe deliverable:
- If the floor plan is **static layout** (tables are fixed positions) — use CSS Grid or absolute positioning. No drag library needed.
- If the floor plan is **interactive editor** (manager can drag tables around) — use dnd-kit.

**Recommendation:** Start with static CSS-positioned floor plan. Add dnd-kit only if the floor plan editor becomes a required screen. This keeps the wireframe lighter and the dev-handoff cleaner.

**Install (if needed):**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### State Management

| Approach | Version | Purpose | Why |
|----------|---------|---------|-----|
| React Context + useReducer | Built-in | Order state, current table, active session | This is a wireframe, not a production app. No backend, no persistence. React's built-in state is sufficient and keeps the codebase reviewable by engineers evaluating the wireframe. |
| Zustand | 5.x | Alternative if Context becomes unwieldy | Only adopt if you find yourself prop-drilling more than 3 levels. Zustand is minimal and does not require a Provider wrapper. |

**Confidence:** HIGH (Context recommendation), MEDIUM (Zustand as fallback)

**What NOT to use:** Redux Toolkit — vastly over-engineered for a wireframe with no async data fetching. React Query / SWR — no API, no need. Jotai — fine but adds another dependency without clear benefit over Context at wireframe scale.

---

### Data / Fixtures

| Approach | Purpose | Why |
|----------|---------|-----|
| TypeScript const fixtures in `/lib/data/` | Menu items, tables, orders, staff | Typed fixture data doubles as the data model documentation for engineers. Export as `MOCK_MENU`, `MOCK_TABLES`, `MOCK_ORDERS`, etc. |
| No database, no API | Out of scope | PROJECT.md explicitly excludes backend / real data |

**Confidence:** HIGH

---

### Typography & Design Tokens

| Decision | Rationale |
|----------|-----------|
| `font-sans` (Inter via next/font) | shadcn/ui default. Inter is legible at small sizes on display screens — relevant for KDS and bill views. |
| shadcn/ui CSS variables for color | `--primary`, `--secondary`, `--destructive`, `--muted` etc. Customize in `globals.css` to match POS context (e.g., `--destructive` for voided orders, green accent for occupied tables). |
| Light mode only | PROJECT.md specifies "clean light / minimal" — do not add dark mode toggle. It adds complexity and the stakeholder review context is almost always a lit office environment. |
| `rounded-md` (default) | shadcn/ui default border radius. Do not override — consistency with the component library is more important than custom brand radius at wireframe stage. |

**Confidence:** HIGH

---

### Tooling

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| ESLint + eslint-config-next | Bundled with Next.js | Linting | Required for dev-handoff quality. Engineers receiving the wireframe will judge code quality. |
| Prettier | 3.x | Code formatting | Consistent formatting makes component code readable for the engineering audience. |
| TypeScript strict mode | — | Type safety | Enable `"strict": true` in tsconfig. Types are documentation when the wireframe is handed to engineers. |

**Confidence:** HIGH

---

### What NOT to Use

| Library | Why Not |
|---------|---------|
| Material UI (MUI) | Conflicts with shadcn/ui design tokens; introduces its own theming system. Do not mix component libraries. |
| Chakra UI | Same reason as MUI. |
| react-beautiful-dnd | Unmaintained since 2023. Use dnd-kit if drag-drop is needed. |
| Framer Motion | Tempting for table status animations, but adds 30KB+ and distracts from wireframe purpose. shadcn/ui uses CSS transitions. Only add if animated interactions are explicitly required for stakeholder demo. |
| Redux Toolkit | Over-engineered for a no-backend wireframe. |
| Prisma / Drizzle | No database. Out of scope per PROJECT.md. |
| NextAuth / Auth.js | No real auth. Role switching is a wireframe state change, not an authentication flow. |
| Storybook | Valuable for component libraries, but adds significant setup overhead. Not needed for this deliverable scope. |
| react-hook-form + Zod | Validation is irrelevant for a wireframe — forms use local state with minimal validation. Only add if form behavior is being spec'd in detail. |

---

## Full Installation Sequence

```bash
# 1. Bootstrap Next.js with TypeScript + Tailwind + App Router
npx create-next-app@latest pos-wireframe \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd pos-wireframe

# 2. Initialize shadcn/ui
npx shadcn@latest init
# When prompted: style=default, base color=zinc (neutral, professional), CSS variables=yes

# 3. Add all relevant shadcn/ui components
npx shadcn@latest add badge button card dialog sheet tabs table select \
  separator avatar scroll-area skeleton sonner command alert progress \
  dropdown-menu popover radio-group checkbox label input switch chart

# 4. Install Lucide (likely already installed as shadcn peer dep, but explicit)
npm install lucide-react

# 5. Add Prettier
npm install -D prettier eslint-config-prettier

# 6. Add dnd-kit ONLY if floor plan editor is confirmed in scope
# npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Directory Structure (Recommended)

```
src/
  app/
    (pos)/
      floor-plan/         # Table map view
      order/[tableId]/    # Order-taking screen
      kds/                # Kitchen display
      payment/[orderId]/  # Checkout screen
      shift/              # Open/close shift
    manager/
      dashboard/          # Manager overview + charts
      settings/           # Branch/staff settings
    layout.tsx
    page.tsx              # Redirect to floor-plan or login state
  components/
    ui/                   # shadcn/ui generated components (do not edit directly)
    pos/                  # POS-specific composite components
      TableCard.tsx
      OrderItem.tsx
      ModifierDialog.tsx
      KdsTicket.tsx
      BillSummary.tsx
      FloorPlan.tsx
  lib/
    data/                 # Mock fixtures
      menu.ts
      tables.ts
      orders.ts
      staff.ts
    types.ts              # Shared TypeScript types
    utils.ts              # shadcn/ui cn() utility + POS helpers
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Component library | shadcn/ui | Radix UI (raw) | shadcn wraps Radix — no reason to use raw Radix when shadcn gives styled components out of the box |
| Icon library | Lucide React | Heroicons, Phosphor | Lucide is shadcn's default; mixing breaks visual consistency |
| Charts | shadcn Chart (Recharts) | Victory, Nivo, Chart.js | shadcn Chart wrapper keeps design tokens consistent; others require separate theming |
| Drag-drop | dnd-kit | react-beautiful-dnd, Pragmatic DnD | react-beautiful-dnd unmaintained; Pragmatic DnD is newer but less documented |
| State | React Context | Zustand, Jotai | Context is sufficient at wireframe scale; no external dep needed |
| Router | App Router | Pages Router | Pages Router is maintenance-only; App Router is the standard |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Next.js 15 + App Router | HIGH | Stable, official recommendation, aligns with PROJECT.md |
| shadcn/ui component selection | HIGH | Based on POS UI patterns well-established in training data through Aug 2025 |
| Lucide React as icon library | HIGH | shadcn/ui's own default; stable |
| Tailwind CSS v4 compatibility | MEDIUM | v4 introduced breaking changes (CSS-first config); verify at `npx shadcn@latest init` time |
| Recharts via shadcn Chart | HIGH | shadcn's official chart implementation since 2024 |
| dnd-kit for floor plan | MEDIUM | Library is stable but scope decision (static vs editable floor plan) is unresolved |
| React Context for state | HIGH | Appropriate for wireframe scale; no external validation needed |

---

## Sources

- PROJECT.md — project constraints and scope (primary source)
- shadcn/ui documentation (ui.shadcn.com) — component catalog and installation patterns [HIGH confidence, training data Aug 2025]
- Next.js documentation (nextjs.org/docs) — App Router status and recommendations [HIGH confidence]
- Lucide documentation (lucide.dev) — React package and icon names [HIGH confidence]
- Recharts + shadcn Chart integration — shadcn/ui chart docs [HIGH confidence]
- dnd-kit documentation (dndkit.com) — library status and React 18/19 compatibility [MEDIUM confidence — verify current version at install time]
- Training knowledge cutoff: August 2025. Verify current versions with `npm info [package] version` before installing.
