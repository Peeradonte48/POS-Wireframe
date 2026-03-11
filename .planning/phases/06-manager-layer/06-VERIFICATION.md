---
phase: 06-manager-layer
verified: 2026-03-11T08:00:00Z
status: human_needed
score: 15/15 automated must-haves verified
re_verification: false
human_verification:
  - test: "Login as Waiter (PIN 1234), open a shift — confirm that no Manager item appears in the sidebar"
    expected: "Sidebar shows Table Map, Orders, KDS, Payment only — Manager is absent"
    why_human: "AppSidebar renders null for manager slug when role !== 'Manager'; correct code confirmed, but visual absence requires a real browser session"
  - test: "Login as Manager (PIN 9999), open a shift — confirm Manager item IS visible in the sidebar"
    expected: "Manager nav item appears and links to /manager"
    why_human: "Same as above — role-based nav visibility is a visual confirmation"
  - test: "SHIFT-01: EOD Summary flow — place an order, pay with Cash, then as Manager open /manager, verify financial cards show non-zero numbers, type a closing-cash value, verify Over/Short variance updates live in green/red, click Close Shift, confirm dialog, verify Shift Closed banner appears and inputs are disabled, then click Logout"
    expected: "Non-zero revenue/VAT/Net Sales; variance is reactive; shift transitions to read-only; Logout returns to login screen"
    why_human: "Reactive state change (closingCash input -> variance display) and shift-close state transition require live interaction"
  - test: "SHIFT-02: Sales Snapshot tab — confirm 4 stat cards (Net Sales, VAT, Gross Revenue, Covers) display correct numbers, and Top Items list shows item names with 'X sold' count and no chart elements"
    expected: "Numbers match what was ordered; no bar/line/pie charts present"
    why_human: "Correctness of derived numbers and absence of chart elements requires visual inspection"
  - test: "SHIFT-03: 86'd Items tab — toggle an item to 86'd, navigate to an order screen, confirm item is greyed with 86'd badge and is not tappable; navigate back to /manager, confirm item is still checked (persist across navigation); uncheck and confirm it becomes tappable again"
    expected: "86'd state persists via Zustand persist middleware; MenuPanel reflects the state in real time"
    why_human: "Cross-screen state propagation with navigation requires browser interaction to confirm"
  - test: "SHIFT-04: Open Tickets tab — with at least one occupied table, confirm the row shows table label, waiter, pax, order stage badge, estimated total, elapsed time; tap the row and confirm navigation to /order/[tableId]; confirm Staff List section shows all 4 mock staff with role badges"
    expected: "Correct table data displayed; tap navigates correctly; all staff present"
    why_human: "Data binding from table/order stores and navigation on tap require browser verification"
---

# Phase 6: Manager Layer Verification Report

**Phase Goal:** Managers can close a shift with a full financial summary and perform operational overrides that staff cannot
**Verified:** 2026-03-11T08:00:00Z
**Status:** human_needed — all automated checks pass; 6 browser verification items remain
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | manager.store.ts exports useManagerStore with eightySixedIds, shiftClosed, toggleEightySix, closeShift, resetShift, isEightySixed | VERIFIED | File reads: all 6 members present in interface + implementation with persist middleware |
| 2 | TableRecord has paidAmount, paymentMethod, discountApplied fields | VERIFIED | table.store.ts lines 31-33; all three nullable fields on interface |
| 3 | PaymentPage.handleConfirmPayment writes paidAmount, paymentMethod, discountApplied to table record | VERIFIED | payment/[tableId]/page.tsx lines 82-86: third updateTable call with all three fields |
| 4 | AppSidebar hides manager nav item entirely for non-Manager roles | VERIFIED | AppSidebar.tsx line 61: `if (slug === 'manager' && role !== 'Manager') return null` |
| 5 | session.store logout calls resetShift | VERIFIED | session.store.ts line 37: `useManagerStore.getState().resetShift()` called before clearing state |
| 6 | Manager can navigate to /manager and see 4 tabs: EOD Summary, Sales Snapshot, 86'd Items, Open Tickets | VERIFIED | manager/page.tsx: 4 TabsTrigger + 4 TabsContent with correct values and components |
| 7 | EOD Summary tab derives financials from order.store + table.store (revenue, VAT, cover count, payment breakdown, discounts) | VERIFIED | EodSummaryTab.tsx lines 40-63: full useMemo derivation matching the specified algorithm |
| 8 | Cash reconciliation input computes variance reactively | VERIFIED | EodSummaryTab.tsx line 65: `variance = closingCash - (openingCash ?? 0) - cashTotal`; rendered with green/red conditional |
| 9 | Close Shift dialog transitions summary to read-only with Shift Closed banner and Logout button | VERIFIED | EodSummaryTab.tsx lines 69-91: shiftClosed banner, closeShift action in dialog confirm, Input disabled={shiftClosed} |
| 10 | Sales Snapshot tab shows 4 stat cards + top 5 items by quantity, no charts | VERIFIED | SalesSnapshotTab.tsx: grid of 4 StatCard components + top items list; no chart library imports |
| 11 | 86'd Items tab shows menu items grouped by category with checkbox toggles | VERIFIED | EightySixTab.tsx: MENU_CATEGORIES.map grouping with native checkbox per item |
| 12 | Toggling 86'd calls toggleEightySix; toggleing again removes it | VERIFIED | EightySixTab.tsx line 40: `onChange={() => toggleEightySix(item.id)`; store handles add/remove in set callback |
| 13 | On order screen, 86'd items appear greyed with badge and are not tappable | VERIFIED | MenuPanel.tsx lines 41-65: disabled={is86d}, onClick={is86d ? undefined : ...}, opacity-50 cursor-not-allowed, Badge rendered |
| 14 | Open Tickets tab shows occupied table rows tappable to /order/[tableId] plus staff list | VERIFIED | OpenTicketsTab.tsx: filters tables to status=Occupied, router.push on click, MOCK_STAFF map with role badges |
| 15 | npx tsc --noEmit passes with zero errors | VERIFIED | Ran tsc --noEmit: zero output = zero errors |

**Score:** 15/15 truths verified automatically

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/stores/manager.store.ts` | 86'd state + shiftClosed persisted | VERIFIED | 31 lines; all 6 store members; persist({ name: 'manager-store' }) |
| `src/stores/table.store.ts` | Extended TableRecord with payment capture fields | VERIFIED | paidAmount/paymentMethod/discountApplied on TableRecord; initialized null in openTable and markClean |
| `src/app/(app)/manager/page.tsx` | 4-tab manager dashboard page | VERIFIED | 28 lines; 4 tabs with correct values; imports all 4 tab components |
| `src/components/manager/EodSummaryTab.tsx` | EOD summary with close shift flow | VERIFIED | 149 lines; all 5 card sections; close shift dialog; shift closed banner |
| `src/components/manager/SalesSnapshotTab.tsx` | Sales snapshot numbers dashboard | VERIFIED | 74 lines; 4 StatCard + top items list; no charts |
| `src/components/manager/EightySixTab.tsx` | 86'd item toggle list grouped by category | VERIFIED | 63 lines; category grouping with useMemo; native checkbox per item |
| `src/components/manager/OpenTicketsTab.tsx` | Open tickets list + staff list | VERIFIED | 116 lines; occupiedTables filter; router.push on click; MOCK_STAFF with assignedTableIds |
| `src/components/order/MenuPanel.tsx` | Menu item render with 86'd state | VERIFIED | useManagerStore selector; disabled + badge per 86'd item |
| `src/components/app-shell/AppSidebar.tsx` | Manager nav hidden for non-Manager | VERIFIED | Line 61 early null return guard |
| `src/stores/session.store.ts` | logout calls resetShift | VERIFIED | Line 37: cross-store reset before clearing session state |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| PaymentPage | table.store.ts | updateTable with paidAmount in handleConfirmPayment | WIRED | payment/[tableId]/page.tsx line 82: `updateTable(tableId, { paidAmount: grandTotal, ... })` |
| session.store.ts | manager.store.ts | logout calls resetShift | WIRED | session.store.ts line 37: `useManagerStore.getState().resetShift()` |
| EodSummaryTab.tsx | order.store.ts | useOrderStore for revenue derivation | WIRED | Line 3 import + line 22 selector used in useMemo |
| EodSummaryTab.tsx | table.store.ts | useTableStore for paidAmount/paymentMethod/discountApplied | WIRED | Line 4 import + line 23 selector used in useMemo |
| EodSummaryTab.tsx | manager.store.ts | useManagerStore for closeShift + shiftClosed | WIRED | Line 6 import + line 25 destructure; used in render logic and dialog |
| EightySixTab.tsx | manager.store.ts | useManagerStore toggleEightySix + eightySixedIds | WIRED | Line 9: `const { eightySixedIds, toggleEightySix } = useManagerStore()` |
| MenuPanel.tsx | manager.store.ts | useManagerStore eightySixedIds read | WIRED | Line 16: selector `(s) => s.eightySixedIds`; used per-item in render |
| OpenTicketsTab.tsx | table.store.ts | useTableStore tables filtered to Occupied | WIRED | Line 19 selector; useMemo filters to status === 'Occupied' |
| OpenTicketsTab.tsx | order.store.ts | useOrderStore getOrder for estimated total | WIRED | Line 20 selector; used inline in occupiedTables.map |
| AppSidebar | /manager route | slug === 'manager' guard | WIRED | Line 61 returns null for non-Manager; Manager role proceeds through existing isAccessible/canAccess path |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SHIFT-01 | 06-01, 06-02, 06-04 | Manager can close shift and view EOD summary (revenue, payment breakdown, voids, discounts, net sales, cash reconciliation) | SATISFIED | EodSummaryTab.tsx: full derivation + close shift flow; all card sections present |
| SHIFT-02 | 06-02, 06-04 | Manager can view sales snapshot dashboard (revenue, covers, top items — numbers, not charts) | SATISFIED | SalesSnapshotTab.tsx: 4 stat cards + top items list; no chart library imports |
| SHIFT-03 | 06-01, 06-03, 06-04 | Manager can toggle item 86'd from within the Staff POS app | SATISFIED | EightySixTab.tsx toggles useManagerStore; MenuPanel.tsx reads eightySixedIds and disables items |
| SHIFT-04 | 06-03, 06-04 | Manager can view all open tickets across tables and a staff/user list | SATISFIED | OpenTicketsTab.tsx: occupiedTables list + MOCK_STAFF roster |

No orphaned requirements — all four SHIFT-01 through SHIFT-04 are claimed by plans and implemented.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| EodSummaryTab.tsx | 133 | `placeholder="0"` | Info | HTML input placeholder attribute — not a code stub |
| MenuPanel.tsx | 52 | `{/* Thumbnail placeholder */}` | Info | Comment labeling a UI thumbnail area — not a missing implementation |

No blocker or warning anti-patterns found. Both flagged items are benign.

---

## Human Verification Required

### 1. Manager nav visibility

**Test:** Login as Waiter (PIN 1234), open a shift, inspect the sidebar. Then login as Manager (PIN 9999), open a shift, inspect the sidebar.
**Expected:** Waiter sees no Manager item; Manager sees the Manager item as a live link.
**Why human:** Role-based conditional rendering verified in code; visual absence/presence requires a real browser session.

### 2. SHIFT-01 — EOD Summary interactive flow

**Test:** Place at least one order and confirm payment (Cash method). Login as Manager, navigate to /manager (EOD Summary tab is default). Type a value in Closing Cash, watch variance update. Click Close Shift, confirm in the dialog, verify the Shift Closed banner and Logout button appear, all inputs are disabled. Click Logout.
**Expected:** Non-zero financials; reactive variance (green for over, red for short); shift transitions to read-only; logout returns to login screen.
**Why human:** Reactive state change, dialog flow, and read-only transition require live user interaction.

### 3. SHIFT-02 — Sales Snapshot numbers

**Test:** Login as Manager, navigate to Sales Snapshot tab. Verify 4 stat cards show values that match what was ordered. Confirm no chart (bar, line, pie) elements exist.
**Expected:** Numbers are correct; page is purely numeric with no chart visualizations.
**Why human:** Correctness of derived numbers and absence of charts cannot be fully confirmed from static analysis.

### 4. SHIFT-03 — 86'd Items cross-screen persistence

**Test:** In 86'd Items tab, toggle one item to checked. Navigate to /table-map, open an order screen. Confirm the item is greyed with the 86'd badge and clicking it does nothing. Navigate back to /manager → 86'd Items and confirm the item is still checked. Uncheck it and return to the order screen to confirm it is tappable again.
**Expected:** Persist middleware keeps state across navigation; MenuPanel reflects 86'd state in real time.
**Why human:** Cross-navigation Zustand persist behavior requires a live browser session.

### 5. SHIFT-04 — Open Tickets tap and staff list

**Test:** With at least one occupied table, navigate to Open Tickets tab. Confirm the row displays table label, waiter name, pax count, order stage badge, estimated total, and elapsed time. Tap the row and confirm navigation to /order/[tableId]. Confirm the On Shift section lists all 4 mock staff with role badges.
**Expected:** All data fields visible; tap navigates correctly; all staff shown.
**Why human:** Data binding accuracy and navigation tap-target require browser interaction.

### 6. TypeScript and build integrity

**Test:** Run `npx tsc --noEmit && npx next build` in the project root.
**Expected:** Both commands exit 0 with zero errors.
**Why human:** Build was verified during Plan 04 execution but should be re-confirmed in the current codebase state before marking phase complete.

---

## Gaps Summary

No automated gaps. All 15 must-haves verified. The 6 human verification items above are browser-only confirmations — the correct code patterns are in place for every one of them. The phase is structurally complete; human sign-off completes the gate.

---

_Verified: 2026-03-11T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
