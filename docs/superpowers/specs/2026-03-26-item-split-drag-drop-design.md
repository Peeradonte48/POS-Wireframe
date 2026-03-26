# Item Split Drag-and-Drop Design

**Date:** 2026-03-26
**Scope:** `ItemSplitSheet.tsx` only
**Feature:** Add drag-and-drop item assignment to the แยกบิลหารตามรายการ bottom sheet

---

## Overview

The แยกบิลหารตามรายการ sheet currently uses a two-step click flow: tap "เลือก" on an item → tap "เพิ่มรายการอาหารที่เลือก" on a bill bucket. This spec adds drag-and-drop as a faster alternative interaction while keeping the click flow fully intact.

---

## Dependencies

Install `@dnd-kit/core`. No other packages needed.

```bash
npm install @dnd-kit/core
```

---

## Architecture

Single file change: `src/components/payment/ItemSplitSheet.tsx`.

No store changes, no new files, no route changes.

---

## DnD Setup

Use three hooks from `@dnd-kit/core`:
- `useDraggable` — on each item card in the left panel
- `useDroppable` — on each bill bucket in the right panel
- `DragOverlay` + `DndContext` — wrapping the two-column layout

**Sensor:** `PointerSensor` with `activationConstraint: { distance: 8 }` to avoid triggering drag during scroll gestures on tablet.

---

## Logic Change

Refactor `handleAddToBill(billId: number)` → `handleAddToBill(billId: number, lineId: string)`.

- **Click flow:** passes `selectedLineId` explicitly → `handleAddToBill(bill.id, selectedLineId)`
- **Drag flow:** `onDragEnd` receives `active.id` (lineId) and `over.id` (billId) → `handleAddToBill(Number(over.id), active.id as string)`

Drop always assigns qty: 1 (same as click flow default).

---

## Drag Behavior

| Scenario | Result |
|---|---|
| Drag item → drop on bill bucket | Assign qty: 1 to that bill, clear any active selection |
| Drag item → drop outside any bucket | No-op, selection unchanged |
| Drag item that is already selected via click | Drop assigns via drag flow, clears selection |
| Drag item with qty > 1, some already assigned | Assigns 1 more unit if remaining > 0; no-op if fully assigned |

---

## Visual Feedback

**Dragging item card (original position):**
- Apply `opacity-40` while `isDragging` is true via `useDraggable`

**Bill bucket drop zone (hover state):**
- `useDroppable` exposes `isOver` boolean
- When `isOver`: apply `border-primary bg-primary/5` to the bucket container

**Ghost overlay (`DragOverlay`):**
- Renders a simplified item card (thumbnail + name + qty badge) at `opacity-90`
- Shown only while `activeDragLineId !== null`

---

## State

Add one piece of state: `activeDragLineId: string | null` — set on `onDragStart`, cleared on `onDragEnd`. Used to:
1. Know which card to render in `DragOverlay`
2. Apply `opacity-40` to the dragged card's original position

---

## Click Flow — Unchanged

The "เลือก" / "เลือกแล้ว" button and "เพิ่มรายการอาหารที่เลือก" button in bill buckets continue to work exactly as before. No changes to selection state logic other than the `handleAddToBill` signature refactor.

---

## What Is Not Changing

- `BillBucket`, `BillAssignment` types
- Qty stepper (±) and trash button on assigned items in buckets
- Add/delete bill logic
- Confirm / cancel footer
- Store interactions (`initCustomSplit`, `setCustomAmount`)
- All other payment components
