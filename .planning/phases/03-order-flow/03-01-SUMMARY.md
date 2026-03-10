---
phase: 03-order-flow
plan: 01
subsystem: ui
tags: [zustand, typescript, sonner, mock-data, menu]

requires:
  - phase: 02-table-map
    provides: tableId identifiers that OrderStore uses as keys; table.store.ts Zustand pattern

provides:
  - Zustand order store (useOrderStore) with LineItemStatus, ModifierSelection, OrderLineItem, OrderRound, ActiveOrder types
  - Six store actions: addItem, editItem, removeItem, sendRound, voidItem, getOrder
  - A Ramen menu fixture: 4 categories, 8 items, full modifier trees for ramen
  - sonner toast library installed

affects:
  - 03-order-flow (all downstream plans import from order.store.ts and menu.ts)
  - 04-kds
  - 05-payment

tech-stack:
  added: [sonner]
  patterns:
    - "Zustand store with Record<string, ActiveOrder> keyed by tableId — no persist middleware"
    - "Immutable round/item state via spread — map over rounds and items arrays"
    - "findLastIndex emulated via reduce to locate unsent round"
    - "crypto.randomUUID polyfill guard for SSR safety"

key-files:
  created:
    - src/stores/order.store.ts
    - src/lib/mock-data/menu.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "'use client' added to order.store.ts following table.store.ts actual pattern (plan note was inconsistent with existing code)"
  - "RAMEN_MODIFIER_GROUPS shared const referenced by all 4 ramen items — avoids duplication while keeping items self-contained"
  - "Spice level omitted from modifier groups per plan: dedicated spiceLevel field on OrderLineItem instead"

patterns-established:
  - "OrderStore: addItem finds last unsent round via reduce; if all rounds sent, opens a new round"
  - "voidItem sets status to voided in-place — item never removed, preserves order history"
  - "Menu fixture uses shared modifier group consts for ramen items rather than inline duplication"

requirements-completed: [ORDER-01, ORDER-02, ORDER-03, ORDER-04, ORDER-05, ORDER-06, ORDER-07]

duration: 5min
completed: 2026-03-10
---

# Phase 3 Plan 01: Data Layer — Order Store and Menu Fixture Summary

**Zustand order store with round-based line item model, A Ramen menu fixture (4 categories, 8 items, full modifier trees), and sonner installed as toast provider**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T09:07:03Z
- **Completed:** 2026-03-10T09:12:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `order.store.ts` with full TypeScript type model: `LineItemStatus`, `ModifierSelection`, `OrderLineItem`, `OrderRound`, `ActiveOrder`, plus the Zustand store with all 6 actions
- Created `menu.ts` fixture with 4 MENU_CATEGORIES, 8 MENU_ITEMS, and reusable modifier group definitions (broth, noodle firmness, toppings) attached to all ramen items
- Installed sonner for downstream toast notifications
- TypeScript strict mode passes with zero errors across both files

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Sonner and create order.store.ts** - `44f4ad8` (feat)
2. **Task 2: Create A Ramen menu fixture** - `c345743` (feat)

## Files Created/Modified

- `src/stores/order.store.ts` — Zustand store with order type model and all 6 actions
- `src/lib/mock-data/menu.ts` — A Ramen menu fixture: 4 categories, 8 items, modifier trees
- `package.json` / `package-lock.json` — sonner added to dependencies

## Decisions Made

- `'use client'` kept on order.store.ts to match table.store.ts actual pattern (the plan note stated "no use client... same pattern as table.store.ts" but table.store.ts itself has the directive — followed the actual code over the ambiguous note)
- Shared `RAMEN_MODIFIER_GROUPS` const referenced by all 4 ramen items to avoid duplication while keeping data consistent
- Spice level omitted from modifier groups as specified — `spiceLevel: number | null` lives on `OrderLineItem` as a dedicated field

## Deviations from Plan

None — plan executed exactly as written (the `'use client'` note was an ambiguity in the plan description, not a deviation from intent).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `order.store.ts` and `menu.ts` provide all type contracts and data fixtures downstream plans require
- All 6 actions are implemented and type-safe
- Ready for Phase 3 Plan 02: Order Entry UI (menu browser + add-to-order flow)

---
*Phase: 03-order-flow*
*Completed: 2026-03-10*
