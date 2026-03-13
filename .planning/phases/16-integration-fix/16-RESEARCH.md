# Phase 16: Integration Fix - Research

**Researched:** 2026-03-13
**Domain:** Cross-store integration wiring — Zustand store action calls, KDS→table.store write-back, payment lifecycle cleanup
**Confidence:** HIGH

---

## Summary

Phase 16 is a surgical integration-gap closure phase, not a feature build. All three gaps are missing function calls in already-written code — no new components, no new stores, no new types. Each fix is 1–3 lines at a clearly-identified callsite.

The gaps were found by the v1.2 milestone audit: `bumpTicket()` in KdsTicketCard advances kds.store state only, never writing back to table.store's `orderStage`; the `onAllPaid` SplitSheet callback in the payment page omits a single `updateTable` call; and the `markClean` Cleaning-status button in TableBottomSheet omits a `dissolveAll` call before cleanup. One additional item (MERGE-02) is a documentation checkbox update plus human browser verification — not a code change.

**Primary recommendation:** Apply three targeted callsite insertions using the `getState()` non-reactive read pattern already established in the codebase, then update REQUIREMENTS.md and perform a build check.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRACK-01 | Table tile shows live order stage badge (Queued → Cooking → Ready → Served) derived from KDS + order store state | Fix KdsTicketCard bumpTicket to write orderStage back to table.store on each stage transition |
| TRACK-03 | Items exceeding time threshold (≥15 min) show visual escalation warning on table tile and timeline view | Depends on TRACK-01 fix — escalation logic is already correct, but badge label was stale because orderStage never advanced past 'Ordered' |
| SPLIT-03 | Each seat can be paid independently; table closes only when all seats paid | Add updateTable({ orderStage: 'Billed' }) to the onAllPaid callback in payment/[tableId]/page.tsx |
| MERGE-01 | Staff can merge bills across 2+ tables into a combined bill | Add dissolveAll call in the Cleaning-status markClean button inside TableBottomSheet |
| MERGE-02 | Staff can unsplit previously separated seats back into a single bill before any seat is paid | Implementation confirmed present; update REQUIREMENTS.md checkbox from [ ] to [x] after human browser verification |
</phase_requirements>

---

## Standard Stack

No new packages. All changes use existing store APIs and patterns.

### Existing APIs Used in Fixes

| API | Location | Verified |
|-----|----------|---------|
| `useTableStore.getState().updateTable(id, patch)` | `src/stores/table.store.ts` line 136 | HIGH — read source |
| `useBillStore.getState().dissolveAll(primaryId)` | `src/stores/bill.store.ts` line 176 | HIGH — read source |
| `useTableStore` (import) | Already imported in KdsTicketCard? No — must add | HIGH — read source |
| `useBillStore` (import) | Already imported in TableBottomSheet (line 11) | HIGH — read source |

### Import Status per File

**`src/components/kds/KdsTicketCard.tsx`**
- Imports `useKdsStore` (line 5), `useSessionStore` (line 6), `canDoAction` (line 7), `useKdsTimer` (line 8), `KdsItemRow` (line 9), `OrderLineItem` (line 10)
- `useTableStore` is NOT imported — must be added
- No import for `useBillStore` needed here

**`src/app/(app)/payment/[tableId]/page.tsx`**
- Already imports `useTableStore` (line 8) and `useBillStore` (line 21)
- `updateTable` already used on line 136 via `useTableStore.getState()`
- Pattern is established; the `onAllPaid` callback (lines 311–315) simply needs one additional line

**`src/components/table-map/TableBottomSheet.tsx`**
- Already imports `useBillStore` (line 11)
- `cancelSplit` already called at line 290 using `useBillStore.getState().cancelSplit(table.id)`
- Pattern is established; `dissolveAll` call needs to be added on line 291 before `markClean`

---

## Architecture Patterns

### Pattern: Non-Reactive Cross-Store Write via getState()

This codebase's established pattern for one store writing to another without creating a reactive subscription is `useXStore.getState().action()`. This avoids Zustand's `useSyncExternalStore` infinite loop described in CLAUDE.md.

```typescript
// Source: Established pattern — table.store.ts, bill.store.ts, payment page.tsx
// Non-reactive imperative write — correct for side-effect-style cross-store calls

useTableStore.getState().updateTable(tableId, { orderStage: 'Cooking' })
useBillStore.getState().dissolveAll(tableId)
```

Do NOT use hook form (`const { updateTable } = useTableStore()`) inside KdsTicketCard for this write-back — KdsTicketCard is not a component that needs to react to table.store changes, so the subscription is unnecessary overhead and follows the pattern consistently.

### Pattern: bumpTicket Stage Machine

Current `bumpTicket` logic in kds.store.ts (lines 71–99):
- `New` → `InProgress`: update ticket stage in place
- `InProgress` → `Ready`: update ticket stage in place
- `Ready` → done: destructure-remove ticket from `tickets` record

The write-back to table.store must mirror this:
- `New → InProgress` transition → `orderStage: 'Cooking'`
- `InProgress → Ready` transition → `orderStage: 'Ready'`
- `Ready → done` (ticket removal) → `orderStage: 'Served'`

The write-back does NOT live in kds.store itself (that would couple stores at definition time). It belongs in KdsTicketCard at the callsite, after `bumpTicket()` is called, using the ticket's current stage as the condition before the bump executes.

### Pattern: Pre-Bump Stage Reading

Since bumpTicket advances state, the current stage must be read BEFORE the bump call to determine which write-back to apply:

```typescript
// Source: Derived from kds.store.ts bumpTicket logic
function handleBump() {
  const currentStage = ticket.stage  // read from prop — already the pre-bump value
  bumpTicket(ticket.ticketId)

  const tableId = ticket.tableId
  if (currentStage === 'New') {
    useTableStore.getState().updateTable(tableId, { orderStage: 'Cooking' })
  } else if (currentStage === 'InProgress') {
    useTableStore.getState().updateTable(tableId, { orderStage: 'Ready' })
  } else if (currentStage === 'Ready') {
    useTableStore.getState().updateTable(tableId, { orderStage: 'Served' })
  }
}
```

The `ticket` prop already carries `tableId` (confirmed in kds.store.ts `KdsTicket` interface line 11). No additional lookup needed.

### Pattern: onAllPaid Callback Augmentation

Current `onAllPaid` (payment/[tableId]/page.tsx lines 311–315):
```typescript
onAllPaid={() => {
  mergedSecondaryIds.forEach((id) => useTableStore.getState().markCleaning(id))
  dissolveAll(tableId)
  setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date() })
  setViewState('receipt')
}}
```

Missing: `useTableStore.getState().updateTable(tableId, { orderStage: 'Billed' })` and `useTableStore.getState().markCleaning(tableId)` (the primary table itself is not marked cleaning here — compare `handleConfirmPayment` at line 133 which calls `markCleaning(tableId)` for the primary).

Wait — reviewing more carefully: `handleConfirmPayment` at line 133 calls `markCleaning(tableId)`. But `onAllPaid` only calls `markCleaning` for `mergedSecondaryIds`, not the primary. This means the primary table also needs `markCleaning` in the `onAllPaid` path. However, the audit specifically calls out only the `orderStage: 'Billed'` omission (SPLIT-03). The markCleaning for primary may be handled by SplitSheet itself before calling onAllPaid — this needs verification by reading SplitSheet.

### Anti-Patterns to Avoid

- **Do NOT add the write-back inside `bumpTicket` in kds.store.ts** — that couples stores at definition time, making kds.store depend on table.store. The callsite pattern is correct.
- **Do NOT use reactive hook subscriptions** (`useTableStore()`) inside KdsTicketCard for the write-back — non-reactive `getState()` is the established pattern for one-off writes.
- **Do NOT call `markCleaning` on `tableId` in `onAllPaid`** without first checking whether SplitSheet already does it — avoid double-calling lifecycle transitions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| KDS→table stage mapping | Custom event bus / observer | `getState().updateTable()` at callsite |
| Merge map cleanup | Custom cleanup hook | `dissolveAll()` already in bill.store |
| Stage advancement logic | Duplicate bumpTicket logic | Read `ticket.stage` prop before calling existing `bumpTicket()` |

---

## Common Pitfalls

### Pitfall 1: Writing into kds.store instead of table.store

**What goes wrong:** Modifying kds.store to call updateTable internally — creates circular store dependency.
**Why it happens:** It feels "clean" to keep the write-back co-located with the stage change.
**How to avoid:** The write-back belongs in KdsTicketCard (the presenter), not in the store action.

### Pitfall 2: Using wrong stage value for the condition

**What goes wrong:** Reading `ticket.stage` AFTER `bumpTicket()` is called — the stage has already advanced in Zustand, so the condition is evaluated on the new stage, not the pre-bump stage.
**Why it happens:** Async thinking — actually synchronous, but Zustand's set is applied before the next render, not before the current function returns.
**How to avoid:** Capture `ticket.stage` in a `const` before calling `bumpTicket()`.

### Pitfall 3: Double-calling markCleaning on primary table in onAllPaid

**What goes wrong:** Adding `markCleaning(tableId)` to `onAllPaid` when SplitSheet already does it internally — results in redundant state write (harmless but noisy).
**Why it happens:** Pattern matching from `handleConfirmPayment` without checking SplitSheet internals.
**How to avoid:** Read SplitSheet's `handleSeatPaid` / all-paid path before adding calls in the callback.

### Pitfall 4: Omitting dissolveAll for secondary merge tables in markClean

**What goes wrong:** Adding `dissolveAll(table.id)` but forgetting it only removes secondaries from the perspective of the PRIMARY. If a secondary table's markClean is called directly, it won't remove itself.
**Why it happens:** `dissolveAll` takes primaryTableId — it removes all entries where `merges[k] === primaryTableId`. If `table.id` IS a secondary, `dissolveAll(table.id)` removes nothing.
**How to avoid:** The markClean fix is specifically for when the PRIMARY table is being cleaned. Secondary tables go through `markCleaning` at payment time, not direct `markClean`. The flow is: primary reaches Cleaning → staff taps Mark Clean → `dissolveAll(primary.id)` removes all secondary references correctly.

---

## Code Examples

### Fix 1: KdsTicketCard — bumpTicket write-back

```typescript
// Source: src/components/kds/KdsTicketCard.tsx — derived from audit + store API review
// Add import at top:
import { useTableStore } from '@/stores/table.store'

// Replace existing onClick inline call with a named handler:
function handleBump() {
  if (bumpBlocked) return
  const currentStage = ticket.stage
  bumpTicket(ticket.ticketId)
  // Write orderStage back to table.store — non-reactive getState() pattern
  if (currentStage === 'New') {
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Cooking' })
  } else if (currentStage === 'InProgress') {
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Ready' })
  } else if (currentStage === 'Ready') {
    useTableStore.getState().updateTable(ticket.tableId, { orderStage: 'Served' })
  }
}

// Button onClick becomes:
onClick={handleBump}
```

### Fix 2: payment/[tableId]/page.tsx — onAllPaid orderStage write

```typescript
// Source: src/app/(app)/payment/[tableId]/page.tsx lines 311-315
// Add one line inside the onAllPaid callback:
onAllPaid={() => {
  useTableStore.getState().updateTable(tableId, { orderStage: 'Billed' })  // ADD
  mergedSecondaryIds.forEach((id) => useTableStore.getState().markCleaning(id))
  dissolveAll(tableId)
  setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date() })
  setViewState('receipt')
}}
```

### Fix 3: TableBottomSheet — markClean dissolveAll

```typescript
// Source: src/components/table-map/TableBottomSheet.tsx lines 289-292
// useBillStore already imported at line 11
onClick={() => {
  useBillStore.getState().cancelSplit(table.id)
  useBillStore.getState().dissolveAll(table.id)   // ADD
  markClean(table.id)
  onClose()
}}
```

### Fix 4: REQUIREMENTS.md — MERGE-02 checkbox update

```markdown
// After human browser verification of "Revert to Single Bill" feature:
- [x] **MERGE-02**: Staff can unsplit previously separated seats back into a single bill before any seat is paid
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Event bus between stores | `getState()` callsite writes | Already in use — continue pattern |
| Store coupling at definition | Callsite coupling at presenter | Cleaner dependency direction |

---

## Open Questions

1. **Does SplitSheet call markCleaning on primary table before invoking onAllPaid?**
   - What we know: `handleConfirmPayment` explicitly calls `markCleaning(tableId)` for the primary. The `onAllPaid` callback only shows `markCleaning` for `mergedSecondaryIds`.
   - What's unclear: Whether SplitSheet's internal `handleSeatPaid` all-paid detection also calls `markCleaning` on the primary before firing `onAllPaid`.
   - Recommendation: Read `src/components/payment/SplitSheet.tsx` before writing the fix to avoid double-marking. The audit only flags the missing `orderStage: 'Billed'` call — follow the audit exactly and do not add `markCleaning` to `onAllPaid` unless SplitSheet is confirmed to not do it.

2. **Should MERGE-02 checkbox be updated before or after human browser verification?**
   - What we know: The audit says "needs human browser verification to close."
   - What's unclear: Whether the planner should mark this as a separate human-action task or as a task the implementer does inline.
   - Recommendation: Make it a distinct task: "Verify MERGE-02 in browser, then update REQUIREMENTS.md checkbox." The checkbox update is the closing artifact, verification is the prerequisite.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured — `npm run build` (TypeScript) is the verification gate |
| Config file | None |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRACK-01 | bumpTicket writes Cooking/Ready/Served to table.store | manual-only (no test framework) | `npm run build` (compile check only) | N/A |
| TRACK-03 | Escalation badge shows correct stage label, not stale 'Ordered' | manual-only | `npm run build` | N/A |
| SPLIT-03 | onAllPaid sets orderStage: 'Billed' | manual-only | `npm run build` | N/A |
| MERGE-01 | markClean dissolves merge map | manual-only | `npm run build` | N/A |
| MERGE-02 | Revert to Single Bill works in browser | manual browser verification | none | N/A |

**Note on manual-only justification:** The project has no test framework (CLAUDE.md: "No test framework is configured"). TypeScript build (`npm run build`) catches import errors, missing properties, and type mismatches. Behavioral correctness requires browser walkthrough.

### Sampling Rate

- **Per task commit:** `npm run build` (must pass with zero errors)
- **Per wave merge:** `npm run build`
- **Phase gate:** Build green + human browser walkthrough of all 5 requirement flows before closing phase

### Wave 0 Gaps

None — no test framework to configure. Build verification is the only automated gate.

---

## Sources

### Primary (HIGH confidence)

- Direct file read: `src/components/kds/KdsTicketCard.tsx` — current bumpTicket callsite, missing import
- Direct file read: `src/stores/kds.store.ts` — bumpTicket stage machine, KdsTicket interface (tableId field confirmed)
- Direct file read: `src/stores/table.store.ts` — updateTable API, OrderStage type, allowed patch fields
- Direct file read: `src/stores/bill.store.ts` — dissolveAll API, cancelSplit pattern
- Direct file read: `src/app/(app)/payment/[tableId]/page.tsx` — onAllPaid callback location (lines 311–315)
- Direct file read: `src/components/table-map/TableBottomSheet.tsx` — markClean button location (lines 289–292), useBillStore already imported
- Direct file read: `.planning/v1.2-MILESTONE-AUDIT.md` — authoritative gap descriptions with file locations and line numbers
- Direct file read: `.planning/REQUIREMENTS.md` — requirement descriptions and checkbox states
- Direct file read: `CLAUDE.md` — getState() pattern, Zustand selector infinite loop warning, non-reactive store read pattern

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` accumulated context — confirmed getState() pattern established in [12-02] and [14-03] decisions

### Tertiary (LOW confidence)

- None — all findings are from direct source code reads

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all APIs read directly from source
- Architecture: HIGH — patterns confirmed from CLAUDE.md and existing callsite examples
- Pitfalls: HIGH — pitfalls derived from direct reading of the store implementations and established patterns
- Gap descriptions: HIGH — taken verbatim from audit file with line numbers verified against source

**Research date:** 2026-03-13
**Valid until:** Until source files change — this is point-in-time source analysis
