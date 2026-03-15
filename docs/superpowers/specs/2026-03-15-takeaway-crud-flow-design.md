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
- `NewTakeawayModal` calls `createTakeaway()` → receives returned `orderId` → `router.push('/order/TK-001')`
- Queue order created with status `Taking`; order.store entry initialised for the orderId

### Read
- `TakeawayCard` shows summary (orderId, customer name, phone, itemsSummary, status badge)
- `/order/TK-001` shows full order entry with takeaway header

### Update
**Customer info** — edit icon (pencil) in order page header opens `EditCustomerModal`:
- Fields: name (required), phone (optional)
- Calls `queue.store.updateCustomer(orderId, name, phone)`
- Available only while status is `Taking`

**Menu items** — standard `MenuPanel` + `TicketPanel` (no changes). Add/remove items as normal.

### Delete (Cancel)
- Cancel button (✕) visible in order page header and on `TakeawayCard` — only when status is `Taking`
- Confirmation dialog: "Cancel this order? TK-001 · [name] will be removed."
- On confirm: `queue.store.cancelOrder(orderId)` → `router.push('/table-map')`
- `cancelOrder` sets status to `Cancelled`; card disappears from TakeawayPanel (filtered out alongside `Collected`)

---

## File Changes

### `src/stores/queue.store.ts`
- `createTakeaway()` returns `orderId` (currently `void`)
- Add `updateCustomer(orderId, name, phone?)` action
- Add `cancelOrder(orderId)` action — sets status to `Cancelled`

### `src/components/queue/NewTakeawayModal.tsx`
- After `createTakeaway()`, call `router.push('/order/${orderId}')`
- Requires `useRouter` import

### `src/app/(app)/order/[tableId]/page.tsx`
- On mount, check `useQueueStore.getState().orders[tableId]`
- If found (`isTakeaway = true`):
  - Header shows `TK-001 · [customerName]` with phone subtitle
  - Edit icon → opens `EditCustomerModal`
  - Cancel button (✕) → shows confirmation dialog (only if status is `Taking`)
  - Send CTA label: "Send to Kitchen" → calls `advanceStatus(orderId)` on queue.store + `router.back()`
- If not found: existing dine-in behaviour unchanged

### `src/components/order/EditCustomerModal.tsx` *(new)*
- Small `Dialog` with name + phone inputs, mirroring `NewTakeawayModal` structure
- Calls `queue.store.updateCustomer()` on confirm

### `src/components/queue/TakeawayCard.tsx`
- "Start Order" button: `router.push('/order/${order.orderId}')` instead of `advanceStatus()`
- Add cancel button (✕) alongside Start Order, visible only when `status === 'Taking'`
- Cancel triggers same confirmation dialog pattern → `cancelOrder()`

### `src/components/queue/TakeawayPanel.tsx`
- Filter out `Cancelled` orders from active list (add `&& o.status !== 'Cancelled'` to existing filter)

---

## Constraints

- No new npm packages
- No new routes — reuse `/order/[tableId]`
- Cancel only available in `Taking` status — not after sent to kitchen
- Edit customer only available in `Taking` status
- `dine-in` order page behaviour must be unchanged (guarded by `isTakeaway` flag)
- Follow existing patterns: shadow tokens via `style={{ boxShadow }}`, Zustand selector safety (raw state + useMemo)

---

## Out of Scope

- Editing menu items after order is sent to kitchen (Phase 18 concern)
- Delivery order editing (Phase 19)
- Order history / archived cancelled orders
