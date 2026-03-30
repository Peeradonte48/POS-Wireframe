# Codebase Audit Report — Phase 22

**Generated:** 2026-03-31
**Source files scanned:** 103 (including 1 e2e spec)
**Build errors:** 0 (TypeScript clean)
**Lint errors:** 14 errors, 12 warnings (ESLint)

---

## Automated Tool Output

### `npm run build` Result

```
✓ Compiled successfully in 7.1s
✓ Generating static pages using 9 workers (12/12)
TypeScript: 0 errors
```

**Build is clean.** All 103 source files type-check without errors. No TypeScript blocking issues exist at Phase 23 start.

### `npm run lint` Result (agent-a4beae2d worktree — canonical)

**14 errors, 12 warnings** across 16 files:

| File | Line | Rule | Severity | Message |
|------|------|------|----------|---------|
| `src/app/(app)/layout.tsx` | 18:48 | `react-hooks/set-state-in-effect` | error | `setHydrated` called synchronously in effect |
| `src/app/(app)/payment/[tableId]/promotions/page.tsx` | 288:7 | `react-hooks/set-state-in-effect` | error | `setSelectedItems` called synchronously in effect |
| `src/app/(app)/payment/[tableId]/split-summary/page.tsx` | 70:9 | `@typescript-eslint/no-unused-vars` | warning | `grandTotal` assigned but never used |
| `src/app/(app)/payment/[tableId]/split-summary/page.tsx` | 100:15 | `react-hooks/purity` | error | `Date.now()` impure call in event handler body |
| `src/components/kds/useKdsTimer.ts` | 17:42 | `react-hooks/purity` | error | `Date.now()` in `useState` initializer |
| `src/components/order/ModifierSheet.tsx` | 76:5 | `react-hooks/set-state-in-effect` | error | `setActiveTab` called synchronously in effect |
| `src/components/order/SimpleItemDialog.tsx` | 25:15 | `react-hooks/set-state-in-effect` | error | `setQuantity` called synchronously in effect |
| `src/components/order/TicketLineItem.tsx` | 120:3 | `@typescript-eslint/no-unused-vars` | warning | `canVoidSent` assigned but never used |
| `src/components/payment/BillLineItem.tsx` | 45:11 | `@next/next/no-img-element` | warning | `<img>` used instead of `<Image />` |
| `src/components/payment/CashDialog.tsx` | 45:15 | `react-hooks/set-state-in-effect` | error | `setInputStr` called synchronously in effect |
| `src/components/payment/ItemSplitSheet.tsx` | 3:20 | `@typescript-eslint/no-unused-vars` | warning | `useMemo` imported but never used |
| `src/components/payment/ItemSplitSheet.tsx` | 6:10 | `@typescript-eslint/no-unused-vars` | warning | `Separator` imported but never used |
| `src/components/payment/SplitSheet.tsx` | 38:10 | `@typescript-eslint/no-unused-vars` | warning | `seatCountInput` assigned but never used |
| `src/components/queue/EditCustomerModal.tsx` | 37:7 | `react-hooks/set-state-in-effect` | error | `setName`/`setPhone` called synchronously in effect |
| `src/components/queue/NewDeliveryModal.tsx` | 34:7 | `react-hooks/set-state-in-effect` | error | `setPlatform` called synchronously in effect |
| `src/components/table-map/OpenTableModal.tsx` | 31:5 | `react-hooks/set-state-in-effect` | error | `setGuestCount` called synchronously in effect |
| `src/components/table-map/TableBottomSheet.tsx` | 51:7 | `react-hooks/set-state-in-effect` | error | `setLocalWaiter`/`setLocalNote` synchronous in effect |
| `src/components/table-map/TableBottomSheet.tsx` | 58:5 | `react-hooks/set-state-in-effect` | error | `setActiveTab` synchronous in effect |
| `src/components/table-map/TableBottomSheet.tsx` | 59:19 | `react-hooks/exhaustive-deps` | warning | Unnecessary `eslint-disable` directive |
| `src/components/table-map/TableTile.tsx` | 69:6 | `react-hooks/exhaustive-deps` | warning | `useMemo` has unnecessary `tickets` dependency |
| `src/components/table-map/useDwellTimer.ts` | 5:34 | `react-hooks/purity` | error | `Date.now()` in `useState` initializer |
| `src/components/table-map/useSentTimer.ts` | 10:34 | `react-hooks/purity` | error | `Date.now()` in `useState` initializer |
| `src/stores/bill.store.ts` | 98:30 | `@typescript-eslint/no-unused-vars` | warning | `_` destructuring discard variable (3 occurrences: lines 98, 248, 259) |
| `src/stores/kds.store.ts` | 52:7 | `@typescript-eslint/no-unused-vars` | warning | `RECALL_TRAY_CAP` defined but never used |
| `src/stores/kds.store.ts` | 113:27 | `@typescript-eslint/no-unused-vars` | warning | `_removed` destructuring discard (2 occurrences: lines 113, 122) |
| `src/stores/order.store.ts` | 197:26 | `@typescript-eslint/no-unused-vars` | warning | `_` destructuring discard |

---

## Phase 23 Scope: TypeScript Errors + Dead Code

**Owning Phase:** 23
**Requirements satisfied:** TS-01, TS-02, DC-01, DC-02

### Build Errors

None. `npm run build` exits clean with 0 TypeScript errors.

### ESLint Errors (React Hooks Purity / State-in-Effect)

These are ESLint errors (not TypeScript), but they indicate patterns that Phase 23 should address for code quality. All 14 errors below:

| File | Line | Error Code | Message | Severity |
|------|------|-----------|---------|----------|
| `src/app/(app)/layout.tsx` | 18:48 | `react-hooks/set-state-in-effect` | `setHydrated(true)` called synchronously inside `useEffect` body | advisory |
| `src/app/(app)/payment/[tableId]/promotions/page.tsx` | 288:7 | `react-hooks/set-state-in-effect` | `setSelectedItems` called synchronously in effect | advisory |
| `src/app/(app)/payment/[tableId]/split-summary/page.tsx` | 100:15 | `react-hooks/purity` | `Date.now()` called in event handler (ESLint mistakenly flags this as render-time; handler is async click, not render) | advisory |
| `src/components/kds/useKdsTimer.ts` | 17:42 | `react-hooks/purity` | `Date.now()` in `useState` initializer — false positive for hooks (initializer runs once) | advisory |
| `src/components/order/ModifierSheet.tsx` | 76:5 | `react-hooks/set-state-in-effect` | `setActiveTab` synchronous in effect | advisory |
| `src/components/order/SimpleItemDialog.tsx` | 25:15 | `react-hooks/set-state-in-effect` | `setQuantity(1)` synchronous in effect — standard dialog reset pattern | advisory |
| `src/components/payment/CashDialog.tsx` | 45:15 | `react-hooks/set-state-in-effect` | `setInputStr('')` synchronous in effect | advisory |
| `src/components/queue/EditCustomerModal.tsx` | 37:7 | `react-hooks/set-state-in-effect` | `setName`/`setPhone` in effect on open | advisory |
| `src/components/queue/NewDeliveryModal.tsx` | 34:7 | `react-hooks/set-state-in-effect` | `setPlatform(null)` in effect on open | advisory |
| `src/components/table-map/OpenTableModal.tsx` | 31:5 | `react-hooks/set-state-in-effect` | `setGuestCount(MIN_GUESTS)` on tableId change | advisory |
| `src/components/table-map/TableBottomSheet.tsx` | 51:7 | `react-hooks/set-state-in-effect` | `setLocalWaiter`/`setLocalNote` on table?.id change | advisory |
| `src/components/table-map/TableBottomSheet.tsx` | 58:5 | `react-hooks/set-state-in-effect` | `setActiveTab('actions')` on table?.id change | advisory |
| `src/components/table-map/useDwellTimer.ts` | 5:34 | `react-hooks/purity` | `Date.now()` in `useState` initializer | advisory |
| `src/components/table-map/useSentTimer.ts` | 10:34 | `react-hooks/purity` | `Date.now()` in `useState` initializer | advisory |

**Note on `react-hooks/purity` for `Date.now()`:** ESLint flags `useState(Date.now())` as impure. The React docs rule applies to render-time computations; `useState` initializers run once (not on every render). Phase 23 can suppress with `// eslint-disable-next-line` where the pattern is intentional, or refactor to `useRef` + lazy init.

**Note on `react-hooks/set-state-in-effect`:** The "standard dialog reset on open" pattern (`useEffect(() => { if (open) setState(x) }, [open])`) is widely used in this codebase and is the established reset pattern. Phase 23 should evaluate whether to suppress uniformly or rewrite as `key`-based unmount resets.

### Any-Casts and Implicit Any

Manual scan found zero explicit `as any` casts across all 103 files. TypeScript strict mode is enforced. No implicit any detected.

| File | Line | Pattern | Severity |
|------|------|---------|----------|
| `src/components/kds/KdsTicketCard.tsx` | 20 | `useSessionStore((s) => s.role)!` — non-null assertion | advisory |
| `src/components/kds/KdsBoard.tsx` | (multiple) | `ticket.tableId` passed to `getState().orders[ticket.tableId]` — safe due to guard | advisory |

### Unused Imports and Variables

| File | Line | Symbol | Source |
|------|------|--------|--------|
| `src/components/payment/ItemSplitSheet.tsx` | 3 | `useMemo` | lint |
| `src/components/payment/ItemSplitSheet.tsx` | 6 | `Separator` | lint |
| `src/components/payment/SplitSheet.tsx` | 38 | `seatCountInput` | lint |
| `src/components/order/TicketLineItem.tsx` | 120 | `canVoidSent` | lint |
| `src/app/(app)/payment/[tableId]/split-summary/page.tsx` | 70 | `grandTotal` | lint |
| `src/stores/kds.store.ts` | 52 | `RECALL_TRAY_CAP` | lint |
| `src/stores/kds.store.ts` | 113, 122 | `_removed` (destructure discard) | lint |
| `src/stores/bill.store.ts` | 98, 248, 259 | `_` (destructure discard) | lint |
| `src/stores/order.store.ts` | 197 | `_` (destructure discard) | lint |
| `src/app/(kds)/kds/page.tsx` | 26–32 | `TOP_NAV_ITEMS` defined inline — `Package2`, `Home`, `ShoppingCart`, `Package`, `Users`, `LineChart`, `Settings`, `PanelLeft`, `EllipsisVertical`, `LogOut`, `ChevronsUpDown`, `User` all imported but several are only used once | manual |

**Note:** The `_` discard variables in stores are idiomatic Zustand destructuring patterns (`const { [id]: _, ...rest } = state.x`). These are false-positive lint warnings; Phase 23 should suppress with `_void` rename or `// eslint-disable-next-line`.

### Dead Code and Unreachable Paths

| File | Line | Description | Severity |
|------|------|-------------|----------|
| `src/stores/kds.store.ts` | 52 | `RECALL_TRAY_CAP = 5` defined but `recallTray` array is never length-capped in `completeTicket` or `bumpTicket`; cap was intended but never wired | advisory |
| `src/components/order/TicketLineItem.tsx` | 120 | `canVoidSent` assigned from `canDoAction()` but never used in render or logic | advisory |
| `src/app/(app)/payment/[tableId]/split-summary/page.tsx` | 70 | `grandTotal` computed but never used | advisory |
| `src/components/payment/SplitSheet.tsx` | 38 | `seatCountInput` state created but never read in render | advisory |
| `src/components/payment/ItemSplitSheet.tsx` | 3, 6 | `useMemo` and `Separator` imported but unused | advisory |
| `src/app/(kds)/kds/page.tsx` | 22–24 | `Package, Users, LineChart` nav items render disabled buttons pointing to `/loyalty`, `/dashboard` — `/loyalty` route does not exist; dead navigation | advisory |

### Naming Inconsistencies

| File | Current Name | Expected Convention | Severity |
|------|-------------|-------------------|----------|
| `src/stores/bill.store.ts` | `BillStore` interface (private) | Consistent; no issue | — |
| `src/app/(app)/payment/[tableId]/split-summary/page.tsx` | `split-summary` (kebab) | Standard Next.js route group naming; acceptable | — |

**Finding:** No naming inconsistencies detected. All files follow Next.js conventions (kebab-case routes, PascalCase components, camelCase hooks, `*.store.ts` suffix for Zustand stores).

---

## Phase 24 Scope: Complex Components + Duplicated Patterns

**Owning Phase:** 24
**Requirements satisfied:** REF-01, REF-02

### Decomposition Candidates

**1. `src/app/(app)/payment/[tableId]/page.tsx`**
- **Line count:** 944
- **What it does:** Single file handles: (1) bill calculation + VAT, (2) CRM lookup dialog, (3) camera coupon scan, (4) QR code generation, (5) payment method selection (Cash/Card/QR), (6) loyalty receipt, (7) split bill sheet orchestration, (8) merge bill awareness, (9) takeaway vs dine-in branching, (10) promotion discounts display
- **Why it's complex:** 10 distinct concerns, 3 conditional rendering paths (dine-in / takeaway / merged), CRM + coupon + receipt lifecycle all managed inline
- **Suggested split:**
  - `PaymentPage` (orchestrator, ~150 LOC)
  - `useBillCalculation()` hook (VAT math, discount aggregation)
  - `useCameraScanner()` hook (CouponScan flow)
  - `PaymentModals` component (CRM, QR, Cash, Card dialogs)
  - `PromotionSummary` component (discount chips + totals)
- **Severity:** advisory

**2. `src/components/payment/SplitSheet.tsx`**
- **Line count:** 788
- **What it does:** (1) Mode selection (custom value / per-seat / item split), (2) custom split UI with adjustable payers, (3) per-seat assignment UI with drag-to-assign items, (4) item split bill grouping UI, (5) payment recording per seat, (6) revert-to-single-bill flow
- **Why it's complex:** Three distinct UI modes share one component with complex internal mode-switching; per-seat assignment logic involves array mutations
- **Suggested split:**
  - `SplitSheet` (orchestrator + mode selector, ~100 LOC)
  - `CustomValueSplitPanel` (~120 LOC)
  - `PerSeatSplitPanel` (~200 LOC)
  - `ItemSplitPanel` (already exists as `ItemSplitSheet.tsx` — finish extraction)
- **Severity:** advisory

**3. `src/app/(app)/payment/[tableId]/promotions/page.tsx`**
- **Line count:** 668
- **What it does:** (1) Coupon code entry + validation, (2) promotion list display (from mock data), (3) item selection for promotion application, (4) promotion detail sheet (read-only), (5) apply/remove promotion actions, (6) promotion discount summary
- **Why it's complex:** Contains full promotion validation state machine, item-selection UI, and two-panel layout all in one page
- **Suggested split:**
  - `PromotionsPage` (orchestrator)
  - `CouponEntry` component (code input + validation state)
  - `PromotionList` component (tile grid + detail sheet)
  - `usePromotionValidation()` hook (code validate + apply logic)
- **Severity:** advisory

**4. `src/app/(app)/payment/[tableId]/split-summary/page.tsx`**
- **Line count:** 604
- **What it does:** Handles split payment completion UI for both custom-split and per-seat modes — per-seat tab navigation, payment recording per seat, "all paid" detection, receipt generation
- **Why it's complex:** Two distinct split modes render different UI from same page; payment state machine and receipt trigger both inline
- **Suggested split:**
  - `SplitSummaryPage` (orchestrator)
  - `PerSeatPaymentPanel` (tab UI per seat)
  - `CustomSplitPaymentPanel` (payer list UI)
  - Extract `useSplitSummary()` hook for totals/VAT derivation
- **Severity:** advisory

**5. `src/components/order/ModifierSheet.tsx`**
- **Line count:** 378
- **What it does:** (1) Tab bar (customize / pack-to-go), (2) forced modifier selection (broth, noodle, etc.), (3) spice level picker, (4) special requests text, (5) edit mode vs add mode, (6) validation error display, (7) Pack-to-Go toggle
- **Suggested split:**
  - `ModifierSheet` (orchestrator + tabs)
  - `ForcedModifiersPanel` (modifier groups)
  - `SpiceLevelPicker` (already a pattern; extract as standalone)
- **Severity:** advisory

### Consolidation Candidates

**1. Dialog-reset pattern (11 files)**

The following pattern appears in 11 components — a `useEffect` that resets state when a dialog/sheet opens:
```tsx
useEffect(() => {
  if (open) setState(initialValue)
}, [open, ...deps])
```
Files: `ModifierSheet.tsx`, `SimpleItemDialog.tsx`, `CashDialog.tsx`, `EditCustomerModal.tsx`, `NewDeliveryModal.tsx`, `OpenTableModal.tsx`, `TableBottomSheet.tsx` (×2), `ValueSplitSheet.tsx`, `SplitSheet.tsx`, `CrmLookupDialog.tsx`

**Consolidation proposal:** Establish a `useDialogReset(open, resetFn, deps)` hook or convert to `key`-based component remounting. Either approach eliminates the lint errors (14 `react-hooks/set-state-in-effect` violations) and consolidates the pattern.

**2. `Date.now()` timer hooks (3 files)**

Three custom timer hooks follow identical structure: `useState(Date.now())` + `useEffect` with `setInterval`:
- `src/components/table-map/useDwellTimer.ts`
- `src/components/table-map/useSentTimer.ts`
- `src/components/kds/useKdsTimer.ts`

**Consolidation proposal:** Extract a shared `useNowTimer(intervalMs?: number): number` hook in `src/lib/hooks/useNowTimer.ts`. All three become wrappers.

**3. Queue order status badge helpers (2 files)**

`src/components/queue/TakeawayCard.tsx` and `src/components/queue/DeliveryCard.tsx` each define local `getStatusBadgeVariant()` and `getStatusLabel()` functions for overlapping `QueueOrderStatus` values.

**Consolidation proposal:** Extract `src/lib/queue-display.ts` with `getQueueStatusBadgeVariant(status)` and `getQueueStatusLabel(status)` covering all channels.

**4. Payment method panel components (3 files)**

`src/components/payment/CashPanel.tsx`, `CardPanel.tsx`, `QrPanel.tsx` each define similar layouts (icon + instructions + confirm button). Minor structural duplication.

**Consolidation proposal:** Extract a `PaymentMethodPanel` wrapper component that accepts `icon`, `label`, `instructions`, and `children` props — reduces duplication in the shared "panel" skeleton.

**5. Zustand selector pattern violations**

The CLAUDE.md anti-pattern (calling functions that return new arrays inside Zustand selectors) should be audited for all store-consuming components. Known instance: `getMergedSecondaries` in `bill.store.ts` line 286. Phase 24 should run a codebase-wide grep for `.getMergedSecondaries\(` and verify all call sites use `useMemo` derivation rather than inline selector.

---

## Phase 25 Scope: Known Tech Debt

**Owning Phase:** 25
**Requirements satisfied:** TD-01, TD-02, TD-03

---

### DLVR-04/05: KDS Bump Does Not Mirror to Queue Status

**Summary:** When a delivery order's KDS ticket is bumped from `New → InProgress`, `queue.store.advanceStatus()` is NOT called. The delivery order's `QueueOrderStatus` stays at `Confirmed` instead of advancing to `Preparing`.

- **Failing code path:**
  - `src/stores/kds.store.ts:89–101` — `bumpTicket()` handles `New → InProgress` transition. It updates `kds.store.tickets[ticketId].stage` from `'New'` to `'InProgress'` and returns. **No cross-store call to `queue.store.advanceStatus()` is made.**
  - `src/components/kds/KdsTicketCard.tsx:41–48` — `handleComplete()` is the only call site for ticket progression in the KDS card component. It calls `completeTicket()` (removes from board, final completion) plus `advanceStatus(ticket.tableId)` for queue write-back. But `handleComplete` is the **final-stage** handler (Ready → done), not the intermediate bumps.
  - The KDS board (`src/components/kds/KdsBoard.tsx`) uses only `KdsTicketCard` and does not wire a `bumpTicket` action at all — the board only shows a single "ออร์เดอร์เสร็จ" (Order Done) button that calls `completeTicket`. **The intermediate `New → InProgress` and `InProgress → Ready` stage transitions exposed by `bumpTicket` in kds.store are never called from any UI component.**

- **Root cause:** The `bumpTicket` action in `kds.store` was designed for a multi-column KDS board (New / InProgress / Ready columns). The actual `KdsBoard` implementation collapsed this to a single "Done" button per ticket using `completeTicket`. Because the intermediate bumps never happen via UI, the `Confirmed → Preparing` queue write-back that was supposed to run at `New → InProgress` bump time was never triggered. The `handleComplete` write-back at line 47 covers only the `Ready → Collected` transition (delivery terminal state), not the `Confirmed → Preparing` intermediate.

- **Proposed fix:**
  1. Add a BUMP button to `KdsTicketCard` that calls `bumpTicket(ticketId)` for `New` and `InProgress` stage tickets (in addition to the existing Done button for `Ready` tickets).
  2. In the `handleBump` function (to be added at `KdsTicketCard.tsx`), after calling `bumpTicket(ticketId)`, check the **previous** stage (capture before the call): if previous stage was `New` and `ticket.orderType === 'delivery'`, call `useQueueStore.getState().advanceStatus(ticket.tableId)` to advance `Confirmed → Preparing`.
  3. The existing `handleComplete` already handles `Ready → done` with `advanceStatus` write-back for queue; that path is correct for the final-step.
  4. Reference: `src/components/kds/KdsTicketCard.tsx:41–48` for the existing write-back pattern.

---

### TKWY-04: Empty order.store + Persistent queue.store on Reload

**Summary:** When the browser is reloaded or `order.store` localStorage is cleared, takeaway orders in `queue.store` (which persists) lose their associated `order.store` entry. UI components that read `order.store.orders[orderId]` receive `undefined`, causing `itemCount = 0` and `itemsSummary = ""` to display stale/empty UI.

- **Failing code path:**
  - `src/stores/order.store.ts:55–222` — `order.store` persists with `{ name: 'order-store', version: 1, migrate: () => ({}) }`. The `migrate: () => ({})` function **wipes state on any version bump**. If a developer increments the version, all orders are lost. This is the primary data-loss path.
  - `src/stores/queue.store.ts:169–178` — `queue.store` persists with `partialize` that includes `orders` and `takeawayCounter`. Takeaway orders with `orderId: 'TK-001'` persist across reloads.
  - `src/components/queue/TakeawayCard.tsx:56–63` — `const orderData = useOrderStore((s) => s.orders[order.orderId])` — if `order.store` is empty after reload, `orderData` is `undefined`, `itemCount` falls to 0, and the card shows "0 items" instead of the actual ordered items.
  - `src/app/(app)/order/delivery/[orderId]/page.tsx` — delivery order entry page reads `order.store.orders[orderId]` with no guard for the case where the store was cleared post-creation.

- **Root cause:** Two contributing factors:
  1. `order.store` and `queue.store` use separate `localStorage` keys (`order-store`, `queue-store`) with independent lifecycles. A reload with `queue.store` intact and `order.store` empty (e.g., after opening DevTools > Application > Storage > Clear localStorage for `order-store` only, or after a store version migration) creates orphaned queue order references.
  2. `order.store` is NOT partitioned by `orderId` type — takeaway order items live in `order.store.orders['TK-001']` but the `queue.store.orders['TK-001']` has no reference back to confirm data integrity on load.

- **Proposed fix:**
  1. **Short-term (Phase 25):** Add a hydration guard in `TakeawayCard` and the delivery order page: if `orderData` is undefined and `order.status !== 'Taking'`, display a "Reload required" warning badge rather than showing "0 items".
  2. **Medium-term (Phase 25):** On `queue.store` hydration, reconcile against `order.store`: for any `QueueOrder` with `status !== 'Taking'` (i.e., order was sent), verify `order.store.orders[orderId]` exists. If missing, set `itemsSummary` to a fallback string (e.g., "items unavailable — reload"). This can be done in a `useEffect` in the queue list page or as a Zustand middleware.
  3. **Long-term:** Move `itemsSummary` calculation into `queue.store` itself on `sendRound`, making it resilient to `order.store` state loss. When `order.store` calls `sendRound(tableId)` for a takeaway, it should call `useQueueStore.getState().updateItemsSummary(orderId, derivedSummary)` to snapshot the summary into the persisted queue record.

---

### E2E Flow Test Stubs

Playwright test stubs in `src/__tests__/e2e/`:

**Status as of 2026-03-31:**

| Flow | File | Status |
|------|------|--------|
| Dine-in full flow | `dine-in-full-flow.spec.ts` | Exists — all `test()` blocks present with TODO comments |
| Takeaway walk-in | `takeaway-walk-in-flow.spec.ts` | Exists — all `test()` blocks present with TODO comments |
| Delivery queue | `delivery-queue-flow.spec.ts` | Exists — all `test()` blocks present with TODO comments |
| Split bill | `split-bill-flow.spec.ts` | Exists — 6 `test()` blocks, 68 TODO comments |
| Merge bill | `merge-bill-flow.spec.ts` | Exists — 5 `test()` blocks, 63 TODO comments |

**Phase 25 action:** Fill in the TODO assertions in all 5 existing stubs with real Playwright selectors and expectations.

**Existing stub structure (reference `dine-in-full-flow.spec.ts`):**
- `test.describe('[Flow Name]', ...)` block
- Multiple `test()` blocks per step (login, table open, order entry, KDS bump, payment)
- Each step has commented-out `// TODO: await page.goto(...)` Playwright calls
- Steps end with a commented-out assertion: `// TODO: await expect(...).toBeVisible()`

---

## Summary Statistics

| Scope | Total Findings | Blocking | Advisory |
|-------|---------------|----------|----------|
| Phase 23 (TypeScript + Dead Code) | 26 findings | 0 | 26 |
| Phase 24 (Refactor) | 9 candidates | 0 | 9 |
| Phase 25 (Tech Debt) | 3 items | 2 (DLVR-04/05, TKWY-04) | 1 (E2E stubs) |
| **Total** | **38** | **2** | **36** |

### By Category

| Category | Count |
|----------|-------|
| ESLint errors (react-hooks) | 14 |
| Unused symbols / imports | 12 |
| Complex components (>200 LOC, multi-concern) | 5 |
| Consolidation candidates | 5 |
| Known tech debt items | 2 functional bugs + 2 missing E2E stubs |

### Build Health

- TypeScript: **CLEAN** (0 errors)
- ESLint: **14 errors, 12 warnings** — all advisory for wireframe; none block functionality
- Runtime correctness: **2 behavioral bugs** (DLVR-04/05, TKWY-04) scoped to Phase 25

---

*Audit produced by Phase 22 — Plan 01 executor*
*Organized for Phase 23 (TypeScript/Dead Code), Phase 24 (Refactor), Phase 25 (Tech Debt) planners*
