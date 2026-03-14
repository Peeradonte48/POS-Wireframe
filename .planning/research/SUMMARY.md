# Project Research Summary

**Project:** A Ramen POS Wireframe — v1.3 Delivery & Takeaway Milestone
**Domain:** Restaurant POS — multi-channel order management (dine-in + delivery + takeaway)
**Researched:** 2026-03-15
**Confidence:** HIGH

## Executive Summary

This milestone adds two new order channels — third-party delivery (GrabFood, LINE MAN) and walk-in takeaway — to a mature dine-in POS wireframe that already handles floor management, order entry, KDS, split billing, and digital order tracking. The recommended approach is to build a single new `queue.store` that owns delivery/takeaway-specific metadata and lifecycle state, while reusing all existing stores (`order.store`, `kds.store`, `bill.store`) unchanged by keying them with namespaced string IDs (`TK-001`, `DL-grab-7821`). Zero new npm packages are required; all capabilities map directly to the existing stack.

The central architectural insight is that `order.store` and `kds.store` are already ID-agnostic — they operate on opaque string keys with no structural coupling to physical tables. Delivery and takeaway orders flow through the full existing pipeline (order entry, KDS bump, payment) with only minor additive changes at the seams: a null-safe header label fallback in the order page, a back-button conditional in the payment page, and a write-back in `KdsTicketCard.handleBump` for non-dine-in orders. `table.store` remains strictly dine-in and is never touched by delivery/takeaway flows.

The top risks are all store-boundary violations: forcing delivery orders into `table.store` (floor plan contamination), reusing `OrderStage`/`TableStatus` enums for delivery lifecycle states (semantic corruption), and routing delivery payment through `bill.store` (split/merge logic breaks). All three are prevented by the `queue.store` separation. The second risk category is visibility: pending delivery orders must surface in the sidebar as a badge count from day one, or they will be missed during demos.

---

## Key Findings

### Recommended Stack

The production stack (Next.js 16, React 19, Tailwind CSS 4, shadcn/ui with @base-ui/react, Zustand 5, Solar icons, sonner, CVA) handles this milestone with no additions. Every new feature maps to an existing capability: delivery simulation via `setInterval` in a `useEffect`, incoming order notifications via the existing `sonner` `ThemedToaster`, order type tagging via a TypeScript discriminated union, and platform color-coding via new CVA badge variants and OKLCH design tokens.

**Core technologies:**
- **Zustand 5 + persist**: New `queue.store.ts` (persist key `'queue-store'`) — owns delivery/takeaway lifecycle; existing stores unchanged
- **TypeScript discriminated union**: `OrderContext` type added as an optional field on `ActiveOrder` — zero regression, full type safety for new channels
- **CVA badge variants**: Three new variants (`'grab'`, `'lineman'`, `'takeaway'`) on the existing `Badge` component — no new components
- **OKLCH design tokens**: Six new CSS custom properties (`--color-status-grab-*`, `--color-status-lineman-*`, `--color-status-takeaway-*`) added to `:root` and `.dark` blocks
- **setInterval in useEffect**: Delivery queue simulation — no external library; a hand-written ~25 LOC factory produces contextually correct A Ramen menu items

Explicitly rejected: `@faker-js/faker` (300 kB, generic data), `xstate` (39 kB, overkill for 5 linear states), `msw` (no network layer to intercept), `@sinonjs/fake-timers` (test-only tool).

### Expected Features

**Must have (table stakes):**
- Delivery order queue: incoming card with platform badge, order number, customer name, items summary, elapsed timer
- Accept / Reject with reason selection (explicit staff confirmation required by all major platforms)
- Delivery status lifecycle: Pending → Accepted → Preparing → ReadyForRider → PickedUp
- Delivery orders auto-route to KDS on accept
- Platform source badge on KDS ticket (kitchen needs to know: plate or bag)
- New Takeaway entry point on the floor plan Takeaway tab
- Customer name + phone capture and sequential order number (TK-001) for takeaway
- Takeaway status progression: Taking → Sent → Ready → Collected
- Three tabs on the floor plan page: Dine-in / Takeaway / Delivery
- Active order count badge on Takeaway and Delivery tab triggers

**Should have (competitive differentiators):**
- Platform color-coding: Grab = green (oklch 0.72 0.18 145), LINE MAN = blue (oklch 0.55 0.22 260)
- Auto-accept toggle (skips Pending state during rush)
- Acceptance countdown timer with ring animation (highest demo visual impact)
- KDS order type filter tabs (All / Dine-in / Takeaway / Delivery)
- Takeaway pickup notification mock dialog
- Delivery count in manager EOD summary

**Defer (v2+):**
- Real GrabFood / LINE MAN API integration
- Delivery driver GPS / rider tracking map
- Dynamic ETA calculation
- Customer-facing pickup display screen
- Menu sync across delivery platforms
- Multi-platform aggregation middleware (Deliverect-style)
- Phone order intake channel

### Architecture Approach

The architecture separates concerns by store domain: `queue.store` owns the pre-entry through handoff lifecycle for both delivery and takeaway orders; `order.store` and `kds.store` own the cooking pipeline unchanged; `bill.store` handles dine-in split/merge and is not involved in delivery/takeaway payment. A single new `/queue` route in the `(app)` route group provides a dedicated queue board. The floor plan (`/table-map`) gains a Tabs wrapper with the Dine-in tab unchanged and two new TabsContent panels (`TakeawayPanel`, `DeliveryPanel`). Order entry and payment reuse existing routes via string-prefixed IDs with minimal conditional fallbacks at the call sites.

**Major components:**
1. `queue.store.ts` (new) — `QueueOrder` record with full lifecycle actions and `injectSimulatedDelivery()` for demo mode
2. `/queue/page.tsx` (new) — dedicated queue board showing pending delivery and active takeaway orders
3. `TakeawayPanel`, `DeliveryPanel`, `QueueOrderCard`, `NewTakeawayModal` (new) — queue UI components; no reuse of `TableTile`
4. `table-map/page.tsx` (modified) — wrapped in Tabs; Dine-in content is the existing `TableGrid` untouched
5. `KdsTicketCard.tsx` (modified) — `orderType` Badge in ticket header; write-back to `queue.store.markReady` on Ready bump for non-dine-in
6. `order.store.ts` (modified) — optional `context?: OrderContext` discriminated union field on `ActiveOrder`
7. `kds.store.ts` (modified) — `orderType` + `platform` fields on `KdsTicket`; updated `addTicket` signature

Files NOT modified: `table.store.ts`, `bill.store.ts`, `session.store.ts`, `manager.store.ts`, `TableGrid.tsx`, `TableTile.tsx`, `TableBottomSheet.tsx`, `OpenTableModal.tsx`, all order components, all payment components.

### Critical Pitfalls

1. **Forcing delivery/takeaway into `table.store`** — creates phantom floor tiles, corrupts `guestCount`/`servedAt` semantics, makes delivery IDs appear as merge candidates in `bill.store`. Prevention: `queue.store` for all non-dine-in records; `table.store` is strictly physical-table-only.

2. **Reusing `OrderStage` or `TableStatus` for delivery lifecycle** — "Reserved" and "Cleaning" are semantically wrong for delivery. Prevention: define `QueueOrderStatus` (`Pending | Confirmed | Ready | Completed | Cancelled`) as its own type in `queue.store` from day one; never append delivery states to existing enums.

3. **`bumpTicket` diverges by order type without an `orderType` field** — bumping past Ready removes a dine-in ticket (correct) but should transition delivery to `ReadyForRider` (wrong to remove). Prevention: add `orderType` to `KdsTicket`; add conditional write-back in `KdsTicketCard.handleBump`.

4. **No sidebar badge for pending delivery orders** — staff on the Dine-in tab miss incoming delivery orders during demos. Prevention: add pending count badge to the `'queue'` sidebar nav item driven by `queue.store` subscription from day one.

5. **Zustand selector returning new arrays from `queue.store`** — causes `useSyncExternalStore` infinite loop (documented in CLAUDE.md). Prevention: select raw `orders: Record<string, QueueOrder>` and derive filtered lists in `useMemo`; never call derived-list functions inside selectors.

---

## Implications for Roadmap

Based on the architectural phase dependency graph in ARCHITECTURE.md and the pitfall phase warnings in PITFALLS.md, four phases are recommended with strict dependency ordering.

### Phase A: Store Foundation + Types

**Rationale:** Every subsequent phase imports from `queue.store` and the new type definitions. Building UI before the store causes repeated refactors as types stabilize. This phase is purely additive — zero existing code paths change behavior, and the result is independently verifiable via TypeScript compilation.

**Delivers:**
- `src/stores/queue.store.ts` with `QueueOrder`, `QueueOrderStatus`, all lifecycle actions, and `injectSimulatedDelivery`
- `OrderContext` discriminated union added to `order.store.ActiveOrder` (optional field — backward compatible)
- `KdsTicket` extended with `orderType: KdsOrderType` and optional `platform` field; `addTicket` signature updated
- `role-permissions.ts` updated with `'queue'` NavSlug and `'new-takeaway'` ActionKey

**Addresses:** Delivery platform type model, sequential order counter, permission gating
**Avoids:** Pitfall 1 (store contamination), Pitfall 2 (enum reuse), Pitfall 11 (persist key collision — use `'queue-store'`), Pitfall 12 (missing nav permissions)

---

### Phase B: Floor Plan Tabs + Queue Entry UI

**Rationale:** Phase B generates the `orderId` strings (`TK-001`, `DL-grab-7821`) that Phase C handles in URL params. The simulated delivery injection button validates `queue.store` before the full KDS pipeline is wired. The sidebar badge for pending orders must land in this phase — not as a polish item — so it is present from first demo.

**Delivers:**
- `table-map/page.tsx` wrapped in Tabs (Dine-in tab is the existing `TableGrid`, untouched)
- `TakeawayPanel`, `DeliveryPanel`, `QueueOrderCard`, `NewTakeawayModal` components under `src/components/queue/`
- `/queue/page.tsx` dedicated queue view in `(app)` route group
- Sidebar badge count for pending delivery orders
- "Simulate Incoming Order" button in `DeliveryPanel` (mirrors existing KDS demo mode)

**Addresses:** Floor plan tabs, delivery queue cards, Accept/Reject with reason, takeaway new order entry, active count badges
**Avoids:** Pitfall 4 (separate tab state; `DeliveryQueueCard` not `TableTile`), Pitfall 6 (sidebar badge from day one), Pitfall 7 (dedicated `customerName`/`pickupNumber` fields in `TakeawayOrder`)

---

### Phase C: Order Entry + Payment Context Awareness

**Rationale:** Only meaningful once TK/DL orders exist in `queue.store` from Phase B to flow through order entry and verify end-to-end. Changes are targeted and low-risk — three lines in the order header, two conditionals in payment, one conditional block in `KdsTicketCard`.

**Delivers:**
- `order/[tableId]/page.tsx`: null-safe header label fallback to `queue.store` (`TK-001 · Customer Name`)
- `payment/[tableId]/page.tsx`: back-button conditional (`/queue` vs `/table-map`) + `queue.store.markCompleted` on confirm
- `KdsTicketCard.tsx`: write-back to `queue.store.markReady` on InProgress → Ready bump for non-dine-in orders
- `KdsBoard.tsx`: derive `orderType` from `order.context` and pass to `addTicket`

**Addresses:** Full end-to-end delivery and takeaway order flow, payment completion, KDS bump write-back
**Avoids:** Pitfall 3 (KDS bump divergence by order type), Pitfall 10 (`markServed` never called for delivery), Pitfall 15 (`markCleaning` never called for delivery)

---

### Phase D: KDS Visual Polish + Differentiators

**Rationale:** Display-only changes that are only meaningful once orders flow through the full stack. Entirely decoupled from data model decisions. Safe to implement last or scope-cut without blocking any functional requirement.

**Delivers:**
- `KdsTicketCard.tsx`: colored `orderType` Badge pill in ticket header (`DINE-IN` / `TAKEAWAY` / `DELIVERY`)
- Platform color OKLCH tokens in `globals.css` (6 new tokens in `:root` and `.dark`)
- New CVA badge variants (`'grab'`, `'lineman'`, `'takeaway'`) on existing `Badge` component
- KDS order type filter tabs (All / Dine-in / Takeaway / Delivery) — recommended if time allows
- Acceptance countdown timer ring animation — highest demo visual impact, medium effort

**Addresses:** Platform color-coding, KDS order type badge, KDS filter tabs, acceptance countdown timer
**Avoids:** Pitfall 8 (KDS ticket header loses meaning without type badge), Pitfall 14 (delivery urgency thresholds differ from dine-in — hardcode separate constants)

---

### Phase Ordering Rationale

- Phase A before all others: `queue.store` type definitions are imported by every new component; building UI first causes type-chasing refactors
- Phase B before Phase C: Phase B generates the order IDs that Phase C's URL param handling needs to resolve against `queue.store`
- Phase C before Phase D: visual order type tags on KDS tickets are only meaningful once delivery/takeaway orders actually appear on the KDS board
- Each phase produces an independently runnable and verifiable app state — no phase leaves the app in a broken state

### Research Flags

Phases with standard patterns (skip additional research):
- **Phase A (Store Foundation):** Zustand store creation follows the established pattern in this codebase; exact store shape is fully specified in ARCHITECTURE.md; TypeScript discriminated union is a standard pattern
- **Phase B (Floor Plan + Queue UI):** Tabs component exists and is verified in `src/components/ui/tabs.tsx`; component boundaries and props are fully specified; no external API integration
- **Phase D (Visual Polish):** CSS token additions and CVA variant extensions follow the exact same pattern as v1.1/v1.2

Phases that benefit from a pre-implementation code review:
- **Phase C (Order Entry + Payment):** Two existing pages are modified with conditional logic; reviewing the current implementations of `order/[tableId]/page.tsx` and `payment/[tableId]/page.tsx` before editing confirms exact insertion points and avoids regressions

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages; all existing capabilities verified against installed versions; rejections documented with rationale |
| Features | HIGH | Table stakes verified across Eats365, Deliveroo, DoorDash, Lightspeed, Square, Toast documentation; strong consensus |
| Architecture | HIGH | All findings from direct codebase inspection of all stores, pages, and key components; store ID-agnosticism confirmed by reading source |
| Pitfalls | HIGH | All critical pitfalls derived from direct codebase analysis; each names the exact file and code path that would be corrupted |

**Overall confidence:** HIGH

### Gaps to Address

- **Delivery payment page scope:** ARCHITECTURE.md recommends reusing `/payment/[tableId]` with a conditional render block, while PITFALLS.md (Pitfall 9) recommends a separate `/payment/delivery/[orderId]` to avoid showing the coupon scan section for delivery orders. Recommendation: use a conditional render block inside the existing payment page (`isDeliveryOrder && <PlatformSettlementSection />`) to minimize new files and keep the routing surface small. Validate this call during Phase C planning.

- **KDS bump depth for delivery:** PITFALLS.md describes `Ready → ReadyForRider → [removed]` (two post-Ready bumps for delivery), while ARCHITECTURE.md's `queue.store.markReady` write-back implies a single bump. Resolve before Phase C: confirm whether one or two post-Ready bumps are needed for the demo narrative, then encode in `getNextStage(current, orderType)` pure function.

- **Auto-accept toggle and sidebar badge interaction:** When auto-accept is enabled, orders skip Pending and the badge should count Confirmed + Ready orders, not just Pending. Ensure badge derivation accounts for this during Phase B.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/stores/order.store.ts`, `kds.store.ts`, `bill.store.ts`, `table.store.ts`, `session.store.ts`, `manager.store.ts`
- Direct codebase inspection: `src/components/kds/KdsBoard.tsx`, `KdsTicketCard.tsx`
- Direct codebase inspection: `src/app/(app)/order/[tableId]/page.tsx`, `payment/[tableId]/page.tsx`
- Direct codebase inspection: `src/lib/role-permissions.ts`, `src/components/ui/tabs.tsx`
- `CLAUDE.md` — Zustand selector infinite loop pattern, shadow token inline style requirement, `@base-ui/react` constraint, non-reactive `getState()` read pattern

### Secondary (MEDIUM confidence)
- Eats365 docs, Deliveroo help center, Grab/Deliverect integration docs — delivery accept/reject with reason confirmation
- DoorDash developer docs (Order Ready Signal), Deliveroo FAQ — "Ready for Rider" pattern
- Lightspeed O-Series, Square, Toast documentation — floor plan tabs per order type
- Toast KDS, Loman.ai articles — KDS order type color-coding

### Tertiary (LOW confidence)
- GrabFood/Foodpanda UX descriptions — acceptance countdown timer pattern (observed in UX descriptions, not formally documented)

---

*Research completed: 2026-03-15*
*Ready for roadmap: yes*
