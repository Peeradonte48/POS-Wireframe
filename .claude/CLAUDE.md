# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Rules

@rules/design-principle.md - Rule for design dicision.
@rules/implement-figma-design.md - Rule for implement figma design.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (catches type errors)
npm run lint     # ESLint
```

No test framework is configured. Use `npm run build` to verify TypeScript correctness.

## What This Is

Interactive Hi-Fi wireframe for an A Ramen restaurant POS system. Dual-purpose: dev-handoff spec + stakeholder presentation artifact. Browser-based, no backend — all data is mock/in-memory or localStorage-persisted via Zustand.

Part of the FIP (Food Intelligent Platform) ecosystem. This wireframe covers: authentication, floor management, order entry with ramen modifiers, KDS, payment with camera coupon scan + dynamic QR, loyalty, and manager tools.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS 4** — config lives in `globals.css` via `@theme` block (no tailwind.config.js)
- **shadcn/ui** using **@base-ui/react** (NOT Radix) as headless primitives
- **Zustand 5** with `persist` middleware for cross-route-group state survival
- **CVA** (class-variance-authority) for component variants
- **lucide-react** — default icon library (matches shadcn/ui default); `import { IconName } from 'lucide-react'`
- **sonner** for toast notifications via `ThemedToaster` wrapper
- **next-themes** for dark mode
- Path alias: `@/*` → `./src/*`

## Architecture

### Route Groups

Three Next.js route groups with separate layouts:

- `(auth)` — `/login` — Centered minimal layout, no shell
- `(app)` — Staff POS interface — `AppShell` with header + collapsible sidebar. Auth guard checks role + shiftOpen, redirects Kitchen to `/kds`
- `(kds)` — `/kds` — Full-screen kitchen display, separate layout with its own `ThemedToaster`

Each route group has its own `layout.tsx`. The `(app)` and `(kds)` groups destroy each other's React tree on navigation — this is why Zustand `persist` middleware is required.

### State Management (src/stores/)

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `session.store` | No | Role, staff identity, shift state |
| `table.store` | Yes | Table status lifecycle (Open→Occupied→CheckRequested→Cleaning), guest count, servedAt |
| `order.store` | Yes | Order rounds, line items with modifiers, void tracking |
| `bill.store` | Yes | Split billing (equal/per-seat) and table merges — payment-phase concerns only |
| `manager.store` | Yes | 86'd items, shift close state |
| `kds.store` | No | Kitchen ticket board, bump/recall, demo mode |

**Key state types:**

- `TableStatus`: `Open | Occupied | Reserved | CheckRequested | Cleaning`
- `OrderStage`: `Ordered | Cooking | Ready | Served | Billed` — lives on `TableRecord`, updated by KDS bump
- `OrderLineItem`: `{ lineId, menuItemId, basePrice, modifiers: ModifierSelection[], spiceLevel, quantity, status: 'unsent'|'sent'|'voided' }`
- `BillSplit`: `{ mode: 'equal'|'per-seat', seatCount, equalAmounts[], assignments[], payments: Record<seatIndex, SeatPaymentRecord> }`
- `bill.store.merges`: `Record<secondaryTableId, primaryTableId>` — flat map; O(1) lookup for `isMergedSecondary`

### Permission System (src/lib/role-permissions.ts)

Two-level access control:

- `canAccess(role, navSlug)` — Navigation visibility (sidebar items)
- `canDoAction(role, actionKey)` — Action-level gating (buttons, workflows)

Roles: `Waiter | Cashier | Manager | Kitchen`

### Design Tokens (src/app/globals.css)

All tokens use **OKLCH color space**. Key token families:

- **Brand:** `--color-brand-red: oklch(0.52 0.26 27)` (crimson primary)
- **Status:** `--color-status-{open|occupied|reserved|check-requested|cleaning}-{fg|bg}` — independently tuned for dark mode (not opacity-reduced)
- **Elevation:** `--shadow-card` (flat), `--shadow-panel` (raised), `--shadow-floating` (modal-level)
- **Glow:** `--shadow-glow-primary` uses `color-mix(in oklch, ...)` for button hover

Dark mode has independently tuned OKLCH values in `.dark` — never just opacity modifications.

### Critical Patterns

**Shadow tokens must use inline style, not Tailwind classes:**
```tsx
style={{ boxShadow: 'var(--shadow-card)' }}
```
Multi-value CSS strings are incompatible with Tailwind v4 `@theme inline`.

**CVA variants in `button.tsx` and `badge.tsx`:** Extend variants in place, never wrap these components. Notable non-obvious variants:
- `button` → `variant="option-card"` — bordered card-style picker button with `data-[selected=true]` state baked in; use for mode/option selectors
- `badge` → `variant="settled"` — green terminal-state badge for paid/closed tables

**ThemedToaster:** Thin `'use client'` wrapper around sonner `Toaster` — uses `resolvedTheme` (not `theme`) because sonner doesn't handle `'system'`. Mount once per layout, never per page.

**`@theme inline` must use `var(--token)` only** — never literal OKLCH values (dark mode breaks silently).

**`@utility caps`** — defined in globals.css via `@apply`. Use the utility class, don't duplicate the pattern inline.

**Zustand selector infinite loop:** Store actions that return new arrays/objects on every call (e.g. `getMergedSecondaries`) cause React's `useSyncExternalStore` to loop with "getSnapshot should be cached". Never call such functions inside a Zustand selector. Instead, select the raw primitive state and derive in `useMemo`:
```tsx
// ✗ infinite loop
const ids = useBillStore((s) => s.getMergedSecondaries(tableId))

// ✓ stable
const merges = useBillStore((s) => s.merges)
const ids = useMemo(() => Object.keys(merges).filter((k) => merges[k] === tableId), [merges, tableId])
```

**Non-reactive store reads:** Use `useXStore.getState().someValue` for values that don't change at runtime (e.g. a table's label in a badge). Avoids a subscription when the value is static.

## High-Level User Flow

*Use this as a blueprint for designing the POS system.*

### 1. Pre-Dining Phase (Queue & Table Management)

- Customer walks to kiosk for queue ticket, waits for number to be called
- Staff monitors real-time table occupancy via Digital Floor Plan
- Staff selects available table → "Open Table" with guest count input → session tracking begins

### 2. Ordering Phase (The "Exam Paper" System)

- Customer fills out Main Menu and Customization sheet forms
- Customer presses table call bell (standalone, not POS)
- Staff collects forms, verifies selections, performs read-back
- Staff inputs data via POS using Forced Modifiers (spiciness, noodle texture)
- Staff confirms order → auto inventory depletion → transmitted to KDS/printer

### 3. Receiving Phase (Service & Fulfillment)

- Customer receives meal through service hatch
- Staff tracks order status by checking service counter (no digital tracking yet)
- Staff taps "Served" on tablet to log actual service start time for KPIs

### 4. Payment Phase (Integrated Checkout)

- Customer provides table number + discount QR code at counter
- Staff uses tablet rear camera to scan coupon within POS app (no app switching)
- System calculates discount, displays Dynamic QR Code for customer "Scan to Pay"

### 5. Loyalty Phase (Member Points)

**Scenario A: Standalone (No CRM)** — Receipt has static QR → customer opens web portal → manually enters phone/receipt ID to claim points. Staff cannot see member data.

**Scenario B: Integrated CRM (Smart Loyalty)** — POS shows member tier + points during checkout. Receipt has Dynamic QR with transaction value + branch ID + timestamp. Customer scans once → points credited instantly → push notification sent.
