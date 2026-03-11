# Stack Research

**Domain:** Restaurant POS — v1.1 UI brand polish and component refinement on existing Tailwind CSS 4 + shadcn/ui stack
**Researched:** 2026-03-11
**Confidence:** HIGH

> **Scope note:** v1.0 stack decisions (Next.js 15, Tailwind 4, shadcn/ui, Zustand 5, Solar icons,
> OKLCH tokens, Sonner) are validated and locked. This document covers ONLY what is needed for
> v1.1: advanced Tailwind 4 theming techniques, shadcn/ui component override patterns,
> OKLCH color manipulation, and animation/transition utilities for energetic UI feel.

---

## What Is Already Installed (Do Not Re-research or Re-add)

| Package | Version in package.json | Role |
|---------|------------------------|------|
| tailwindcss | ^4 | CSS-first config via `@import "tailwindcss"` in globals.css |
| tw-animate-css | ^1.4.0 | Imported in globals.css — all animate-in/out utilities active |
| shadcn | ^4.0.2 | Components as owned source files in `src/components/ui/` |
| @base-ui/react | ^1.2.0 | Underlying primitive for Button, Badge, Dialog, etc. |
| class-variance-authority | ^0.7.1 | CVA — variant engine driving all component style variants |
| tailwind-merge | ^3.5.0 | `cn()` helper for safe class override at callsite |
| OKLCH tokens | — | `--primary` at `oklch(0.52 0.22 27)`, brand-red vars, full dark mode |

---

## Recommended Stack: Techniques, Not New Packages

Zero new npm packages are required for v1.1. All capability exists in the current stack.
The following table describes what to use and precisely how each technique integrates.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS 4 `@theme` block | 4.x | Register new brand tokens and custom animation keyframes | The only mechanism that generates `animate-*` utilities from custom `@keyframes`. Tokens defined here become `bg-*`, `text-*`, `animate-*` utilities automatically. Add new color tokens and animations here, not in `:root`. |
| Tailwind CSS 4 `@theme inline` block | 4.x | Map shadcn semantic CSS variables to Tailwind utility space | Already used in globals.css for `--primary`, `--card`, etc. When adding new semantic tokens (e.g., `--color-brand-warm`), add the mapping here so Tailwind generates the utility class. |
| Tailwind CSS 4 `@layer base` | 4.x | Apply global typographic hierarchy — font weights, letter-spacing, leading | Correct layer for element-level overrides (`h1`, `h2`, `p`, `strong`) that establish visual hierarchy without fighting utility specificity. |
| Tailwind CSS 4 `@utility` directive | 4.x | Register single-purpose custom utilities that work with responsive and state variants | Use for any property/value pair not covered by stock Tailwind. Unlike `@layer utilities`, `@utility` entries respect variant ordering and can be used as `hover:my-utility`. |
| CSS Relative Color Syntax | Native CSS, Baseline 2023 | Derive hover, active, muted, and dark variants from a single OKLCH base token | `oklch(from var(--primary) calc(l * 0.88) c h)` produces a 12% darker hover. Eliminates manual color math and reduces token count. Browser support: 92%+ globally as of 2025. Zero bundle cost. |
| CVA `cva()` variant extension | ^0.7.1 | Add bold new variants (`"brand"`, `"ghost-crimson"`) and override base classes | The correct pattern for this stack: edit the `cva()` call directly in the component file. No wrapper, no separate variant registry. Adding a key to the `variant` object is the complete change. |
| `cn()` with `tailwind-merge` | ^3.5.0 | Override component classes at call site without specificity conflicts | Pass overriding classes through `className` prop; `cn()` resolves conflicts (e.g., if button has `bg-primary` and you pass `bg-amber-500`, merge picks the last winner). |
| tw-animate-css `animate-in` / `animate-out` | ^1.4.0 (already installed) | Compose enter/exit animations for badge state transitions and micro-interactions | Full class set is active: `animate-in fade-in zoom-in-95 duration-150` for tight energetic entries. Compose modifiers: `fade-in`, `zoom-in-*`, `slide-in-from-*`, `spin-in`, `blur-in`. No additional install. |
| Tailwind CSS `data-[state=*]:` arbitrary variants | 4.x | Drive stateful styles from Base UI's `data-state` attributes without JS class toggling | Base UI components set `data-state="open"`, `data-state="checked"`, etc. automatically. Use `data-[state=open]:animate-in` for native-feeling component transitions. |

### Supporting Libraries (Already Installed, Usage Patterns for v1.1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tw-animate-css | ^1.4.0 | Enter / exit animations, accordion transitions | Already imported. Use `animate-in` + composable modifiers (`fade-in`, `zoom-in-95`, `slide-in-from-bottom-2`) for badge mount, dialog open, toast appear. Duration `150`–`200ms` for snappy POS feel. |
| class-variance-authority | ^0.7.1 | Variant engine for Button, Badge, and any new component variants | Add `"brand"` variant to `buttonVariants` for the bold primary CTA style. Add status-specific badge variants (`"occupied"`, `"check-requested"`) directly in `badgeVariants`. |
| tailwind-merge | ^3.5.0 | Class conflict resolution | Always wrap merged classes in `cn()`. Critical when passing dark-on-dark overrides (e.g., a red button variant inside a red panel). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Browser DevTools color picker | Inspect OKLCH channel values in computed styles | Chrome DevTools supports OKLCH color space display. Useful when tuning `l` / `c` / `h` values directly in globals.css. |
| shadcn MCP tool (project tooling) | Generate or regenerate shadcn component variants | Use for scaffolding; then edit the generated `cva()` by hand for brand variants. |

---

## Techniques in Detail

### 1. Tailwind CSS 4 `@theme` — Adding Brand Tokens and Animations

Define tokens inside the existing `@theme {}` block in `globals.css`. Tailwind generates utility
classes for every `--color-*`, `--animate-*`, and `--radius-*` token declared here.

```css
/* globals.css — inside the existing @theme {} block */
@theme {
  /* New brand accent — warm amber for highlight states */
  --color-brand-amber:       oklch(0.72 0.16 75);
  --color-brand-amber-muted: oklch(0.72 0.16 75 / 15%);

  /* Custom micro-interaction animation */
  --animate-pop: pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes pop {
    0%   { transform: scale(0.94); }
    60%  { transform: scale(1.04); }
    100% { transform: scale(1); }
  }
}
```

This makes `bg-brand-amber`, `text-brand-amber`, `bg-brand-amber-muted`, and `animate-pop`
available as Tailwind utilities immediately.

**Rule:** Put NEW color tokens and keyframes here. Never put hover variants or alpha variants as
separate tokens — derive them with relative color syntax instead (see technique 3).

---

### 2. CVA Variant Extension — Adding Bold Button and Badge Variants

The correct override for this stack is editing the `cva()` call in the component file directly.
No wrapper component is needed. The component file is already owned source code.

**Adding a `"brand"` primary CTA variant to Button:**

```tsx
// src/components/ui/button.tsx
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center ...", // existing base
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground ...",
        // ... existing variants ...

        // NEW: bold brand CTA — higher chroma crimson, uppercase tracking
        brand:
          "bg-brand-red text-white font-semibold tracking-wide uppercase text-xs " +
          "hover:bg-brand-red-hover active:scale-[0.97] transition-transform",

        // NEW: ghost with crimson text for secondary actions on dark panels
        "ghost-crimson":
          "text-brand-red hover:bg-brand-red-muted hover:text-brand-red " +
          "dark:hover:bg-brand-red-muted",
      },
      // ... existing size variants unchanged ...
    },
  }
)
```

**Adding status badge variants for table states:**

```tsx
// src/components/ui/badge.tsx
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit ...", // existing base
  {
    variants: {
      variant: {
        // ... existing variants ...

        // NEW status variants — map directly to table/order state semantics
        occupied:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        reserved:
          "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
        "check-requested":
          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
        cleaning:
          "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/20",
      },
    },
  }
)
```

---

### 3. CSS Relative Color Syntax — OKLCH Token Manipulation

Use `oklch(from <source> l c h)` to derive hover, active, and muted states without defining
additional CSS variables. All modern browsers support this (baseline 2023).

```css
/* globals.css — in :root or component-scoped CSS */
:root {
  --primary: oklch(0.50 0.26 27); /* boosted chroma for bolder brand refresh */
}

/* Derived states — no additional token needed */
.btn-primary:hover {
  background-color: oklch(from var(--primary) calc(l * 0.88) c h); /* 12% darker */
}

.btn-primary:active {
  background-color: oklch(from var(--primary) calc(l * 0.80) c h); /* 20% darker */
}

.badge-primary-muted {
  background-color: oklch(from var(--primary) l c h / 15%); /* 15% alpha */
}
```

**For the brand refresh specifically:** To strengthen the crimson, increase chroma from
`0.22` toward `0.26`–`0.28`. Higher chroma = more saturated. Lightness `0.50` is the sweet
spot for WCAG contrast on white. Test with: `oklch(0.50 0.26 27)` for light mode primary.

---

### 4. tw-animate-css — Available Utilities (Already Installed)

The full utility set is active. Key classes for energetic POS UI:

**Enter animations (use with `animate-in`):**
- `fade-in` — opacity 0 → 1
- `zoom-in-95` — scale 0.95 → 1 (tight, snappy)
- `slide-in-from-bottom-2` — translate 0.5rem up (modal/sheet entry)
- `slide-in-from-top-2` — translate 0.5rem down (dropdown entry)
- `spin-in` — rotate 30deg → 0 (icon state change)

**Exit animations (use with `animate-out`):**
- `fade-out`, `zoom-out-95`, `slide-out-to-bottom-2`

**Duration modifiers:** `duration-150` (micro), `duration-200` (standard), `duration-300` (deliberate)

**Recommended composition for POS interactions:**
- Dialog open: `animate-in fade-in zoom-in-95 duration-200`
- Badge status change: `animate-in fade-in zoom-in-95 duration-150`
- Toast appear: `animate-in slide-in-from-bottom-2 fade-in duration-300`
- Button press: Use native CSS `active:scale-[0.97] transition-transform duration-75` (not tw-animate — too instant for keyframe overhead)

---

### 5. `@layer base` — Typographic Hierarchy

Add typographic scale rules inside `@layer base {}` in globals.css. This layer runs before
component and utility layers, so utility overrides still win.

```css
@layer base {
  /* Existing rules stay ... */

  /* NEW: sharper hierarchy for POS legibility */
  h1, h2, h3 {
    @apply font-bold tracking-tight;
  }

  h4, h5, h6 {
    @apply font-semibold;
  }

  /* Table and KDS contexts need tight leading */
  .pos-label {
    @apply text-xs font-semibold uppercase tracking-widest text-muted-foreground;
  }
}
```

---

## Installation

No new packages needed for v1.1. All techniques operate within the current dependency tree.

```bash
# Nothing to install — verify existing versions are correct
npm list tailwindcss tw-animate-css class-variance-authority tailwind-merge
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| CSS Relative Color Syntax (`oklch(from var(...))`) | Manual `--primary-hover` token in `:root` | When you need IE11/old-Safari support (not applicable here — POS tablet is modern Chrome/Safari) |
| CVA variant extension (edit component file) | Wrapper component with `cn()` override | When you cannot touch the component source (third-party library). Here the source is owned. |
| tw-animate-css `animate-in` composition | Framer Motion `motion.div` | When you need physics-based spring animations, layout animations, or shared element transitions — not needed for a POS wireframe's micro-interactions |
| `active:scale-[0.97]` Tailwind utility | tw-animate-css keyframe animation | Button press feedback needs to be instant (<80ms). Keyframe overhead is noticeable. Native `scale` + `transition` is the right tool. |
| `@theme` for new tokens | JavaScript `tailwind.config.js` | In Tailwind 3 projects. This project uses Tailwind 4 CSS-first config — there is no `tailwind.config.js` and none should be created. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `framer-motion` | 50KB+ runtime; adds a second animation system alongside tw-animate-css; overkill for a wireframe's micro-interactions | `tw-animate-css` + `transition-*` Tailwind utilities + `active:scale-[0.97]` |
| `tailwindcss-animate` (legacy) | The Tailwind v3 plugin — incompatible with v4's CSS-first architecture | `tw-animate-css` (already installed — the v4-native replacement) |
| CSS Modules for component-scoped styles | Introduces a second styling mental model alongside Tailwind; class name collisions in dev | CVA + `cn()` — already the project's pattern |
| `tailwind-variants` library | A CVA replacement with slots — valuable in a design system, high churn to migrate mid-project | CVA 0.7.x is already installed and used consistently throughout |
| Separate `--primary-hover`, `--primary-active` tokens in `:root` | Token proliferation; hard to keep in sync when the base color changes | CSS relative color syntax — derive states from the base token at use site |
| `@radix-ui/*` primitives | Project uses `@base-ui/react`. Mixing both creates two dialog stacks with incompatible prop APIs and conflicting CSS variable names | Stay on `@base-ui/react` for all primitives |
| External color library (chroma.js, color) | JavaScript color math adds bundle weight; runs at JS runtime not CSS render time | CSS `oklch(from ...)` relative color syntax — zero bundle cost, runs in browser paint |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| tailwindcss ^4 | tw-animate-css ^1.4.0 | tw-animate-css uses `@theme inline` + `@utility` — designed for Tailwind 4 CSS-first architecture. Verified by reading installed `dist/tw-animate.css` in this project. |
| tailwindcss ^4 | @tailwindcss/postcss ^4 | Must match major version. Already aligned in this project's `devDependencies`. |
| shadcn ^4.0.2 | tailwindcss ^4 | shadcn v4 CLI generates Tailwind 4 CSS-first components. The `shadcn/tailwind.css` import provides base token layer. Confirmed working in this project. |
| @base-ui/react ^1.2.0 | React 19.x | Base UI 1.x built for React 18+. Confirmed working with React 19 in this project. |
| class-variance-authority ^0.7.1 | tailwind-merge ^3.5.0 | No conflict. CVA produces class strings; tailwind-merge deduplicates at `cn()` call. Standard combination. |
| next 16.1.6 | tailwindcss ^4 | Next.js 16 uses Turbopack by default. Tailwind 4's PostCSS plugin works with both Turbopack and webpack. |
| CSS Relative Color Syntax | All modern browsers (Baseline 2023) | Chrome 119+, Firefox 128+, Safari 16.4+. Global support 92%+ as of 2025. POS tablet targets Chrome/Safari — fully safe to use. |

---

## The Single Control Surface: globals.css Structure

All theming flows through one file. The existing structure is correct:

```
@import "tailwindcss";         <- Tailwind core
@import "tw-animate-css";      <- animate-in / animate-out family
@import "shadcn/tailwind.css"; <- shadcn base resets + token scaffolding

@theme { ... }                 <- ADD new brand color tokens and @keyframes here
@theme inline { ... }          <- ADD new semantic token mappings here
:root { ... }                  <- MODIFY --primary OKLCH value for brand refresh
.dark { ... }                  <- MODIFY dark mode equivalents
@layer base { ... }            <- ADD typography hierarchy rules here
```

Do not create `tailwind.config.js` — Tailwind 4 is fully CSS-first. Config file is unused
in this project and would be ignored.

---

## Sources

- [Tailwind CSS — Theme variables](https://tailwindcss.com/docs/theme) — `@theme`, `@theme inline`, `@theme static` behavior, token namespaces. HIGH confidence — official docs.
- [Tailwind CSS — Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles) — `@layer`, `@utility` directive patterns. HIGH confidence — official docs.
- [Tailwind CSS v4.0 release blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first architecture overview, OKLCH default palette. HIGH confidence — official.
- [tw-animate-css GitHub (Wombosvideo/tw-animate-css)](https://github.com/Wombosvideo/tw-animate-css) — Full utility inventory confirmed by reading installed `node_modules/tw-animate-css/dist/tw-animate.css`. HIGH confidence — source file inspection.
- [CSS relative color syntax — Chrome for Developers](https://developer.chrome.com/blog/css-relative-color-syntax) — `oklch(from var(--x) l c h)` syntax and browser support. MEDIUM-HIGH confidence — official Chrome team article; MDN agrees.
- [MDN — oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch) — Channel ranges, Baseline 2023 status. HIGH confidence — MDN.
- [Vercel Academy — Extending shadcn/ui](https://vercel.com/academy/shadcn-ui/extending-shadcn-ui-with-custom-components) — CVA extension patterns. MEDIUM confidence — official Vercel source.
- [OKLCH in CSS — Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) — Chroma range guidance, perceptual uniformity rationale. MEDIUM confidence.
- Project source files inspected: `src/app/globals.css`, `package.json`, `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`

---

*Stack research for: A Ramen POS Wireframe — v1.1 Brand Polish + Bug Fixes*
*Researched: 2026-03-11*
