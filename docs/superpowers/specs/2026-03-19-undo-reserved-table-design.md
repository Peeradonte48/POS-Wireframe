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
- Sets `status: 'Open'` on the target table record
- No other fields need resetting (the table had no occupancy data while Reserved)

### 2. Permissions — `src/lib/role-permissions.ts`

Add `'undo-reserved'` action key granted to: `Waiter | Cashier | Manager`

This mirrors the same role set as the existing `mark-reserved` action — any role that can reserve a table can also release it.

### 3. UI — `src/components/table-map/TableBottomSheet.tsx`

In the Reserved status block, add a full-width "Release Reservation" button:
- Variant: `outline` (consistent with "Mark Reserved" button style)
- Disabled when `!canDoAction(role, 'undo-reserved')`
- On click: call `undoReserved(table.id)`, fire `toast('Reservation released')`, close sheet

## Behaviour

| Trigger | Before | After |
|--------|--------|-------|
| Tap "Release Reservation" | `status: Reserved` | `status: Open` |
| Toast | — | "Reservation released" |
| Bottom sheet | Open | Closes |

## Out of Scope

- No confirmation dialog (single-tap action per user decision)
- No audit log or timestamp for the release event
- No restriction on re-reserving immediately after release
