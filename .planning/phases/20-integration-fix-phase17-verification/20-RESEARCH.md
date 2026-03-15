# Phase 20: Integration Fix + Phase 17 Verification — Research

**Researched:** 2026-03-15
**Domain:** Zustand cross-store write-back, useMemo derivation, gsd-verifier workflow
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**acceptOrder fix (DLVR-02)**
- Pass `orderType: 'delivery'` and `platform: order.platform` as 3rd and 4th arguments to `addTicket` in `queue.store.ts` `acceptOrder` action
- One-line fix — no other callsites need changes (KdsBoard auto-register already handles dine-in correctly; payment page handles takeaway correctly)
- KDS Delivery filter tab fix (criterion 2) is automatically resolved by this same fix — live-accepted orders will have `orderType:'delivery'` and the `channelCounts.delivery` useMemo in KdsBoard will count them

**Floor plan Delivery tab badge (NAV-02)**
- Rename `pendingDeliveryCount` to `activeDeliveryCount` in `table-map/page.tsx`
- Count all active delivery states: `Pending`, `Confirmed`, `Preparing`, `ReadyForRider`
- Exclude terminal states: `PickedUp`, `Rejected`
- Badge style: unchanged (same small count pill as current)
- Badge visibility: only when `activeDeliveryCount > 0` (keep current conditional render behavior)
- This matches the `activeQueueCount` logic already in `AppSidebar.tsx` — consistent counting across the UI

**Phase 17 verification**
- Run `gsd-verifier` on Phase 17 to produce `.planning/phases/17-queue-store-floor-plan-tabs/17-VERIFICATION.md`
- Scope: all 12 Phase-17 requirements (NAV-01, DLVR-01 through DLVR-09, TKWY-01)
- If verifier finds code gaps: fix them inline within Phase 20 (same phase, not a follow-up task)
- Phase 20 VERIFICATION.md: one combined artifact covering Phase 20's own 4 requirements (DLVR-02, KDS-01, KDS-02, NAV-02)
- Phase 17 VERIFICATION.md and Phase 20 VERIFICATION.md are separate artifacts

### Claude's Discretion
- Variable naming for the useMemo result in table-map/page.tsx (e.g. `activeDeliveryCount` vs `deliveryBadgeCount`)
- Whether to leave a code comment referencing the gap it fixes (nice to have for traceability)
- Order of gsd-verifier vs code fix execution in plan waves

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DLVR-02 | Staff can accept an incoming delivery order (auto-routes to KDS) | `acceptOrder` in `queue.store.ts:89` — single-line fix adds `'delivery', order.platform` as 3rd/4th args to `addTicket`; all data already available on the `order` object at callsite |
| KDS-01 | KDS tickets show an order type badge (Dine-in / Takeaway / Delivery + platform) | Downstream of DLVR-02 fix — `getOrderTypeBadgeVariant` in `KdsTicketCard.tsx` already reads `ticket.orderType` and `ticket.platform`; once addTicket gets the args, live delivery tickets will render `GRAB`/`LINE MAN` badges |
| KDS-02 | KDS board can be filtered by order type (All / Dine-in / Takeaway / Delivery) | Downstream of DLVR-02 fix — `channelCounts.delivery` useMemo in `KdsBoard.tsx` already filters on `t.orderType === 'delivery'`; live-accepted tickets will count once they carry the metadata |
| NAV-02 | Takeaway and Delivery tabs show a live badge count of active orders | `pendingDeliveryCount` useMemo in `table-map/page.tsx:19-25` — widen status filter from `o.status === 'Pending'` to `['Pending','Confirmed','Preparing','ReadyForRider'].includes(o.status)` and rename the variable |
</phase_requirements>

---

## Summary

Phase 20 closes two surgical integration gaps found in the v1.3 milestone audit and produces the missing Phase 17 VERIFICATION.md. The code changes are minimal by design — the audit traced both bugs to single locations with well-understood root causes.

**Gap 1 (DLVR-02 / KDS-01 / KDS-02):** `acceptOrder` in `queue.store.ts` at line 89 calls `addTicket(order.orderId, order.orderId)` without channel metadata. The `addTicket` signature already accepts optional 3rd/4th args (`orderType` and `platform`) — they are simply not being passed. Adding `'delivery', order.platform` as arguments is a one-line fix that simultaneously unblocks DLVR-02, KDS-01, and KDS-02 because the downstream consumers (`KdsTicketCard` badge variants and `KdsBoard` channel filter) already handle these fields correctly for demo-injected tickets.

**Gap 2 (NAV-02):** `pendingDeliveryCount` in `table-map/page.tsx` only counts `status === 'Pending'` delivery orders. After a staff member accepts an order, its status advances to `Confirmed`, `Preparing`, or `ReadyForRider` — none of which were counted. The reference implementation already exists in `AppSidebar.tsx`'s `activeQueueCount` useMemo, which uses the correct multi-status filter. The fix is to mirror that pattern.

**Phase 17 Verification:** Phase 17 was fully executed (all 4 plans have SUMMARY.md files) but `gsd-verifier` was never run, leaving all 12 Phase-17 requirements formally unverified. This phase runs the verifier to produce `17-VERIFICATION.md` and fixes any inline code gaps the verifier surfaces.

**Primary recommendation:** Apply the two code fixes first (a single commit each), then run gsd-verifier on Phase 17 — this way the verifier sees the fixed codebase and can verify DLVR-02, KDS-01, KDS-02 as fully wired rather than flagging the known gap.

---

## Standard Stack

### Core (no new packages — all already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand 5 | 5.x | `queue.store.ts` store actions | All stores use Zustand; cross-store write-back via `getState()` is the established pattern |
| React `useMemo` | React 19 | Derive `activeDeliveryCount` from raw `orders` record | MANDATORY per CLAUDE.md — never derive arrays inside Zustand selectors |
| TypeScript 5 (strict) | 5.x | Type-check that `addTicket` args match `KdsTicket` interface | `npm run build` is the only correctness gate |

### Alternatives Considered

None — the fix surfaces are fully constrained by existing architecture. No library choices involved.

**Installation:** No new packages required.

---

## Architecture Patterns

### Exact Fix Locations

```
src/
├── stores/
│   └── queue.store.ts          # Line 89: addTicket missing 3rd/4th args — one-line fix
└── app/(app)/table-map/
    └── page.tsx                # Lines 19-25: pendingDeliveryCount — rename + widen filter
```

### Pattern 1: addTicket Signature (confirmed from source)

**What:** `addTicket` in `kds.store.ts` accepts four parameters — `tableId`, `tableLabel`, and optional `orderType` and `platform`. The optional args default to `undefined` if omitted, which causes `KdsTicket.orderType` to be `undefined`, which `KdsBoard` treats as `'dine-in'` via the `?? 'dine-in'` fallback.

**The fix:**
```typescript
// Source: src/stores/queue.store.ts — acceptOrder action, line 89
// BEFORE (broken — orderType undefined on resulting KdsTicket):
useKdsStore.getState().addTicket(order.orderId, order.orderId)

// AFTER (fixed — KdsTicket gets orderType:'delivery' and correct platform):
useKdsStore.getState().addTicket(order.orderId, order.orderId, 'delivery', order.platform)
```

Both `order.orderId` (string) and `order.platform` (`'grab' | 'lineman' | undefined`) are already available on the `order` object captured at the top of `acceptOrder`. No new data fetching or type imports needed.

### Pattern 2: activeDeliveryCount useMemo (confirmed from AppSidebar.tsx)

**What:** The reference implementation is `activeQueueCount` in `AppSidebar.tsx` lines 50-57. It uses the same `orders` record selection + `useMemo` pattern and already uses the correct multi-status filter for delivery. The table-map fix mirrors this exactly.

**The fix:**
```typescript
// Source: src/app/(app)/table-map/page.tsx — lines 19-25
// BEFORE (broken — only counts Pending, misses accepted orders):
const pendingDeliveryCount = useMemo(
  () =>
    Object.values(orders).filter(
      (o) => o.channel === 'delivery' && o.status === 'Pending'
    ).length,
  [orders]
)

// AFTER (fixed — counts all active delivery states):
const activeDeliveryCount = useMemo(
  () =>
    Object.values(orders).filter(
      (o) =>
        o.channel === 'delivery' &&
        ['Pending', 'Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
    ).length,
  [orders]
)
```

The JSX reference `pendingDeliveryCount` on line 68 must also be updated to `activeDeliveryCount`.

### Pattern 3: Reference Implementation in AppSidebar.tsx

**What:** The sidebar's `activeQueueCount` shows the exact status list to use for delivery. Confirmed from source (lines 52-55):

```typescript
// Source: src/components/app-shell/AppSidebar.tsx lines 50-57
const activeQueueCount = useMemo(
  () =>
    Object.values(orders).filter((o) => {
      if (o.channel === 'delivery') {
        return ['Pending', 'Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
      }
      // ... takeaway branch
    }).length,
  [orders]
)
```

This confirms the canonical list of active delivery states: `Pending`, `Confirmed`, `Preparing`, `ReadyForRider`. Terminal states (`PickedUp`, `Rejected`) are excluded.

### Anti-Patterns to Avoid

- **Touching KdsBoard.tsx:** No changes needed. `channelCounts.delivery` already correctly filters `t.orderType === 'delivery'`. Once the fix lands in queue.store, live delivery tickets will be counted automatically.
- **Touching KdsTicketCard.tsx:** No changes needed. `getOrderTypeBadgeVariant` and `getOrderTypeLabel` already handle `orderType:'delivery'` with `platform:'grab'`/`platform:'lineman'`. The fix is entirely upstream.
- **Fixing takeaway callsites:** `addTicket` calls for takeaway (in `payment/[tableId]/page.tsx`) already pass `'takeaway'` as the third arg — confirmed from STATE.md note `[18-03]`. No changes there.
- **Widening filter in AppSidebar.tsx:** The sidebar already uses the correct multi-status logic. Only `table-map/page.tsx` needs updating.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Delivery status counting | New derived state field on queue.store | `useMemo` on raw `orders` record | Follows CLAUDE.md mandatory pattern; avoids Zustand selector infinite loop |
| Platform type checking | Manual string comparison | TypeScript checks `DeliveryPlatform` union (`'grab' | 'lineman'`) | `order.platform` is already typed correctly; the fix passes it directly |

---

## Common Pitfalls

### Pitfall 1: Updating JSX but not the useMemo variable name

**What goes wrong:** Renaming `pendingDeliveryCount` to `activeDeliveryCount` in the `useMemo` declaration but leaving the JSX reference at line 68 unchanged — TypeScript error "Cannot find name 'pendingDeliveryCount'".

**How to avoid:** Both the useMemo declaration (line 19) and the JSX usage (line 68) must be updated in the same commit. Search for all usages of `pendingDeliveryCount` in the file before committing.

**Warning signs:** `npm run build` fails with "Cannot find name" error.

### Pitfall 2: Passing order.platform without checking the type

**What goes wrong:** `order.platform` is typed as `DeliveryPlatform | undefined`. The `addTicket` signature accepts `platform?: 'grab' | 'lineman'` — so passing `undefined` is valid TypeScript and will silently revert to the broken behavior for orders that somehow lack a platform.

**How to avoid:** This is not actually a risk in practice — delivery orders always have a platform assigned by `buildMockDeliveryOrder()`. But the fix is type-safe regardless because passing `undefined` for an optional param is valid; the fix just makes the intent explicit by passing `order.platform` directly.

### Pitfall 3: gsd-verifier run on unpatched code

**What goes wrong:** Running Phase 17 verification before the code fixes are committed means the verifier will flag DLVR-02, KDS-01, and KDS-02 as broken (correctly), and the Phase 17 VERIFICATION.md will show those as failed.

**How to avoid:** Apply both code fixes and commit them before running gsd-verifier on Phase 17. The CONTEXT.md allows discretion on ordering — fix-first is the correct order for a clean verification result.

### Pitfall 4: Merging Phase 17 and Phase 20 VERIFICATION artifacts

**What goes wrong:** Producing one VERIFICATION.md that covers both Phase 17 requirements (12 reqs) and Phase 20 requirements (4 reqs).

**How to avoid:** Per locked decisions — two separate artifacts:
- `.planning/phases/17-queue-store-floor-plan-tabs/17-VERIFICATION.md` — covers 12 Phase-17 reqs
- `.planning/phases/20-integration-fix-phase17-verification/20-VERIFICATION.md` — covers 4 Phase-20 reqs (DLVR-02, KDS-01, KDS-02, NAV-02)

---

## Code Examples

### Confirmed addTicket signature (kds.store.ts)

```typescript
// Source: src/stores/kds.store.ts lines 33, 52-68
addTicket: (tableId: string, tableLabel: string, orderType?: 'dine-in' | 'takeaway' | 'delivery', platform?: 'grab' | 'lineman') => void

// Implementation confirms: orderType and platform are stored directly on KdsTicket
const ticket: KdsTicket = {
  ticketId,
  tableId,
  tableLabel,
  addedAt: Date.now(),
  stage: 'New',
  checkedItems: new Set<string>(),
  orderType,   // <-- passes through as-is from arg
  platform,    // <-- passes through as-is from arg
}
```

### Confirmed channelCounts derivation (KdsBoard.tsx)

```typescript
// Source: src/components/kds/KdsBoard.tsx lines 36-44
const channelCounts = useMemo(() => {
  const ticketList = Object.values(tickets)
  return {
    all:        ticketList.length,
    'dine-in':  ticketList.filter((t) => !t.orderType || t.orderType === 'dine-in').length,
    takeaway:   ticketList.filter((t) => t.orderType === 'takeaway').length,
    delivery:   ticketList.filter((t) => t.orderType === 'delivery').length,
  }
}, [tickets])
```

Once live delivery tickets have `orderType: 'delivery'`, the `delivery` count will include them. No changes to this file needed.

### Confirmed channel filter logic (KdsBoard.tsx)

```typescript
// Source: src/components/kds/KdsBoard.tsx lines 102-112
const stageTickets = Object.values(tickets).filter((t) => {
  if (t.stage !== stage) return false
  if (activeChannelFilter !== 'all') {
    const effectiveType = t.orderType ?? 'dine-in'  // undefined treated as dine-in
    if (effectiveType !== activeChannelFilter) return false
  }
  // ...
})
```

The `?? 'dine-in'` fallback is the root cause: live delivery tickets with `orderType: undefined` fall through to the dine-in bucket. The fix makes them carry `orderType: 'delivery'` so the comparison succeeds correctly.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `addTicket(order.orderId, order.orderId)` — no channel metadata | `addTicket(order.orderId, order.orderId, 'delivery', order.platform)` — full metadata | Phase 20 fix | Live delivery tickets render GRAB/LINE MAN badge; Delivery filter tab counts them |
| `pendingDeliveryCount` — counts only `Pending` | `activeDeliveryCount` — counts all active states | Phase 20 fix | Tab badge reflects actual staff workload, not just queue of unanswered orders |

**Tech debt items NOT in Phase 20 scope** (from audit, deferred):
- DLVR-07: Elapsed timer for post-accept delivery stages — design decision, not a bug
- Phase 18 SUMMARY.md `requirements-completed` missing TKWY-04 — doc-only fix, Phase 21

---

## Open Questions

1. **Does gsd-verifier find additional Phase 17 inline code gaps?**
   - What we know: The audit identified DLVR-02, KDS-01, KDS-02 as the only hard code gaps in Phase 17's domain. All other 9 requirements (NAV-01, DLVR-01, DLVR-03–09, TKWY-01) are listed as `WIRED` in the audit.
   - What's unclear: The verifier may surface edge cases or minor discrepancies not caught by the integration checker.
   - Recommendation: If verifier finds gaps, fix inline within Phase 20 per locked decisions. Most likely no additional code gaps exist for the non-DLVR-02 requirements.

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler + ESLint (no test framework per CLAUDE.md) |
| Config file | `tsconfig.json` / `.eslintrc` |
| Quick run command | `npm run build` |
| Full suite command | `npm run build && npm run lint` |
| Estimated runtime | ~15 seconds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DLVR-02 | `acceptOrder` passes `'delivery'` and `order.platform` to `addTicket` | build (type-check) | `npm run build` | ✅ `src/stores/queue.store.ts` |
| KDS-01 | Live delivery KDS tickets show GRAB/LINE MAN badge (not DIN) | manual | Stakeholder demo — accept delivery order, check KDS ticket badge | N/A |
| KDS-02 | KDS Delivery filter tab counts live-accepted delivery orders | manual | Stakeholder demo — accept delivery order, check Delivery filter count | N/A |
| NAV-02 | Delivery tab badge counts Confirmed/Preparing/ReadyForRider orders | build (type-check) + manual | `npm run build` + visual check after accepting an order | ✅ `src/app/(app)/table-map/page.tsx` |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Full build + lint green before `/gsd:verify-work`

### Wave 0 Gaps

None — no new files or test infrastructure needed. Both fix locations are existing files.

---

## Sources

### Primary (HIGH confidence)

- Direct source read: `src/stores/queue.store.ts` — confirmed `acceptOrder` at line 89, confirmed `addTicket` call missing args, confirmed `order.platform` available in scope
- Direct source read: `src/stores/kds.store.ts` — confirmed `addTicket` signature (4 args, optional 3rd/4th), confirmed `KdsTicket` fields `orderType` and `platform`
- Direct source read: `src/app/(app)/table-map/page.tsx` — confirmed `pendingDeliveryCount` useMemo at lines 19-25, confirmed `pendingDeliveryCount` JSX reference at line 68
- Direct source read: `src/components/kds/KdsBoard.tsx` — confirmed `channelCounts` useMemo, confirmed `?? 'dine-in'` fallback behavior, confirmed no changes needed
- Direct source read: `src/components/app-shell/AppSidebar.tsx` — confirmed `activeQueueCount` useMemo with correct multi-status filter as reference implementation
- Direct read: `.planning/phases/20-integration-fix-phase17-verification/20-CONTEXT.md` — locked decisions, exact fix specifications
- Direct read: `.planning/v1.3-MILESTONE-AUDIT.md` — root cause analysis, integration map, confirmed MISSING-01 at `queue.store.ts:89`
- Direct read: `.planning/REQUIREMENTS.md` — DLVR-02, KDS-01, KDS-02, NAV-02 definitions
- Direct read: `.planning/STATE.md` — architecture decisions including `[18-03]` takeaway addTicket already correct
- Direct read: `.planning/phases/17-queue-store-floor-plan-tabs/17-VALIDATION.md` — confirmed nyquist_compliant:false, Phase 17 never formally verified
- Direct read: `CLAUDE.md` — Zustand selector infinite loop prevention pattern, useMemo mandatory, `getState()` non-reactive read pattern

### Secondary (MEDIUM confidence)

- `.planning/phases/17-queue-store-floor-plan-tabs/17-01-SUMMARY.md` — confirmed Phase 17 execution history; `acceptOrder` cross-store write-back established in Plan 01 but arg bug introduced silently

---

## Metadata

**Confidence breakdown:**
- DLVR-02 fix: HIGH — root cause confirmed in source at exact line; fix is one argument addition; both pieces of data (`'delivery'` literal and `order.platform`) are in scope
- NAV-02 fix: HIGH — broken filter confirmed in source; reference implementation confirmed in AppSidebar.tsx; status list confirmed from QueueOrderStatus type
- KDS-01 / KDS-02 resolution: HIGH — both are downstream consumers of the DLVR-02 fix; KdsBoard and KdsTicketCard source confirms no changes needed there
- Phase 17 verification scope: HIGH — 12 requirements confirmed from REQUIREMENTS.md traceability table; VERIFICATION.md absence confirmed from audit and phase directory listing

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable stack; no npm changes; fix is deterministic)
