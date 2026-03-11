---
phase: 06-manager-layer
plan: 03
subsystem: manager
tags: [86d, menu-panel, open-tickets, staff-list, cross-store]
dependency_graph:
  requires: [06-01]
  provides: [EightySixTab, OpenTicketsTab, MenuPanel-86d-integration]
  affects: [src/components/order/MenuPanel.tsx]
tech_stack:
  added: []
  patterns: [useManagerStore-selector, useMemo-grouping, inline-estimated-total]
key_files:
  created:
    - src/components/manager/EightySixTab.tsx
    - src/components/manager/OpenTicketsTab.tsx
  modified:
    - src/components/order/MenuPanel.tsx
decisions:
  - "Estimated total computed inline in OpenTicketsTab render rather than via a helper function — avoids complex ReturnType<> annotation for getOrder callback"
  - "86'd badge renders as 86&apos;d (HTML entity) to satisfy React JSX apostrophe linting requirement"
  - "OpenTicketsTab stubs from Plan 02 replaced with full implementations (files existed as single-line null returns)"
metrics:
  duration: "~2min"
  completed_date: "2026-03-11"
  tasks: 2
  files_modified: 3
---

# Phase 6 Plan 03: 86'd Items Tab + Open Tickets Tab Summary

**One-liner:** EightySixTab with category-grouped checkbox toggles cross-wired to MenuPanel's 86'd disabled state, plus OpenTicketsTab showing occupied tables and MOCK_STAFF roster.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | EightySixTab + MenuPanel 86'd integration | fe393dc | EightySixTab.tsx (created), MenuPanel.tsx (modified) |
| 2 | OpenTicketsTab (open tickets + staff list) | 5236089 | OpenTicketsTab.tsx (created) |

---

## What Was Built

### EightySixTab (`src/components/manager/EightySixTab.tsx`)

- Renders all menu items grouped by `categoryId` using `useMemo` over `MENU_CATEGORIES` and `MENU_ITEMS`
- Each item has a native `<input type="checkbox">` with `accent-primary` (consistent with Phase 3 ModifierSheet toppings)
- Toggling calls `toggleEightySix(item.id)` from `useManagerStore`
- 86'd items show a `<Badge variant="outline">` next to the price
- Empty categories (no items) are filtered out

### MenuPanel (`src/components/order/MenuPanel.tsx`) — modified

- Imports `useManagerStore`, `Badge`, and `cn` added to existing imports
- `const eightySixedIds = useManagerStore((s) => s.eightySixedIds)` added in component body
- Per-item: `const is86d = eightySixedIds.includes(item.id)` computed before button render
- Button: `disabled={is86d}`, `onClick={is86d ? undefined : () => onItemTap(item.id)}`, class conditionally applies `opacity-50 cursor-not-allowed` vs `hover:bg-accent` via `cn()`
- 86'd badge rendered inside button when `is86d` is true

### OpenTicketsTab (`src/components/manager/OpenTicketsTab.tsx`)

- **Open Tickets section:** filters `useTableStore` tables to `status === 'Occupied'`
- Each row: table label, `orderStage` badge, waiter name, pax count, estimated total (from `useOrderStore`), elapsed time formatted as `Nm` or `NhNm`
- Tapping a row calls `router.push('/order/${table.id}')`
- Empty state: "No open tables" when `occupiedTables.length === 0`
- **Staff List section:** maps `MOCK_STAFF` and matches `waiterName === staff.name` for occupied tables to derive assigned table labels
- Each staff row shows name, assigned tables (if any), and role `<Badge variant="secondary">`

---

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

**Implementation note:** The `getEstimatedTotal` helper function proposed in the plan was inlined directly in the render loop to avoid the complex `ReturnType<typeof useOrderStore['getState']['getOrder']>` type annotation, which the plan itself flagged as potentially problematic. This is a simplification, not a deviation.

---

## Self-Check: PASSED

Files confirmed present:
- `src/components/manager/EightySixTab.tsx` — FOUND
- `src/components/manager/OpenTicketsTab.tsx` — FOUND
- `src/components/order/MenuPanel.tsx` — FOUND (modified)

Commits confirmed:
- `fe393dc` — FOUND (feat(06-03): implement EightySixTab and MenuPanel 86'd integration)
- `5236089` — FOUND (feat(06-03): implement OpenTicketsTab with open tickets list and staff list)

TypeScript: `npx tsc --noEmit` — PASSED (zero errors)
