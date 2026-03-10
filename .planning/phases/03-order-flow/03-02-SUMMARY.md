---
phase: 03-order-flow
plan: 02
subsystem: ui
tags: [next.js, react, zustand, shadcn, tabs, tailwind]

requires:
  - phase: 03-order-flow plan 01
    provides: useOrderStore types; MENU_CATEGORIES and MENU_ITEMS fixtures; useTableStore with guestCount on TableRecord

provides:
  - /order/[tableId] Next.js App Router page with split-panel shell
  - OrderPage: fixed header (back arrow, table label + guest count), left panel (MenuPanel), right panel (ticket placeholder)
  - MenuPanel: shadcn Tabs category row + filtered MENU_ITEMS list with emoji thumbnail, name, Thai name, price
  - shadcn Tabs component (tabs.tsx) added to UI library

affects:
  - 03-03 (ModifierSheet mounts inside OrderPage, receives selectedMenuItemId)
  - 03-04 (TicketPanel replaces right-panel placeholder)
  - 03-05 (TableBottomSheet wires "Take Order" nav to this route)

tech-stack:
  added: [shadcn/ui tabs]
  patterns:
    - "useParams<{ tableId: string }>() for dynamic route params in Next.js 15 App Router (not page props destructuring)"
    - "Derived state from Zustand in page header: useTableStore selector for table label + guestCount"
    - "Tabs without TabsContent: use Tabs/TabsList/TabsTrigger for navigation only, filter data separately"

key-files:
  created:
    - src/app/(app)/order/[tableId]/page.tsx
    - src/components/order/MenuPanel.tsx
    - src/components/ui/tabs.tsx
  modified: []

key-decisions:
  - "Tabs without TabsContent pattern: category selection drives MENU_ITEMS.filter() directly rather than rendering TabsContent slots — avoids remounting list on tab switch"
  - "selectedMenuItemId and editingLineId declared but not wired — Plan 03 adds ModifierSheet; state already in place"
  - "Tabs component installed via shadcn CLI (not manually authored) to stay consistent with project's shadcn component pattern"

patterns-established:
  - "OrderPage: useParams for tableId, useTableStore selector for display data, local useState for ephemeral sheet state"
  - "MenuPanel: controlled activeCategory via useState initialized from MENU_CATEGORIES[0].id"

requirements-completed: [ORDER-01]

duration: 5min
completed: 2026-03-10
---

# Phase 3 Plan 02: Order Page Shell and Menu Browser Summary

**Split-panel /order/[tableId] route with fixed header showing table + guest count, category-filtered menu item list (4 tabs, 8 items), and ticket placeholder column**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T16:31:11Z
- **Completed:** 2026-03-10T16:36:00Z
- **Tasks:** 2
- **Files modified:** 3 created + 1 installed (tabs.tsx via shadcn CLI)

## Accomplishments

- Created `/order/[tableId]` App Router page with fixed header (back arrow + table label + guest count from Zustand) and `h-[calc(100vh-3.5rem)]` split-panel body
- Created `MenuPanel` with shadcn Tabs for category navigation and a filtered button list — 4 categories, 8 items, each row showing emoji thumbnail, English name, Thai name, and price
- Added shadcn Tabs component to UI library via CLI
- TypeScript strict mode passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OrderPage route with split-panel shell** - `cb1c649` (feat)
2. **Task 2: Build MenuPanel with category tabs and filtered item list rows** - `820f5a5` (feat)

## Files Created/Modified

- `src/app/(app)/order/[tableId]/page.tsx` — OrderPage with split-panel layout, header, left/right panels
- `src/components/order/MenuPanel.tsx` — Category tabs + filtered menu item list rows
- `src/components/ui/tabs.tsx` — shadcn Tabs primitive (Tabs, TabsList, TabsTrigger, TabsContent)

## Decisions Made

- Used Tabs without TabsContent: filter MENU_ITEMS by activeCategory rather than placing items inside TabsContent slots. This avoids any remount/scroll-reset on tab switch and keeps the item list in a single scrollable container.
- `selectedMenuItemId` and `editingLineId` declared at page level but not yet wired to any sheet — Plan 03 will add ModifierSheet and connect both.
- Installed shadcn Tabs via `npx shadcn@latest add tabs` to stay consistent with how other UI components (button, dialog, input) are managed in this project.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added shadcn Tabs component before MenuPanel could compile**
- **Found during:** Task 2 (MenuPanel setup)
- **Issue:** `@/components/ui/tabs` import would fail — tabs.tsx not yet in the UI library; plan assumed it existed but it did not
- **Fix:** Ran `npx shadcn@latest add tabs --yes` before writing MenuPanel.tsx
- **Files modified:** src/components/ui/tabs.tsx (created)
- **Verification:** TypeScript compiles clean; import resolves correctly
- **Committed in:** `820f5a5` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Required addition — without tabs.tsx the component could not compile. Zero scope creep.

## Issues Encountered

None beyond the missing tabs component noted above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `OrderPage` provides the `selectedMenuItemId` + `editingLineId` state hooks Plan 03 needs for ModifierSheet
- `MenuPanel` is self-contained and ready — `onItemTap` callback surfaces item selection to the page
- Right panel placeholder is clearly marked for Plan 04 replacement with `<TicketPanel>`
- Ready for Phase 3 Plan 03: Modifier Sheet

---
*Phase: 03-order-flow*
*Completed: 2026-03-10*
