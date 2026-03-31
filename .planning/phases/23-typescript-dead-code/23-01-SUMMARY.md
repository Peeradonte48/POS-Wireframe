---
plan: 23-01
phase: 23-typescript-dead-code
status: complete
---

# 23-01 Summary: ESLint Suppressions + Exhaustive-Deps Fixes

## What was done

**Task 1 — Add eslint-disable-next-line suppressions (14 files)**

Added inline suppression comments for three categories of intentional lint patterns:
- `react-hooks/set-state-in-effect` — 11 instances across 9 files (dialog reset useEffects)
- `react-hooks/purity` — 3 `Date.now()` calls in timer hooks + 1 in split-summary
- `@next/next/no-img-element` — 1 instance in BillLineItem

Also cleaned up stale `eslint-disable-line` end-of-line comments in TableBottomSheet.

**Task 2 — Fix exhaustive-deps in TableTile**

Removed `tickets` from the `isEscalated` useMemo dependency array (was `[tickets, orders, table.id, table.status, table.orderStage]`, now `[orders, table.id, table.status, table.orderStage]`). The memo body does not read `tickets` — it only reads `orders` and `table.*` properties. Also removed the now-unused `useKdsStore` import and selector.

## Decisions

- Kept `eslint-disable-next-line react-hooks/exhaustive-deps` in TableBottomSheet first effect (converted from stale inline form) — the `[table?.id]` dep array is correct and complete; comment is now properly placed above the line rather than inline.
- Removed `useKdsStore` import from TableTile entirely since the only usage (the `tickets` selector) was deleted.

## Verification

- `npm run build` passes with zero errors
- `npx eslint src/components/table-map/TableTile.tsx` clean (no warnings)
- All 15 specified suppression locations have comments applied
