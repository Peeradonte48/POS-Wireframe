# Phase 12: Split Bill - Research

**Researched:** 2026-03-12
**Domain:** In-memory state modeling for payment splitting + React UI composition within existing bottom sheet pattern
**Confidence:** HIGH

## Summary

Phase 12 is an entirely internal state + UI composition problem with zero new npm dependencies. The codebase is already at the exact capability level needed: bottom sheet infrastructure exists in `TableBottomSheet.tsx` and `ModifierSheet.tsx`, the payment panel components (`CashPanel`, `QrPanel`, `CardPanel`, `PaymentMethodSelector`) are pure presentational components that accept a `grandTotal` prop, and `table.store` already provides `guestCount` and `markCleaning`. The only new file needed is `bill.store.ts` — a Zustand persist store keyed by `tableId` holding split mode, seat definitions, item assignments, and per-seat payment state.

The core implementation challenge is data modeling: the store must represent a flat list of "slot assignments" (lineId + seatIndex + assignedQty) rather than duplicating line items, because items with `quantity > 1` can be split across seats. VAT rounding uses the floor + remainder-on-last integer pattern already used on the payment page. The bottom sheet must handle two distinct internal view states (mode selector → seat cards) and a nested payment panel for each seat.

The `TableTile` integration is a single conditional badge in the existing `absolute top-2 right-2` slot — it reads a derived selector from `bill.store` and replaces the `orderStage` badge when a split is active. The amber/orange color token needs to be defined as a new CSS variable following the established OKLCH pattern in `globals.css`.

**Primary recommendation:** Build `bill.store.ts` first with the full TypeScript interface, then build the `SplitSheet` component as a self-contained file, then wire `TotalsSection` and `TableTile`. This ordering means each step is independently testable.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Split Entry Flow**
- Tapping 'Split Bill' opens a bottom sheet (slides up over the payment page — consistent with existing modifier sheet pattern)
- Sheet shows a mode selector first: Equal Split vs Per Seat — staff picks mode, then sheet adapts
- If the table already has an active split in bill.store (partial payment), the payment page auto-detects and opens the split sheet automatically on entry, resuming mid-split
- Staff can always cancel a split and return to normal payment — even after partial payment (bill.store resets, already-paid seats are treated as an edge case for the wireframe)

**Equal Split Mode**
- Staff enters guest count N — system divides grand total into N shares using floor + remainder-on-last rounding in satang
- Sheet transitions to show N seat cards, each payable in-sheet — staff taps a seat card to pay it
- No separate screen — the whole equal split flow stays inside the bottom sheet

**Per-Seat Item Assignment UX**
- Seat count defaults to the table's guest count (from table.store), adjustable with +/− buttons
- Item assignment: tap item → seat picker appears (numbered seat buttons)
- Items start in an "Unassigned" bucket at the top; as assigned, they move to the seat's section below
- All items must be assigned before any seat's Pay button is enabled (unassigned bucket = Pay disabled)
- Staff can re-assign an already-assigned item by tapping it again — seat picker appears to change destination
- For items with quantity > 1, a quantity picker appears in the seat picker (e.g. "How many to Seat 1? [1] of 2")
- Remaining qty stays unassigned until fully distributed

**Seat Payment Flow**
- Tapping a seat card to pay opens a nested panel (or secondary sheet) with the full Cash/QR/Card selector — reuses existing PaymentMethodSelector, CashPanel, QrPanel, CardPanel
- VAT calculated and shown per seat: each seat shows its own subtotal + VAT 7% + seat total (floor + remainder-on-last)
- Paid/settled seat card shows: green 'Settled' badge + payment method label, card dimmed/muted — cannot be paid again
- When the last seat is paid: auto-confirm — markCleaning(tableId) called, split sheet closes, navigates to existing ReceiptScreen

**Split Progress Badge (TableTile)**
- While split is in progress, the top-right badge on TableTile replaces the orderStage badge with "2/4 paid"
- Badge style: amber/orange filled badge with a split/scissors icon + "X/N paid"
- Table status badge (left border + status pill) stays 'Check Requested' — split badge is the new info layer, not a new status
- Badge disappears when all seats paid and table transitions to Cleaning (at which point the slot is empty again)

### Claude's Discretion
- Exact Solar icon to use for the split badge (scissors, card, or other)
- Animation/transition between mode selector and seat cards inside the sheet
- Exact amber OKLCH token value (should align with the status token system in globals.css)
- Exact layout of the nested seat payment panel (full sheet vs in-sheet collapse)
- Error/edge case handling when split is cancelled after partial payment (reset state, show toast)

### Deferred Ideas (OUT OF SCOPE)
- Merge bill — combining two tables' bills — Phase 14
- Custom amount split (arbitrary baht per person) — v2 requirement (PAY-01)
- Percentage split (e.g. 60/40) — v2 requirement (PAY-02)
- Unsplit after partial payment — complex edge case; for now, cancel split always resets (wireframe simplification)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SPLIT-01 | Staff can split bill equally by N guests — system divides total / N with correct VAT rounding (floor + remainder-on-last in satang) | bill.store equal-split computation; integer math pattern confirmed from existing payment page (`Math.round(subtotal * 0.07)` → same floor approach per seat) |
| SPLIT-02 | Staff can split bill per-seat by assigning items to individual seats — each seat sub-bill totals correctly with VAT | SeatAssignment model in bill.store; per-seat subtotal derivation; partial-qty assignment for items qty > 1 |
| SPLIT-03 | Each seat can be paid independently (Cash/QR/Card) with paid seats showing settled state; table closes only when all seats paid | Per-seat payment state in bill.store; reuse of CashPanel/QrPanel/CardPanel with per-seat grandTotal; last-seat → markCleaning trigger |
| SPLIT-04 | Table tile shows split progress badge (e.g. "2/4 paid") when bill is partially settled | bill.store selector for paidCount/totalSeats per tableId; TableTile conditional badge in existing absolute top-2 right-2 slot |
</phase_requirements>

---

## Standard Stack

No new npm packages. Zero additions to package.json.

### Core (existing)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand 5 | 5.x | bill.store — new persist store for split state | Project standard for all cross-route state |
| React 19 | 19.x | SplitSheet component, seat cards, nested payment panel | Project framework |
| Next.js 16 | 16.x | App Router, no new routes needed | Project framework |
| Tailwind CSS 4 | 4.x | Styling via `@theme` tokens + utility classes | Project standard |
| Solar icon set | latest | Icons for split badge and sheet UI | Project standard for all icons |
| CVA | latest | Seat card variant (settled/active) | Project standard for component variants |
| sonner | latest | Toast on split cancel/reset | Project standard for toasts |

**Installation:** none required.

## Architecture Patterns

### New File: `src/stores/bill.store.ts`

This is the only new file that is purely logic (no UI). Everything else is UI composition.

```typescript
// src/stores/bill.store.ts
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SplitMode = 'equal' | 'per-seat'

export interface SeatAssignment {
  lineId: string      // references OrderLineItem.lineId
  seatIndex: number   // 0-based seat index
  assignedQty: number // partial qty assigned to this seat (for qty>1 items)
}

export interface SeatPaymentRecord {
  method: 'Cash' | 'QR PromptPay' | 'Card'
  paidAt: number // Date.now()
  amount: number // satang-rounded seat total
}

export interface BillSplit {
  tableId: string
  mode: SplitMode
  seatCount: number
  // For equal mode: pre-computed seat amounts [seat0, seat1, ...]
  // Index length === seatCount; last seat absorbs remainder
  equalAmounts: number[]
  // For per-seat mode: assignment records
  assignments: SeatAssignment[]
  // Payment records per seat index (undefined = unpaid)
  payments: Record<number, SeatPaymentRecord>
}

interface BillStore {
  splits: Record<string, BillSplit> // keyed by tableId
  initEqualSplit: (tableId: string, grandTotal: number, seatCount: number) => void
  initPerSeatSplit: (tableId: string, seatCount: number) => void
  assignItem: (tableId: string, lineId: string, seatIndex: number, qty: number) => void
  unassignItem: (tableId: string, lineId: string) => void
  recordPayment: (tableId: string, seatIndex: number, record: SeatPaymentRecord) => void
  cancelSplit: (tableId: string) => void
  getSplit: (tableId: string) => BillSplit | undefined
}
```

**Key invariant:** `equalAmounts` must sum exactly to `grandTotal`. Use integer math:
```typescript
// floor + remainder-on-last
function computeEqualAmounts(grandTotal: number, n: number): number[] {
  const base = Math.floor(grandTotal / n)
  const remainder = grandTotal - base * n
  return Array.from({ length: n }, (_, i) =>
    i === n - 1 ? base + remainder : base
  )
}
```

**Per-seat VAT formula (mirrors payment page exactly):**
```typescript
// Each seat: subtotal → vat → total (all floor + remainder-on-last for the seat)
const seatSubtotal = /* sum of assignedQty × basePrice for this seat's assignments */
const seatVat = Math.round(seatSubtotal * 0.07)
const seatTotal = seatSubtotal + seatVat
```

Note: for per-seat mode the sum of all seatTotals may differ from grandTotal by ±1 satang due to per-seat VAT rounding. This is acceptable for a wireframe and is the standard Thai POS behaviour.

### New File: `src/components/payment/SplitSheet.tsx`

Single file for the full split bottom sheet. Internal view state machine:

```
'mode-select'   → user picks Equal Split or Per Seat
'equal-config'  → enter N, confirm → transitions to 'equal-seats'
'equal-seats'   → N seat cards, each tappable to pay
'per-seat-assign' → unassigned bucket + seat sections, item tap → seat picker
'per-seat-pay'  → all assigned; seat cards with Pay buttons
```

Active seat payment panel is an in-sheet expansion (not a new sheet):
- Tapping "Pay Seat N" expands a `SeatPaymentPanel` inline (collapses others)
- `SeatPaymentPanel` renders `PaymentMethodSelector` + conditional `CashPanel`/`QrPanel`/`CardPanel` with `seatTotal` as `grandTotal` prop
- On confirm: `recordPayment(tableId, seatIndex, record)` → if last seat: `markCleaning(tableId)` + close sheet + navigate to ReceiptScreen

### Bottom Sheet Construction Pattern (copy from existing)

Confirmed pattern from `TableBottomSheet.tsx` and `ModifierSheet.tsx`:

```tsx
// Backdrop
<div
  onClick={onClose}
  className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
/>

// Panel
<div
  style={{ boxShadow: 'var(--shadow-floating)' }}
  className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
    transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto
    ${open ? 'translate-y-0' : 'translate-y-full'}`}
>
  {/* Drag handle */}
  <div className="flex justify-center pt-3 pb-1">
    <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
  </div>
  {/* content */}
</div>
```

Body scroll lock (copy from both existing sheets):
```tsx
useEffect(() => {
  if (open) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = ''
  return () => { document.body.style.overflow = '' }
}, [open])
```

### Color Token: Split Badge Amber

Add to `globals.css` following the established OKLCH status token pattern:

```css
/* In :root */
--status-split:    oklch(0.62 0.18 60);   /* amber-orange fg */
--status-split-bg: oklch(0.96 0.06 60);   /* amber-orange bg */

/* In .dark */
--status-split:    oklch(0.78 0.16 60);
--status-split-bg: oklch(0.28 0.08 60);
```

And in `@theme inline`:
```css
--color-status-split:    var(--status-split);
--color-status-split-bg: var(--status-split-bg);
```

Hue 60 is the amber-gold range in OKLCH, consistent with the check-requested token at hue 75 but distinctly more orange. These values are tuned to match the visual weight of other status tokens.

### TableTile Integration

The `orderStage` badge slot is `absolute top-2 right-2`. The split badge replaces it when a split is active for the table:

```tsx
// In TableTile.tsx — add bill.store read
import { useBillStore } from '@/stores/bill.store'

// Inside component:
const split = useBillStore((s) => s.getSplit(table.id))
const paidCount = split ? Object.keys(split.payments).length : 0
const showSplitBadge = split !== undefined && table.status === 'CheckRequested'

{/* Order stage / split progress badge */}
{showSplitBadge ? (
  <Badge
    className="absolute top-2 right-2 text-[10px] py-0 bg-status-split-bg text-status-split border-0"
  >
    <ScissorsLinear size={10} className="mr-0.5" />
    {paidCount}/{split.seatCount} paid
  </Badge>
) : table.orderStage !== null ? (
  <Badge variant="outline" className="absolute top-2 right-2 text-[10px] py-0">
    {table.orderStage}
  </Badge>
) : null}
```

Badge disappears naturally when `markCleaning` is called (split in bill.store is cancelled at that point).

### TotalsSection Integration

Replace the disabled placeholder button:

```tsx
// Props addition:
onSplitBill?: () => void

// Replace disabled button block:
<Button variant="outline" className="w-full mt-4" onClick={onSplitBill}>
  <ScissorsLinear size={16} className="mr-2" />
  Split Bill
</Button>
```

The `payment/[tableId]/page.tsx` manages the `splitSheetOpen` boolean state and passes the callback, plus a `useEffect` on mount to auto-open if `bill.store.getSplit(tableId)` exists.

### Recommended Project Structure (additions only)

```
src/
├── stores/
│   └── bill.store.ts          # NEW — split state per tableId
├── components/
│   └── payment/
│       ├── SplitSheet.tsx     # NEW — full bottom sheet for split flow
│       └── SeatPaymentPanel.tsx  # NEW — inline seat payment (Cash/QR/Card)
```

`SeatPaymentPanel` is a separate file only because it is a meaningfully sized component (method selector + conditional sub-panel + confirm button). It accepts `seatTotal`, `seatIndex`, `tableId`, and an `onPaid` callback.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet overlay | Custom drawer from scratch | Copy `TableBottomSheet.tsx` pattern | Body scroll lock, z-index layering, and `translate-y-full` animation are already working across iOS Safari and Android Chrome |
| Payment UI per seat | New payment form | Reuse `PaymentMethodSelector` + `CashPanel`/`QrPanel`/`CardPanel` as-is with `seatTotal` as the `grandTotal` prop | These components are pure presentational, prop-driven — zero changes needed |
| VAT rounding | Custom formula | `Math.round(subtotal * 0.07)` exactly as in `payment/[tableId]/page.tsx` line 69 | Already handles satang correctly for Thai POS |
| Equal division with remainder | Custom algorithm | `Math.floor(total / n)` + remainder-on-last | This is the standard Thai POS split convention |
| Toast notifications | Custom alert | `toast()` from sonner via existing ThemedToaster | Already mounted in the (app) layout |

**Key insight:** Every UI primitive this phase needs already exists in the codebase. SplitSheet is composition, not construction.

## Common Pitfalls

### Pitfall 1: Mutating Order Store for Seat Assignments
**What goes wrong:** Storing seat assignments on `OrderLineItem` in `order.store` requires modifying the order data model and breaks the existing order flow.
**Why it happens:** Natural first instinct — "the assignment is about items."
**How to avoid:** Seat assignments live in `bill.store` exclusively as `SeatAssignment` records referencing `lineId`. This is confirmed as an explicit architecture decision in STATE.md.
**Warning signs:** Any `import { useOrderStore }` in the SplitSheet is a red flag.

### Pitfall 2: Per-Seat VAT Sum Mismatch
**What goes wrong:** Sum of per-seat totals (each rounded independently) differs from the original `grandTotal`, confusing staff.
**Why it happens:** `Math.round` on each seat introduces ±1 satang divergence per seat.
**How to avoid:** For per-seat mode, this divergence is acceptable and standard. Document it in the seat sheet with a note if needed. For equal mode, use the floor+remainder algorithm which guarantees exact sum equality.
**Warning signs:** Writing `Math.round(grandTotal / n)` for equal mode — this loses the remainder.

### Pitfall 3: Split Sheet Covers Sticky Bottom Bar
**What goes wrong:** The payment page has a sticky `bottom-0` bar (Confirm Payment button). The split sheet at `z-50` must render above this bar.
**Why it happens:** The sticky bar is part of the page layout, not the sheet.
**How to avoid:** The split sheet uses `fixed bottom-0 z-50` (same as existing sheets) — it will naturally cover the sticky bar because `fixed` elements stack by z-index, not DOM order.

### Pitfall 4: Re-opening Split Sheet Loses Sheet Internal State
**What goes wrong:** React destroys sheet internal view state (which mode, which seat is paying) when the sheet closes and reopens.
**Why it happens:** `useState` inside the sheet component is ephemeral.
**How to avoid:** All durable split state lives in `bill.store` (persisted). Sheet-internal state (e.g. which seat's payment panel is expanded) is ephemeral and intentionally resets on close — acceptable because `bill.store` preserves the assignment and payment records.

### Pitfall 5: Tailwind Classes for Shadow Tokens
**What goes wrong:** Using `shadow-floating` as a Tailwind class fails silently — the shadow token is a multi-value CSS string and Tailwind v4 `@theme inline` cannot process it.
**Why it happens:** Other shadow utilities (like `drop-shadow-*`) work as Tailwind classes, creating a false expectation.
**How to avoid:** Always use `style={{ boxShadow: 'var(--shadow-floating)' }}` for all shadow tokens. This is an established project rule in CLAUDE.md.

### Pitfall 6: `bill.store` Not Cleared on Table Reset
**What goes wrong:** After `markCleaning` and eventually `markClean`, the `bill.store` still holds the old split data for that `tableId`. Next time the table is opened, `payment/[tableId]/page.tsx` auto-detects the stale split and incorrectly opens the sheet.
**Why it happens:** `markClean` in `table.store` does not touch `bill.store`.
**How to avoid:** Call `cancelSplit(tableId)` from `bill.store` at two points: (1) when the last seat is paid (right before `markCleaning`), and (2) when the staff taps Cancel in the split sheet. Also call it in `markClean` action — either add a `bill.store` import to `table.store` (creates circular dependency risk) or call it from the UI layer that calls `markClean`.

**Recommended approach:** Call `cancelSplit` from the UI at the point of last payment, not from `table.store`. The table-map's "Mark Clean" action should also call `cancelSplit` — this can be done in `TableBottomSheet.tsx` where `markClean` is already called.

## Code Examples

Verified patterns from existing source files:

### Bottom Sheet Slide-Up (from `TableBottomSheet.tsx`)
```tsx
// Source: src/components/table-map/TableBottomSheet.tsx lines 61-77
<div
  onClick={onClose}
  className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
/>
<div
  style={{ boxShadow: 'var(--shadow-floating)' }}
  className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
    transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto
    ${open ? 'translate-y-0' : 'translate-y-full'}`}
>
```

### VAT Calculation (from `payment/[tableId]/page.tsx`)
```typescript
// Source: src/app/(app)/payment/[tableId]/page.tsx lines 69-70
const vatAmount = Math.round(discountedSubtotal * 0.07)
const grandTotal = discountedSubtotal + vatAmount
```
Apply the same formula per seat: `seatVat = Math.round(seatSubtotal * 0.07)`.

### Zustand Persist Store (from `order.store.ts`)
```typescript
// Source: src/stores/order.store.ts lines 52-54, 193-195
export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'order-store' },
  ),
)
// bill.store uses identical pattern with { name: 'bill-store' }
```

### Table Store guestCount Access
```typescript
// Source: src/stores/table.store.ts — TableRecord.guestCount
// bill.store initPerSeatSplit default:
const guestCount = useTableStore.getState().tables[tableId]?.guestCount ?? 2
```

### Confirm Payment + markCleaning (from payment page)
```typescript
// Source: src/app/(app)/payment/[tableId]/page.tsx lines 82-84
const { markCleaning, updateTable } = useTableStore.getState()
markCleaning(tableId)
updateTable(tableId, { orderStage: 'Billed' })
```
For split: call this after `recordPayment` for the last seat. The split sheet then closes and navigates to `ReceiptScreen` via `router.push`.

### OrderStage Badge in TableTile (from `TableTile.tsx`)
```tsx
// Source: src/components/table-map/TableTile.tsx lines 67-72
{table.orderStage !== null && (
  <Badge variant="outline" className="absolute top-2 right-2 text-[10px] py-0">
    {table.orderStage}
  </Badge>
)}
// Split badge conditionally replaces this block
```

### Status Token Pattern (from `globals.css`)
```css
/* Source: src/app/globals.css lines 116-125 */
--status-check-requested:    oklch(0.60 0.18 75);
--status-check-requested-bg: oklch(0.97 0.05 75);
/* New split token at hue 60 (amber): */
--status-split:    oklch(0.62 0.18 60);
--status-split-bg: oklch(0.96 0.06 60);
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Disabled `Split Bill → v2` button in `TotalsSection.tsx` | Real button opening SplitSheet | Wire-up is a prop addition + placeholder removal |
| `orderStage` badge in TableTile is always the single info layer | Split badge conditionally overrides `orderStage` badge | One conditional render replaces the existing badge |
| No `bill.store.ts` | New persisted Zustand store | Required for mid-split resume across navigation |

**Deprecated/outdated (in this codebase):**
- `TotalsSection` disabled button + `"ⓘ Seat-level split planned for v2"` note: remove entirely in this phase.

## Open Questions

1. **ReceiptScreen signature for split payments**
   - What we know: `ReceiptScreen` accepts a single `grandTotal` and `paymentMethod`. For split, the last seat's payment triggers navigation.
   - What's unclear: Should the receipt show a split summary (total per seat) or just the grand total?
   - Recommendation: Navigate to `ReceiptScreen` with the original table `grandTotal` for now (the receipt represents the full bill, not one seat). This avoids changing the `ReceiptScreen` interface. Mark as a v2 enhancement for a split-receipt view.

2. **Quantity picker UX in seat assignment (items with qty > 1)**
   - What we know: CONTEXT.md specifies a quantity picker: "How many to Seat 1? [1] of 2"
   - What's unclear: Implementation — inline stepper vs modal vs sheet-within-sheet
   - Recommendation: Inline stepper in the seat picker popup (a small overlay div, not a new sheet). Seat buttons are shown as a horizontal row; below them, a stepper `[−] [N] [+]` appears when selected seat requires qty sub-allocation. This avoids z-index complexity of nested sheets.

3. **Cancel split after partial payment — edge case behavior**
   - What we know: CONTEXT.md says "cancel split always resets (wireframe simplification)" and already-paid seats are "treated as an edge case."
   - What's unclear: Whether to show a warning before reset.
   - Recommendation: Show a confirmation toast/dialog on cancel with warning: "This will clear all payment progress for this table." On confirm, call `cancelSplit(tableId)` and show a sonner toast "Split cancelled." No partial refund logic needed for wireframe.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — project uses `npm run build` (TypeScript compiler) as the only automated verification |
| Config file | tsconfig.json |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

From CLAUDE.md: "No test framework is configured. Use `npm run build` to verify TypeScript correctness."

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| SPLIT-01 | Equal split N seats sums to grandTotal | manual-only | `npm run build` (type check) | No unit test framework; verify by running the split flow in browser with known total |
| SPLIT-02 | Per-seat assignment covers all items, VAT correct per seat | manual-only | `npm run build` | Verify by assigning all items and checking seat subtotals sum correctly |
| SPLIT-03 | Independent seat payment; last seat triggers table close | manual-only | `npm run build` | Verify by paying seats individually in browser |
| SPLIT-04 | TableTile shows "X/N paid" badge during active split | manual-only | `npm run build` | Verify by observing floor plan while split is in progress |

**Justification for manual-only:** No unit test framework exists. TypeScript strict mode (`npm run build`) catches type errors in store interfaces and component props. Behavioral correctness is verified through manual browser interaction.

### Sampling Rate
- **Per task commit:** `npm run build` — ensures no TypeScript errors introduced
- **Per wave merge:** `npm run build` — same
- **Phase gate:** `npm run build` green + manual walkthrough of both split modes before marking phase complete

### Wave 0 Gaps
None — no test framework to configure, no test files to create. `npm run build` is the existing verification mechanism and requires no setup.

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/stores/order.store.ts` — Zustand persist store pattern
- Direct source read: `src/stores/table.store.ts` — `markCleaning`, `guestCount`, `TableRecord` shape
- Direct source read: `src/components/table-map/TableBottomSheet.tsx` — bottom sheet implementation pattern
- Direct source read: `src/components/order/ModifierSheet.tsx` — body scroll lock pattern, sheet reuse
- Direct source read: `src/components/payment/TotalsSection.tsx` — disabled button placeholder location
- Direct source read: `src/components/payment/BillLineItem.tsx` — line item rendering
- Direct source read: `src/app/(app)/payment/[tableId]/page.tsx` — VAT formula, `markCleaning` call, payment page structure
- Direct source read: `src/components/table-map/TableTile.tsx` — `absolute top-2 right-2` badge slot
- Direct source read: `src/app/globals.css` — OKLCH token definitions, status token pattern, shadow tokens
- Direct source read: `.planning/phases/12-split-bill/12-CONTEXT.md` — all locked decisions
- Direct source read: `.planning/REQUIREMENTS.md` — SPLIT-01 through SPLIT-04 definitions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` key architecture decisions — "Seat assignments in bill.store only: Not on OrderLineItem — payment-phase concern stays out of order data model" (project decision, not external source)

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all patterns directly verified in source
- Architecture: HIGH — bill.store interface and SplitSheet composition derived from direct code reading
- Pitfalls: HIGH — scroll lock, shadow token, store clearing, and VAT rounding pitfalls all verified against actual source code

**Research date:** 2026-03-12
**Valid until:** 2026-06-12 (stable stack, no fast-moving dependencies)
