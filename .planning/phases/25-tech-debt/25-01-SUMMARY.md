---
phase: 25-tech-debt
plan: 01
subsystem: kds, queue, delivery
tags: [bug-fix, tech-debt, kds, queue, hydration]
dependency_graph:
  requires: []
  provides: [DLVR-04-fix, DLVR-05-fix, TKWY-04-fix]
  affects: [KdsTicketCard, TakeawayCard, queue.store, delivery-order-page]
tech_stack:
  added: []
  patterns:
    - prevStage capture before Zustand synchronous set
    - Cross-store write-back via getState() inside event handler
    - onRehydrate reconciliation callback in Zustand persist
    - Hydration guard with destructive Badge for missing data
key_files:
  created: []
  modified:
    - src/components/kds/KdsTicketCard.tsx
    - src/components/queue/TakeawayCard.tsx
    - src/app/(app)/order/delivery/[orderId]/page.tsx
    - src/stores/queue.store.ts
decisions:
  - "[25-01] BUMP button gated on bumpBlocked (all items checked + role permission): consistent with existing completion gate; ensures kitchen confirms items before advancing stage"
  - "[25-01] BUMP visible for New/InProgress, Done button only for Ready: stage-appropriate CTA avoids confusion between intermediate bump and final completion"
  - "[25-01] onRehydrate checks orderStore.orders[id] to detect orphaned queue orders: order.store clears on version migration; queue.store persists; mismatch signals stale reference"
  - "[25-01] itemsSummary fallback text 'items unavailable — reload': descriptive enough for staff to understand transient state, without alarming language"
  - "[25-01] Delivery order page keeps useEffect redirect + adds early return guard: useEffect handles navigation away, early return prevents render crash before redirect fires"
metrics:
  duration_seconds: 154
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
requirements_addressed: [TD-01, TD-02]
---

# Phase 25 Plan 01: Tech Debt — KDS Desync + Hydration Guards Summary

Fixed the two known runtime behavioral bugs in the codebase: DLVR-04/05 (KDS delivery bump never mirrored to queue status) and TKWY-04 (empty order.store + persistent queue.store causing crashes and "0 items" on browser reload).

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add BUMP button to KdsTicketCard with queue write-back (TD-01) | `539820e` | `KdsTicketCard.tsx` |
| 2 | Add hydration guards and queue.store reconciliation (TD-02) | `02d8f97` | `TakeawayCard.tsx`, `delivery/[orderId]/page.tsx`, `queue.store.ts` |

---

## What Was Built

### Task 1: KDS BUMP Button with Queue Write-back

Added `handleBump` to `KdsTicketCard.tsx` that:
1. Captures `prevStage` before calling `useKdsStore.getState().bumpTicket()` (per the CLAUDE.md pattern — Zustand set is synchronous so post-capture yields the new stage)
2. Calls `useQueueStore.getState().advanceStatus(ticket.tableId)` for delivery/takeaway tickets when `prevStage` is `New` or `InProgress`
3. Writes dine-in `orderStage` to table.store: `New -> Cooking`, `InProgress -> Ready`

The BUMP button renders for `New` and `InProgress` stages. The Done button ("ออร์เดอร์เสร็จ") renders only for the `Ready` stage. Both gates use the existing `bumpBlocked` check (all items checked + role permission).

### Task 2: Hydration Guards + Queue.store Reconciliation

**TakeawayCard.tsx:** Added guard in the body row — when `orderData` is `undefined` AND `order.status !== 'Taking'`, renders a destructive Badge with "data unavailable" instead of the item count. When `order.status === 'Taking'`, shows normal item count (no data expected yet). Falls back to `order.itemsSummary` when available.

**Delivery order page:** Changed `if (!order) return null` to return an "Order not found" message div instead of a blank render — prevents invisible crashes when navigating to stale delivery order URLs.

**queue.store.ts:** Added `onRehydrate` callback to the Zustand persist config. After rehydration, it iterates all persisted queue orders. For any order in an active status (`Confirmed`/`Preparing`/`ReadyForRider`/`Sent`/`Ready`) where `order.store.orders[orderId]` is missing, it updates `itemsSummary` to `'items unavailable — reload'`. This surfaces the data inconsistency as a visible warning rather than a silent "0 items" display.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all data flows are wired.

---

## Self-Check: PASSED

Files verified present:
- FOUND: src/components/kds/KdsTicketCard.tsx (BUMP button + handleBump)
- FOUND: src/components/queue/TakeawayCard.tsx (data unavailable guard)
- FOUND: src/app/(app)/order/delivery/[orderId]/page.tsx (Order not found guard)
- FOUND: src/stores/queue.store.ts (onRehydrate reconciliation)

Commits verified:
- FOUND: 539820e (Task 1 - BUMP button)
- FOUND: 02d8f97 (Task 2 - hydration guards)

Build: Passes with zero TypeScript errors.
