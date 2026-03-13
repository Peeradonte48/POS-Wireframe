---
phase: 14-merge-bill
verified: 2026-03-13T10:00:00Z
status: human_needed
score: 17/17 must-haves verified
re_verification: false
human_verification:
  - test: "Merge flow end-to-end (MERGE-01)"
    expected: "Open two occupied tables, tap TableBottomSheet > Merge Bill, select secondary in MergeSheet, confirm. Secondary tile shows indigo Merged badge and tapping navigates to primary payment page. Payment page groups items by table with per-group Dissolve Merge button. Grand total equals combined items from both tables."
    why_human: "Visual rendering of badge, routing behavior on tile tap, grouped items layout, and combined total accuracy all require browser interaction to confirm."
  - test: "TotalsSection entry point + Split Bill hide (MERGE-01)"
    expected: "On the primary payment page with an active merge, Merge Bill button is present (disabled), Split Bill button is absent from DOM. After dissolving, Split Bill reappears."
    why_human: "Conditional DOM presence of Split Bill during active merge cannot be verified without rendering the component with live store state."
  - test: "Unsplit revert flow (MERGE-02)"
    expected: "SplitSheet shows Revert to Single Bill at bottom. With no paid seats the button is enabled; tapping shows a confirm dialog; tapping Revert calls cancelSplit, closes sheet, shows toast. With any seat paid, button is disabled with Cannot revert label."
    why_human: "Multi-step interaction flow with state guards requires real browser use."
---

# Phase 14: Merge Bill Verification Report

**Phase Goal:** Merge 2+ tables into a single bill — staff can link secondary tables to a primary, payment flows through the primary, and any active split can be reverted before completing the merge.
**Verified:** 2026-03-13T10:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All truths are drawn directly from the `must_haves` frontmatter across the three plan files. All 17 automated must-haves pass. Three behavioral truths require human browser verification.

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | bill.store exposes initMerge, dissolveAll, isMergedSecondary, getPrimaryTable, getMergedSecondaries | VERIFIED | All five signatures present in BillStore interface and implementation (bill.store.ts lines 40–44, 164–188) |
| 2  | merges: Record<string, string> survives route-group transitions via persist | VERIFIED | `merges: {}` initialized at line 51; persisted under existing 'bill-store' name (line 190) |
| 3  | Indigo/violet --status-merged and --status-merged-bg tokens exist in :root, .dark, and @theme inline | VERIFIED | Tokens confirmed at hue 270° in all three locations; @theme uses var() aliases only (globals.css lines 81–82, 134–135, 194–195) |
| 4  | TypeScript build passes with zero errors after store extension | VERIFIED | npm run build exits 0 — all 11 pages rendered without error |
| 5  | MergeSheet renders a slide-up bottom sheet with a table picker and confirm button | VERIFIED | MergeSheet.tsx: full backdrop + translate-y panel structure; confirm button with dynamic label; Cancel button |
| 6  | Only Occupied and CheckRequested tables (excluding primary and already-merged secondaries) appear in picker | VERIFIED | eligibleTables filter: `(t.status === 'Occupied' \|\| t.status === 'CheckRequested') && t.id !== primaryTableId && !isMergedSecondary(t.id)` (MergeSheet.tsx lines 47–52) |
| 7  | Multi-select works: tapping a card toggles selection; confirm is disabled when nothing is selected | VERIFIED | Set<string> state with toggleTable(); `disabled={selectedIds.size === 0}` on confirm button (lines 60–67, 126) |
| 8  | Confirming calls initMerge(primaryTableId, selectedIds) and then onMergeConfirmed() | VERIFIED | handleConfirm(): `initMerge(primaryTableId, [...selectedIds])` then `onMergeConfirmed()` then `onClose()` (lines 54–58) |
| 9  | Body scroll lock while open; sheet resets selection state on every open | VERIFIED | Two useEffects: open-gated selection reset and body scroll lock with cleanup (lines 31–44) |
| 10 | Secondary table tile shows 'Merged→T[X]' indigo badge in the top-right slot | VERIFIED | showMergeBadge ternary slot renders Badge with `bg-status-merged-bg text-status-merged` and `Merged→{primaryLabel}` (TableTile.tsx lines 98–102) |
| 11 | Tapping a secondary table tile navigates to primary's /payment/[primaryTableId] — bottom sheet does NOT open | VERIFIED | onClick override: `if (isMergedSecondary && primaryTableId) { router.push('/payment/'+primaryTableId); return }` (TableTile.tsx lines 60–64) |
| 12 | TotalsSection shows 'Merge Bill' button; Split Bill is hidden when a merge is active | VERIFIED | `{!isMergeActive && <Button>Split Bill</Button>}` removes it from DOM; Merge Bill always rendered but `disabled={isMergeActive}` (TotalsSection.tsx lines 107–116) |
| 13 | Payment page groups items by source table with section headers and per-group Dissolve Merge button when merge is active | VERIFIED | tableOrders computed; `isMerged && tableOrders` conditional renders grouped sections each with Dissolve Merge button (page.tsx lines 99–110, 218–245) |
| 14 | Combined subtotal/VAT/grandTotal computed from all merged tables' flat items (VAT applied once) | VERIFIED | billItems useMemo collects primary + secondary items; subtotal/vatAmount/grandTotal formulas read billItems unchanged (page.tsx lines 85–121) |
| 15 | MergeSheet opens from both TotalsSection and TableBottomSheet (Occupied + CheckRequested) | VERIFIED | TotalsSection: `onMergeBill={() => setMergeSheetOpen(true)}`; TableBottomSheet: Merge Bill button in both Occupied (line 196) and CheckRequested (line 209) sections |
| 16 | Dissolve Merge removes the merge group and returns to flat item display | VERIFIED | Dissolve Merge button: `onClick={() => dissolveAll(tableId)}`; dissolveAll removes all entries where value === primaryTableId (page.tsx line 227; bill.store.ts lines 176–181) |
| 17 | SplitSheet shows 'Revert to Single Bill' button; disabled with inline label when any seat is paid; confirm dialog on tap when no seats paid; calls cancelSplit + closes sheet on confirm | VERIFIED | Full Revert to Single Bill section present (SplitSheet.tsx lines 706–757): paidCount guard on disabled; confirm dialog with Keep Split / Revert buttons; cancelSplit call with toast and onClose |

**Score:** 17/17 automated truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/stores/bill.store.ts` | merges state + 5 new actions | VERIFIED | merges: Record<string, string> at line 31; all 5 actions implemented with correct set()/get() patterns |
| `src/app/globals.css` | --status-merged / --status-merged-bg tokens | VERIFIED | All 3 locations present; hue 270° in :root and .dark; @theme inline uses var() only |
| `src/components/table-map/MergeSheet.tsx` | Table picker bottom sheet for merge flow | VERIFIED | Exports MergeSheet; 144 lines; substantive implementation with full sheet structure, filtering logic, and confirm action |
| `src/components/table-map/TableTile.tsx` | merge badge + routing override for secondary tables | VERIFIED | isMergedSecondary subscription; router.push override; Badge ternary with status-merged tokens |
| `src/app/(app)/payment/[tableId]/page.tsx` | grouped items render + MergeSheet wiring | VERIFIED | getMergedSecondaries via stable merges selector + useMemo; grouped tableOrders render; dissolveAll wired; MergeSheet rendered |
| `src/components/payment/SplitSheet.tsx` | Revert to Single Bill with paidCount guard | VERIFIED | "Revert to Single Bill" text at line 719; paidCount at component level (line 57); confirm dialog at lines 728–754 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| bill.store.ts | merges map | initMerge/dissolveAll set() calls | WIRED | initMerge: `set((state) => ({ merges: { ...state.merges, ...Object.fromEntries(...) } }))`; dissolveAll: `set((state) => ({ merges: Object.fromEntries(filter) }))` |
| globals.css | @theme inline | --color-status-merged: var(--status-merged) | WIRED | Lines 81–82: `--color-status-merged: var(--status-merged); --color-status-merged-bg: var(--status-merged-bg)` |
| TableTile.tsx | /payment/[primaryTableId] | router.push when isMergedSecondary | WIRED | `router.push('/payment/'+primaryTableId)` with early return preventing onTap |
| payment/[tableId]/page.tsx | useBillStore.getMergedSecondaries | reactive subscription driving grouped render | WIRED | Uses `useBillStore((s) => s.merges)` + useMemo to derive mergedSecondaryIds (stable-reference pattern; avoids infinite render loop) |
| payment/[tableId]/page.tsx | dissolveAll | Dissolve Merge button onClick | WIRED | `onClick={() => dissolveAll(tableId)}` in each group section |
| SplitSheet.tsx | cancelSplit | Revert to Single Bill confirm | WIRED | `cancelSplit(tableId)` called in Revert button onClick at line 744 |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| MERGE-01 | 14-01, 14-02, 14-03 | Staff can merge bills across 2+ tables into a combined bill showing all items with correct totals; source tables link to merged bill | SATISFIED | Full pipeline: bill.store merges map (14-01) + MergeSheet picker (14-02) + TableTile badge/routing + grouped payment page + dual entry points (14-03) |
| MERGE-02 | 14-03 | Staff can unsplit previously separated seats back into a single bill before any seat is paid | SATISFIED (automated) / NEEDS HUMAN (flow) | SplitSheet Revert to Single Bill section present with paidCount guard, confirm dialog, and cancelSplit call. Full flow behavior requires browser verification. |

REQUIREMENTS.md notes MERGE-01 as `[x] Complete` and MERGE-02 as `[ ] Pending` (checkbox not yet checked). Both are mapped to Phase 14 in the traceability table. All Phase 14 requirement IDs are accounted for — no orphaned requirements.

---

## Anti-Patterns Found

No TODO/FIXME/PLACEHOLDER/console.log-only implementations were found in any phase 14 modified files. All implementations are substantive.

One notable design deviation (not a defect): the payment page uses `useBillStore((s) => s.merges)` + `useMemo` rather than `useBillStore((s) => s.getMergedSecondaries(tableId))` directly. This is a correct fix for an infinite render loop caused by `getMergedSecondaries` returning a new array reference on every render cycle. The WIP commit `a3002b4` documents this fix explicitly with a comment. The behavior is identical; the implementation is correct.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

---

## Human Verification Required

### 1. Merge flow end-to-end (MERGE-01)

**Test:** Log in as Waiter or Cashier. Open two tables (e.g. T1 and T2) with orders. On T1, tap TableBottomSheet > tap "Merge Bill" > MergeSheet opens > select T2 > tap Merge. Verify: T2 tile on floor plan shows indigo "Merged→T1" badge. Tap T2 tile — must navigate directly to T1 payment page with no bottom sheet. T1 payment page must show two grouped sections ("T1 — N guests" and "T2 — N guests"), each with a "Dissolve Merge" button. Grand total must equal the combined item total from both tables. Tap "Dissolve Merge" — items revert to flat list; T2 badge disappears.

**Expected:** Full merge lifecycle works without errors or visual glitches.

**Why human:** Badge rendering, routing interception, grouped layout, and combined total accuracy all require live browser interaction with real store state.

### 2. TotalsSection entry point + Split Bill visibility (MERGE-01)

**Test:** With an active merge on T1's payment page, scroll to the totals area. Verify "Split Bill" button is absent and "Merge Bill" button is present but greyed/disabled. Tap "Merge Bill" — should be inert (disabled). After dissolving the merge, verify "Split Bill" reappears and "Merge Bill" becomes active.

**Expected:** DOM conditionality matches the isMergeActive flag correctly in all states.

**Why human:** Conditional DOM visibility and disabled-state rendering require visual inspection.

### 3. Unsplit revert flow (MERGE-02)

**Test:** On any payment page, tap "Split Bill" > choose per-seat or equal split. Without paying any seat, scroll to the bottom of SplitSheet — "Revert to Single Bill" button should be enabled. Tap it — confirm dialog appears. Tap "Revert" — sheet closes, toast shows "Reverted to single bill", bill is back to single. Re-open SplitSheet, pay one seat, scroll to bottom — "Revert to Single Bill" should be disabled and "Cannot revert — 1 seat(s) already paid" label should appear below it.

**Expected:** State guards work correctly; confirm dialog appears only when no seats are paid; cancelSplit completes cleanly.

**Why human:** Multi-step stateful interaction cannot be verified by static code inspection alone.

---

## Gaps Summary

No gaps. All 17 automated must-haves are verified. All artifacts exist, are substantive, and are correctly wired. The phase is complete pending human verification of the three browser-testable flows listed above.

The REQUIREMENTS.md traceability table still shows MERGE-02 as `Pending` (unchecked checkbox). This is a documentation artifact — the implementation is present. The checkbox should be updated to `[x] Complete` when the human verify checkpoint is formally closed.

---

_Verified: 2026-03-13T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
