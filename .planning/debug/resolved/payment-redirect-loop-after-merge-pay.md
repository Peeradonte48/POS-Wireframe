---
status: resolved
trigger: "After paying a merged bill, the app redirects back to the payment page instead of navigating away"
created: 2026-03-13T00:00:00Z
updated: 2026-03-13T00:01:00Z
---

## Current Focus

hypothesis: When payment completes, handleConfirmPayment calls markCleaning on all tables and then sets viewState to 'receipt'. However, the merge record in bill.store is NOT dissolved at payment time. This means the secondary table's status becomes 'Cleaning' but it is still registered as a merged secondary. TableTile.tsx has special onClick logic: if a tile is a mergedSecondary it immediately pushes router to /payment/[primaryTableId]. After payment, the user is on the receipt screen and clicks "Back to Floor Plan" which routes to /table-map. On the table map, the secondary table tile still has isMergedSecondary === true (because dissolveAll was never called), and the secondary table's status is 'Cleaning'. When the user (or any re-render) triggers the tile's onClick, it sends the user back to /payment/[primaryTableId]. This is the redirect loop.
test: Trace the sequence — pay merged bill → receipt → back to floor plan → secondary tile still has merge entry → tap secondary tile → redirects to /payment/primary
expecting: Confirmed root cause. Fix is to call dissolveAll(tableId) inside handleConfirmPayment and onAllPaid so the merge relationship is cleared when payment completes.
next_action: Apply fix in payment/[tableId]/page.tsx

## Symptoms

expected: After payment completes, the user should be redirected away from the payment page (e.g. to the floor plan /tables or receipt view)
actual: After confirming payment on a merged bill, the page redirects back to the payment page — likely /payment/[tableId] for the secondary table instead of leaving payment flow entirely
errors: No visible error — just wrong navigation destination
reproduction: 1. Open two tables, merge T2 into T1, request check on T1, pay at /payment/T1 — after payment completes, app redirects to payment page instead of exiting
started: Likely introduced alongside the merged-table-status-not-clearing fix in Phase 14, or the redirect logic pre-dates merge support and doesn't account for merged secondaries

## Eliminated

- hypothesis: Auth guard in (app)/layout.tsx causing redirect
  evidence: Layout guard only checks role, Kitchen, and shiftOpen — no payment-specific logic. Cannot redirect to /payment.
  timestamp: 2026-03-13T00:00:00Z

- hypothesis: Payment page's empty-order guard triggering and falling through
  evidence: The guard at line 166 of page.tsx renders a "No order data found" panel and button — it does not router.push anywhere. Cannot cause redirect.
  timestamp: 2026-03-13T00:00:00Z

- hypothesis: ReceiptScreen's onBackToFloor navigates to wrong path
  evidence: onBackToFloor calls router.push('/table-map') which is correct. This is not the source.
  timestamp: 2026-03-13T00:00:00Z

## Evidence

- timestamp: 2026-03-13T00:00:00Z
  checked: src/components/table-map/TableTile.tsx lines 93-98
  found: TableTile onClick handler has special merge-secondary routing: if (isMergedSecondary && primaryTableId) { router.push(`/payment/${primaryTableId}`); return; }
  implication: Any tap on a merged secondary tile sends user to /payment/[primaryTableId]. This fires even on the table-map screen after payment if the merge is still registered.

- timestamp: 2026-03-13T00:00:00Z
  checked: src/app/(app)/payment/[tableId]/page.tsx handleConfirmPayment (line 130-144) and onAllPaid in SplitSheet callback (line 310-314)
  found: Both paths call markCleaning on primary + secondaries, but NEITHER calls dissolveAll(tableId) to remove the merge record from bill.store.
  implication: After payment, the merge entry persists in bill.store.merges. The secondary table's status is 'Cleaning' but isMergedSecondary is still true. When user returns to table-map and taps the secondary tile, the redirect to /payment/[primaryTableId] fires again.

- timestamp: 2026-03-13T00:00:00Z
  checked: src/stores/bill.store.ts dissolveAll (line 176-181)
  found: dissolveAll(primaryTableId) removes all merge entries where the value === primaryTableId. It is idempotent and safe to call even if no merges exist.
  implication: Calling dissolveAll(tableId) at payment confirmation time will clean up the merge state and stop the TableTile from triggering payment redirects.

## Resolution

root_cause: bill.store merge records are never dissolved at payment time. After paying, mergedSecondaryIds still appear in bill.store.merges. TableTile.tsx's onClick redirects any merged-secondary tile tap to /payment/[primaryTableId], so returning to table-map and tapping the secondary tile (now in 'Cleaning' status) fires this redirect — sending the user back into the payment page they just left.

fix: In payment/[tableId]/page.tsx, call dissolveAll(tableId) inside both handleConfirmPayment (single-pay path) and the SplitSheet onAllPaid callback (split-pay path), after markCleaning calls. This must happen before setViewState('receipt') or before the receipt callback fires so the merge state is cleared immediately.

verification: Build passes (npm run build clean, no TypeScript errors). Fix is minimal — two one-line additions of dissolveAll(tableId) in handleConfirmPayment and the SplitSheet onAllPaid callback. dissolveAll is already destructured from useBillStore at line 73 so no new imports are needed. Awaiting human confirmation that the redirect loop is gone in the browser.
files_changed:
  - src/app/(app)/payment/[tableId]/page.tsx
