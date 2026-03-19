# Undo Reserved Table

**Date:** 2026-03-19
**Status:** Approved

## Summary

Add a single-tap "Release Reservation" button to the Reserved table bottom sheet, allowing Waiter and Cashier roles (and Manager) to revert a Reserved table back to Open without a confirmation dialog.

## Problem

When a table is marked Reserved, the bottom sheet currently shows a read-only status message with no available actions. Staff who mistakenly reserved a table, or need to release a reservation, have no way to undo it without Manager intervention or a page reload with mock data reset.

## Design

### 1. Store — `src/stores/table.store.ts`

Add `undoReserved(id: string)` action:
- Sets `status: 'Open'` on the target table record using the minimal-spread pattern (same as `markReserved`) — no explicit nulling needed because a Reserved table has never received occupancy data
- No status precondition guard (consistent with all other store actions in this file — calling on a non-Reserved table is a no-op for the status field; this is an accepted wireframe convention)
- Add `undoReserved: (id: string) => void` to the `TableState` interface

### 2. Permissions — `src/lib/role-permissions.ts`

Add `'undo-reserved'` to **both**:
1. The `ActionKey` union type (required for TypeScript strict mode)
2. The `ACTION_PERMISSIONS` record, granted to: `Waiter | Cashier | Manager`

This mirrors the same role set as the existing `mark-reserved` action — any role that can reserve a table can also release it.

### 3. UI — `src/components/table-map/TableBottomSheet.tsx`

In the Reserved status block, add a full-width "Release Reservation" button:
- Variant: `outline` (consistent with "Mark Reserved" button style)
- Disabled when `!canDoAction(role, 'undo-reserved')`
- On click: call `undoReserved(table.id)`, fire `toast('Table unreserved')`, close sheet
- Toast phrasing follows the existing `'Table [past-tense verb]'` convention used throughout the bottom sheet (e.g. `'Table reserved'`, `'Table served'`)

`TableTile` re-renders automatically via Zustand subscription — no additional changes needed there.

## Behaviour

| Trigger | Before | After |
|--------|--------|-------|
| Tap "Release Reservation" | `status: Reserved` | `status: Open` |
| Toast | — | "Table unreserved" |
| Bottom sheet | Open | Closes |

## Out of Scope

- No confirmation dialog (single-tap action per user decision)
- No audit log or timestamp for the release event
- No restriction on re-reserving immediately after release
- No status precondition guard in the store (consistent wireframe convention)
