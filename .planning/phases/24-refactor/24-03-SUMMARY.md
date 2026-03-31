---
phase: 24-refactor
plan: "03"
subsystem: payment
tags: [refactor, decomposition, hooks, components]
dependency_graph:
  requires: [24-01]
  provides: [useBillCalculation, useCameraScanner, PaymentModals, PromotionSummary]
  affects: [src/app/(app)/payment/[tableId]/page.tsx]
tech_stack:
  added: []
  patterns: [hook-extraction, component-decomposition, jsx-variable-hoisting]
key_files:
  created:
    - src/components/payment/useBillCalculation.ts
    - src/components/payment/useCameraScanner.ts
    - src/components/payment/PaymentModals.tsx
    - src/components/payment/PromotionSummary.tsx
  modified:
    - src/app/(app)/payment/[tableId]/page.tsx
decisions:
  - "useBillCalculation uses static getState() for isTakeaway (per CLAUDE.md non-reactive read pattern)"
  - "useBillCalculation imports useQueueStore directly with proper import (not require) for clean TypeScript"
  - "useCameraScanner extracted with full state API; payment page calls it without destructuring since camera UI not yet wired in this page"
  - "PaymentModals hoisted as const modals JSX variable in payment page to avoid rendering twice in checkout + checkBill views"
  - "PromotionSummary owns the PromoDetail sheet state internally (self-contained) to keep page state minimal"
  - "Page reduced 944→318 LOC (66% reduction); 280 target not met due to dense check-bill view JSX"
metrics:
  duration: "16 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 24 Plan 03: Payment Page Decomposition Summary

**One-liner:** Payment page (944 LOC) decomposed into orchestrator + 4 focused modules: bill calc hook, camera scanner hook, modals component, and promotion summary component.

## What Was Built

Decomposed the largest component in the codebase into 5 focused files:

| File | LOC | Concern |
|------|-----|---------|
| `useBillCalculation.ts` | ~105 | VAT math, discount aggregation, merge awareness, takeaway branching |
| `useCameraScanner.ts` | ~45 | Camera coupon scan flow state (cameraOpen, scannedCode, handleScan, clearScan) |
| `PaymentModals.tsx` | ~261 | All dialog/sheet wrappers: CRM, QR, Cash, Split, Merge, Payment method |
| `PromotionSummary.tsx` | ~312 | Applied coupon chips, show/hide overflow, PromoDetail sheet |
| `page.tsx` (orchestrator) | ~318 | Hook calls, view state machine, JSX composition |

**Before:** 1 file, 944 LOC, 10 mixed concerns
**After:** 5 files — each with single concern

## Tasks Completed

### Task 1: Extract useBillCalculation and useCameraScanner

- Created `useBillCalculation.ts` aggregating line items from order.store (including merged tables), VAT computation (7%), discount/promotion aggregation, grand total, isMerged awareness via useMemo (CLAUDE.md anti-loop pattern), isTakeaway via getState() static read
- Created `useCameraScanner.ts` managing camera open state, scanned code, handleScan/clearScan flow
- Updated payment page to import and call both hooks; removed extracted useMemo blocks and merge state derivation
- Build: 0 TypeScript errors

### Task 2: Extract PaymentModals and PromotionSummary, finalize orchestrator

- Created `PromotionSummary.tsx` with applied coupon list (show/hide overflow at 3), delete button, and self-contained PromoDetail sheet
- Created `PaymentModals.tsx` wrapping all 9 dialogs/sheets with prop-driven open state and callbacks
- Rewrote payment page as clean orchestrator: hooks → state → handlers → JSX composition
- Hoisted shared `modals` JSX variable above view split to avoid render duplication in checkout + checkBill views
- Build: 0 TypeScript errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed useBillCalculation takeaway detection using require()**
- **Found during:** Task 1
- **Issue:** Initial implementation used dynamic `require('@/stores/queue.store')` inside hook body to avoid a potential circular dependency concern
- **Fix:** Added proper `import { useQueueStore } from '@/stores/queue.store'` at top of file; used `useQueueStore.getState().orders[tableId]` per CLAUDE.md non-reactive read pattern
- **Files modified:** `src/components/payment/useBillCalculation.ts`
- **Commit:** f1ec780

**2. [Rule 1 - Bug] Fixed syntax error in toggleGroup inline handler**
- **Found during:** Task 2 build
- **Issue:** `if (next.has(tid)) next.delete(tid) else next.add(tid)` — missing braces caused Turbopack parse error
- **Fix:** Added braces: `if (next.has(tid)) { next.delete(tid) } else { next.add(tid) }`
- **Files modified:** `src/app/(app)/payment/[tableId]/page.tsx`
- **Commit:** 3f692bd

### Plan Target Deviation

**LOC target not fully met:** Plan target was 280 LOC; actual orchestrator is 318 LOC.

The 38-line gap comes from the check-bill view's left panel JSX (discount accordion animation + table groups accordion) which is dense, non-extractable UI markup. The core structural goal was achieved: 944 → 318 LOC (66% reduction), all 10 concerns separated into focused modules.

## Known Stubs

None — all concerns are properly wired. The `useCameraScanner` hook is called in the payment page but its state is not yet wired to UI (no CameraSheet rendered in the page). This is pre-existing behavior — CameraSheet was imported but never rendered in the original 944-line page.

## Self-Check: PASSED

- `src/components/payment/useBillCalculation.ts` — EXISTS
- `src/components/payment/useCameraScanner.ts` — EXISTS
- `src/components/payment/PaymentModals.tsx` — EXISTS
- `src/components/payment/PromotionSummary.tsx` — EXISTS
- Commits: f1ec780 (task 1), 3f692bd (task 2)
- Build: `✓ Compiled successfully` — 0 TypeScript errors
