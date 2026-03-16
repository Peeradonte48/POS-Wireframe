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
   - Order ID: e.g. GR-4401 (required, text field)
   - Customer name (optional)
   - Customer phone (optional)
4. Staff taps **Start Adding Items →** — navigates to `/order/delivery/[orderId]`
5. Order entry page reuses existing MenuPanel + ModifierSheet + TicketPanel (same as dine-in, with full modifier support)
6. Staff confirms order → items sent to KDS with delivery tag → order status set to **Confirmed** → navigate back to `/table-map?tab=delivery`
7. Staff advances status on DeliveryCard: **Confirmed → Preparing → Ready for Rider → Picked Up**

## What Is Removed

- Simulate Order / Stop Demo demo controls
- Auto-accept toggle
- Pending order state and countdown ring timer
- Accept / Reject action buttons on DeliveryCard
- RejectReasonDialog component
- Rejected order status

## Data Model

### QueueOrder type (after)

```ts
type QueueOrder = {
  orderId: string
  channel: 'delivery' | 'takeaway'
  platform: 'grab' | 'lineman'
  externalId: string        // platform order ID, e.g. "GR-4401"
  customerName?: string
  customerPhone?: string
  itemsSummary: string
  status: 'Confirmed' | 'Preparing' | 'ReadyForRider' | 'PickedUp'
  createdAt: number
}
```

### queue.store changes

**Remove:**
- `status: 'Pending' | 'Rejected'` from the status union
- `pendingAt` field on QueueOrder
- `rejectionReason` field on QueueOrder
- `simulateOrder()` action
- `demoActive` state + `toggleDemoActive()` action
- `autoAccept` state + `toggleAutoAccept()` action
- `acceptOrder()` action
- `rejectOrder()` action

**Add:**
- `createDeliveryOrder(platform, externalId, customerName?, customerPhone?): string` — creates a new delivery order with status `Confirmed`, returns the generated `orderId`

### Status lifecycle (unchanged)

`Confirmed → Preparing → ReadyForRider → PickedUp`

Driven by existing `advanceStatus(orderId)` action — no changes needed.

## Components & Files

### New files

| File | Purpose |
|------|---------|
| `src/components/queue/NewDeliveryModal.tsx` | Bottom sheet for metadata entry (platform, externalId, optional customer info). On submit, calls `createDeliveryOrder()` and navigates to order entry page. |
| `src/app/(app)/order/delivery/[orderId]/page.tsx` | Delivery order entry page. Reads delivery order from queue.store by orderId. Renders MenuPanel + ModifierSheet + TicketPanel with delivery context in header (platform badge + externalId). "Confirm Order" sends items to kds.store and navigates back to `/table-map?tab=delivery`. |

### Edited files

| File | Change |
|------|--------|
| `src/stores/queue.store.ts` | Remove Pending/Rejected states and all related actions; add `createDeliveryOrder()` |
| `src/components/queue/DeliveryPanel.tsx` | Remove demo controls and pending section; add "+ New Order" button that opens NewDeliveryModal |
| `src/components/queue/DeliveryCard.tsx` | Remove CountdownRing, Accept/Reject buttons, isPending logic, Rejected status rendering |

### Deleted files

| File | Reason |
|------|--------|
| `src/components/queue/RejectReasonDialog.tsx` | Reject flow no longer exists |

## What Stays the Same

- `advanceStatus()` action — unchanged
- DeliveryCard CTA buttons (Mark Preparing, Mark Ready for Rider, Confirm Picked Up) — unchanged
- KDS delivery differentiation (items tagged as delivery) — unchanged
- Takeaway flow — completely untouched
- Platform badges (Grab green, LINE MAN green) — unchanged

## Constraints

- Order entry page must reuse existing MenuPanel + ModifierSheet + TicketPanel — do not duplicate order entry logic
- Back navigation from order entry page returns to `/table-map?tab=delivery`
- No real API integration — this remains a wireframe with mock/in-memory data
