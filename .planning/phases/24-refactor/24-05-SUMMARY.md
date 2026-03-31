---
phase: 24-refactor
plan: "05"
subsystem: payment
tags: [refactor, payment, zustand, consolidation]
dependency_graph:
  requires: []
  provides: [PaymentMethodPanel]
  affects:
    - src/components/payment/CashPanel.tsx
    - src/components/payment/CardPanel.tsx
    - src/components/payment/QrPanel.tsx
tech_stack:
  added: []
  patterns:
    - PaymentMethodPanel wrapper for shared panel skeleton (icon + title + description + children)
key_files:
  created:
    - src/components/payment/PaymentMethodPanel.tsx
  modified:
    - src/components/payment/CashPanel.tsx
    - src/components/payment/CardPanel.tsx
    - src/components/payment/QrPanel.tsx
decisions:
  - PaymentMethodPanel uses flex-col items-center pattern to match QrPanel's centering; CashPanel content uses full-width div in children slot
  - Icon size 24 inside 48px muted rounded circle for visual consistency across all three panels
  - getMergedSecondaries call sites already compliant — audit confirmed zero violations; no file changes needed for Task 2
metrics:
  duration_minutes: 8
  completed: "2026-03-31"
  tasks_completed: 2
  files_modified: 4
  files_created: 1
requirements_completed: [REF-02]
---

# Phase 24 Plan 05: Payment Panel Consolidation + Zustand Audit Summary

PaymentMethodPanel shared wrapper extracted from three payment panel files; getMergedSecondaries Zustand selector audit confirmed zero violations.

---

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Extract shared PaymentMethodPanel wrapper (D-02 item 4) | Done | d20793a |
| 2 | Zustand selector pattern audit — getMergedSecondaries (D-02 item 5) | Done (no changes needed) | d20793a |

---

## What Was Built

### Task 1: PaymentMethodPanel Wrapper

Created `src/components/payment/PaymentMethodPanel.tsx` — a shared structural wrapper providing:
- Icon slot (centered, 48px muted circular container)
- Title text
- Optional description text
- Children slot for panel-specific content

Updated all three payment panels to use it:
- **CashPanel**: `Banknote` icon, "Cash" title, description + cash input + change due as children
- **CardPanel**: `CreditCard` icon, "Card" title, description + amount display as children
- **QrPanel**: `QrCode` icon, "QR PromptPay" title, description + QR SVG as children

All panels preserved their existing behavior exactly. Build passes with zero errors.

### Task 2: Zustand Selector Audit

Audited all `getMergedSecondaries` and `.merges` call sites across the codebase:

| File | Pattern | Status |
|------|---------|--------|
| `src/app/(app)/payment/[tableId]/page.tsx:125` | `useBillStore((s) => s.merges)` + `useMemo` derivation | Correct |
| `src/components/table-map/TableTile.tsx:48` | `useBillStore((s) => s.merges)` + `useMemo` derivation | Correct |
| `src/components/table-map/TableBottomSheet.tsx:35` | `useBillStore((s) => s.merges)` + inline boolean check | Correct |
| `src/stores/bill.store.ts:286` | Function definition (not a selector call) | N/A |

**Result:** Zero violations. No files required modification. All call sites already follow the CLAUDE.md `useMemo` derivation pattern.

---

## Deviations from Plan

None — plan executed exactly as written. Task 2 audit confirmed no selector violations; no fixes required.

---

## Known Stubs

None.

---

## Self-Check: PASSED

- `src/components/payment/PaymentMethodPanel.tsx` exists: FOUND
- Commit d20793a exists: FOUND
- Zero `useBillStore.*getMergedSecondaries` violations: CONFIRMED
- `npm run build` passes with 0 errors: CONFIRMED
