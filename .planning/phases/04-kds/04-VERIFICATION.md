---
phase: 04-kds
verified: 2026-03-11T05:00:00Z
status: human_needed
score: 9/9 automated must-haves verified
human_verification:
  - test: "Kitchen role redirects to /kds, skipping shift-open and AppShell"
    expected: "Log in with Kitchen role at /login → immediate redirect to /kds with no AppShell sidebar or top nav visible; three columns (NEW / IN PROGRESS / READY) fill the full screen"
    why_human: "Route redirect behavior and visual absence of AppShell chrome cannot be verified programmatically"
  - test: "BUMP advances ticket stage New → In Progress → Ready → Done with recall"
    expected: "Waiter sends an order on T01; KDS shows ticket in NEW column with ticking MM:SS timer (green). Tap BUMP → moves to IN PROGRESS, checkboxes become interactive. Check all items, tap BUMP → READY. Tap BUMP once more → ticket disappears from board and appears as a pill in recall tray. Tap pill → ticket restores to READY column."
    why_human: "Stage transition, checkbox gate, and recall tray restore are interactive UI flows requiring browser interaction"
  - test: "MM:SS timer ticks and changes color at thresholds"
    expected: "Timer shows elapsed time and ticks each second; text is green below 10 min, turns amber at 10 min (600s), turns red at 15 min (900s)"
    why_human: "Requires watching the timer update live and waiting for threshold crossings"
  - test: "Allergy badge and voided item display on KDS ticket"
    expected: "Item with specialRequest shows orange ALLERGY badge + request text. Voided item shows struck-through name + VOID badge (muted, no checkbox)"
    why_human: "Requires creating test orders with special requests and post-send voids in a Waiter session, then observing the KDS"
  - test: "Demo mode auto-injects tickets at 8-12 second cadence"
    expected: "Tap 'Demo Mode' button → amber DEMO badge appears. Wait 30 seconds → at least 2 new demo tickets appear automatically in the NEW column with item rows. Tap 'Demo Mode' again → injection stops; existing demo tickets remain and can be bumped/recalled like real tickets."
    why_human: "Requires real-time observation of timed ticket injection; cannot be verified with static grep"
---

# Phase 4: KDS Verification Report

**Phase Goal:** Kitchen staff can view, action, and clear tickets on a full-screen display that auto-populates with new orders in demo mode
**Verified:** 2026-03-11T05:00:00Z
**Status:** human_needed — all automated checks passed; 5 items require browser verification
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All truths are derived from the three plan `must_haves` blocks (Plans 01, 02, 03).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Kitchen role logs in and is redirected directly to /kds — not to shift-open or AppShell | ? HUMAN NEEDED | `(app)/layout.tsx` line 17-19: `role === 'Kitchen'` → `router.replace('/kds')` before shiftOpen check; line 27: `if (!role \|\| role === 'Kitchen') return null` prevents AppShell flash |
| 2 | The /kds route renders without AppShell sidebar or top nav header | ? HUMAN NEEDED | `(kds)/layout.tsx` is a standalone server component rendering only `<div h-screen w-screen>` with no AppShell import; confirmed by visual inspection of file (10 lines, zero AppShell references) |
| 3 | Kitchen staff see a ticking MM:SS timer on each ticket showing time since order placed | ? HUMAN NEEDED | `useKdsTimer.ts`: `setInterval` ticking `Date.now()` every 1000ms; `display` returns `MM:SS` format; `KdsTicketCard.tsx` line 42: `{display}` rendered with color class |
| 4 | Kitchen staff see three columns (New / In Progress / Ready) on a high-contrast full-screen board | ? HUMAN NEEDED | `KdsBoard.tsx`: `STAGES` array drives three columns; each column has `overflow-y-auto` scroll; `kds/page.tsx` wraps board in `flex flex-1 overflow-hidden` |
| 5 | Each ticket card shows table label, MM:SS elapsed timer (color-coded green/amber/red), item rows with modifier summary | ? HUMAN NEEDED | `KdsTicketCard.tsx`: `timerColorClass` uses 600s/900s thresholds (lines 18-23); `KdsItemRow.tsx`: modifier summary built from `modifiers[0].optionLabel` + `Spice N` + remaining modifiers joined with ` • ` |
| 6 | Tapping BUMP advances the ticket stage: New → In Progress → Ready → Done (removed from board) | ? HUMAN NEEDED | `kds.store.ts` `bumpTicket` action: New→InProgress→Ready→recallTray (lines 76-106); `KdsTicketCard.tsx` BUMP button calls `bumpTicket(ticket.ticketId)` (line 65); BUMP blocked from InProgress until all items checked (line 35) |
| 7 | Voided items appear struck-through with a VOID badge; allergy items show orange ALLERGY badge | ? HUMAN NEEDED | `KdsItemRow.tsx` lines 35-49: voided branch renders `line-through text-muted-foreground/40` + VOID badge; lines 69-78: `specialRequest` renders orange ALLERGY badge |
| 8 | Recently bumped tickets appear in recall tray; tapping one restores it to Ready | ? HUMAN NEEDED | `KdsRecallTray.tsx`: reads `recallTray` from store; pill button `onClick={() => recallTicket(entry.ticket.ticketId)}` restores to Ready (line 24); `kds.store.ts` `recallTicket` action restores with `stage: 'Ready'` (line 147) |
| 9 | Demo mode injects new mock tickets every 8-12s when active; DEMO badge visible; stops on toggle-off | ? HUMAN NEEDED | `kds/page.tsx` lines 27-45: `setTimeout` re-schedule loop inside `useEffect([demoActive])`, calls `injectDemoTicket(mockTicket)`, clears on unmount/toggle-off; `kds-demo.ts`: `buildMockDemoTicket()` picks 1-3 random MENU_ITEMS; DEMO badge renders when `demoActive` (line 56) |

**Score:** 9/9 automated structural checks pass. All truths require browser verification for behavioral confirmation.

---

## Required Artifacts

| Artifact | Status | Evidence |
|----------|--------|----------|
| `src/stores/kds.store.ts` | VERIFIED | 163 lines; exports `KdsStage`, `KdsTicket`, `RecalledTicket`, `useKdsStore` with all 8 actions; full state machine (New→InProgress→Ready→recallTray); Set immutability maintained |
| `src/components/kds/useKdsTimer.ts` | VERIFIED | 33 lines; `setInterval` 1000ms ticking; returns `{ display: MM:SS, elapsedSeconds }`; cleanup via `clearInterval` |
| `src/app/(kds)/layout.tsx` | VERIFIED | 10 lines; server component; no AppShell import; renders only `<div h-screen w-screen>` children |
| `src/app/(kds)/kds/page.tsx` | VERIFIED | 79 lines; auth guard useEffect; demo injection useEffect with setTimeout re-schedule; wires `KdsBoard` + `KdsRecallTray`; DEMO badge + toggle button |
| `src/app/(app)/layout.tsx` | VERIFIED | 30 lines; Kitchen redirect before shiftOpen check (line 17-19); null guard includes Kitchen (line 27) |
| `src/components/kds/KdsBoard.tsx` | VERIFIED | 85 lines; three-column grid via `STAGES` map; auto-registers tickets in `useEffect`; fallback to `getDemoOrderItems` for demo tickets |
| `src/components/kds/KdsTicketCard.tsx` | VERIFIED | 78 lines; timer with color thresholds; checkbox gate (`checkboxesActive = ticket.stage === 'InProgress'`); BUMP guard (`bumpBlocked`); BUMP shows progress count when blocked |
| `src/components/kds/KdsItemRow.tsx` | VERIFIED | 83 lines; voided branch (struck-through + VOID badge); active branch (checkbox + modifier summary); allergy branch (orange ALLERGY badge + specialRequest text) |
| `src/components/kds/KdsRecallTray.tsx` | VERIFIED | 32 lines; empty state strip; populated state with pill buttons; `recallTicket()` on click |
| `src/lib/mock-data/kds-demo.ts` | VERIFIED | 63 lines; `buildMockDemoTicket()` picks 1-3 random MENU_ITEMS; module-level `demoItemsMap`; `getDemoOrderItems()` fallback |

---

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `(app)/layout.tsx` | `/kds` | `router.replace('/kds')` when `role === 'Kitchen'` | WIRED | Lines 17-19: branch fires before `shiftOpen` check |
| `kds/page.tsx` | `useSessionStore` | `useEffect` auth guard redirects to `/login` when role is null | WIRED | Lines 17-24: `if (role === null) router.replace('/login')` |
| `KdsBoard.tsx` | `useOrderStore` | reads `orders` record to derive tables with sent items | WIRED | Line 18: `const allOrders = useOrderStore((s) => s.orders)` |
| `KdsBoard.tsx` | `useKdsStore` | reads `tickets`; calls `addTicket` for new tables in `useEffect` | WIRED | Lines 19, 24-38: `useEffect` compares order store tables to `tickets`, calls `addTicket` |
| `KdsTicketCard.tsx` | `useKdsStore.bumpTicket` | BUMP button `onClick` calls `bumpTicket(ticket.ticketId)` | WIRED | Line 65: `onClick={() => !bumpBlocked && bumpTicket(ticket.ticketId)}` |
| `kds/page.tsx` | `KdsBoard + KdsRecallTray` | page renders real components (not scaffold) | WIRED | Lines 7-8 imports; lines 72, 76 render |
| `kds/page.tsx` | `useKdsStore.injectDemoTicket` | `setTimeout` re-schedule loop calls `injectDemoTicket` when `demoActive` | WIRED | Lines 27-45: `useEffect([demoActive, injectDemoTicket])`; `scheduleNext()` calls `injectDemoTicket(mockTicket)` |
| `kds-demo.ts` | `menu.ts` (MENU_ITEMS) | imports `MENU_ITEMS` to pick random items | WIRED | Line 1: `import { MENU_ITEMS } from '@/lib/mock-data/menu'`; used line 29 |
| `KdsBoard.tsx` | `kds-demo.ts` (getDemoOrderItems) | fallback for demo tickets not in order.store | WIRED | Line 9 import; line 49: `return getDemoOrderItems(ticket)` in else branch |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| KDS-01 | 04-01, 04-02 | Full-screen KDS, no sidebar, high-contrast, ticket columns (New / In Progress / Ready) | VERIFIED (automated) / HUMAN (visual) | `(kds)/layout.tsx` has no AppShell; `KdsBoard.tsx` renders three stage columns; auth redirect wired |
| KDS-02 | 04-01, 04-02 | Bump items/tickets, recall tickets, elapsed timer | VERIFIED (automated) / HUMAN (interactive) | `bumpTicket` state machine in store; `recallTicket` action; `useKdsTimer` hook wired into `KdsTicketCard` |
| KDS-03 | 04-02 | Allergy/special request flags and voided items visible on KDS tickets | VERIFIED (automated) / HUMAN (visual) | `KdsItemRow.tsx` has distinct voided and allergy branches with correct styling |
| KDS-04 | 04-03 | KDS auto-updates with mock tickets in demo mode | VERIFIED (automated) / HUMAN (timed) | `setTimeout` re-schedule loop in `kds/page.tsx`; `buildMockDemoTicket` factory; `injectDemoTicket` action |

**Note:** REQUIREMENTS.md entry for KDS-04 says "via setInterval" but implementation uses `setTimeout` re-schedule loop. This is an intentional improvement documented in the Plan 03 SUMMARY (better randomness, no drift). The observable behavior — auto-injection of mock tickets — is equivalent. No gap.

**Orphaned requirements check:** No additional KDS requirements appear in REQUIREMENTS.md beyond KDS-01 through KDS-04. All four are claimed and verified.

---

## Anti-Patterns Found

No anti-patterns detected across all 10 KDS files:
- Zero TODO/FIXME/HACK/PLACEHOLDER comments
- Zero empty stub implementations (`return null` in `kds/page.tsx` line 48 is a legitimate auth guard, not a stub)
- Zero console.log-only handlers
- All BUMP and checkbox interactions have real store dispatch calls

---

## Git Commit Verification

All 8 commits documented in SUMMARY files confirmed present in git history:

| Commit | Description |
|--------|-------------|
| `60a47dd` | feat(04-01): add kds.store.ts and useKdsTimer hook |
| `cec9219` | feat(04-01): KDS route group layout, page scaffold, Kitchen redirect |
| `dd998b2` | feat(04-02): KdsItemRow + KdsTicketCard components |
| `5876ca2` | feat(04-02): KdsBoard + KdsRecallTray + wire KDS page |
| `3ccb259` | feat(04-03): demo mode ticket injection with setTimeout re-schedule loop |
| `5b6d672` | fix(04-kds): move addTicket call into useEffect (render-phase mutation fix) |
| `19f3c1f` | feat(04-kds): checkboxes active only when ticket is InProgress |
| `f5c0aa4` | feat(04-kds): block BUMP from InProgress until all items checked |

---

## Human Verification Required

All automated structural checks pass. The following 5 items need browser verification to confirm the phase goal is fully achieved.

### 1. Full-Screen KDS Layout (KDS-01)

**Test:** Log in with Kitchen role via PIN at `/login`. Observe the redirect target and page layout.
**Expected:** Redirect goes directly to `/kds` with no shift-open screen; page shows no AppShell sidebar or top nav; three column labels (NEW / IN PROGRESS / READY) fill the full screen width; `h-screen` layout has no overflow.
**Why human:** Route redirect target and visual absence of sidebar chrome require browser observation.

### 2. Bump / Stage Transitions / Recall (KDS-02)

**Test:** In a second browser tab, log in as Waiter, open table T01, add a ramen item, send the order. Switch to KDS tab.
**Expected:** Ticket for T01 appears in NEW column automatically. BUMP moves it to IN PROGRESS (checkboxes activate). Checking all items enables the BUMP button; tapping moves ticket to READY. Final BUMP removes ticket from board and adds it as a pill in the recall tray. Tapping the pill restores the ticket to the READY column.
**Why human:** End-to-end state transitions and UI feedback (ring on BUMP button, checkbox gate) require interactive browser testing.

### 3. MM:SS Timer with Color Thresholds (KDS-02)

**Test:** Observe a ticket timer ticking on the KDS board.
**Expected:** Timer text updates every second. Color is green for tickets under 10 minutes, amber at 10 minutes (600s), red at 15 minutes (900s).
**Why human:** Requires real-time observation; color threshold crossing cannot be verified statically.

### 4. Allergy Badge and Void Display (KDS-03)

**Test:** As Waiter, add an item to T02 with specialRequest "No MSG — nut allergy" and send. Also add another item, send it, then void it via manager PIN override. Switch to KDS.
**Expected:** Allergy item shows orange ALLERGY badge with the request text. Voided item shows struck-through name and VOID badge (muted, no checkbox).
**Why human:** Requires creating specific test order conditions and visually confirming badge rendering.

### 5. Demo Mode Ticket Injection (KDS-04)

**Test:** On the KDS board, tap the "Demo Mode" button. Wait 30 seconds.
**Expected:** Amber DEMO badge appears immediately in the KDS header. At least 2–3 new demo tickets appear automatically in the NEW column with item rows and modifier summaries. Tapping "Demo Mode" again stops injection; existing demo tickets remain on board and can be bumped and recalled like real tickets.
**Why human:** Requires real-time observation of timed async injection; cannot be confirmed via static analysis.

---

## Summary

Phase 4 (KDS) implementation is structurally complete and correctly wired:

- All 10 files exist with substantive implementations (no stubs, no placeholders)
- All 9 key links verified: Kitchen redirect, auth guard, order-to-ticket registration, bump action, recall, demo injection, demo fallback for item display
- All 4 requirement IDs (KDS-01 through KDS-04) are claimed by plans and structurally satisfied
- All 8 documented commits confirmed in git history
- Three post-checkpoint fixes (render-phase mutation, checkbox gate, BUMP guard) are all present in the final code

The only remaining step is human browser verification of the interactive behaviors. The code architecture provides all the correct foundations; the human check confirms the behaviors work end-to-end in a running browser session.

---

_Verified: 2026-03-11T05:00:00Z_
_Verifier: Claude (gsd-verifier)_
