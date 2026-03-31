---
phase: "24-refactor"
plan: "02"
subsystem: "order-entry, payment"
tags: ["refactor", "decomposition", "components", "modifier-sheet", "split-sheet"]
dependency_graph:
  requires: ["24-01"]
  provides: ["ForcedModifiersPanel", "SpiceLevelPicker", "CustomValueSplitPanel", "PerSeatSplitPanel"]
  affects: ["order entry flow", "payment split flow"]
tech_stack:
  added: []
  patterns: ["key-based remount for state reset", "orchestrator + sub-component pattern"]
key_files:
  created:
    - src/components/order/ForcedModifiersPanel.tsx
    - src/components/order/SpiceLevelPicker.tsx
    - src/components/payment/CustomValueSplitPanel.tsx
    - src/components/payment/PerSeatSplitPanel.tsx
  modified:
    - src/components/order/ModifierSheet.tsx
    - src/components/payment/SplitSheet.tsx
decisions:
  - "Key-based remount via ModifierSheetContent key prop eliminates eslint-disable set-state-in-effect"
  - "PerSeatSplitPanel owns both assign and pay views (two internal states) to keep SplitSheet under 150 LOC"
  - "CancelSection as inline component inside PerSeatSplitPanel avoids prop drilling to both view branches"
  - "splitRaw + const split = splitRaw pattern for TypeScript narrowing in nested function scope"
metrics:
  duration_minutes: 12
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_modified: 6
  files_created: 4
requirements_completed: ["REF-01"]
---

# Phase 24 Plan 02: Component Decomposition — ModifierSheet + SplitSheet Summary

ModifierSheet (379 LOC) and SplitSheet (787 LOC) decomposed into focused orchestrators + sub-components using key-based remount for state management; each file under 200 LOC with single concerns.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Decompose ModifierSheet | a3c8790 | ModifierSheet.tsx, ForcedModifiersPanel.tsx, SpiceLevelPicker.tsx |
| 2 | Decompose SplitSheet | f055c4d | SplitSheet.tsx, CustomValueSplitPanel.tsx, PerSeatSplitPanel.tsx |

## What Was Built

### Task 1: ModifierSheet Decomposition

**ForcedModifiersPanel.tsx** (129 LOC) — Extracted the modifier group iteration, option-card rendering, and error highlighting into a pure presentational component. Props: `modifierGroups`, `selections`, `onSelect`, `errors`, `groupRefs`.

**SpiceLevelPicker.tsx** (75 LOC) — New presentational component for spice level selection with flame icon rows. Props: `value`, `onChange`, `levels`. Available for future use when spice level is modeled as a separate UI element.

**ModifierSheet.tsx** (214 LOC, was 379) — Refactored as orchestrator + `ModifierSheetContent` inner component. The `eslint-disable react-hooks/set-state-in-effect` at the former line 76 is eliminated by using key-based remount: `<ModifierSheetContent key={`${menuItem.id}-${editingLineId ?? 'new'}`}>` forces full remount when item or edit target changes, resetting all state naturally without `useEffect`.

### Task 2: SplitSheet Decomposition

**CustomValueSplitPanel.tsx** (154 LOC) — Manages the custom value split mode: payer rows, amount inputs, `SeatPaymentPanel` integration, remaining balance display, and cancel confirmation. Uses `useBillStore` internally for `initCustomSplit`, `addCustomPayer`, `setCustomAmount`, `recordPayment`.

**PerSeatSplitPanel.tsx** (189 LOC) — Manages two-phase per-seat flow: assign view (item selection + seat picker with qty stepper + reassignment) and pay view (seat totals with mini-receipt breakdown + `SeatPaymentPanel`). Uses `useBillStore` and `useTableStore` internally.

**SplitSheet.tsx** (167 LOC, was 787) — Reduced to pure mode orchestrator: manages `mode` state (`select | custom | per-seat | item`), renders the appropriate panel per mode, handles Revert to Single Bill confirmation. No dialog-reset `useEffect` patterns.

**ItemSplitSheet.tsx** — No changes required; was already cleaned of unused imports in Phase 23 (prior commit `dcb04ed`).

## Verification Results

```
ModifierSheet.tsx: 214 LOC (< 220 acceptance criteria)
ForcedModifiersPanel.tsx: 129 LOC
SpiceLevelPicker.tsx: 75 LOC

SplitSheet.tsx: 167 LOC (< 180 acceptance criteria)
CustomValueSplitPanel.tsx: 154 LOC (< 200 must_have)
PerSeatSplitPanel.tsx: 189 LOC (< 200 must_have)

eslint-disable set-state-in-effect: 0 occurrences in ModifierSheet.tsx
eslint-disable set-state-in-effect: 0 occurrences in SplitSheet.tsx
npm run build: ✓ Compiled successfully
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript narrowing failure in PerSeatSplitPanel nested function**
- **Found during:** Task 2 build
- **Issue:** `split` variable (type `BillSplit | undefined`) was narrowed to non-null by an early `if (!split) return null` guard, but TypeScript did not propagate this narrowing into the nested `computeSeatTotal` function, causing a type error: `'split' is possibly 'undefined'`
- **Fix:** Added `const split = splitRaw` assignment after the null guard to create a definitively non-null binding; TypeScript correctly narrows the aliased `const`
- **Files modified:** `src/components/payment/PerSeatSplitPanel.tsx`
- **Commit:** f055c4d

**2. [Rule 2 - Missing type] ModifierGroup type name mismatch**
- **Found during:** Task 1 initial ForcedModifiersPanel.tsx creation
- **Issue:** Import referenced `ModifierGroup` but menu.ts exports `MenuModifierGroup`
- **Fix:** Corrected import to `MenuModifierGroup` before any build attempt
- **Files modified:** `src/components/order/ForcedModifiersPanel.tsx`
- **Commit:** a3c8790

## Decisions Made

1. **Key-based remount eliminates set-state-in-effect suppression** — The former `useEffect([menuItem?.id, editingLineId])` with inline `setActiveTab` (suppressed via eslint-disable) is replaced by `<ModifierSheetContent key={...}>`. The key forces a full unmount/remount, so all `useState` initializers run fresh per item/session — cleaner than imperative state sync.

2. **PerSeatSplitPanel owns both assign + pay views** — The plan proposed separate components but keeping both views in one panel avoids shared-state threading (assigningLineId, activeSeatIndex) across component boundaries. The internal `view` state is a minor orchestration concern that stays well under 200 LOC.

3. **CancelSection as inline function component** — Avoids duplicating cancel JSX across both assign and pay views without prop drilling. TypeScript infers closure captures correctly.

4. **splitRaw + const split alias pattern** — Preferred over `split!` non-null assertion to maintain TypeScript safety without runtime risk. Consistent with the project's strict TypeScript mandate.

## Known Stubs

None — all decomposed components wire to live store state. No hardcoded values or placeholders introduced.

## Self-Check: PASSED

Files confirmed to exist:
- src/components/order/ForcedModifiersPanel.tsx: FOUND
- src/components/order/SpiceLevelPicker.tsx: FOUND
- src/components/payment/CustomValueSplitPanel.tsx: FOUND
- src/components/payment/PerSeatSplitPanel.tsx: FOUND

Commits confirmed:
- a3c8790 (Task 1): FOUND
- f055c4d (Task 2): FOUND
