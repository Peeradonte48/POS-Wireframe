# Phase 2: Table Map - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can view every table's current status on a digital floor plan, open a table for incoming guests, and navigate to the appropriate next action based on table state. Order entry, payment, and KDS are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Floor plan structure
- Single zone "Main Floor" — no multiple zones or sections
- 12 tables, labeled T01–T12
- Responsive grid: 4 columns on tablet (≥768px), 3 columns on mobile (375px)
- Page header shows live count: "X / 12 tables available"
- No drag-to-reposition (static layout — decided in Phase 1 roadmap)

### Table tile
- Always visible on tile: table number, colored border (status), status text label, guest count (when occupied), dwell timer (when occupied), order stage badge (when order exists)
- Assigned waiter is NOT on the tile — shown in the bottom sheet only
- Status visual: colored border + status text label (not background fill, not dot-only)
- Status color mapping (Claude's discretion for exact hex, follow this intent):
  - Open → green
  - Occupied → red/orange
  - Reserved → blue/purple
  - Check Requested → amber/yellow
  - Cleaning → gray

### Table detail bottom sheet
- Tapping any non-Open table slides up a bottom sheet from the bottom
- Floor plan fades behind sheet (overlay/dim)
- Bottom sheet content varies by status:
  - **Occupied**: table number, guest count, dwell timer, waiter name (editable inline text), table note (editable inline text), order stage badge, [View Order] + [Served] + [Request Check] buttons
  - **Check Requested**: table number + [Go to Payment] button (Phase 5 target — placeholder link in Phase 2)
  - **Cleaning**: table number + [Mark Clean] button → resets table to Open
  - **Reserved**: table number + status label only (read-only, no interactive trigger)

### Open Table modal
- Tapping an Open tile → bottom sheet with two options: [Open Table] and [Mark Reserved]
- Tapping [Open Table] → center modal (reusing existing Dialog component from Phase 1)
- Modal fields:
  - Guest count: number input field (keyboard on tap), required, min 1
  - No waiter or note in modal — these are editable post-seating from the bottom sheet
- Confirm button label: "Open Table"
- After confirming: modal closes, tile immediately updates to Occupied (red border, guest count, 0:00 timer), user stays on floor plan — NO navigation to order entry
- Matches A Ramen's real-world flow: staff opens table → customer fills paper order form → staff comes back to key in order

### State machine (complete lifecycle for Phase 2)
- Open → Occupied: via "Open Table" modal (guest count input)
- Open → Reserved: via "Mark Reserved" in bottom sheet (mock only — pre-seed 1–2 reserved tables in fixture; interactive toggle available but not a focus)
- Occupied → Check Requested: via "Request Check" button in occupied bottom sheet
- Check Requested → Cleaning: driven by Phase 5 payment confirmation (placeholder in Phase 2)
- Cleaning → Open: via "Mark Clean" button in cleaning bottom sheet
- Occupied order stage updates (Ordered → Cooking → Ready → Billed): driven by Phase 3 KDS/order data

### Served button
- "Served" button lives inside the occupied table bottom sheet (not on the tile directly)
- Pressing Served changes order stage badge from "Cooking/Ready" to "Served" and records service start time in the table store
- Waiter presses this after physically delivering food and placing the invoice on the table (matches CLAUDE.md Receiving phase flow)

### Zustand store
- New `table.store.ts` follows same pattern as `session.store.ts`
- Table state shape: `{ id, label, status, guestCount, openedAt, waiterId, waiterName, note, orderStage, servedAt }`
- Tables initialized as Open; 1–2 pre-seeded as Reserved in mock data
- Dwell timer: computed from `openedAt` using `Date.now()` — interval-driven display in component

### Claude's Discretion
- Exact Tailwind color classes for each status (follow the color intent above)
- Bottom sheet animation implementation (CSS transition or Framer Motion)
- Exact spacing, typography, tile height
- Dwell timer format (0:42 vs 42m vs 0h 42m — use 0:42 for under 1hr, 1h 02m for over)
- Loading/empty states

</decisions>

<specifics>
## Specific Ideas

- A Ramen real-world flow (from CLAUDE.md): Staff opens table + enters guest count → customer takes paper forms + fills order → customer rings table bell → staff walks over, collects forms, keys order into POS. **Phase 2 ends at "Open Table confirmed". Order entry is Phase 3.**
- "Open Table" is the A Ramen operational term (not "Seat Table" as used in the roadmap requirements — use "Open Table" in all UI copy)
- The floor plan is the first screen staff sees after login + shift open. It must be immediately scannable — staff should be able to spot available tables at a glance.
- Payment flow: customer walks to counter, gives table number → staff searches table on POS. The floor plan + table number lookup must support this in Phase 5.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Badge` component (`src/components/ui/badge.tsx`): use for order stage badge on tile (Ordered/Cooking/Ready/Billed/Served)
- `Dialog` component (`src/components/ui/dialog.tsx`): reuse for Open Table modal (same pattern as ManagerPinModal in Phase 1)
- `Input` component (`src/components/ui/input.tsx`): guest count number input in modal; inline waiter/note fields in bottom sheet
- `Button` component (`src/components/ui/button.tsx`): all action buttons
- `session.store.ts` pattern: `table.store.ts` follows identical Zustand `create<T>()` pattern
- `BRANCHES` + `STAFF` mock data fixtures: staff fixture already has 4 named staff → reuse for waiter assignment display

### Established Patterns
- Zustand store with no persist middleware (intentional — each session starts fresh)
- Client-only components (`'use client'`) for all interactive views
- shadcn/ui Dialog for modals (Base UI Dialog already wired in Phase 1 — confirm which one is canonical before using)
- Tailwind CSS 4 CSS-first config (`@theme` block in `globals.css`) — no `tailwind.config.js`
- TypeScript strict mode: all store types must be fully typed

### Integration Points
- `/table-map` route already exists as the post-shift-open redirect target (Phase 1 wired `router.replace('/table-map')`)
- `AppShell` + `(app)/layout.tsx` auth guard already wraps all `(app)` routes — no auth work needed
- `ROLE_NAV_ACCESS`: Waiter and Manager have `table-map` access; Kitchen does NOT — floor plan is already gated
- `useSessionStore`: Phase 2 components read `role`, `staffName`, `branchName` from existing store

</code_context>

<deferred>
## Deferred Ideas

- **Loyalty program** (from CLAUDE.md update): QR code on receipt for loyalty points collection — separate FIP module, not POS v1 scope
- **Queue system integration**: Customer queue ticket machine at front of store — separate hardware system; POS only shows table status, not queue position
- **QR coupon scanning** (Payment phase): Staff scans customer QR coupon from tablet camera — Phase 5 concern
- **Dynamic QR payment**: System displays QR for customer to scan — Phase 5 concern
- **Auto-print receipt with unique QR**: Phase 5/6 concern
- **Reserved table interactive toggle**: FLOOR-01 includes Reserved as a status — the wireframe shows it via mock pre-seeded data; interactive "reserve from floor plan" can be added in Phase 6 or 7 if needed
- **Table search / lookup by number**: Cashier at counter searches table by number for payment — Phase 5 should include this

</deferred>

---

*Phase: 02-table-map*
*Context gathered: 2026-03-10*
