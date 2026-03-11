---
phase: 05-payment
plan: 02
subsystem: payments
tags: [react, next.js, zustand, sonner, lucide-react, tailwind]

requires:
  - phase: 05-01
    provides: PaymentPage with payment view, markCleaning/updateTable store actions, Toaster already mounted

provides:
  - ReceiptScreen component (full post-payment confirmation view with details card, reprint button, back-to-floor button)
  - PaymentPage renders ReceiptScreen when viewState === 'receipt' and receiptData is set
  - handleConfirmPayment triggers markCleaning + updateTable(orderStage:'Billed') + receipt transition
  - TableBottomSheet Go to Payment button active — routes to /payment/[tableId] from CheckRequested state

affects:
  - 06-manager-layer (table lifecycle complete — Cleaning state now reachable from payment flow)
  - 07-polish (receipt screen is a stakeholder demo anchor)

tech-stack:
  added: []
  patterns:
    - "Receipt view rendered inline in same page component via viewState === 'receipt' guard — no route change"
    - "Sonner toast fired from page-level handleReprint, passed into ReceiptScreen via onReprint prop"
    - "useRouter already imported in TableBottomSheet — no duplicate import needed"

key-files:
  created:
    - src/components/payment/ReceiptScreen.tsx
  modified:
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/table-map/TableBottomSheet.tsx

key-decisions:
  - "toast imported directly in PaymentPage (not ReceiptScreen) — keeps ReceiptScreen a pure display component with no side effects"
  - "Toaster rendered in both payment and receipt view branches — each branch returns its own JSX tree with Toaster included"
  - "useRouter was already imported in TableBottomSheet from Phase 2 — no changes to imports needed"

patterns-established:
  - "ReceiptScreen: pure display component — receives onReprint/onBackToFloor callbacks, no direct store or router access"

requirements-completed:
  - PAY-03
  - PAY-04

duration: 2min
completed: 2026-03-11
---

# Phase 5 Plan 02: Receipt Screen + TableBottomSheet Activation Summary

**ReceiptScreen component with CheckCircle header, details card (table/total/method/time/auto-print annotation), Reprint toast, and Back-to-Floor navigation; TableBottomSheet Go to Payment button activated to route to /payment/[tableId]**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-11T06:05:04Z
- **Completed:** 2026-03-11T06:06:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `ReceiptScreen.tsx` — full post-payment confirmation UI with green CheckCircle, details card showing table ID, total paid in ฿, payment method, Thai-locale timestamp, auto-print annotation, and action buttons
- Replaced PaymentPage receipt stub with `ReceiptScreen` render; added `handleReprint` firing Sonner toast "Receipt sent to printer"; fixed missing `toast` import in PaymentPage
- Activated TableBottomSheet `CheckRequested` branch — Go to Payment button now calls `router.push('/payment/${table.id}')`, removing the Phase 5 disabled stub

## Task Commits

Each task was committed atomically:

1. **Task 1: ReceiptScreen component + wire receipt view into PaymentPage** - `fe5392e` (feat)
2. **Task 2: Activate TableBottomSheet Go to Payment button + build verify** - `65f6ecb` (feat)

## Files Created/Modified

- `src/components/payment/ReceiptScreen.tsx` — Post-payment receipt confirmation component; exports `ReceiptScreen`
- `src/app/(app)/payment/[tableId]/page.tsx` — Added ReceiptScreen import, handleReprint function, replaced stub receipt view with full ReceiptScreen render; added `toast` to sonner import
- `src/components/table-map/TableBottomSheet.tsx` — Replaced disabled Go to Payment stub with active `router.push('/payment/${table.id}')` button

## Decisions Made

- `toast` import kept in `PaymentPage` (not `ReceiptScreen`) — keeps ReceiptScreen a pure display component with no side effects; reprint action delegated via `onReprint` prop
- Toaster included in both payment and receipt JSX branches since each branch returns an independent JSX tree (conditional return pattern)
- `useRouter` was already imported in `TableBottomSheet` from Phase 2 code — no import changes needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing `toast` import in PaymentPage**
- **Found during:** Task 1 (TypeScript verification after wiring ReceiptScreen)
- **Issue:** `handleReprint` calls `toast(...)` but `toast` was not imported from `sonner` — only `Toaster` was imported
- **Fix:** Added `toast` to the existing sonner import: `import { toast, Toaster } from 'sonner'`
- **Files modified:** `src/app/(app)/payment/[tableId]/page.tsx`
- **Verification:** `npx tsc --noEmit` exits 0 after fix
- **Committed in:** `fe5392e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — missing import)
**Impact on plan:** Single-line fix required for TypeScript to compile. No scope creep.

## Issues Encountered

- `ReceiptScreen.tsx` initially included an unused `toast` import (plan noted it as option). Removed before commit to keep the component clean since toast is handled at page level.

## Build Status

- `npx tsc --noEmit`: passes
- `npm run build`: passes (Next.js 16 Turbopack, all routes compiled cleanly)

## Next Phase Readiness

- Full payment lifecycle is complete: floor plan → order → request check → payment → receipt → cleaning state
- PAY-03 and PAY-04 requirements satisfied
- Phase 5 Plan 03 (verification/polish if any) or Phase 6 (Manager Layer) can proceed

---
*Phase: 05-payment*
*Completed: 2026-03-11*
