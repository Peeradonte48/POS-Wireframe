---
phase: 19-kds-differentiation-+-combo-flag
verified: 2026-03-15T14:37:03Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 19: KDS Differentiation + Combo Flag Verification Report

**Phase Goal:** Surface order type (dine-in, takeaway, delivery) and pack-to-go intent on every KDS ticket and in order entry, so kitchen staff can differentiate packaging without leaving the KDS screen.
**Verified:** 2026-03-15T14:37:03Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | OrderLineItem has `packToGo?: boolean` backward-compatible with existing persisted data | VERIFIED | `src/stores/order.store.ts` line 23: `packToGo?: boolean` after `quantity`, before `status` |
| 2 | `togglePackToGo` action in order.store toggles the flag immutably on the correct item | VERIFIED | Lines 203-218: follows exact immutable `rounds.map > items.map` pattern as `voidItem` |
| 3 | badge.tsx has `order-type-din`, `order-type-tkwy`, `order-type-dlvr` CVA variants alongside grab/lineman | VERIFIED | Lines 29-31 in `badge.tsx`; uses semantic `@theme inline` token classes, not raw OKLCH |
| 4 | Every KDS ticket header shows an order type badge between table label and stage badge | VERIFIED | `KdsTicketCard.tsx` lines 101-103: Badge with `getOrderTypeBadgeVariant` result, positioned between `tableLabel` and stage Badge |
| 5 | Items with `packToGo: true` show a PACK amber chip in the KDS item row | VERIFIED | `KdsItemRow.tsx` lines 71-75: `{item.packToGo && <span ...>PACK</span>}` using `bg-status-cooking-bg text-status-cooking` |
| 6 | KDS board has All / Dine-in / Takeaway / Delivery filter tabs with live counts | VERIFIED | `KdsBoard.tsx` lines 13-20: `CHANNEL_FILTERS` const; lines 36-44: `channelCounts` via `useMemo`; lines 82-97: tab row rendered |
| 7 | Selecting a filter tab hides tickets from other channels; empty columns show No tickets placeholder | VERIFIED | Lines 102-112: `stageTickets` applies `activeChannelFilter` second pass; lines 123-126: existing No tickets placeholder retained |
| 8 | Bag icon toggle appears on dine-in order entry item rows (sent + unsent); absent on takeaway/delivery | VERIFIED | `TicketLineItem.tsx` lines 103-116 (sent), 172-185 (unsent): guarded by `showPackToGo` prop; `TicketPanel.tsx` line 51: `isTakeaway = !!useQueueStore.getState().orders[tableId]`, passes `showPackToGo={!isTakeaway}` at line 144 |
| 9 | Tapping bag icon toggles `item.packToGo` via `togglePackToGo`; icon is amber when active, muted when not | VERIFIED | `TicketLineItem.tsx` lines 106-111: `cn(...)` switches between amber `text-status-cooking bg-status-cooking-bg` (active) and muted (inactive) |
| 10 | Demo mode KDS tickets have mixed orderType and some items have `packToGo: true` | VERIFIED | `kds-demo.ts` lines 36-47: weighted 60/25/15 distribution; line 60: `packToGo: orderType === 'dine-in' && Math.random() < 0.30`; lines 65-74: `orderType`/`platform` in returned ticket |

**Score:** 10/10 truths verified

---

## Required Artifacts

| Artifact | Plan | Expected | Status | Details |
|----------|------|----------|--------|---------|
| `src/stores/order.store.ts` | 19-01 | `packToGo` field + `togglePackToGo` action | VERIFIED | Lines 23, 47, 203-218 |
| `src/components/ui/badge.tsx` | 19-01 | `order-type-din`, `order-type-tkwy`, `order-type-dlvr` CVA variants | VERIFIED | Lines 29-31; semantic tokens only |
| `src/components/kds/KdsTicketCard.tsx` | 19-02 | `getOrderTypeBadgeVariant` helper + badge in header | VERIFIED | Lines 20-44 (helpers), 101-103 (JSX usage) |
| `src/components/kds/KdsItemRow.tsx` | 19-02 | PACK chip on `packToGo` items | VERIFIED | Lines 71-75 |
| `src/components/kds/KdsBoard.tsx` | 19-02 | Channel filter tabs + `activeChannelFilter` state | VERIFIED | Lines 13-20 (consts), 33-44 (state + counts), 82-112 (render + filter) |
| `src/components/order/TicketLineItem.tsx` | 19-03 | `showPackToGo` prop + bag icon toggle | VERIFIED | Lines 48-49 (props), 103-116 (sent), 172-185 (unsent) |
| `src/components/order/TicketPanel.tsx` | 19-03 | `isTakeaway` detection + `showPackToGo` pass-through | VERIFIED | Lines 10, 45, 51, 144-145 |
| `src/lib/mock-data/kds-demo.ts` | 19-03 | Mixed `orderType`/`platform` + `packToGo` on demo items | VERIFIED | Lines 36-74 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/stores/order.store.ts` | `src/components/kds/KdsItemRow.tsx` | `OrderLineItem.packToGo` read from item prop | VERIFIED | `KdsItemRow.tsx` line 71 reads `item.packToGo` directly; `OrderLineItem` imported from `order.store` |
| `src/components/ui/badge.tsx` | `src/components/kds/KdsTicketCard.tsx` | Badge variant prop with `order-type-*` string | VERIFIED | `KdsTicketCard.tsx` line 101: `variant={getOrderTypeBadgeVariant(...) as Parameters<typeof Badge>[0]['variant']}` |
| `src/components/kds/KdsBoard.tsx` | `src/components/kds/KdsTicketCard.tsx` | `ticket` prop passes `orderType` + `platform` through | VERIFIED | `KdsBoard.tsx` line 130: `<KdsTicketCard ticket={ticket} ...>`; `KdsTicket` type carries `orderType` and `platform` |
| `src/components/kds/KdsBoard.tsx` | `activeChannelFilter` | `useState` filter applied to `stageTickets` before render | VERIFIED | Lines 33, 105-107: filter second-pass using `effectiveType !== activeChannelFilter` |
| `src/components/order/TicketPanel.tsx` | `src/stores/queue.store.ts` | `useQueueStore.getState().orders[tableId]` non-reactive read | VERIFIED | Line 51: `const isTakeaway = !!useQueueStore.getState().orders[tableId]`; `useQueueStore` imported line 10 |
| `src/components/order/TicketLineItem.tsx` | `src/stores/order.store.ts` | `onTogglePackToGo` callback calls `togglePackToGo(tableId, lineId)` | VERIFIED | `TicketPanel.tsx` line 145: `onTogglePackToGo={(lineId) => togglePackToGo(tableId, lineId)}`; `togglePackToGo` destructured from `useOrderStore()` at line 45 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| UI-01 | 19-01 | Delivery platform colors (Grab green, LINE MAN blue) as OKLCH design tokens and CVA badge variants | VERIFIED | `globals.css` lines 162-164, 236-239: OKLCH tokens for both light and dark mode; `badge.tsx` lines 27-28: grab/lineman CVA variants using `var(--platform-grab-bg)` etc. |
| KDS-01 | 19-01, 19-02 | KDS tickets show order type badge (Dine-in / Takeaway / Delivery + platform) | VERIFIED | `KdsTicketCard.tsx` helpers + header Badge render all five cases: DIN, TKWY, GRAB, LINE MAN, DLVR |
| KDS-02 | 19-02 | KDS board can be filtered by order type (All / Dine-in / Takeaway / Delivery) | VERIFIED | `KdsBoard.tsx` channel filter tab row + `stageTickets` second-pass filter |
| COMBO-01 | 19-03 | Staff can flag individual items on a dine-in order as "pack to go" | VERIFIED | Bag icon toggle in `TicketLineItem.tsx` on both sent/unsent rows; dine-in only via `showPackToGo={!isTakeaway}` in `TicketPanel.tsx` |
| COMBO-02 | 19-02 | KDS tickets show a "PACK" indicator on flagged items | VERIFIED | `KdsItemRow.tsx` lines 71-75: PACK amber chip conditional on `item.packToGo` |

All 5 phase-19 requirements are satisfied. No orphaned requirements detected — REQUIREMENTS.md traceability table maps all 5 to Phase 19 and marks them Complete.

---

## Anti-Patterns Found

No blockers or stubs detected across the 8 modified files. Specific checks:

| File | Check | Result |
|------|-------|--------|
| `order.store.ts` | `togglePackToGo` returns state (not `{}` or `null`) | Clean — returns new `orders` map |
| `KdsTicketCard.tsx` | `getOrderTypeBadgeVariant` handles all branches (delivery no-platform, takeaway, dine-in/undefined) | Clean — all 5 cases covered |
| `KdsBoard.tsx` | `channelCounts` inside `useMemo`, not selector | Clean — follows CLAUDE.md infinite-loop prevention |
| `KdsBoard.tsx` | `effectiveType ?? 'dine-in'` fallback for legacy undefined `orderType` | Clean — undefined tickets count as dine-in |
| `TicketPanel.tsx` | `isTakeaway` via `getState()` (non-reactive) | Clean — matches CLAUDE.md non-reactive read pattern |
| `kds-demo.ts` | `orderType` declared before item map, used inside map | Clean — single-pass factory, no extra state |
| `badge.tsx` | `order-type-*` variants use semantic tokens, not raw OKLCH | Clean — `bg-status-ordered-bg` etc. |
| `globals.css` | Platform tokens defined in both `:root` and `.dark` | Clean — independent OKLCH values per mode |

---

## Build Verification

`npm run build` passes with zero TypeScript errors. All 11 routes compile. No new lint errors introduced by Phase 19 (pre-existing 9 lint errors from prior phases documented in `deferred-items.md`).

---

## Human Verification Required

### 1. Bag Icon Visual Toggle State

**Test:** Open a dine-in table in order entry. Add an item. Tap the bag icon on the item row.
**Expected:** Icon background changes from muted to amber. Tap again — returns to muted.
**Why human:** Visual color state change cannot be verified programmatically from source alone.

### 2. KDS Filter Tab Live Counts

**Test:** Go to `/kds`, enable Demo Mode. Watch several tickets appear. Observe the tab labels.
**Expected:** All (N), Dine-in (n), Takeaway (n), Delivery (n) counts update as tickets inject. Select Dine-in — only DIN-badged tickets remain visible.
**Why human:** Dynamic count updates and filter interaction require live browser session.

### 3. PACK Chip Visibility in Demo Mode

**Test:** In KDS Demo Mode, wait for several dine-in tickets. Inspect item rows.
**Expected:** Roughly 30% of dine-in ticket items show an amber "PACK" chip below the modifier summary.
**Why human:** Probabilistic — requires live session with enough tickets to observe distribution.

### 4. Takeaway Order Entry — No Bag Icon

**Test:** Navigate to a takeaway order entry page (create via TakeawayPanel).
**Expected:** No bag icon appears on any item row, neither sent nor unsent.
**Why human:** Requires creating a real takeaway order in the running app to confirm `isTakeaway` detection works end-to-end.

---

## Commit Verification

All 6 feature commits referenced in SUMMARYs confirmed present in git log:

| Commit | Description |
|--------|-------------|
| `d456cd6` | feat(19-01): extend OrderLineItem with packToGo field and togglePackToGo action |
| `e2af214` | feat(19-01): add order-type-din, order-type-tkwy, order-type-dlvr badge CVA variants |
| `11db26c` | feat(19-02): order type badge in KdsTicketCard + PACK chip in KdsItemRow |
| `3ee6583` | feat(19-02): channel filter tabs in KdsBoard |
| `4039b13` | feat(19-03): pack-to-go bag toggle in TicketLineItem + TicketPanel wiring |
| `0c7b5d2` | feat(19-03): mixed-channel demo tickets with PACK badges in kds-demo.ts |

---

_Verified: 2026-03-15T14:37:03Z_
_Verifier: Claude (gsd-verifier)_
