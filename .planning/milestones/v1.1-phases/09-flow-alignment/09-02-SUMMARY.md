---
phase: 09-flow-alignment
plan: "02"
subsystem: payment
tags: [coupon, camera-scan, qr-panel, flow-alignment, FLOW-03, FLOW-04]
dependency_graph:
  requires: []
  provides: [CameraSheet, TotalsSection-scan-flow, QrPanel-discount-note]
  affects: [src/app/(app)/payment/[tableId]/page.tsx]
tech_stack:
  added: []
  patterns: [slide-up-bottom-sheet, useEffect-cleanup-timer, optional-prop-conditional-render]
key_files:
  created:
    - src/components/payment/CameraSheet.tsx
  modified:
    - src/components/payment/TotalsSection.tsx
    - src/components/payment/QrPanel.tsx
    - src/app/(app)/payment/[tableId]/page.tsx
decisions:
  - "setCouponApplied added as prop to TotalsSection — required for scan callback to set coupon state; onApplyCoupon kept for backward compat"
  - "discountApplied prop named differently from page-local discountAmount intentionally — comment added at call site"
metrics:
  duration: "~12 minutes"
  completed: "2026-03-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 3
---

# Phase 9 Plan 02: Payment Camera Scan Flow + QR Discount Note Summary

**One-liner:** Camera scan bottom sheet replaces manual coupon input (FLOW-03) and QrPanel now shows net-amount discount note when coupon applied (FLOW-04).

---

## What Was Built

### FLOW-03: Camera scan coupon flow

Replaced the manual coupon text/number input + Apply button in `TotalsSection.tsx` with a camera scan interaction:

- New `CameraSheet.tsx` — slide-up bottom sheet simulating a camera viewfinder
- Opens via tap on "Scan Coupon QR" button in TotalsSection
- After 1.5s, fires `onCouponScanned('RAMEN50', 50)` and auto-closes
- User can tap X before 1.5s; the useEffect cleanup cancels the timeout so no coupon is applied
- After scan, button remains visible but is disabled (grayed) — cannot scan twice
- Applied coupon shows as "RAMEN50 −฿50" in the totals list (existing rendering logic)

### FLOW-04: QR PromptPay discount note

Extended `QrPanel.tsx` with an optional `discountApplied?: number` prop:

- When `discountApplied > 0`, renders `(after ฿50 discount)` below the grand total amount
- When no coupon applied (`discountAmount = 0`), the note does not render
- Payment page passes `discountApplied={discountAmount}` at the QrPanel call site

---

## Decisions Made

1. **setCouponApplied added to TotalsSection props** — The scan callback inside CameraSheet needs to set `couponApplied` to `true`. The simplest approach is passing `setCouponApplied` down alongside the other coupon setters. The existing `onApplyCoupon` handler was kept in the interface and still wired in payment page for backward compat (no callers broken).

2. **discountApplied vs discountAmount naming** — QrPanel uses `discountApplied` as the prop name (matching the plan spec) while the page-local variable is `discountAmount`. A comment was added at the call site to document this intentional naming difference.

---

## Deviations from Plan

None — plan executed exactly as written. The only minor addition was propagating `setCouponApplied` as a prop to TotalsSection (implied by the scan flow spec, just not listed explicitly in the interface block).

---

## Commits

| Task | Commit  | Message |
|------|---------|---------|
| 1    | b120a94 | feat(09-02): FLOW-03 — replace coupon input with camera scan button and CameraSheet |
| 2    | ebf4f02 | feat(09-02): FLOW-04 — add discount note to QrPanel and wire call site |
