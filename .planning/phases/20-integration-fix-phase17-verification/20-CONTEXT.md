# Phase 20: Integration Fix + Phase 17 Verification — Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Close two specific delivery channel gaps from the v1.3 audit and formally verify Phase 17 requirements. No new features — purely fix + verify.

**Gap 1 (DLVR-02):** `acceptOrder` in `queue.store.ts` calls `addTicket(order.orderId, order.orderId)` without `orderType:'delivery'` or `platform`. Result: live-accepted delivery orders appear as `DIN` on KDS instead of `GRAB`/`LINE MAN`, and the KDS Delivery filter tab doesn't count them.

**Gap 2 (NAV-02):** `pendingDeliveryCount` in `table-map/page.tsx` only counts `status === 'Pending'` delivery orders. The tab badge should count all active delivery states.

**Verify Phase 17:** Run gsd-verifier on Phase 17 to produce `17-VERIFICATION.md` covering all 12 Phase-17 requirements. Also formally verify KDS-01 and KDS-02 (implemented in Phase 19, never formally verified).

</domain>

<decisions>
## Implementation Decisions

### acceptOrder fix (DLVR-02)
- Pass `orderType: 'delivery'` and `platform: order.platform` as 3rd and 4th arguments to `addTicket` in `queue.store.ts` `acceptOrder` action
- One-line fix — no other callsites need changes (KdsBoard auto-register already handles dine-in correctly; payment page handles takeaway correctly)
- KDS Delivery filter tab fix (criterion 2) is automatically resolved by this same fix — live-accepted orders will have `orderType:'delivery'` and the `channelCounts.delivery` useMemo in KdsBoard will count them

### Floor plan Delivery tab badge (NAV-02)
- Rename `pendingDeliveryCount` to `activeDeliveryCount` in `table-map/page.tsx`
- Count all active delivery states: `Pending`, `Confirmed`, `Preparing`, `ReadyForRider`
- Exclude terminal states: `PickedUp`, `Rejected`
- Badge style: unchanged (same small count pill as current)
- Badge visibility: only when `activeDeliveryCount > 0` (keep current conditional render behavior)
- This matches the `activeQueueCount` logic already in `AppSidebar.tsx` — consistent counting across the UI

### Phase 17 verification
- Run `gsd-verifier` on Phase 17 to produce `.planning/phases/17-queue-store-floor-plan-tabs/17-VERIFICATION.md`
- Scope: all 12 Phase-17 requirements (NAV-01, DLVR-01 through DLVR-09, TKWY-01)
- If verifier finds code gaps: fix them inline within Phase 20 (same phase, not a follow-up task)
- Phase 20 VERIFICATION.md: one combined artifact covering Phase 20's own 4 requirements (DLVR-02, KDS-01, KDS-02, NAV-02)
- Phase 17 VERIFICATION.md and Phase 20 VERIFICATION.md are separate artifacts

### Claude's Discretion
- Variable naming for the useMemo result in table-map/page.tsx (e.g. `activeDeliveryCount` vs `deliveryBadgeCount`)
- Whether to leave a code comment referencing the gap it fixes (nice to have for traceability)
- Order of gsd-verifier vs code fix execution in plan waves

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/queue.store.ts` `acceptOrder` (line ~89): `useKdsStore.getState().addTicket(order.orderId, order.orderId)` — fix is adding `'delivery'` and `order.platform` as 3rd/4th args
- `src/app/(app)/table-map/page.tsx` `pendingDeliveryCount` useMemo (line ~19–23): change filter from `o.status === 'Pending'` to `['Pending','Confirmed','Preparing','ReadyForRider'].includes(o.status)`
- `src/components/kds/KdsBoard.tsx`: Already correctly handles delivery channel filter tab counting via `channelCounts.delivery` useMemo — no changes needed here once the metadata fix lands
- `src/components/app-shell/AppSidebar.tsx` `activeQueueCount` (line ~50–57): Already uses the correct multi-status counting logic — reference pattern for table-map fix

### Established Patterns
- Zustand selector safety: select raw `orders` Record, derive counts in `useMemo` — per CLAUDE.md
- Non-reactive reads: `useKdsStore.getState()` / `useQueueStore.getState()` for static reads
- `addTicket` signature: `(tableId: string, tableLabel: string, orderType?, platform?)`

### Integration Points
- `queue.store.ts` `acceptOrder`: single-line fix at the `addTicket` call
- `table-map/page.tsx`: rename + widen the filter in the `pendingDeliveryCount` useMemo
- Phase 17 directory: `gsd-verifier` writes `17-VERIFICATION.md` there

</code_context>

<specifics>
## Specific Ideas

- The metadata drop fix is surgical — one additional argument to `addTicket` unblocks both DLVR-02 criterion 1 and criterion 2 simultaneously
- The floor plan badge fix mirrors the sidebar's existing `activeQueueCount` logic exactly — same status list
- Phase 17 verifier should check actual rendered output against requirements (e.g. DLVR-09 countdown ring, DLVR-07 platform badge + timer, DLVR-08 auto-accept toggle)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-integration-fix-phase17-verification*
*Context gathered: 2026-03-15*
