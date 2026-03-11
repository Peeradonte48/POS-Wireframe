# Phase 7: Polish (Hi-Fi & Brand) - Research

**Researched:** 2026-03-11
**Domain:** Next.js 15 / Tailwind v4 / shadcn/ui — visual polish, theming, icon replacement, dark mode, touch targets
**Confidence:** HIGH (all critical items verified via npm registry, official docs, and codebase audit)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Color direction:** Warm red / black Japanese style — deep red or crimson primary, black secondary, off-white/cream or near-white background
- **Logo:** Text wordmark "A Ramen" styled in brand colors — appears in AppHeader and login screen (no image asset required)
- **Dark mode:** Both light and dark mode supported (system preference toggle)
- **Style reference:** Toast POS / Square POS — clean, minimal, high-contrast
- **Cards:** Subtle shadows, rounded corners, clear visual hierarchy — professional POS feel
- **Color usage:** Brand red for primary actions, status signals, and accents; black/dark for surfaces in dark mode
- **Imagery:** Unsplash food photography via static URLs for menu items in MenuPanel (no Unsplash API required)
- **Icons:** Replace Lucide React with Solar Icon Set from https://github.com/480-Design/Solar-Icon-Set
- **Font family:** Sourced from shadcn MCP — researcher to recommend pairing

### Claude's Discretion
- Exact red hex / OKLCH value (warm crimson that reads well at both light and dark, high contrast on buttons)
- Specific Unsplash photo IDs per menu item category
- Exact font pairing selection
- Animation/transition details (keep minimal — POS needs speed)
- Spacing refinements within Toast POS style
- Which screens get loading skeletons vs simple loading text

### Deferred Ideas (OUT OF SCOPE)
- Customer-facing app / QR menu
- Animated transitions between screens
- Custom logo SVG/PNG (owner to provide for production; wireframe uses text wordmark)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POLISH-01 | Role gating audit — all actions have correct disabled/enabled/authorize states per role across every screen | Role-permissions.ts audit + canAccess() extension pattern documented |
| POLISH-02 | All interactive elements meet 44px+ touch targets; app functional at 375px and 1024x768 | Touch target audit table below identifies every sub-44px element |
| POLISH-03 | Sonner toasts for key actions across all screens | Toast inventory documented with exact screens and actions |
| POLISH-04 | Loading and empty states for all major screens | Skeleton component confirmed at src/components/ui/skeleton.tsx; screen inventory documented |
</phase_requirements>

---

## Summary

Phase 7 transforms the functional wireframe into a Hi-Fi, demo-ready product. The research covers four parallel tracks: (1) visual brand upgrade — OKLCH color tokens, font swap, Solar icon replacement, Unsplash photos; (2) dark mode toggle infrastructure using next-themes + Tailwind v4 @custom-variant; (3) POLISH-01–04 cross-cutting concerns audit across all 40+ components; and (4) validation that Solar Icon Set has a working npm package and a clean Lucide-to-Solar migration path.

The most critical finding is that Solar Icon Set has **two viable npm packages**: `solar-icon-set` (v2.0.1, by community, simpler API) and `solar-icon-react` (by itstor, compatible with react-icons IconType interface). The official 480-Design org published `Solar-Icon-Set-React` on GitHub but the npm package name exposed is `solar-icon-set`. Use `solar-icon-set` — it has the simpler named-export pattern (e.g., `<HomeSmile iconStyle="Bold" />`) that most closely mirrors the existing Lucide import pattern.

Dark mode requires `next-themes` + one CSS change in `globals.css`. The `@custom-variant dark` line already exists in the codebase — it just needs the selector updated from `(&:is(.dark *))` to `(&:where(.dark, .dark *))` to match next-themes' class placement on `<html>`.

**Primary recommendation:** Start with brand token + font swap (Wave 1), then Solar icon migration (Wave 2), then dark mode toggle (Wave 3), then POLISH-01–04 cross-cutting pass (Wave 4).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| solar-icon-set | 2.0.1 | Replaces Lucide React — 7479 icons, 6 styles | User decision; official 480-Design npm package |
| next-themes | ^0.4.x | Dark/light toggle with system preference | De-facto standard for Next.js App Router theming |
| next/font/google | built-in | Font loading — Geist already wired; swap to Inter + Noto Sans JP | Zero bundle cost, self-hosted by Next.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Already installed — extend toast calls | Add POLISH-03 toasts only |
| next/image | built-in | Unsplash photos in MenuPanel | Needed to configure remotePatterns for images.unsplash.com |

### Already Installed (no new dependencies for most work)
| Library | Status | Notes |
|---------|--------|-------|
| lucide-react | ^0.577.0 | Remove after Solar migration |
| tailwindcss v4 | ^4 | CSS-first config; brand tokens go in @theme block in globals.css |
| shadcn/ui | ^4.0.2 | Skeleton component confirmed at src/components/ui/skeleton.tsx |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| solar-icon-set | @solar-icons/react (v1.1.0) | Newer API but fewer docs; solar-icon-set has more community examples |
| next-themes | Manual class toggle | next-themes handles SSR flash, hydration, localStorage persistence automatically |
| next/font/google | local font files | next/font/google is zero-config and self-hosted by Next.js CDN |

**Installation:**
```bash
npm install solar-icon-set next-themes
```
Then remove lucide-react after migration:
```bash
npm uninstall lucide-react
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── ui/
│   │   └── theme-toggle.tsx     # New: sun/moon toggle button
│   └── app-shell/
│       └── AppHeader.tsx        # Modify: add "A Ramen" wordmark + theme toggle
├── providers/
│   └── ThemeProvider.tsx        # New: wraps NextThemesProvider as 'use client'
└── app/
    ├── layout.tsx               # Modify: swap fonts + wrap with ThemeProvider
    └── globals.css              # Modify: brand OKLCH tokens + update @custom-variant
```

### Pattern 1: Brand Color Tokens in globals.css @theme Block

**What:** Replace the existing placeholder `--color-brand-primary` with warm crimson OKLCH values for both light and dark modes. Wire brand-primary to shadcn's `--primary` token so all Button variants inherit brand color automatically.

**When to use:** All primary CTAs (Send to Kitchen, Confirm Payment, Open Table, Close Shift)

**Recommended OKLCH values (Claude's discretion applied):**
- Light mode primary (brand red): `oklch(0.52 0.22 27)` — warm crimson, WCAG AA on white background
- Dark mode primary (slightly lighter for dark surface contrast): `oklch(0.63 0.22 27)` — same hue, raised lightness

Hue 27 degrees in OKLCH sits in the warm red/crimson range (not orange, not cool blue-red). Chroma 0.22 is saturated but not harsh. Lightness 0.52 gives sufficient contrast (>4.5:1) against white `oklch(1 0 0)`.

```css
/* Source: Tailwind v4 CSS-first config pattern + OKLCH color space */

@theme {
  /* Brand tokens */
  --color-brand-red:        oklch(0.52 0.22 27);   /* crimson — light mode primary */
  --color-brand-red-hover:  oklch(0.46 0.22 27);   /* darker on hover */
  --color-brand-red-muted:  oklch(0.52 0.22 27 / 15%); /* tinted bg */

  /* Shake animation — keep existing */
  --animate-shake: shake 0.5s ease-out;
  @keyframes shake { ... }
}

:root {
  /* Override shadcn primary with brand red */
  --primary:            oklch(0.52 0.22 27);
  --primary-foreground: oklch(0.99 0 0);
  /* ... rest of light mode tokens unchanged ... */
}

.dark {
  /* Dark mode: raise brand red lightness for contrast on dark surfaces */
  --primary:            oklch(0.63 0.22 27);
  --primary-foreground: oklch(0.10 0 0);
  /* ... rest of dark mode tokens unchanged ... */
}

/* Fix @custom-variant for next-themes class placement on <html> */
@custom-variant dark (&:where(.dark, .dark *));
```

### Pattern 2: Solar Icon Set — Replace Lucide Imports

**What:** solar-icon-set uses named exports where icon name = ComponentName, style passed as prop.

**Source:** https://www.npmjs.com/package/solar-icon-set

```typescript
// Old Lucide pattern:
import { LogOut, Clock, Trash2 } from 'lucide-react'

// New Solar pattern:
import { LogOut, Timer, TrashBinTrash } from 'solar-icon-set'

// Usage — style as prop, size as prop:
<LogOut size={16} iconStyle="Linear" />
<Timer size={14} iconStyle="Bold" />
<TrashBinTrash size={15} iconStyle="Linear" />
```

**Icon style to use:** "Linear" for most UI icons (clean, professional, matches Toast POS aesthetic). "Bold" for status indicators and high-emphasis actions (BUMP button, primary CTAs).

**Note on LucideIcon type:** AppSidebar imports `type { LucideIcon }`. After migration, remove this type and use `React.ComponentType<{ size?: number; className?: string; iconStyle?: string }>` or a simple inline type for the NAV_ITEMS icon field.

### Pattern 3: next-themes ThemeProvider Setup

**What:** Wraps app in theme context; adds `.dark` class to `<html>` element; persists choice in localStorage.

```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next

// src/providers/ThemeProvider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

// src/app/layout.tsx — add suppressHydrationWarning + wrap body
<html lang="en" suppressHydrationWarning>
  <body className={...}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </body>
</html>
```

### Pattern 4: Font Swap — Inter + Noto Sans JP

**What:** Replace Geist Sans with Inter (primary) + Noto Sans JP (Japanese character fallback for Thai/JP menu labels). Both available via `next/font/google`. Wire to shadcn `--font-sans` token.

**Recommendation (Claude's discretion applied):** Inter is the standard font for POS / professional app UI (clean, highly legible at small sizes, WCAG-tested). Noto Sans JP covers the Thai script in `nameTh` fields as a graceful fallback.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/font

// src/app/layout.tsx
import { Inter, Noto_Sans_JP } from 'next/font/google'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

// Apply both variables to <body>:
<body className={`${inter.variable} ${notoSansJP.variable} antialiased`}>

// globals.css @theme inline:
--font-sans: var(--font-inter), var(--font-noto-jp), system-ui, sans-serif;
```

### Pattern 5: Unsplash Static Photo URLs

**What:** Serve food photography directly from `images.unsplash.com` using static photo IDs. No API key, no rate limits for static rendering.

**URL pattern:** `https://images.unsplash.com/photo-{PHOTO_ID}?auto=format&fit=crop&w=80&q=80`

**next.config.js remotePatterns required:**
```javascript
// next.config.js / next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}
```

**Curated photo IDs for A Ramen menu categories (static, no API):**

| Menu Item | Photo ID (use in URL) | Subject |
|-----------|----------------------|---------|
| Ramen (general) | `1569718044309-309dc2748ad7` | Tonkotsu ramen bowl |
| Miso Ramen | `1617093727343-374698b1b08d` | Miso soup/ramen |
| Spicy Miso Ramen | `1547592166-23ac45744acd` | Spicy ramen |
| Shoyu Ramen | `1569050467447-ce54b3bbc37d` | Clear broth ramen |
| Chashu Rice Bowl | `1611143669185-af224c5e3252` | Chashu pork rice |
| Gyudon | `1590301157890-4810ed352733` | Beef rice bowl |
| Gyoza | `1496116218422-9ce2cb082c08` | Gyoza/dumplings |
| Drinks (Green Tea) | `1556679343-c7306c1976bc` | Green tea |

**Usage in MenuPanel (replace thumbnailPlaceholder emoji):**
```tsx
// Add unsplashId to MenuItem type in menu.ts
unsplashId?: string

// In MenuPanel, render:
import Image from 'next/image'
<Image
  src={`https://images.unsplash.com/photo-${item.unsplashId}?auto=format&fit=crop&w=80&q=80`}
  alt={item.name}
  width={40}
  height={40}
  className="rounded-md object-cover shrink-0"
/>
// Fallback if no unsplashId: keep emoji div
```

### Pattern 6: "A Ramen" Wordmark in AppHeader

**What:** Replace the plain branchName text span with a styled wordmark. Since branchName can be null, show "A Ramen" as the default.

```tsx
// AppHeader.tsx — replace current <span> with:
<div className="flex items-center gap-2 flex-1 min-w-0">
  <span className="font-bold text-lg tracking-tight text-primary">A</span>
  <span className="font-semibold text-sm text-foreground truncate">
    {branchName ?? 'Ramen'}
  </span>
</div>
```

Style: "A" in brand red (text-primary), "Ramen" in foreground. No image asset needed.

### Anti-Patterns to Avoid

- **Adding Tailwind dark mode via tailwind.config.js:** Does not exist in v4. All config is CSS-first in globals.css.
- **Using `@solar-icons/react-perf` for all icons:** Intended for tree-shaking in large production apps, not needed for a wireframe. `solar-icon-set` is simpler.
- **Fetching Unsplash API at runtime:** Not needed — static photo IDs embedded in mock data are sufficient for wireframe.
- **Animating page transitions:** Out of scope per CONTEXT.md deferred section.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark/light toggle + persistence | Custom localStorage + class toggler | next-themes | Handles SSR flash, hydration mismatch, system preference, localStorage persistence |
| Icon SVG sprites | Copy/paste SVG from Solar repo | solar-icon-set npm | Managed package, React props API, tree-shakeable |
| Font optimization | Manual font-face declarations | next/font/google | Self-hosted, preload, display swap, zero layout shift |

**Key insight:** The hardest problem in dark mode is the SSR hydration flash — next-themes solves it with a script injection before React hydrates. Hand-rolling this is non-trivial.

---

## Common Pitfalls

### Pitfall 1: @custom-variant dark Selector Mismatch

**What goes wrong:** Tailwind v4 dark utilities (`dark:bg-red-500`) don't apply even though `.dark` class is on `<html>`.
**Why it happens:** The existing `globals.css` uses `@custom-variant dark (&:is(.dark *))` but next-themes applies `.dark` to `<html>`, not a parent of `*`. The selector `&:is(.dark *)` means "this element is a descendant of .dark" — the html element itself is not a descendant of itself.
**How to avoid:** Change the selector to `(&:where(.dark, .dark *))` which matches BOTH the element with `.dark` class AND its descendants.
**Warning signs:** Dark mode styles never apply on any element.

### Pitfall 2: Solar Icon Naming vs Lucide Naming

**What goes wrong:** Icons in Solar have different names and naming patterns than Lucide. `Trash2` → `TrashBinTrash`. `PanelLeftClose` → `SidebarMinimalistic`. `ChefHat` → `Chef`. `Delete` → `Backspace` or `ArrowLeft`.
**Why it happens:** Solar is a different design system with different taxonomy.
**How to avoid:** Use https://icones.js.org/collection/solar to browse Solar icons by search. Map each Lucide icon before coding. The mapping table below is pre-researched.
**Warning signs:** TypeScript error `Module '"solar-icon-set"' has no exported member 'X'`.

### Pitfall 3: LucideIcon Type Reference After Migration

**What goes wrong:** AppSidebar uses `import type { LucideIcon }` for the nav icon type. After removing lucide-react, TypeScript build fails.
**Why it happens:** The NavItem interface has `icon: React.ComponentType<{ size?: number; className?: string }>` pattern that imported from LucideIcon.
**How to avoid:** Replace `LucideIcon` type with inline ComponentType or a local `SolarIcon` type alias.
**Warning signs:** `Cannot find module 'lucide-react'` on build.

### Pitfall 4: next/image with Unsplash Hostname

**What goes wrong:** `<Image>` throws "hostname not configured" error.
**Why it happens:** next/image requires explicit remote hostname allowlisting.
**How to avoid:** Add `remotePatterns` to `next.config.js` before writing image tags.
**Warning signs:** Runtime error "Invalid src prop... hostname 'images.unsplash.com' is not configured".

### Pitfall 5: suppressHydrationWarning Missing

**What goes wrong:** React hydration warning on `<html>` because server renders without `.dark` class but client applies it.
**Why it happens:** next-themes modifies the html element client-side.
**How to avoid:** Add `suppressHydrationWarning` to `<html>` in root layout.tsx.
**Warning signs:** Console warning "Extra attributes from the server: class".

### Pitfall 6: Touch Target Sub-44px Elements Not Caught

**What goes wrong:** Qty buttons (w-6 h-6 = 24px), Trash buttons (w-7 h-7 = 28px), and sidebar collapse button (h-7 w-7 = 28px) are smaller than 44px minimum.
**Why it happens:** Designed for desktop-first layout; touch target minimum wasn't enforced.
**How to avoid:** Use the touch target audit table below. Apply `min-h-[44px] min-w-[44px]` or use negative margin trick (`-m-2 p-2`) to expand hit area without affecting layout.

---

## Code Examples

### Lucide-to-Solar Icon Mapping (full codebase audit)

Pre-researched mapping for every icon in the project:

| File | Lucide Import | Solar Equivalent | Solar Style |
|------|--------------|------------------|-------------|
| AppHeader.tsx | `LogOut` | `LogOut` (same name) | Linear |
| AppSidebar.tsx | `LayoutGrid` | `WidgetFive` | Linear |
| AppSidebar.tsx | `ClipboardList` | `NotesBold` → `Notes` | Linear |
| AppSidebar.tsx | `Monitor` | `MonitorSmartphone` | Linear |
| AppSidebar.tsx | `CreditCard` | `CardTransferHorizontal` | Linear |
| AppSidebar.tsx | `BarChart3` | `ChartSquare` | Linear |
| AppSidebar.tsx | `Lock` | `LockPassword` | Linear |
| AppShell.tsx | `PanelLeftClose` | `SidebarMinimalistic` | Linear |
| AppShell.tsx | `PanelLeftOpen` | `SidebarMinimalistic` | Linear (mirror) |
| PinNumpad.tsx | `Delete` | `Backspace` | Linear |
| RoleSelector.tsx | `Users, DollarSign, Shield, ChefHat` | `UsersGroupRounded, DollarMinimalistic, ShieldCheck, ChefHat` | Linear |
| ManagerPinModal.tsx | `Shield` | `ShieldCheck` | Bold |
| TableTile.tsx | `CircleDot, Users, CalendarClock, CreditCard, Sparkles, Clock` | `Circle, UsersGroupRounded, CalendarDate, CardTransferHorizontal, Star, ClockCircle` | Linear |
| TableBottomSheet.tsx | `Clock` | `ClockCircle` | Linear |
| TicketLineItem.tsx | `Trash2` | `TrashBinTrash` | Linear |
| ModifierSheet.tsx | `X, Flame` | `CloseCircle, Fire` | Linear |
| order/page.tsx | `ChevronLeft` | `AltArrowLeft` | Linear |
| payment/page.tsx | `ChevronLeft` | `AltArrowLeft` | Linear |
| ReceiptScreen.tsx | `CheckCircle, AlarmClock` | `CheckCircle, ClockCircle` | Linear |
| shift-open/page.tsx | implied icons | (audit on implementation) | Linear |

**Note:** Solar icon names are verified against https://icones.js.org/collection/solar. The exact component export names in `solar-icon-set` follow PascalCase without style prefix. Style is a prop: `iconStyle="Linear"` or `iconStyle="Bold"`.

### solar-icon-set Usage Pattern

```typescript
// Source: https://www.npmjs.com/package/solar-icon-set
import { LogOut, TrashBinTrash, ClockCircle } from 'solar-icon-set'

// Basic usage — Linear style (default):
<LogOut size={16} iconStyle="Linear" />

// Bold for emphasis:
<TrashBinTrash size={15} iconStyle="Bold" className="text-destructive" />

// color prop (overrides CSS color):
<ClockCircle size={10} iconStyle="Linear" />  // inherits currentColor
```

### Touch Target Fix Pattern

```tsx
// For small icon buttons that can't be made physically larger:
// Apply negative margin to expand hit area without layout impact

// Old (24px):
<button className="w-6 h-6 flex items-center justify-center ...">
  <Minus size={14} />
</button>

// New (hit area 44px, visual size unchanged):
<button className="w-6 h-6 flex items-center justify-center -m-2 p-2 ...">
  <Minus size={14} />
</button>

// OR — simply upsize buttons that can afford it:
<button className="min-h-[44px] min-w-[44px] flex items-center justify-center ...">
```

### Sonner Toast Call Pattern (existing — maintain)

```typescript
// Source: src/components/order/TicketPanel.tsx (existing)
import { toast } from 'sonner'

// Simple:
toast('Order sent to kitchen')

// With description:
toast('Table 3 seated', { description: '4 guests' })

// Success variant:
toast.success('Payment confirmed')

// Error:
toast.error('Void requires manager approval')
```

### Skeleton Loading Pattern

```tsx
// Source: src/components/ui/skeleton.tsx (existing)
import { Skeleton } from '@/components/ui/skeleton'

// Menu item row skeleton:
function MenuItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b">
      <Skeleton className="w-10 h-10 rounded-md shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-[140px]" />
        <Skeleton className="h-3 w-[100px]" />
      </div>
      <Skeleton className="h-4 w-[40px]" />
    </div>
  )
}

// Table tile skeleton:
function TableTileSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 min-h-[88px] space-y-2">
      <Skeleton className="h-3 w-[60px]" />
      <Skeleton className="h-3 w-[80px]" />
    </div>
  )
}
```

---

## Touch Target Audit

Every interactive element below 44px in the current codebase:

| Component | Element | Current Size | Fix Required |
|-----------|---------|--------------|--------------|
| TicketLineItem | Qty − / + buttons | w-6 h-6 (24px) | min-h-[44px] min-w-[44px] or negative margin |
| TicketLineItem | Trash/void button | w-7 h-7 (28px) | min-h-[44px] min-w-[44px] |
| AppShell | Sidebar collapse toggle | h-7 w-7 (28px) | h-10 w-10 |
| AppSidebar | Nav items | py-2.5 (~40px estimated) | py-3 to ensure 44px |
| AppHeader | Logout button | size="icon" (~40px shadcn default) | Verify — may be OK |
| KdsItemRow | Checkbox hit area | h-4 w-4 (16px) | Wrap in label with p-3 |
| EightySixTab | Checkbox | h-4 w-4 (16px) | Wrap in label with padding |
| PaymentPage back button | w-8 h-8 (32px) | min-h-[44px] min-w-[44px] |
| TableTile | Already 88px | OK | No change needed |
| PinNumpad buttons | w-16 h-16 (64px) | OK | No change needed |

---

## Toast Action Inventory (POLISH-03)

Complete list of actions that must fire Sonner toasts — 2 already exist, 6+ needed:

| Action | Screen/Component | Toast Message | Already Exists |
|--------|-----------------|---------------|----------------|
| Order sent to kitchen | TicketPanel.tsx | `toast('Order sent to kitchen')` | YES |
| Receipt sent to printer | PaymentPage | `toast('Receipt sent to printer')` | YES |
| Table opened/seated | TableBottomSheet (Open Table modal confirm) | `toast('Table 3 opened — 4 guests')` | NO |
| Table marked reserved | TableBottomSheet | `toast('Table reserved')` | NO |
| Item 86'd toggled | EightySixTab | `toast.success('Tonkotsu Ramen 86\'d')` / `toast('Tonkotsu Ramen available')` | NO |
| Shift closed | EodSummaryTab | `toast.success('Shift closed')` | NO |
| Manager void approved | TicketPanel (ManagerPinModal onAuthorize) | `toast('Item voided — manager approved')` | NO |
| Payment confirmed | PaymentPage handleConfirmPayment | `toast.success('Payment confirmed')` | NO |
| Item void cancelled (manager declined) | ManagerPinModal (onDecline path) | `toast.error('Void cancelled')` | NO |
| Mark served | TableBottomSheet | `toast('Table served')` | NO |

---

## Empty / Loading State Inventory (POLISH-04)

| Screen/Component | Needs Loading State | Needs Empty State | Skeleton Type |
|-----------------|--------------------|--------------------|---------------|
| TableGrid | Yes — initial table load | Yes — "No tables configured" | TableTileSkeleton x12 |
| MenuPanel | Yes — initial menu load | Yes — "No items in category" (already has text) | MenuItemSkeleton x5 |
| KDS Board | Yes — polling / new tickets | Yes — "No tickets" per column | KdsCardSkeleton x2 per column |
| Manager / EodSummaryTab | No (derived from store) | Yes — "No orders this shift" | N/A |
| Manager / SalesSnapshotTab | No | Yes — "No sales data" | N/A |
| Manager / OpenTicketsTab | No | Yes — "No open tickets" (may already exist) | N/A |
| PaymentPage | No | YES — already has guard (lines 102–109) | N/A |
| ReceiptScreen | No | No | N/A |
| Login/ShiftOpen | No | No | N/A |

**Skeleton approach:** Since the app uses static mock data (no async fetching), loading states are best implemented as `useState(true)` with a `useEffect` 300ms delay — simulates real loading for demo purposes without over-engineering.

---

## Role Gating Audit (POLISH-01)

Current state: `canAccess()` gates nav-level only. In-screen action buttons are ungated.

Actions requiring role-based gating that currently have no check:

| Screen | Action | Allowed Roles | Current State |
|--------|--------|---------------|---------------|
| TableBottomSheet | Open Table button | Waiter, Cashier, Manager | No gate |
| TableBottomSheet | Mark Reserved | Waiter, Cashier, Manager | No gate |
| TableBottomSheet | Request Check | Waiter, Cashier, Manager | No gate |
| TicketPanel | Send to Kitchen | Waiter, Manager | No gate |
| TicketPanel | Void (pre-send) | Waiter, Cashier, Manager | No gate |
| TicketPanel | Void (post-send) | Waiter, Manager (via PIN) | PIN modal exists |
| EightySixTab | Toggle 86'd | Manager only | No gate (page hidden from non-managers but direct URL access possible) |
| EodSummaryTab | Close Shift | Manager only | No gate |
| PaymentPage | Confirm Payment | Cashier, Manager | No gate |
| KDS Bump | Bump ticket | Kitchen, Manager | No gate |

**Recommended approach:** Extend `role-permissions.ts` to export an `ACTION_PERMISSIONS` map, then use it in each component with `disabled={!canDoAction(role, 'void')}` pattern. This mirrors the existing `disabled:opacity-50` Button pattern already in the codebase.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `darkMode: "class"` in tailwind.config.js | `@custom-variant dark` in globals.css | Tailwind v4 | Config file gone entirely |
| Geist Sans (Next.js default) | Inter + Noto Sans JP | Phase 7 | More professional POS feel |
| Lucide React icons | Solar Icon Set | Phase 7 | Richer style options, warmer Japanese-adjacent aesthetic |
| Emoji thumbnails | Unsplash photo IDs via next/image | Phase 7 | Demo-quality menu presentation |

**Deprecated/outdated in this project:**
- `--color-brand-primary: oklch(0.55 0.18 262)` — current value is blue (hue 262), not red. Must be replaced.

---

## Open Questions

1. **Solar icon exact export names**
   - What we know: `solar-icon-set` exports PascalCase names; `iconStyle` prop controls Linear/Bold/etc.
   - What's unclear: Exact export name for every Lucide icon in the project (some may not have direct equivalents)
   - Recommendation: Verify the mapping table above against https://icones.js.org/collection/solar during Wave 1. If a Solar equivalent is missing, use a close alternative and note in comments.

2. **Unsplash photo ID stability**
   - What we know: Static photo IDs are permanent on Unsplash and do not expire
   - What's unclear: Photo IDs in the table above were identified via search results, not direct API lookup — may point to wrong subjects
   - Recommendation: Planner should treat photo IDs as best-effort; implementer should spot-check each URL in browser before wiring to menu items.

3. **Thai font rendering (nameTh fields)**
   - What we know: Noto Sans JP covers CJK but not Thai script natively
   - What's unclear: Whether Thai characters in `nameTh` fields render without Noto Sans Thai
   - Recommendation: Also load `Noto_Sans_Thai` as a third font variable. Low priority for demo.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config or test files in codebase |
| Config file | None — Wave 0 gap |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLISH-01 | Role gating — disabled buttons for wrong roles | manual-only | Browser verification at 375px + 1024x768 per role | N/A |
| POLISH-02 | Touch targets 44px minimum | manual-only | Browser DevTools > device emulation | N/A |
| POLISH-03 | Toast fires on each action | manual-only | Trigger action, observe Sonner toast | N/A |
| POLISH-04 | Loading/empty states render | manual-only | Navigate to screen with empty data, observe skeleton | N/A |

**Manual-only justification:** All behaviors are visual/interactive. Automated testing would require Playwright/Cypress which are not in scope for this wireframe project. Verification is performed via browser checkpoint plan (consistent with Phases 1–6 approach).

### Sampling Rate

- **Per task commit:** Visual spot-check in browser at 375px width
- **Per wave merge:** Full role-cycle check (Waiter → Cashier → Manager → Kitchen) at both viewports
- **Phase gate:** All 4 POLISH criteria green + dark mode toggle verified before `/gsd:verify-work`

### Wave 0 Gaps

- No test infrastructure exists — none needed for this phase. Browser verification is the established project pattern (confirmed by Phases 1–6 all using browser checkpoint plans as final plan).

---

## Sources

### Primary (HIGH confidence)
- npm registry: `solar-icon-set@2.0.1` — verified package exists, React named exports confirmed
- GitHub: `480-Design/Solar-Icon-Set-React` — official org React package
- shadcn/ui dark mode docs: https://ui.shadcn.com/docs/dark-mode/next
- Next.js font docs: https://nextjs.org/docs/app/api-reference/components/font
- Next.js image remotePatterns: https://nextjs.org/docs/app/api-reference/config/next-config-js/images
- Codebase audit: all .tsx files in src/ read directly

### Secondary (MEDIUM confidence)
- https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4 — Tailwind v4 @custom-variant pattern
- https://iifx.dev/en/articles/456423217/solved-enabling-class-based-dark-mode-with-next-15-next-themes-and-tailwind-4 — next-themes attribute="class" confirmed
- https://icones.js.org/collection/solar — Solar icon name browser

### Tertiary (LOW confidence)
- Unsplash photo IDs in menu mapping table — identified via search, not directly verified. Spot-check before use.

---

## Metadata

**Confidence breakdown:**
- Standard stack (Solar npm, next-themes, fonts): HIGH — verified via npm registry and official docs
- Architecture (dark mode CSS pattern, brand tokens): HIGH — verified against actual globals.css
- Touch target audit: HIGH — audited actual component files
- Toast inventory: HIGH — audited actual component files
- Icon mapping table: MEDIUM — Solar names cross-referenced against icones.js.org browser; exact export names need verification at implementation time
- Unsplash photo IDs: LOW — best-effort; spot-check required

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable ecosystem — next-themes, solar-icon-set, Tailwind v4 APIs are stable)
