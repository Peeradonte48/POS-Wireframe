---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Delivery & Takeaway Orders
status: completed
last_updated: "2026-03-15T00:05:00.000Z"
last_activity: "2026-03-15 -- 17-03 complete: NewTakeawayModal + TakeawayCard + TakeawayPanel + advanceStatus takeaway transitions"
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 46
  completed_plans: 43
  percent: 93
---

# Project State: FIP POS Staff App Wireframe

**Last updated:** 2026-03-15
**Session:** v1.3 roadmap created — 3 phases (17-19) covering 21 requirements across NAV, DLVR, TKWY, COMBO, KDS, UI categories; Phase 17 planning is next

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-15 -- Milestone v1.3 started)

**Core value:** A restaurant staff member can open a shift, seat a table, take a full ramen order with modifiers, send it to the kitchen, and close the bill -- all from a mobile PWA that feels fast enough for real service conditions.

**Current focus:** v1.3 -- Delivery & Takeaway Orders

**Stack:** Next.js 16 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui (Base UI) + Zustand 5 (persist) + Solar icon set

**Deliverable:** Browser-based interactive Hi-Fi wireframe -- dual-use dev handoff spec + stakeholder presentation artifact

**Repo root:** `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe`

---

## Current Position

Phase: 17 -- Queue Store + Floor Plan Tabs (in progress)
Plan: 03 complete, next: 04 (QueueBoard UI integration)
Status: 17-03 complete -- NewTakeawayModal + TakeawayCard + TakeawayPanel built
Last activity: 2026-03-15 -- 17-03 complete: takeaway creation flow with FAB + advanceStatus takeaway transitions patched

```
Progress: [█████████░] 93% (43/46 plans — v1.3 in progress)
```

---

## Milestone Overview

### v1.3 Delivery & Takeaway Orders

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 17. Queue Store + Floor Plan Tabs | Staff can view/manage delivery queue and create takeaway orders from the floor plan | NAV-01, NAV-02, DLVR-01–09, TKWY-01 (12 total) | In progress (03/04 plans done) |
| 18. Order Entry + Payment Pipeline | Takeaway/delivery orders flow through existing order entry and payment with KDS write-back | TKWY-02, TKWY-03, TKWY-04, TKWY-05 (4 total) | Not started |
| 19. KDS Differentiation + Combo Flag | Kitchen sees order type badge per ticket, can filter by channel, dine-in items can be flagged pack-to-go | COMBO-01, COMBO-02, KDS-01, KDS-02, UI-01 (5 total) | Not started |

---

## Accumulated Context

See `.planning/PROJECT.md` for full key decisions log.

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

### Architecture Decisions for v1.3 (17-03 execution)

- **[17-03] advanceStatus extended with takeaway transitions**: Taking→Sent and Ready→Collected added to the transitions Partial Record -- keeps single-action pattern; declarative map makes all transitions auditable
- **[17-03] TakeawayCard "Start Order" CTA advances to Sent as Phase 17 placeholder**: Phase 18 will replace with navigation; comment documents hook-in point

### Architecture Decisions for v1.3 (17-01 execution)

- **[17-01] queue.store partialize excludes demoActive/autoAccept**: Runtime-only session toggles -- resetting to false on page load is correct behavior; persisting would cause unexpected demo mode on app restart
- **[17-01] createTakeaway uses single set() closure**: Atomic counter increment + order creation prevents orderId race condition from two rapid calls to separate set()
- **[17-01] Light mode platform fg uses lower OKLCH lightness**: oklch(0.46/0.40 L) vs dark mode oklch(0.72/0.68 L) -- contrast on light bg; consistent with independently-tuned status token pattern
- **[17-01] acceptOrder cross-store write-back inside action body**: useKdsStore.getState() called inside function, not at module init -- avoids circular dependency issues

### Architecture Decisions for v1.3 (from research)

- **queue.store as the only non-dine-in store**: table.store remains strictly physical-table-only; delivery/takeaway records live exclusively in queue.store to prevent floor tile contamination and merge candidate corruption
- **QueueOrderStatus is its own type**: `Pending | Confirmed | Ready | Completed | Cancelled` -- never appended to OrderStage or TableStatus enums to avoid semantic corruption
- **ID-agnostic order/kds stores**: order.store and kds.store already operate on opaque string keys; TK-001 and DL-grab-7821 flow through unchanged with only additive seam changes
- **OrderContext discriminated union**: optional field on ActiveOrder (backward compatible); drives header label fallback and KDS orderType derivation
- **KdsTicket extended with orderType + platform**: addTicket signature updated; KdsTicketCard.handleBump adds conditional write-back for non-dine-in (queue.store.markReady vs table.store orderStage)
- **Zustand selector safety**: select raw `orders: Record<string, QueueOrder>` from queue.store; derive filtered lists in useMemo -- never call derived-list functions inside selectors (per CLAUDE.md infinite loop pattern)
- **Sidebar badge for pending delivery**: pending count badge on queue nav item from day one (Phase 17) -- not deferred to polish phase
- **Platform OKLCH tokens**: Grab green oklch(0.72 0.18 145), LINE MAN blue oklch(0.55 0.22 260); added to :root and .dark independently tuned
- **Delivery payment in existing /payment/[tableId]**: conditional render block (`isDeliveryOrder`) avoids new route; coupon scan section hidden for delivery orders
- **Zero new npm packages**: setInterval in useEffect for delivery simulation (~25 LOC factory); no faker, xstate, msw, or fake-timers

### Bug Fixes (post-phase)

- **[2026-03-13] merged-table-status-not-clearing** -- After paying a merged bill, secondary tables stayed in "Check Requested". Root cause: both handleConfirmPayment and the SplitSheet onAllPaid callback called markCleaning only on the primary tableId. Fix: added `mergedSecondaryIds.forEach((id) => markCleaning(id))` in both paths inside payment/[tableId]/page.tsx. Resolved.

- **[2026-03-13] payment-redirect-loop-after-merge-pay** -- After paying a merged bill, tapping the secondary table tile on the floor plan redirected back into /payment/[primaryTableId]. Root cause: bill.store merge records were never dissolved at payment time, so TableTile's isMergedSecondary guard kept firing the payment redirect. Fix: added `dissolveAll(tableId)` in both handleConfirmPayment and onAllPaid in payment/[tableId]/page.tsx. Resolved.

### Blockers / Concerns

- **Delivery payment page scope (open):** Research flags a conflict between reusing /payment/[tableId] with a conditional block vs a separate /payment/delivery/[orderId] route. Recommendation is conditional block. Confirm and lock during Phase 18 planning.
- **KDS bump depth for delivery (open):** One post-Ready bump (Ready → PickedUp, removes from board) or two (Ready → ReadyForRider → PickedUp)? Confirm during Phase 18 planning to encode in getNextStage(current, orderType).

---

*State initialized: 2026-03-10 during roadmap creation*
*v1.0 archived: 2026-03-11*
*v1.1 archived: 2026-03-12*
*v1.2 archived: 2026-03-13*
*v1.3 roadmap created: 2026-03-15*
