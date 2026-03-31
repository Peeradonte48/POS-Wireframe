---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Codebase Cleanup
status: verifying
last_updated: "2026-03-31T10:20:00.000Z"
last_activity: 2026-03-31
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 9
  completed_plans: 7
  percent: 78
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-31
**Session:** Milestone v1.4 Codebase Cleanup — 24-04 complete (promotions 669→173 LOC, split-summary 604→119 LOC, 6 new payment sub-components)

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30 — v1.4 milestone start)

**Core value:** A restaurant staff member can manage dine-in tables, walk-in takeaway orders, and third-party delivery orders from a single interface — with the kitchen always knowing whether to plate or bag.

**Current focus:** Phase 24 — refactor

**Stack:** Next.js 16 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui (Base UI) + Zustand 5 (persist) + Solar icon set

**Deliverable:** Browser-based interactive Hi-Fi wireframe -- dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

Phase: 24 (refactor) — EXECUTING
Plan: 5 of 5
Status: Phase complete — ready for verification
Last activity: 2026-03-31

```
Progress: [████████░░] 78% (7/9 plans complete in v1.4)
```

---

## Milestone Overview

### v1.4 Codebase Cleanup (Phases 22-25)

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 22. Codebase Audit | Written map of all structural issues, dead code, type errors, and tech debt root causes | AUD-01, AUD-02 | Complete |
| 23. TypeScript + Dead Code | Zero build errors, no unjustified any-casts, no unused code, consistent naming | TS-01, TS-02, DC-01, DC-02 | Not started |
| 24. Refactor | Complex components simplified, duplicated patterns consolidated | REF-01, REF-02 | Not started |
| 25. Tech Debt | DLVR-04/05 KDS desync fixed, TKWY-04 reload edge case resolved, 5 E2E flows documented | TD-01, TD-02, TD-03 | Not started |

---

## Accumulated Context

See `.planning/PROJECT.md` for full key decisions log.

### Architecture Decisions for v1.4 (22-01 execution)

- **[22-01] DLVR-04/05 root cause confirmed**: `bumpTicket()` in `kds.store.ts:89` is never called from any UI component; `KdsBoard` only uses `completeTicket()` (final done). The intermediate `New→InProgress` stage transition never fires, so `queue.store.advanceStatus()` (`Confirmed→Preparing`) is never called. Fix: add BUMP button to `KdsTicketCard` with write-back on `New→InProgress` transition.
- **[22-01] TKWY-04 root cause confirmed**: `order.store` (localStorage key `order-store`) and `queue.store` (localStorage key `queue-store`) are independent persist stores. On reload or version migration, `order.store` can be cleared while `queue.store` persists takeaway orders referencing stale `orderId` keys. `TakeawayCard.tsx:56` reads `order.store.orders[orderId]` with no guard, showing "0 items" when data is gone.
- **[22-01] TypeScript build is clean**: 0 errors across 103 files. Phase 23 addresses ESLint advisory patterns only (no blocking TS fixes needed).
- **[22-01] 14 ESLint errors are all advisory react-hooks patterns**: dialog-reset `useEffect` pattern and `Date.now()` in `useState` initializer. Phase 23 can suppress with comments or refactor to `key`-based resets.

### Key Architecture Decisions (v1.2)

- **bill.store.ts**: New Zustand store with persist -- handles split/merge as payment-phase concerns separate from order.store
- **Derivation over duplication**: Order tracking stages derived via pure functions from KDS + order stores, never stored redundantly
- **VAT rounding**: floor + remainder-on-last pattern using integer math (satang)
- **Cross-store sync**: KDS bump triggers table.store orderStage update via explicit action calls (not event bus)
- **Zero new npm packages**: Pure state modeling + UI composition on existing stack
- **Shadow tokens via inline style**: `style={{ boxShadow: 'var(--shadow-*)' }}` pattern continues from v1.1
- **Seat assignments in bill.store only**: Not on OrderLineItem -- payment-phase concern stays out of order data model
- **[12-01] useTableStore imported into bill.store.ts**: For canonical guestCount lookup in initPerSeatSplit via getState() (not reactive subscription)
- **[12-01] cancelSplit uses destructuring rest pattern**: `const { [tableId]: _, ...rest } = state.splits` to avoid Zustand mutation
- **[12-02] SplitSheet view resets to mode-select on every open**: via `useEffect([open])` -- clean state for each split session
- **[12-02] handleSeatPaid reads fresh state via getState() after recordPayment**: to reliably detect all-paid condition without stale closure
- **[12-03] showSplitBadge guards split! non-null assertion in TableTile**: TypeScript safety without runtime overhead -- ternary badge slot prioritises split badge over orderStage badge during payment phase
- **[12-04] onAllPaid uses 'Cash' as placeholder paymentMethod on receipt**: Wireframe receipt shows full grand total regardless of per-seat payment method mix; tracking mixed methods at receipt level is out of scope
- **[12-04] assignItem accumulates qty on existing seat assignment**: Allows splitting same-item quantities across multiple seats -- consistent with how restaurants split shared dishes
- **[12-04] Store cleanup before table lifecycle transitions**: cancelSplit called in TableBottomSheet before markClean -- establishes the pattern for all future bill.store cleanup on table reset
- **[13-01] settled OKLCH token**: hue 145 matching open but chroma 0.21/lightness 0.48 to visually distinguish terminal-state from available-state
- **[13-01] option-card CVA variant**: uses [box-shadow:var(--shadow-card)] Tailwind v4 arbitrary property -- no style prop needed at call sites; data-[selected=true] baked in for Phase 14 picker reuse
- **[13-02] SplitSheet horizontal scroll seat picker**: overflow-x-auto snap-x pb-1 replaces flex-wrap -- single-row at all viewports, no reflow at 6+ seats; justify-center removed as inapplicable in scroll context
- **[13-03] IBM Plex Sans static font**: requires explicit weight array ['400','500','600','700']; 600 included for font-semibold coverage; no variable font config
- **[13-03] Noto Sans Thai in --font-sans token**: was in DOM via body className but missing from CSS token declaration -- correctness fix, not new feature
- **[14-01] merges map uses secondary→primary direction**: O(1) lookup for isMergedSecondary and getPrimaryTable; one-primary-per-secondary guard enforced at initMerge write-time
- **[14-01] --status-merged hue 270° (indigo/violet)**: distinct from amber split (~60°) and crimson primary (~27°); getMergedSecondaries uses linear scan acceptable at POS table counts (<20)
- **[14-02] MergeSheet in table-map/ directory**: merge is initiated from floor plan context, not payment flow; isMergedSecondary filter prevents double-assign of secondaries; LinkLinear solar icon (GitMerge unavailable)
- **[14-03] useTableStore.getState() static read for merge badge primary label**: label never changes at runtime, no reactive subscription needed; avoids extra hook in TableTile
- **[14-03] tableOrders for grouped render computed inline (not in memo)**: only used in JSX render; isMerged reactive flag already drives re-renders; billItems memo covers totals computation
- **[14-03] TotalsSection Split Bill hidden (not disabled) when isMergeActive**: DOM removal is cleaner than disabled state per CONTEXT.md locked decision; Merge Bill always renders but disabled when active
- **[14-03] SplitSheet auto-open useEffect guarded by getMergedSecondaries check**: prevents auto-opening SplitSheet when table is already part of an active merge group
- **[14-03] paidCount lifted to component level in SplitSheet**: shared by renderCancelSection and Revert to Single Bill section without prop drilling
- **[15-01] cooking tokens reuse hue 75 (amber)**: shared with check-requested -- semantically "in progress" states share warm amber family; differentiated by context
- **[15-01] escalated tokens use brand red hue 27**: consistent with destructive/primary brand color, signals urgency without introducing a new hue
- **[15-01] Order-stage hue assignments**: ordered=250(indigo), cooking=75(amber), ready=155(green), escalated=27(crimson)
- **[15-02] tickets in isEscalated useMemo deps intentionally**: KDS bump changes ticket existence/stage, warranting escalation recheck in TableTile even though tickets Record is not read inside memo body
- **[15-02] order-tracking.ts as shared pure-function module**: ESCALATION_THRESHOLD_MS + deriveRoundStage + isRoundEscalated imported by TableTile (Plan 02) and OrderTimeline (Plan 03)
- **[15-02] Badge condition gated on Occupied|CheckRequested**: hides stale orderStage badges on non-active table statuses
- **[15-03] RoundSection sub-component for useSentTimer**: hooks-in-loop violation avoided by extracting a sub-component per round; useSentTimer called at component level not inside map callback
- **[15-03] Tab bar as plain buttons with underline indicator**: two `<button>` elements with `border-b-2 border-primary -mb-px` -- no new shadcn/Base UI imports; simpler than Tabs primitive
- **[15-03] activeTab resets on table?.id change**: follows same useEffect pattern as localWaiter/localNote reset already in TableBottomSheet
- **[15-03] Escalation banner uses flatMap across escalatedRounds**: flat item list under single banner -- not per-round banners
- **[16-01] handleBump pre-captures ticket.stage before bumpTicket()**: Zustand set is synchronous -- post-capture yields the new stage, not the triggering stage; three-way conditional writes Cooking/Ready/Served
- **[16-01] KDS orderStage write-back at KdsTicketCard callsite**: avoids coupling kds.store to table.store at module-definition time; consistent with CLAUDE.md getState() pattern
- **[16-01] Cleanup ordering in markClean**: cancelSplit → dissolveAll → markClean → onClose -- all bill.store cleanup before table.store lifecycle change
- **[16-01] orderStage Billed set as first statement in onAllPaid**: primary table must reach terminal stage before secondary markCleaning and dissolveAll run

### Architecture Decisions for v1.3 (20-01 execution)

- **[20-01] acceptOrder passes 'delivery' and order.platform as 3rd/4th args to addTicket**: Explicit channel metadata required at write-time; addTicket signature already accepted optional args -- this fix makes explicit what was silently omitted; closes DLVR-02
- **[20-01] activeDeliveryCount replaces pendingDeliveryCount**: Floor plan Delivery tab badge widened from `status === 'Pending'` to `['Pending','Confirmed','Preparing','ReadyForRider'].includes(o.status)` -- matches AppSidebar.tsx activeQueueCount delivery branch exactly; badge no longer disappears on order accept; closes NAV-02

### Architecture Decisions for v1.3 (19-02 execution)

- **[19-02] getOrderTypeBadgeVariant/getOrderTypeLabel as co-located helpers in KdsTicketCard**: Small, file-local helpers; badge string cast via `Parameters<typeof Badge>[0]['variant']` keeps TypeScript happy without hard-coding the variant union
- **[19-02] PACK chip uses bg-status-cooking-bg/text-status-cooking tokens**: Amber family signals handle-differently; consistent with order-type-tkwy variant; distinct from ALLERGY orange-500 hardcode
- **[19-02] channelCounts in useMemo([tickets]) not inside selector**: Follows CLAUDE.md Zustand selector infinite-loop prevention rule; tickets Record is stable reference when no mutation
- **[19-02] effectiveType fallback to dine-in for undefined orderType**: Demo tickets and legacy dine-in tickets have no orderType field; treating undefined as dine-in matches the DIN badge label shown by getOrderTypeLabel
- **[19-02] Channel filter as second pass in stageTickets filter**: Single filter chain; no new derived state; empty columns handled by existing No tickets placeholder — zero layout shift

### Architecture Decisions for v1.3 (19-01 execution)

- **[19-01] packToGo?: boolean placed after quantity in OrderLineItem**: Optional field hydrates safely from existing persisted localStorage data without migration; undefined is falsy so all logic gates on truthy check
- **[19-01] order-type-din reuses status-ordered token family (indigo hue 250)**: Semantically aligns dine-in with an ordered state; token class names used (not raw OKLCH) for correct dark/light mode via @theme inline
- **[19-01] order-type-tkwy reuses status-cooking token family (amber hue 75)**: Warm channel feel for takeaway; follows established token reuse pattern from Phase 15
- **[19-01] order-type-dlvr uses bg-muted/text-muted-foreground/border-border**: Neutral fallback when delivery platform is null or unknown

### Architecture Decisions for v1.3 (18-01 execution)

- **[18-01] queue.store Sent→Ready transition added**: Completes the takeaway KDS lifecycle -- transitions map now has the missing entry between Taking→Sent and Ready→Collected
- **[18-01] KdsTicket orderType/platform optional fields**: Purely additive; Phase 19 reads these with zero additional store changes; all existing 2-arg addTicket callers continue unchanged
- **[18-01] KdsBoard guard uses getState() inside useEffect, not in dep array**: Non-reactive read consistent with CLAUDE.md pattern; prevents phantom dine-in ticket registration for queue orders
- **[18-01] KdsTicketCard queue write-back gated on InProgress only**: New→InProgress bump does not advance queue status; only InProgress→Ready bump calls advanceStatus

### Architecture Decisions for v1.3 (18-03 execution)

- **[18-03] isTakeaway detected via non-reactive getState()**: Boolean is stable for the lifetime of the payment page — no reactive subscription needed; consistent with CLAUDE.md getState() pattern for static reads
- **[18-03] TotalsSection billing action buttons gated on callback presence**: `onSplitBill !== undefined` / `onMergeBill !== undefined` gates render — passing `undefined` from parent hides buttons entirely; cleaner than a dedicated `hideBillingActions` prop
- **[18-03] handleConfirmPayment takeaway branch returns early before setReceiptData**: Prevents receipt screen flash for takeaway path; `router.push('/table-map')` + `return` ensures dine-in path never executes for takeaway
- **[18-03] SplitSheet/MergeSheet conditionally rendered (!isTakeaway)**: DOM removal matches established hide-not-disable pattern; avoids prop drilling or sheet-level gating
- **[18-03] TicketPanel send-to-kitchen bypass via onSend prop presence**: `(!onSend && !canDoAction(role, 'send-to-kitchen'))` — when a custom onSend is wired in, action is navigation not kitchen dispatch; permission gate is semantically inapplicable
- **[18-03] Takeaway confirm-payment bypass via !isTakeaway guard**: `(!isTakeaway && !canDoAction(role, 'confirm-payment'))` — all roles involved in takeaway creation (Waiter, Cashier, Manager) can complete payment; no role restriction needed for takeaway checkout
- **[18-03] activeQueueCount replaces pendingDeliveryCount**: sidebar badge now reflects total active queue load — delivery (Pending/Confirmed/Preparing/ReadyForRider) + takeaway (Taking/Sent/Ready); Completed/Cancelled/Collected statuses excluded as they require no staff attention

### Architecture Decisions for v1.3 (18-02 execution)

- **[18-02] onSend for takeaway navigates to /payment/tableId only**: advanceStatus removed from this callback -- queue status stays in Taking until payment is confirmed in Plan 03; enforces pay-at-ordering model (TKWY-02)
- **[18-02] TakeawayCard useOrderStore raw selector + useMemo derivation**: select `orders[orderId]` raw object (stable reference on no-mutation); useMemo derives itemsSummary string; avoids Zustand selector infinite-loop anti-pattern per CLAUDE.md
- **[18-02] itemsSummary "No items yet" guard**: shown when status is Taking (before order entry begins) or when order has zero non-voided items; truncates at 3 item groups with "+N more"

### Architecture Decisions for v1.3 (17-04 execution)

- **[17-04] Option C for dual-active nav**: both `table-map` and `queue` nav items show active on `/table-map` — wireframe acceptable; documented with code comment
- **[17-04] InboxLinear for Queue icon**: available in solar-icon-set; semantically appropriate for an incoming orders queue view
- **[17-04] Collapsed sidebar dot indicator**: 8px absolute `span -top-0.5 -right-0.5` on relative `<li>`; count badge omitted in collapsed (64px) mode

### Architecture Decisions for v1.3 (17-03 execution)

- **[17-03] advanceStatus extended with takeaway transitions**: Taking→Sent and Ready→Collected added to the transitions Partial Record
- **[17-03] TakeawayCard "Start Order" CTA advances to Sent as Phase 17 placeholder**: Phase 18 will replace with navigation; comment documents hook-in point

### Architecture Decisions for v1.3 (17-02 execution)

- **[17-02] CountdownRing seconds derived from progress state**: `Date.now()` in JSX render triggers react-hooks/purity lint rule; fixed by computing from existing RAF-driven progress state
- **[17-02] Simulate Order fires immediate + starts loop in one click**: When demo is not active, clicking fires both simulateOrder() and toggleDemoActive()
- **[17-02] Active Orders heading conditional on coexistence**: "Active Orders" section label only renders when both pending and active orders are visible simultaneously

### Architecture Decisions for v1.3 (17-01 execution)

- **[17-01] queue.store partialize excludes demoActive/autoAccept**: Runtime-only session toggles -- resetting to false on page load is correct behavior
- **[17-01] createTakeaway uses single set() closure**: Atomic counter increment + order creation prevents orderId race condition
- **[17-01] Light mode platform fg uses lower OKLCH lightness**: oklch(0.46/0.40 L) vs dark mode oklch(0.72/0.68 L) -- contrast on light bg
- **[17-01] acceptOrder cross-store write-back inside action body**: useKdsStore.getState() called inside function, not at module init -- avoids circular dependency

### Architecture Decisions for v1.3 (from research)

- **queue.store as the only non-dine-in store**: table.store remains strictly physical-table-only; delivery/takeaway records live exclusively in queue.store
- **QueueOrderStatus is its own type**: Never appended to OrderStage or TableStatus enums to avoid semantic corruption
- **KdsTicket extended with orderType + platform**: addTicket signature updated; KdsTicketCard.handleBump adds conditional write-back for non-dine-in
- **Zustand selector safety**: select raw `orders: Record<string, QueueOrder>` from queue.store; derive filtered lists in useMemo
- **Zero new npm packages**: setInterval in useEffect for delivery simulation (~25 LOC factory)

### Nyquist Sign-off (2026-03-16)

- Phases 17, 18, 19: nyquist_compliant: true — all VALIDATION.md files updated
- TKWY-04: requirements-completed field added to 18-03-SUMMARY.md; REQUIREMENTS.md checkbox marked [x]
- v1.3 milestone audit complete — all requirements verified, all phases Nyquist compliant

### Bug Fixes (post-phase)

- **[2026-03-13] merged-table-status-not-clearing** -- After paying a merged bill, secondary tables stayed in "Check Requested". Fix: added `mergedSecondaryIds.forEach((id) => markCleaning(id))` in both paths inside payment/[tableId]/page.tsx. Resolved.

- **[2026-03-13] payment-redirect-loop-after-merge-pay** -- After paying a merged bill, tapping the secondary table tile redirected back into /payment/[primaryTableId]. Fix: added `dissolveAll(tableId)` in both handleConfirmPayment and onAllPaid in payment/[tableId]/page.tsx. Resolved.

### Known Tech Debt (v1.4 targets)

- **DLVR-04/05**: KDS `New→InProgress` bump does not mirror to queue `Confirmed→Preparing` — Phase 25
- **TKWY-04**: empty order.store + persistent queue.store edge case on browser reload — Phase 25
- **5 E2E flows**: Multi-screen flows flagged `human_needed` in Phase 18 verifier require live browser test documentation — Phase 25

---

*State initialized: 2026-03-10 during roadmap creation*
*v1.0 archived: 2026-03-11*
*v1.1 archived: 2026-03-12*
*v1.2 archived: 2026-03-13*
*v1.3 roadmap created: 2026-03-15*
*v1.4 roadmap created: 2026-03-30*
