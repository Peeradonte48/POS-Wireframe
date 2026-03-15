---
phase: 17-queue-store-floor-plan-tabs
verified_date: "2026-03-15"
requirements_verified: [NAV-01, DLVR-01, DLVR-02, DLVR-03, DLVR-04, DLVR-05, DLVR-06, DLVR-07, DLVR-08, DLVR-09, TKWY-01]
all_passed: true
---

# Phase 17 Verification

**Phase:** 17-queue-store-floor-plan-tabs
**Verified:** 2026-03-15
**Requirements:** 11 (NAV-01, DLVR-01 through DLVR-09, TKWY-01)
**Result:** All VERIFIED — no unresolved GAP items

---

## NAV-01: 3-tab floor plan (Dine-in / Takeaway / Delivery)

**Status:** VERIFIED

**Evidence:**
- File: `src/app/(app)/table-map/page.tsx` lines 57-76
- `<Tabs defaultValue="dine-in">` wraps `<TabsTrigger value="dine-in">Dine-in</TabsTrigger>`, `<TabsTrigger value="takeaway">`, `<TabsTrigger value="delivery">`
- All three tabs are rendered; `TabsContent` for each tab wraps `TableGrid`, `TakeawayPanel`, and `DeliveryPanel` respectively

---

## DLVR-01: Staff can view incoming delivery orders from Grab/LINE MAN in a queue (simulated)

**Status:** VERIFIED

**Evidence:**
- File: `src/components/queue/DeliveryPanel.tsx`
- `pendingOrders` useMemo filters `o.channel === 'delivery' && o.status === 'Pending'` from `useQueueStore` orders
- Orders are rendered as `<DeliveryCard>` components in a "Waiting for response" section
- Demo simulation loop (10-15s interval) via `useEffect([demoActive])` calls `simulateOrder()` — delivery orders appear without backend

---

## DLVR-02: Staff can accept an incoming delivery order (auto-routes to KDS)

**Status:** VERIFIED (gap fixed in Phase 20 Plan 01)

**Evidence:**
- File: `src/stores/queue.store.ts` lines 80-91
- `acceptOrder` sets status to `'Confirmed'` then calls `useKdsStore.getState().addTicket(order.orderId, order.orderId, 'delivery', order.platform)`
- The 4-argument `addTicket` call (fixed in Phase 20) carries `orderType:'delivery'` and `platform` so KDS ticket badge and filter render correctly
- File: `src/components/queue/DeliveryCard.tsx` lines 155-164 — `<Button onClick={() => acceptOrder(order.orderId)}>Accept</Button>` wired on pending cards

---

## DLVR-03: Staff can reject an incoming delivery order with a reason

**Status:** VERIFIED

**Evidence:**
- File: `src/components/queue/DeliveryCard.tsx` lines 111, 165-172, 185-193
- "Reject" button opens `<RejectReasonDialog>` via local `showRejectDialog` state
- `onConfirm={(reason) => { rejectOrder(order.orderId, reason); setShowRejectDialog(false) }}` calls `queue.store.rejectOrder`
- File: `src/stores/queue.store.ts` lines 93-106 — `rejectOrder` sets `status: 'Rejected'` and `rejectionReason: reason`
- File: `src/components/queue/RejectReasonDialog.tsx` — exists in `src/components/queue/`

---

## DLVR-04: Accepted delivery orders progress through Accepted → Preparing → ReadyForRider → PickedUp

**Status:** VERIFIED

**Evidence:**
- File: `src/stores/queue.store.ts` lines 112-121
- `advanceStatus` transitions map includes `Confirmed: 'Preparing'`, `Preparing: 'ReadyForRider'`, `ReadyForRider: 'PickedUp'`
- File: `src/components/queue/DeliveryCard.tsx` lines 57-67 — `getCtaLabel` returns context-sensitive CTA label for each active status

---

## DLVR-05: Staff can mark a delivery order "Ready for Rider" when kitchen completes

**Status:** VERIFIED

**Evidence:**
- File: `src/components/queue/DeliveryCard.tsx` lines 57-67 — `getCtaLabel('Preparing')` returns `'Mark Ready for Rider'`
- Lines 174-182 — non-pending CTA button calls `advanceStatus(order.orderId)`
- `advanceStatus` maps `Preparing → ReadyForRider` in queue.store

---

## DLVR-06: Staff can trigger simulated incoming delivery orders for demo

**Status:** VERIFIED

**Evidence:**
- File: `src/stores/queue.store.ts` lines 68-78 — `simulateOrder` calls `buildMockDeliveryOrder()` and adds to `orders`
- File: `src/lib/mock-data/delivery-demo.ts` — `buildMockDeliveryOrder` factory with rotating platforms, customer names, and item summaries
- File: `src/components/queue/DeliveryPanel.tsx` lines 40-52 — demo simulation loop via `useEffect([demoActive])`
- Lines 72-89 — "Simulate Order" / "Stop Demo" button toggle with auto-start on first click
- Mirrors existing `kds/page.tsx` demo mode pattern

---

## DLVR-07: Delivery order cards show platform badge, customer name, items summary, and elapsed timer

**Status:** VERIFIED

**Evidence:**
- File: `src/components/queue/DeliveryCard.tsx`
- Lines 116-118 — `platformLabel` and `platformVariant` derived from `order.platform`
- Line 130 — `<Badge variant={platformVariant}>{platformLabel}</Badge>` (Grab or LINE MAN badge)
- Line 147 — `<span className="text-sm font-semibold">{order.customerName}</span>`
- Line 148 — `<span className="text-xs text-muted-foreground">{order.itemsSummary}</span>`
- Lines 12-55 — `CountdownRing` component provides elapsed/remaining timer display with RAF-driven conic-gradient animation for pending orders; `pendingAt` timestamp drives both ring progress and seconds display

---

## DLVR-08: Staff can enable auto-accept to skip the manual accept tap during rush

**Status:** VERIFIED

**Evidence:**
- File: `src/stores/queue.store.ts` line 46 — `autoAccept: boolean` state field, line 173 — `toggleAutoAccept`
- Lines 75-77 — `simulateOrder` checks `get().autoAccept` and immediately calls `get().acceptOrder(newOrder.orderId)` if enabled
- File: `src/components/queue/DeliveryPanel.tsx` lines 61-71 — "Auto-accept ON/OFF" chip button calling `toggleAutoAccept`
- Store partialize (line 178) does NOT persist `autoAccept` — resets to false on app restart (intentional)

---

## DLVR-09: Incoming delivery orders show a countdown timer ring before auto-reject

**Status:** VERIFIED

**Evidence:**
- File: `src/components/queue/DeliveryCard.tsx` lines 12-55 — `CountdownRing` sub-component
- `PENDING_WINDOW_MS = 30_000` (30-second window)
- RAF loop updates `progress` state; `conic-gradient` drains the ring visually
- Ring color transitions: green → amber (>50%) → red (>75%) for urgency signaling
- Lines 133-136 — `CountdownRing` rendered only when `isPending && order.pendingAt !== undefined`
- Seconds display: `Math.max(0, Math.round(PENDING_WINDOW_MS * (1 - progress) / 1000))`

---

## TKWY-01: Staff can create a takeaway order with customer name, phone, and auto-assigned order number (TK-001...)

**Status:** VERIFIED

**Evidence:**
- File: `src/components/queue/NewTakeawayModal.tsx` — `NewTakeawayModal` component with customer name (required) and phone (optional) fields
- File: `src/stores/queue.store.ts` lines 134-151 — `createTakeaway(customerName, customerPhone)`:
  - Increments `takeawayCounter` atomically
  - Generates `orderId = 'TK-' + String(counter).padStart(3, '0')` (TK-001, TK-002, ...)
  - Creates `QueueOrder` with `channel: 'takeaway'`, `status: 'Taking'`
- After creation, `NewTakeawayModal` pushes to `/order/${orderId}` for order entry

---

## Summary

| Requirement | Status    | Primary Evidence File |
|-------------|-----------|----------------------|
| NAV-01      | VERIFIED  | src/app/(app)/table-map/page.tsx |
| DLVR-01     | VERIFIED  | src/components/queue/DeliveryPanel.tsx |
| DLVR-02     | VERIFIED  | src/stores/queue.store.ts |
| DLVR-03     | VERIFIED  | src/components/queue/DeliveryCard.tsx |
| DLVR-04     | VERIFIED  | src/stores/queue.store.ts |
| DLVR-05     | VERIFIED  | src/components/queue/DeliveryCard.tsx |
| DLVR-06     | VERIFIED  | src/lib/mock-data/delivery-demo.ts |
| DLVR-07     | VERIFIED  | src/components/queue/DeliveryCard.tsx |
| DLVR-08     | VERIFIED  | src/stores/queue.store.ts |
| DLVR-09     | VERIFIED  | src/components/queue/DeliveryCard.tsx |
| TKWY-01     | VERIFIED  | src/components/queue/NewTakeawayModal.tsx |

All 11 Phase-17 requirements verified against the codebase. No GAP items found.
DLVR-02 note: this requirement was fully closed by Phase 20 Plan 01 which added the missing `orderType`/`platform` arguments to the `addTicket` call in `acceptOrder`.
