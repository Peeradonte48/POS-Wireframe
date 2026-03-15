# Takeaway CRUD Flow — Design Spec

**Date:** 2026-03-15
**Status:** Approved by user

---

## Overview

After creating a takeaway order, staff should be taken directly to the order entry page to build the order. Takeaway orders need full CRUD: create (existing), read (existing card), update (customer info + menu items), and delete (cancel while Taking).

---

## Approach: Store Lookup for Context (Option B)

The existing `/order/[tableId]` page detects a takeaway order by looking up the `tableId` in `queue.store`. If a matching `QueueOrder` exists, the page renders a takeaway-specific header and Send CTA. No new routes. The order store already treats keys as opaque strings — `TK-001` flows through unchanged.

---

## CRUD Operations

### Create
- `NewTakeawayModal` calls `createTakeaway()` → receives returned `orderId` → `router.push('/order/${orderId}')`
- Queue order created with status `Taking`; `order.store` entry is created implicitly on first item add (`addItem` auto-creates an `ActiveOrder` shell)

### Read
- `TakeawayCard` shows summary (orderId, customer name, phone, itemsSummary, status badge)
- `/order/TK-001` shows full order entry with takeaway header

### Update
**Customer info** — edit icon (pencil) in order page header opens `EditCustomerModal`:
- Fields: name (required), phone (optional)
- Calls `queue.store.updateCustomer(orderId, name, phone)`
- Available only while status is `Taking`

**Menu items** — standard `MenuPanel` + `TicketPanel` (no prop changes). Add/remove items as normal. Only available while status is `Taking` (page is read-only otherwise — see Post-Taking State below).

### Delete (Cancel)
- Cancel button (✕) visible in order page header and on `TakeawayCard` — only when status is `Taking`
- Shared `ConfirmCancelDialog` component handles confirmation: "Cancel this order? TK-001 · [name] will be removed."
- On confirm: `queue.store.cancelOrder(orderId)` → `router.push('/table-map')`
- `cancelOrder` sets status to `Cancelled`; card disappears from TakeawayPanel (filtered out alongside `Collected`)

---

## Post-Taking State (Read-Only Guard)

When staff navigate to `/order/TK-001` and the queue order status is not `Taking` (e.g. `Sent`, `Ready`, `Collected`):

- `MenuPanel` is wrapped in `<div className="pointer-events-none opacity-50">` — no `disabled` prop needed, no `MenuPanel.tsx` changes required
- `TicketPanel` Send CTA is hidden
- Edit icon and Cancel button in the header are hidden
- A status pill shows the current order status (e.g. "Sent to Kitchen")

This prevents double-sends and stale edits after the order leaves the kitchen queue.

---

## File Changes

### `src/stores/queue.store.ts`
- `createTakeaway()` must return `orderId`. Because Zustand `set()` always returns `void`, derive the orderId **before** calling `set()`, then return it from the outer action:
  ```typescript
  // Store interface change:
  createTakeaway: (customerName: string, customerPhone?: string) => string

  // Implementation pattern:
  createTakeaway: (customerName, customerPhone) => {
    const counter = get().takeawayCounter + 1
    const orderId = `TK-${String(counter).padStart(3, '0')}`
    set((state) => ({
      takeawayCounter: counter,
      orders: { ...state.orders, [orderId]: { orderId, channel: 'takeaway', customerName, customerPhone, itemsSummary: 'No items yet', status: 'Taking', createdAt: Date.now() } },
    }))
    return orderId
  }
  ```
- Add `'Cancelled'` to the `QueueOrderStatus` union type (required for `cancelOrder` to be type-safe)
- Add `updateCustomer(orderId: string, name: string, phone?: string)` action — updates `customerName` and `customerPhone` on the matching order
- Add `cancelOrder(orderId: string)` action — sets status to `Cancelled`

### `src/components/queue/NewTakeawayModal.tsx`
- Add `useRouter` from `next/navigation`
- Call sequence: `createTakeaway()` → `onClose()` → `router.push('/order/${orderId}')`. Reset modal state first, then navigate — avoids any flash of stale form content during navigation animation.

### `src/app/(app)/order/[tableId]/page.tsx`
- **Identity check (non-reactive):** `const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])` — only checks whether the key exists, which never changes during the session. Safe as a non-reactive read.
- **Status (reactive):** `const queueStatus = useQueueStore((s) => s.orders[tableId]?.status)` — reactive selector on the primitive `status` string. Drives the read-only guard and button visibility correctly when status transitions (e.g. after Send). This follows the CLAUDE.md pattern of selecting raw primitive state.
- Derive `const isTakingStatus = queueStatus === 'Taking'` for clarity.
- **If `isTakeaway`:**
  - Header shows `TK-001 · [customerName]` with phone subtitle (customer name read once via `getState()` — static for the session)
  - Edit icon (pencil) visible when `isTakingStatus` → opens `EditCustomerModal`
  - Cancel button (✕) visible when `isTakingStatus` → opens `ConfirmCancelDialog`
  - When `!isTakingStatus`: show read-only status pill (maps `queueStatus` to a display label); wrap `MenuPanel` in `pointer-events-none opacity-50`; pass `hideSend` to TicketPanel
  - `router.push('/table-map')` after cancel confirmation
- **If not `isTakeaway`:** existing dine-in behaviour entirely unchanged

### `src/components/order/TicketPanel.tsx`
- Add optional `onSend?: () => void` prop and optional `hideSend?: boolean` prop
- When `hideSend` is true, the Send button is not rendered (used for post-Taking read-only state)
- **Takeaway send pattern — Interpretation B (committed):** When `onSend` is provided, TicketPanel calls `sendRound(tableId)` as normal to persist items, then calls `onSend()` instead of `updateTable(tableId, { orderStage: 'Ordered' })`. The `updateTable` call is skipped entirely when `onSend` is present — gated by `if (!onSend) updateTable(...)`. The order page's `onSend` callback calls `useQueueStore.getState().advanceStatus(tableId)` then `router.push('/table-map')`.
- This means: dine-in path (`onSend` absent) → `sendRound` + `updateTable` unchanged. Takeaway path (`onSend` present) → `sendRound` + `onSend` (no `updateTable`).
- Dine-in callers do not pass `onSend` or `hideSend` — zero behaviour change for dine-in

### `src/components/queue/EditCustomerModal.tsx` *(new — in queue/ not order/)*
- Small `Dialog` with name (required) + phone (optional) inputs, mirroring `NewTakeawayModal` structure
- Props: `open`, `onClose`, `orderId`, `initialName`, `initialPhone`
- On confirm: calls `queue.store.updateCustomer(orderId, name, phone)`

### `src/components/queue/ConfirmCancelDialog.tsx` *(new)*
- Props: `open`, `onClose`, `onConfirm`, `orderId`, `customerName`
- Renders: "Cancel this order? [orderId] · [customerName] will be removed."
- Buttons: "Keep" (onClose) + "Cancel Order" (onConfirm)
- Used by both order page header and TakeawayCard

### `src/components/queue/TakeawayCard.tsx`
- "Start Order" button: `router.push('/order/${order.orderId}')` instead of `advanceStatus()`
- Add cancel button (✕) alongside Start Order when `status === 'Taking'`: render as a row with `gap-2` — `Start Order` button (`flex-1`, `variant="outline"`) and a `min-w-[36px]` icon-only ✕ button (`variant="ghost"`, destructive text colour)
- Cancel opens `ConfirmCancelDialog` → `cancelOrder()` on confirm (stays on current page; card disappears from list)

### `src/components/queue/TakeawayPanel.tsx`
- Add `&& o.status !== 'Cancelled'` to the existing active-orders filter

---

## Known Gaps (Wireframe Acceptable)

- **`itemsSummary` is not updated after order entry.** The card will show "No items yet" even after items are added via MenuPanel. Updating this would require either a queue.store action called from TicketPanel or a derived field — out of scope for this wireframe phase.
- **`TicketPanel` guest-count / table label** falls back to raw `TK-001` string when `tables['TK-001']` is undefined. This is acceptable — the takeaway header in the order page provides the correct context label.

---

## Constraints

- No new npm packages
- No new routes — reuse `/order/[tableId]`
- Cancel only available in `Taking` status — not after sent to kitchen
- Edit customer only available in `Taking` status
- Dine-in order page behaviour must be unchanged (all changes guarded by `isTakeaway`)
- Follow existing patterns: shadow tokens via `style={{ boxShadow }}`, Zustand selector safety (raw state + useMemo), non-reactive `getState()` for static reads
- Use `router.push('/table-map')` (not `router.back()`) for post-cancel and post-send navigation to ensure correctness on direct URL access

---

## Out of Scope

- Editing menu items after order is sent to kitchen (Phase 18 concern)
- Delivery order editing (Phase 19)
- Order history / archived cancelled orders
- Updating `itemsSummary` dynamically from order.store
