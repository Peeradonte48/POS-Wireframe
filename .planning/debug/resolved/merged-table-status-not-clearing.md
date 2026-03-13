---
status: resolved
trigger: "After paying a merged bill, secondary (merged-in) table stays in 'Check Requested' status instead of transitioning to 'Cleaning'"
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED
test: TypeScript build passed clean
expecting: Human verification that secondary tables now show "Cleaning" after payment
next_action: Human verifies in browser

## Symptoms

expected: When a merged bill is fully paid, ALL tables involved (primary + all secondary/merged-in tables) should transition from "Check Requested" to "Cleaning" status
actual: Only the primary table transitions to "Cleaning". The secondary table(s) that were merged in remain stuck at "Check Requested" status after payment completes.
errors: No visible errors — UI just shows wrong table status
reproduction: 1. Open two tables, 2. Merge them via MergeSheet, 3. Request check on the primary table, 4. Go to payment/checkout on primary table, 5. Complete payment, 6. Observe secondary table tile — it stays "Check Requested" instead of "Cleaning"
started: Known gap — merge integration done in Phase 14 but payment flow may not have been updated

## Eliminated

(none — root cause found on first hypothesis)

## Evidence

- timestamp: 2026-03-13T00:01:00Z
  checked: src/app/(app)/payment/[tableId]/page.tsx handleConfirmPayment (lines 130-143)
  found: markCleaning called only for primary tableId; no iteration over mergedSecondaryIds
  implication: Secondary tables never transition to Cleaning on single-bill payment

- timestamp: 2026-03-13T00:01:00Z
  checked: src/components/payment/SplitSheet.tsx handleSeatPaid allPaid branch (lines 118-123)
  found: markCleaning(tableId) only; mergedSecondaryIds not available in SplitSheet scope
  implication: Secondary tables never transition to Cleaning on split-bill payment either

- timestamp: 2026-03-13T00:01:00Z
  checked: mergedSecondaryIds derivation in payment page (lines 67-72)
  found: already computed via useMemo from bill.store merges — just not used in completion handlers
  implication: Fix can be done entirely in the payment page without modifying SplitSheet

- timestamp: 2026-03-13T00:02:00Z
  checked: npm run build after patch
  found: compiled successfully, zero TypeScript errors
  implication: Fix is type-safe

## Resolution

root_cause: |
  Two payment completion paths both call markCleaning only on the primary tableId:
  1. handleConfirmPayment (single-bill path) — line 133, payment/[tableId]/page.tsx
  2. onAllPaid callback passed to SplitSheet (split-bill path) — line 310, same file
  The mergedSecondaryIds array was already derived in scope but never forwarded to either handler.

fix: |
  Added `mergedSecondaryIds.forEach((id) => markCleaning(id))` immediately after the primary
  markCleaning call in handleConfirmPayment (single-bill path), and added
  `mergedSecondaryIds.forEach((id) => useTableStore.getState().markCleaning(id))` at the
  top of the onAllPaid callback (split-bill path). Both patches are co-located in
  payment/[tableId]/page.tsx where mergedSecondaryIds is in scope.

verification: TypeScript build passes clean (npm run build — zero errors)

files_changed:
  - src/app/(app)/payment/[tableId]/page.tsx
