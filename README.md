# A Ramen POS — Interactive Hi-Fi Wireframe

Interactive Hi-Fi wireframe for an A Ramen restaurant POS system. Dual-purpose: dev-handoff spec + stakeholder presentation artifact. Browser-based, no backend — all data is mock/in-memory or localStorage-persisted via Zustand.

Part of the FIP (Food Intelligent Platform) ecosystem.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — login with any role using PIN `9999`.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (catches type errors)
npm run lint     # ESLint
```

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS 4** — config via `@theme` block in `globals.css`
- **shadcn/ui** using **@base-ui/react** as headless primitives
- **Zustand 5** with `persist` middleware for cross-route state
- **CVA** for component variants
- **lucide-react** for icons
- **sonner** for toast notifications
- **next-themes** for dark mode
- Font: **Thonburi** (system) with IBM Plex Sans / Noto Sans fallbacks

## Route Groups

| Group | Path | Purpose |
|-------|------|---------|
| `(auth)` | `/login` | Role selection + PIN entry |
| `(app)` | `/table-map`, `/orders`, `/order/*`, `/payment/*`, `/manager` | Staff POS interface with AppShell |
| `(kds)` | `/kds` | Kitchen Display System — full-screen, no shell |

## KDS (Kitchen Display System)

Full-screen kitchen display at `/kds` for Kitchen and Manager roles.

### Layout

- **KPI Bar** — Average cooking time + on-time cooking percentage + settings gear
- **Main Area** — Order cards (1 menu item per card) with color-coded urgency headers
  - Green: < 30 seconds
  - Amber: 30–60 seconds
  - Red: > 60 seconds
- **Summary Sidebar** — Aggregated menu items grouped by 5-minute time windows
- **Bottom Table Bar** — Per-table cards with progress and timer

### Key Flows

| Action | Flow |
|--------|------|
| Send single item | Click "ส่งออร์เดอร์" on card → card disappears → toast |
| Send all (by menu) | Sidebar ReplyAll → confirm dialog with affected tables → ยืนยัน |
| Send all (by table) | Table bar ReplyAll → confirm dialog → ยืนยัน |
| View table detail | Click table card → bottomsheet with all orders for that table |
| View menu detail | Click sidebar item → bottomsheet filtered by that menu item |
| Cancel order | POS cancels → card shows "ออร์เดอร์ถูกยกเลิก" overlay → click to update info |

### Demo Mode

Enable via settings gear dropdown:

- **Demo Mode** — Injects random orders every 8–12 seconds across 5 table slots (T01–T05)
- **Cancel Simulation** — Randomly cancels items every 5–10 seconds (only when demo is active)

### A/B Testing

The table bottomsheet has a built-in Design A/B toggle in its header:

- **Design A** — Order cards + footer buttons
- **Design B** — Order cards + inline summary sidebar + footer buttons

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `KdsBoard` | `src/components/kds/KdsBoard.tsx` | Main board layout with auto-registration |
| `KdsTicketCard` | `src/components/kds/KdsTicketCard.tsx` | Single item card (normal + cancelled states) |
| `KdsItemRow` | `src/components/kds/KdsItemRow.tsx` | Item with color-coded modifier icons |
| `KdsKpiBar` | `src/components/kds/KdsKpiBar.tsx` | Top KPI stats bar |
| `KdsSummaryPanel` | `src/components/kds/KdsSummaryPanel.tsx` | Right sidebar with time-grouped aggregation |
| `KdsTableBar` | `src/components/kds/KdsTableBar.tsx` | Bottom table bar with per-table cards |
| `KdsTableBottomsheet` | `src/components/kds/KdsTableBottomsheet.tsx` | Table/menu detail bottomsheet (A/B variants) |
| `KdsSendConfirmDialog` | `src/components/kds/KdsSendConfirmDialog.tsx` | Menu-level send confirmation with table list |
| `KdsTableSendConfirmDialog` | `src/components/kds/KdsTableSendConfirmDialog.tsx` | Table-level send confirmation |
| `KdsCancelInfoDialog` | `src/components/kds/KdsCancelInfoDialog.tsx` | Cancel info form (stock deduct + notes) |

### State (Zustand)

KDS store (`src/stores/kds.store.ts`) — not persisted:

- `tickets` — Active KDS tickets keyed by ticketId
- `KdsTicket.sentLineIds` — Tracks individually sent items
- `KdsTicket.cancelledLineIds` — Tracks items cancelled from POS
- `completedTableIds` — Prevents re-registration of completed tables

## Roles

| Role | PIN | Access |
|------|-----|--------|
| Waiter | 9999 | POS app (orders, tables) |
| Cashier | 9999 | POS app (payments) |
| Manager | 9999 | POS app + KDS + manager tools |
| Kitchen | 9999 | KDS only |

## Deploy

```bash
npm run build
```

Deploy to Vercel or any Node.js hosting platform.
