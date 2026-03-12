---
phase: 14-merge-bill
plan: 03
subsystem: ui
tags: [zustand, react, next.js, table-management, payments, merge-bill]

# Dependency graph
requires:
  - phase: 14-01
    provides: bill.store merge actions (initMerge, dissolveAll, isMergedSecondary, getPrimaryTable, getMergedSecondaries)
  - phase: 14-02
    provides: MergeSheet bottom sheet component with multi-select table picker
provides:
  - TableTile secondary badge + routing override (secondary → primary payment page)
  - MergeSheet entry point wired into TableBottomSheet (Occupied + CheckRequested)
  - TotalsSection Merge Bill button + isMergeActive prop (Split Bill hidden when merge active)
  - Payment page grouped items render with per-group Dissolve Merge button + combined totals
  - SplitSheet Revert to Single Bill with paidCount guard + confirm dialog
affects: [15-order-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isMergedSecondary reactive subscription in TableTile: useTableStore.getState() static read for label (non-reactive, label never changes)"
    - "useOrderStore.getState().getOrder() inside useMemo for merged secondary items (non-reactive read, dependency tracked via mergedSecondaryIds)"
    - "tableOrders computed inline (not in memo) — used only in render, depends on isMerged reactive flag"
    - "SplitSheet paidCount computed at component level — shared by renderCancelSection and Revert to Single Bill section"

key-files:
  created: []
  modified:
    - src/components/table-map/TableTile.tsx
    - src/components/table-map/TableBottomSheet.tsx
    - src/components/payment/TotalsSection.tsx
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/payment/SplitSheet.tsx

key-decisions:
  - "TableTile uses useTableStore.getState() (non-reactive) for primary label in merge badge — label never changes at runtime so no subscription needed"
  - "tableOrders for grouped render computed inline (not in memo) — only used in JSX, isMerged reactive state drives re-renders"
  - "TotalsSection Merge Bill button always renders (disabled when isMergeActive); Split Bill conditionally hidden (not disabled) per CONTEXT.md locked decision"
  - "SplitSheet auto-open useEffect guarded: only fires when no merge is active on the primary table"
  - "paidCount lifted to component level in SplitSheet to serve both renderCancelSection and Revert to Single Bill"

patterns-established:
  - "Dissolve Merge: single button per table group in grouped render calls dissolveAll(primaryTableId) — one click removes all secondaries"
  - "Revert to Single Bill: paidCount > 0 disables button with inline label; paidCount === 0 shows confirm dialog before calling cancelSplit"

requirements-completed: [MERGE-01, MERGE-02]

# Metrics
duration: 25min
completed: 2026-03-13
---

# Phase 14 Plan 03: Merge Bill Integration Summary

**Full merge flow wired end-to-end: secondary badge + routing, dual entry points (TableBottomSheet + TotalsSection), payment page grouped items with Dissolve Merge, combined totals, and SplitSheet Revert to Single Bill with paidCount guard**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-13T~16:35Z
- **Completed:** 2026-03-13 (checkpoint reached — awaiting human verify)
- **Tasks:** 2/3 (Task 3 is human-verify checkpoint)
- **Files modified:** 5

## Accomplishments
- TableTile: secondary tables render indigo "Merged→T[X]" badge; tapping navigates to primary payment page without opening TableBottomSheet
- TableBottomSheet: "Merge Bill" button added to Occupied and CheckRequested sections; opens MergeSheet with correct primaryTableId
- TotalsSection: "Merge Bill" button wired with onMergeBill prop; "Split Bill" hidden (not disabled) when isMergeActive; Merge Bill disabled when merge already active
- Payment page: billItems memo extended to include merged tables' items; grouped section render with per-group "Dissolve Merge" button; combined subtotal/VAT/grandTotal computed from flat merged billItems; MergeSheet wired from TotalsSection; SplitSheet auto-open guarded when merge active
- SplitSheet: "Revert to Single Bill" section added at bottom; disabled with inline label when paidCount > 0; confirm dialog ("Revert to single bill? This will remove all seat assignments.") when paidCount === 0; calls cancelSplit + toast + closes sheet on confirm

## Task Commits

Each task was committed atomically:

1. **Task 1: TableTile merge badge + secondary routing override** - `94fe86b` (feat)
2. **Task 2: Wire merge entry points (TableBottomSheet, TotalsSection, payment page, SplitSheet)** - `f99e7cb` (feat)
3. **Task 3: Human verify** - pending (checkpoint)

## Files Created/Modified
- `src/components/table-map/TableTile.tsx` - Added LinkLinear icon, useRouter, merge store subscriptions, onClick override for secondary routing, showMergeBadge ternary slot
- `src/components/table-map/TableBottomSheet.tsx` - Added MergeSheet import, mergeSheetOpen state, Merge Bill buttons in Occupied + CheckRequested, MergeSheet render
- `src/components/payment/TotalsSection.tsx` - Added LinkLinear, onMergeBill + isMergeActive props, Split Bill conditional hide, Merge Bill button
- `src/app/(app)/payment/[tableId]/page.tsx` - Added MergeSheet import, merge state subscriptions, tableOrders compute, grouped items render, MergeSheet render, TotalsSection new props, SplitSheet auto-open guard
- `src/components/payment/SplitSheet.tsx` - Added paidCount at component level, showRevertConfirm state, reset on open, Revert to Single Bill section

## Decisions Made
- Used `useTableStore.getState()` static read for primary table label in TableTile merge badge — label never changes at runtime, no subscription overhead needed
- `tableOrders` computed inline (not in useMemo) since it's used only in render and isMerged reactive state already drives re-renders
- `TotalsSection` Merge Bill button always renders, disabled when already active; Split Bill conditionally removed from DOM per locked CONTEXT.md decision

## Deviations from Plan

None — plan executed exactly as written. One minor issue corrected inline: the `useOrderStore` import was accidentally duplicated during task 2 edits (plan instruction to "verify it's there" led to adding it again) — removed the duplicate immediately before build, no functional impact.

## Issues Encountered
None.

## Next Phase Readiness
- After human verify checkpoint approval, plan 14-03 will be fully complete
- MERGE-01 and MERGE-02 requirements satisfied
- Phase 14 (Merge Bill) will be complete after checkpoint approval
- Phase 15 (Order Tracking) can begin: live stage badge, per-item timeline, escalation

## Self-Check: PASSED

All files present. Both task commits verified (94fe86b, f99e7cb). Build passes.

---
*Phase: 14-merge-bill*
*Completed: 2026-03-13*
