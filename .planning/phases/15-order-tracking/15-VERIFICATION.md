---
phase: 15-order-tracking
verified: 2026-03-13T04:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 15: Order Tracking Verification Report

**Phase Goal:** Add real-time digital order tracking — live order stage badge on table tiles + per-item timeline detail view with escalation highlighting
**Verified:** 2026-03-13T04:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Color utilities bg-status-ordered, text-status-ordered (and cooking/ready/escalated) resolve correctly in both light and dark mode | VERIFIED | globals.css lines 85-92 (@theme inline var() refs), lines 146-153 (:root OKLCH values), lines 214-221 (.dark independently tuned values) |
| 2  | Badge component accepts variant='ordered', 'cooking', 'ready', 'escalated' without TypeScript error | VERIFIED | badge.tsx lines 23-26 — all 4 CVA variants present; `npm run build` exits 0 |
| 3  | Dark mode token values are independently tuned OKLCH (not opacity reductions of light values) | VERIFIED | .dark block has distinct lightness/chroma values (e.g. ordered: 0.70 vs light 0.50; bg: 0.22 vs 0.95) — not opacity variants |
| 4  | TableTile shows a color-coded stage badge (blue/amber/green/gray) for Occupied and CheckRequested tables with non-null orderStage | VERIFIED | TableTile.tsx lines 137-143 — badge conditioned on `table.status === 'Occupied' \|\| table.status === 'CheckRequested'` and `table.orderStage !== null`; uses `STAGE_VARIANT[table.orderStage]` |
| 5  | If any sent round for the table is older than 15 minutes, the badge overrides to the 'escalated' (red) variant | VERIFIED | TableTile.tsx lines 70-80 — `isEscalated` useMemo checks `order.rounds.filter(sentAt !== null).some(r => isRoundEscalated(r.sentAt))`; line 139: `variant={isEscalated ? 'escalated' : STAGE_VARIANT[table.orderStage]}` |
| 6  | TableTile badge priority is unchanged: split > merge > orderStage (escalated or color-coded) | VERIFIED | TableTile.tsx lines 125-144 — ternary: `showSplitBadge ? ... : showMergeBadge ? ... : table.orderStage !== null && (Occupied\|CheckRequested) ? ...` |
| 7  | The escalation check does not cause a getSnapshot infinite loop — raw Record selectors + useMemo only | VERIFIED | TableTile.tsx lines 67-68: `useKdsStore((s) => s.tickets)` and `useOrderStore((s) => s.orders)` — stable Record refs; derivation done in useMemo at line 70 |
| 8  | Tapping an Occupied or CheckRequested table opens a bottom sheet with two tabs: 'Actions' and 'Timeline' | VERIFIED | TableBottomSheet.tsx lines 118-235 (Occupied) and lines 237-283 (CheckRequested) — both sections have identical two-button tab bars |
| 9  | Timeline tab shows items grouped by round with stage dot, item name, and elapsed minutes since sent | VERIFIED | OrderTimeline.tsx — RoundSection renders round header + visibleItems map with stage dot span (STAGE_DOT_CLASS), item name, elapsed from useSentTimer |
| 10 | Escalated rounds (>15 min) show red row background tint + red elapsed text; escalation summary banner lists delayed items | VERIFIED | OrderTimeline.tsx lines 47-49: `escalated ? 'bg-status-escalated-bg/40' : ''`; lines 59-61: `escalated ? 'text-status-escalated' : 'text-muted-foreground'`; lines 119-131: escalation summary banner |

**Score:** 10/10 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/globals.css` | 4 new token pairs in :root, .dark, and @theme inline | VERIFIED | 8 entries in @theme inline (var() refs only, lines 85-92); 8 in :root (lines 146-153); 8 in .dark (lines 214-221) |
| `src/components/ui/badge.tsx` | 4 new CVA variants: ordered, cooking, ready, escalated | VERIFIED | Lines 23-26 — all 4 variants follow the `settled` class pattern; exports Badge and badgeVariants |
| `src/lib/order-tracking.ts` | deriveRoundStage, isRoundEscalated, ESCALATION_THRESHOLD_MS exports | VERIFIED | 33-line pure TypeScript module, all 3 exports present; no React imports; null guard on sentAt |
| `src/components/table-map/useSentTimer.ts` | 60-second tick hook returning elapsed minutes | VERIFIED | 20-line hook, setInterval(60_000), clearInterval cleanup, returns 0 for null sentAt, Math.floor minutes |
| `src/components/table-map/TableTile.tsx` | Color-coded badge with escalation override, STAGE_VARIANT map | VERIFIED | STAGE_VARIANT map at lines 39-45; isEscalated useMemo at lines 70-80; color-coded badge branch at lines 137-143 |
| `src/components/table-map/OrderTimeline.tsx` | OrderTimeline export, RoundSection sub-component, escalation banner | VERIFIED | 135 lines; exports OrderTimeline; RoundSection calls useSentTimer at component scope (not in map loop); escalation banner at lines 119-131 |
| `src/components/table-map/TableBottomSheet.tsx` | Two-tab layout for Occupied/CheckRequested, tab reset on table change | VERIFIED | activeTab state at line 38; tab reset useEffect at lines 49-51; tab bar + OrderTimeline wired for both Occupied (lines 118-235) and CheckRequested (lines 237-283) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/globals.css` (@theme inline) | `src/app/globals.css` (:root / .dark) | `var(--status-ordered)` references | WIRED | Lines 85-92 use `var(--status-ordered)` etc.; raw values defined in :root lines 146-153 and .dark lines 214-221 |
| `src/components/ui/badge.tsx` | `src/app/globals.css` | `bg-status-ordered-bg`, `text-status-ordered` utility classes | WIRED | badge.tsx lines 23-26 reference the Tailwind utility classes generated from @theme inline tokens |
| `src/components/table-map/TableTile.tsx` | `src/lib/order-tracking.ts` | `import { isRoundEscalated }` | WIRED | TableTile.tsx line 20: `import { isRoundEscalated } from '@/lib/order-tracking'`; used at line 79 |
| `src/components/table-map/TableTile.tsx` | `src/stores/kds.store` | `useKdsStore((s) => s.tickets)` | WIRED | TableTile.tsx line 67: stable Record selector; used in isEscalated useMemo deps at line 80 |
| `src/components/table-map/TableTile.tsx` | `src/components/ui/badge.tsx` | `variant={isEscalated ? 'escalated' : STAGE_VARIANT[table.orderStage]}` | WIRED | TableTile.tsx line 139: STAGE_VARIANT lookup used as variant prop on Badge |
| `src/components/table-map/TableBottomSheet.tsx` | `src/components/table-map/OrderTimeline.tsx` | `<OrderTimeline tableId={table.id} />` when `activeTab === 'timeline'` | WIRED | TableBottomSheet.tsx line 16: import; lines 231-233 (Occupied) and lines 279-281 (CheckRequested): render |
| `src/components/table-map/OrderTimeline.tsx` | `src/lib/order-tracking.ts` | `deriveRoundStage`, `isRoundEscalated`, `ESCALATION_THRESHOLD_MS` | WIRED | OrderTimeline.tsx line 6: imports `deriveRoundStage` and `isRoundEscalated`; used at lines 89 and 95 |
| `src/components/table-map/OrderTimeline.tsx` | `src/components/table-map/useSentTimer.ts` | `useSentTimer(round.sentAt)` inside RoundSection | WIRED | OrderTimeline.tsx line 7: `import { useSentTimer } from './useSentTimer'`; called at line 27 inside RoundSection (component scope, not loop) |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TRACK-01 | 15-01, 15-02 | Table tile shows live order stage badge (Ordered/Cooking/Ready/Served) derived from KDS + order store state | SATISFIED | STAGE_VARIANT map in TableTile.tsx maps OrderStage to badge variant; badge derived from `table.orderStage` (set by KDS bump flow) |
| TRACK-02 | 15-03 | Tapping a table's order shows per-item timeline with timestamp trail | SATISFIED | OrderTimeline.tsx renders round-grouped items with sentAt timestamp in round header, elapsed minutes per item via useSentTimer |
| TRACK-03 | 15-01, 15-02, 15-03 | Items exceeding 15-minute time threshold show visual escalation warning on both table tile and timeline view | SATISFIED | Table tile: `isEscalated` useMemo + `variant="escalated"` in TableTile.tsx; Timeline: red row tint + red elapsed text + escalation summary banner in OrderTimeline.tsx |

No orphaned requirements — all three TRACK IDs appear in plan frontmatter and are accounted for by implemented code.

---

### Anti-Patterns Found

None. All five modified/created files are clean:
- No TODO/FIXME/PLACEHOLDER comments
- No stub returns (null, empty array, empty object)
- No console.log-only implementations
- No plain `variant="outline"` for orderStage badge (removed as planned)
- No literal OKLCH values in the `@theme inline` block

The two occurrences of `placeholder=` in TableBottomSheet.tsx are HTML input placeholder attributes, not stub markers.

---

### Human Verification Required

The following behaviors cannot be verified programmatically and require manual testing:

#### 1. Color-coded badge updates as KDS stage changes

**Test:** Log in as Waiter, open a table, add an order item, send the round. Return to floor plan. Bump the KDS ticket through New → InProgress → Ready → off board.
**Expected:** Table tile badge cycles: blue "Ordered" → amber "Cooking" → green "Ready" → gray "Served"
**Why human:** KDS bump triggers a cross-store state update; badge color re-render requires a live browser session with Zustand reactivity.

#### 2. Escalation badge visual appearance

**Test:** With a sent round, manually patch `sentAt` to `Date.now() - 16*60*1000` via browser console. Observe the table tile.
**Expected:** Badge turns red and displays "Ordered" (or current stage) in escalated (red/crimson) color.
**Why human:** Time manipulation required; color fidelity of OKLCH values needs visual confirmation.

#### 3. Timeline tab content and layout

**Test:** Tap an Occupied table with a sent order. Switch to the Timeline tab.
**Expected:** Items appear grouped by "Round 1 · HH:mm", each row shows colored dot + item name + elapsed minutes. Tab bar underline indicator animates between Actions/Timeline.
**Why human:** Visual layout, tab indicator appearance, and round header time formatting need visual confirmation.

#### 4. Escalation row tint and summary banner

**Test:** With escalated sentAt (>15 min ago), open Timeline tab.
**Expected:** Affected item rows show faint red/pink background tint; elapsed time text is red; escalation summary banner at bottom shows "Delayed: [ItemName] — N min in [Stage]".
**Why human:** Color tint visibility (bg-status-escalated-bg/40 opacity) and banner text formatting need visual confirmation.

#### 5. Tab reset on table change

**Test:** Tap Table A, switch to Timeline tab, close sheet, tap Table B.
**Expected:** Bottom sheet for Table B opens with the Actions tab active (not Timeline).
**Why human:** useState reset behavior with useEffect needs runtime observation.

---

### Build Verification

`npm run build` — exits 0. All TypeScript types resolve correctly. No new errors introduced by Phase 15 changes.

Pre-existing lint errors (8 ESLint errors in unrelated files: payment page, kds timer, modifier sheet, merge sheet, open table modal, table bottom sheet, dwell timer) are documented in `deferred-items.md` and predate Phase 15.

---

## Summary

Phase 15 goal is fully achieved. All 10 observable truths are verified against actual codebase content — no stubs, no orphaned artifacts, no broken wiring.

The implementation is structurally complete and correct:
- Token foundations (Plan 01): All 4 token pairs in all 3 CSS blocks; 4 CVA badge variants live in badge.tsx
- Table tile badge (Plan 02): STAGE_VARIANT lookup, cross-store escalation useMemo using stable Record selectors, color-coded badge with escalation override — all wired and substantive
- Timeline + tab bar (Plan 03): OrderTimeline is a full implementation (not a stub), RoundSection correctly isolates useSentTimer from map loops, TableBottomSheet tab bar wired for both Occupied and CheckRequested, tab resets on table change

Five items remain for human visual confirmation (color fidelity, layout, interactive behavior) but all automated checks pass.

---

_Verified: 2026-03-13T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
