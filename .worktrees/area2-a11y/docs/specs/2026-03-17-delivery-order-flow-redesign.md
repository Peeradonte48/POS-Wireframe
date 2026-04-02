# Delivery Order Flow Redesign

**Date:** 2026-03-17
**Status:** Approved

## Overview

Redesign the delivery order flow from a reactive (auto-receive) model to a staff-initiated (manual entry) model. In the real operation, delivery orders arrive on a separate Grab or LINE MAN tablet. Staff read the order from that tablet and manually enter it into the POS — the POS does not receive orders automatically from delivery platforms.

## Problem

The current implementation simulates inbound orders automatically and presents staff with Accept/Reject decisions with a countdown timer. This does not match the actual restaurant workflow, where no direct API integration with Grab or LINE MAN exists.

## New User Flow

1. Staff receives order on the external Grab / LINE MAN tablet (outside POS scope)
2. Staff taps **+ New Order** button in the Delivery tab of the POS
3. A creation sheet opens — staff enters:
   - Platform: Grab or LINE MAN (required, toggle selector)
   - External Order ID: e.g. GR-4401 (required, text field — used as reference to the platform order)
   - Customer name (optional)
   - Customer phone (optional)
4. Staff taps **Start Adding Items →** — navigates to `/order/delivery/[orderId]`
5. Order entry page reuses existing MenuPanel + ModifierSheet + TicketPanel (same as dine-in, with full modifier support). The `orderId` (e.g. `DL-grab-7821`) is passed as the `tableId` prop throughout the component triplet — `order.store` accumulates line items under this key.
6. Staff taps **"Confirm Order"** (TicketPanel's send button, relabelled via a new `sendLabel` prop) → `itemsSummary` is computed from confirmed line items → items sent to KDS with delivery tag → order status set to **Confirmed** → navigate back to `/table-map?tab=delivery`
7. Staff advances status on DeliveryCard: **Confirmed → Preparing → Ready for Rider → Picked Up**
8. **Picked Up** orders are hidden from the active list (same filter behaviour as before — only `Confirmed`, `Preparing`, `ReadyForRider` are shown)

## What Is Removed

- Simulate Order / Stop Demo demo controls
- Auto-accept toggle
- Pending order state and countdown ring timer
- Accept / Reject action buttons on DeliveryCard
- `RejectReasonDialog` component
- Rejected order status

## Data Model

### QueueOrder type — incremental changes only

`QueueOrder` is shared between delivery and takeaway. Only delivery-specific fields are changed. The takeaway channel shape is unchanged — `createTakeaway()` continues to work as before.

**Fields removed:**
- `pendingAt?: number`
- `rejectionReason?: string`

**Fields added:**
- `externalId?: string` — platform order reference (e.g. `"GR-4401"`); set only on delivery orders, not present on takeaway

**Fields modified:**
- `customerName: string → customerName?: string` — made optional to support delivery orders where customer name is not captured. Takeaway's `createTakeaway(customerName, ...)` still passes the name, so takeaway behaviour is unchanged.

**Status union changes:**
- Remove: `'Pending'` and `'Rejected'`
- Remaining delivery statuses: `'Confirmed' | 'Preparing' | 'ReadyForRider' | 'PickedUp'`
- Takeaway statuses unchanged: `'Taking' | 'Sent' | 'Ready' | 'Collected' | 'Cancelled'`

### `itemsSummary` lifecycle

On creation (via `createDeliveryOrder`), `itemsSummary` is set to `''` (empty string). When staff confirms the order on the entry page, the confirm handler computes a human-readable summary from the submitted line items (e.g. `"Tonkotsu ×2, Shoyu ×1"`) and calls `updateItemsSummary(orderId, summary)` before navigating back. `DeliveryCard` renders `itemsSummary` as-is; an empty string renders nothing.

### queue.store changes

**Remove:**
- `'Pending'` and `'Rejected'` from `QueueOrderStatus`
- `pendingAt` field on `QueueOrder`
- `rejectionReason` field on `QueueOrder`
- `simulateOrder()` action
- `demoActive` state + `toggleDemoActive()` action
- `autoAccept` state + `toggleAutoAccept()` action
- `acceptOrder()` action
- `rejectOrder()` action

**Add:**
- `createDeliveryOrder(platform: DeliveryPlatform, externalId: string, customerName?: string, customerPhone?: string): string` — creates a new `QueueOrder` with `channel: 'delivery'`, status `'Confirmed'`, `itemsSummary: ''`, and returns the generated `orderId`. The `orderId` is generated as `` `DL-${platform}-${Date.now()}` `` (e.g. `DL-grab-1773695938000`) — timestamp suffix ensures uniqueness within a single browser session (sufficient for a wireframe).
- `updateItemsSummary(orderId: string, summary: string): void` — updates `itemsSummary` on an existing order after items are confirmed

### Status lifecycle (delivery — unchanged)

`Confirmed → Preparing → ReadyForRider → PickedUp`

Driven by existing `advanceStatus(orderId)` action — no changes needed.

## KDS Integration

When staff confirms the delivery order on the order entry page, items are sent to `kds.store` via `addTicket()`. The `tableLabel` argument is set to the order's `externalId` (e.g. `"GR-4401"`) so KDS operators can cross-reference with the platform tablet. The `orderType` is `'delivery'` and `platform` is passed as-is.

## Components & Files

### New files

| File | Purpose |
|------|---------|
| `src/components/queue/NewDeliveryModal.tsx` | Bottom sheet for metadata entry (platform toggle, externalId input, optional customer name + phone). Submit button disabled until platform + externalId are filled. On submit, calls `createDeliveryOrder()` and navigates to `/order/delivery/[orderId]`. |
| `src/app/(app)/order/delivery/[orderId]/page.tsx` | Delivery order entry page. In Next.js App Router, the literal path segment `delivery` takes precedence over the `[tableId]` dynamic segment — `/order/delivery/GR-4401` routes here, not to the dine-in page. Reads delivery order from `queue.store` by `orderId`. If `orderId` is not found (e.g. page refresh or stale link), redirects immediately to `/table-map?tab=delivery`. Renders MenuPanel + ModifierSheet + TicketPanel with delivery context in header (platform badge + externalId). On "Confirm Order": computes `itemsSummary` from line items, calls `updateItemsSummary()`, sends items to KDS with `tableLabel = externalId`, then navigates back to `/table-map?tab=delivery`. |

### Edited files

| File | Change |
|------|--------|
| `src/stores/queue.store.ts` | Remove Pending/Rejected statuses, `pendingAt`, `rejectionReason`, and all related actions; make `customerName` optional; add `externalId?` field; add `createDeliveryOrder()` and `updateItemsSummary()` actions |
| `src/components/order/TicketPanel.tsx` | (1) Add optional `sendLabel?: string` prop — when provided, replaces the default "Send to Kitchen" button label. Delivery order entry page passes `sendLabel="Confirm Order"`. (2) Add optional `headerLabel?: string` prop — when provided, replaces the `table?.label ?? tableId` fallback in the panel header. Delivery order entry page passes `headerLabel={externalId}` so the panel header shows the human-facing reference (e.g. "GR-4401") instead of the internal key `DL-grab-7821`. (3) Fix `isTakeaway` detection: change `const isTakeaway = !!useQueueStore.getState().orders[tableId]` to `const isTakeaway = useQueueStore.getState().orders[tableId]?.channel === 'takeaway'` — delivery orders are in `queue.store` too and must not be misidentified as takeaway. |
| `src/components/queue/DeliveryPanel.tsx` | Remove demo controls and pending section; add "+ New Order" button that opens `NewDeliveryModal`; update empty-state copy to "Tap '+ New Order' to add a delivery order" |
| `src/components/queue/DeliveryCard.tsx` | Remove `CountdownRing`, Accept/Reject buttons, `isPending` logic, Rejected status rendering; replace the `font-mono` `order.orderId` span in the header row with `order.externalId` (the human-facing platform reference, e.g. "GR-4401"); render `customerName` conditionally — when absent, show nothing (the `externalId` in the header row already provides the human identifier); render `itemsSummary` conditionally — when empty, show nothing |
| `src/app/(app)/table-map/page.tsx` | (1) Update delivery badge count filter from `['Pending', 'Confirmed', 'Preparing', 'ReadyForRider']` to `['Confirmed', 'Preparing', 'ReadyForRider']`. (2) The file already has `'use client'`. Add `useSearchParams()` from `next/navigation`. Use `useState` initialised from `searchParams.get('tab') ?? 'dine-in'` as the controlled tab value: `const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'dine-in')`. Pass `value={activeTab}` and `onValueChange={setActiveTab}` to `<Tabs>`. This approach is reactive and handles both the back-navigation case (fresh mount with `?tab=delivery`) and any future in-page tab switches. |
| `src/components/app-shell/AppSidebar.tsx` | Same filter update: remove `'Pending'` from delivery active count filter |
| `src/app/(app)/order/[tableId]/page.tsx` | Fix the `isTakeaway` check (same pattern as `TicketPanel`): change `Boolean(useQueueStore.getState().orders[tableId])` to `useQueueStore.getState().orders[tableId]?.channel === 'takeaway'` — prevents delivery `orderId`s from being misidentified as takeaway, which incorrectly shows Edit Customer and Cancel buttons. |

### Deleted files

| File | Reason |
|------|--------|
| `src/components/queue/RejectReasonDialog.tsx` | Reject flow no longer exists |
| `src/lib/mock-data/delivery-demo.ts` | Only used by `simulateOrder()` which is removed |

## What Stays the Same

- `advanceStatus()` action — unchanged
- DeliveryCard CTA buttons (Mark Preparing, Mark Ready for Rider, Confirm Picked Up) — unchanged
- `PickedUp` orders filtered out of the active list — unchanged
- KDS delivery differentiation (items tagged as delivery) — unchanged
- Takeaway flow — completely untouched (`createTakeaway`, `TakeawayPanel`, `TakeawayCard`, `NewTakeawayModal` all unchanged)
- Platform badges (Grab, LINE MAN) — unchanged

## Constraints

- Order entry page must reuse existing MenuPanel + ModifierSheet + TicketPanel — do not duplicate order entry logic
- Back navigation from order entry page returns to `/table-map?tab=delivery`
- No real API integration — this remains a wireframe with mock/in-memory data
- `QueueOrder` type is shared with takeaway — changes must not break the takeaway channel
