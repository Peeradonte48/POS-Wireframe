# Phase 5: Payment - Research

**Researched:** 2026-03-11
**Domain:** POS payment screen — bill assembly, payment method UX, post-payment state transitions
**Confidence:** HIGH (all decisions locked in CONTEXT.md; primary research is codebase archaeology, not library selection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Bill layout**
- Single focused column layout — full-width scrollable bill, payment actions anchored at the bottom (not a split panel; this is a read + confirm flow, not an editing flow)
- Flat item list — all items regardless of round, matching a printed receipt format
- Each line: item name + modifier summary line + quantity + price
- Voided items are hidden (not shown on the bill)
- Modifier details shown inline beneath each line item (same pattern as TicketLineItem)

**Coupon / discount**
- Coupon code text field + discount amount (฿) field — both always visible in the totals section (no tap-to-reveal)
- Staff enters the coupon code AND the discount amount manually (no auto-resolve — wireframe has no backend)
- Any staff role can apply a coupon — no Manager PIN required for discounts
- After [Apply]: coupon line appears in the totals section (e.g. "Coupon ABC123 −฿50")

**Totals section**
- Order: Subtotal → Coupon line (if applied) → VAT 7% → Total
- VAT 7% always shown (Thailand standard VAT, applied to subtotal after discount)
- Split bill: disabled [Split Bill → v2] button with annotation "ⓘ Seat-level split planned" — visible placeholder, not interactive

**Payment method UX**
- Three methods: Cash / QR PromptPay / Card — segmented selector (one active at a time)
- Cash: After selecting, a "Cash received" input appears. System calculates and displays "Change due: ฿XX"
- QR PromptPay: Shows a static 200×200 mock QR code image with total amount above it and "Scan to pay with PromptPay" label beneath
- Card: Shows total amount + instructional note "Customer taps or swipes at card reader" — no card input fields

**Post-payment screen**
- Tapping [Confirm Payment] transitions to a dedicated receipt confirmation screen (not a toast + redirect)
- Receipt screen shows: ✔ Payment Received header, table number, total paid, payment method, timestamp, and a design annotation "🖶 Invoice auto-printed [annotated]"
- Table status transitions to Cleaning immediately on payment confirmation (triggers markCleaning() in table.store)
- [Reprint Receipt] button fires a Sonner toast: "Receipt sent to printer" with a small annotation note "(annotated — no printer)" beneath the button (PAY-04)
- [Back to Floor Plan] navigates to /table-map

**Navigation**
- Entry point: `/payment/[tableId]` — accessed only via [Go to Payment] button in TableBottomSheet when table is in CheckRequested status (already stubbed in Phase 2)
- ← back arrow in header returns to /table-map — table stays in CheckRequested, order data untouched (non-destructive back)
- Route: `/payment/[tableId]` inside the (app) route group (uses AppShell)

### Claude's Discretion
- Exact visual styling of the receipt confirmation screen (card, centered, full-screen — whatever reads cleanest)
- Exact QR mock image (static SVG or placeholder image)
- Loading/transition animation between payment screen and receipt screen
- Exact positioning of the annotation note below [Reprint Receipt]

### Deferred Ideas (OUT OF SCOPE)
- Merge bill — combining two tables' orders into one bill — not in v1 requirements, noted for future backlog
- Split bill (actual) — PAY-V2-01 is already in v2 requirements: seat-level split at order time
- CRM-integrated coupon scanning — camera-scan QR coupon from customer's app — FIP module, out of scope for POS wireframe v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | Staff can view an itemized bill with line items, modifier details, discount input field, tax, and total | Bill assembly from `useOrderStore` — flatten rounds, filter voided, compute subtotal/VAT/total; reuse `buildModifierSummary` from TicketLineItem |
| PAY-02 | Staff can select payment method (Cash / QR PromptPay / Card) and confirm payment | Segmented selector with conditional sub-UI per method; `[Confirm Payment]` calls `markCleaning()` + sets `orderStage: 'Billed'`; transitions to receipt screen |
| PAY-03 | Payment confirmation triggers table status → Cleaning and shows a receipt action state (annotated — no real printer) | `useTableStore.markCleaning(tableId)` already built; receipt screen is a new view state within the payment page |
| PAY-04 | Staff can reprint a receipt from a closed/paid order | [Reprint Receipt] fires Sonner toast "Receipt sent to printer"; button visible on receipt screen after payment confirmed |
| PAY-05 | Split bill v2 placeholder is annotated on the payment screen with a design note | Disabled button with annotation copy — no logic needed, purely presentational |
</phase_requirements>

---

## Summary

Phase 5 is a pure UI composition phase. There are no new libraries to install, no new stores to design from scratch, and no complex architectural decisions to make. Every technical primitive is already in the codebase — the work is assembling them correctly.

The payment screen reads `useOrderStore` to build a flat bill (filtering voided items, summing prices), applies a manual coupon discount and 7% VAT calculation, then gates a `[Confirm Payment]` action behind a payment method selection. On confirmation it calls the already-built `markCleaning()` and sets `orderStage: 'Billed'` via the existing `updateTable()` patch. The route `/payment/[tableId]` lives inside the `(app)` route group and uses `AppShell` — the same wrapper as every other staff screen.

The screen has two visual states: the active payment form and the post-payment receipt screen. These should be modeled as local React state within the page component, not as separate routes. The receipt screen is a "show moment" with no complex logic: display confirmation metadata, fire a Sonner toast on [Reprint Receipt], and navigate to `/table-map` on [Back to Floor Plan]. The only Phase 5 item requiring judgment from Claude is the visual treatment of the receipt confirmation screen (the locked decisions specify content but not layout style).

**Primary recommendation:** Build as a single `PaymentPage` with two local view states (`'payment' | 'receipt'`), no new stores, no new libraries. Re-use `buildModifierSummary` for bill line items. Wire `TableBottomSheet`'s disabled "Go to Payment (Phase 5)" button as the final activation step.

---

## Standard Stack

### Core (already installed — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15 | Dynamic route `/payment/[tableId]` | Project foundation |
| TypeScript (strict) | 5 | All component and util types | Project foundation |
| Tailwind CSS | 4 | Styling — CSS-first config via globals.css | Project foundation |
| shadcn/ui | current | Button, Input, Badge — all available | Already wired project-wide |
| Zustand | 5 | `useTableStore`, `useOrderStore` — reading order, writing state | Project state management |
| Sonner | current | Toaster for "Receipt sent to printer" toast | Already installed in OrderPage |
| Lucide React | current | ChevronLeft back arrow, CheckCircle for receipt confirmation | Already in project |

### No New Libraries Required
This phase requires zero `npm install` calls. All needed primitives (routing, state, UI components, toast) are already present. The QR mock is a static SVG inline — no QR generation library.

---

## Architecture Patterns

### Recommended File Structure
```
src/
├── app/(app)/payment/
│   └── [tableId]/
│       └── page.tsx          # PaymentPage — two view states: 'payment' | 'receipt'
└── components/payment/
    ├── BillLineItem.tsx       # Single line: name + modifier summary + qty + price
    ├── TotalsSection.tsx      # Subtotal + coupon + VAT + total rows
    ├── PaymentMethodSelector.tsx  # Segmented: Cash | QR PromptPay | Card
    ├── CashPanel.tsx          # Cash received input + change due display
    ├── QrPanel.tsx            # Static 200×200 SVG QR + total + label
    ├── CardPanel.tsx          # Total amount + instructional copy
    └── ReceiptScreen.tsx      # Post-payment confirmation view
```

### Pattern 1: Two-state page (payment / receipt)
**What:** A single page component holds `viewState: 'payment' | 'receipt'` in local React state. The payment form renders when `viewState === 'payment'`; the receipt screen renders when `viewState === 'receipt'`.
**When to use:** This is the correct pattern when two visually distinct screens share the same URL context (same tableId) and the transition is one-directional (no back from receipt to payment form).

```typescript
// src/app/(app)/payment/[tableId]/page.tsx
'use client'

const [viewState, setViewState] = useState<'payment' | 'receipt'>('payment')
const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QR PromptPay' | 'Card' | null>(null)
const [couponCode, setCouponCode] = useState('')
const [couponAmount, setCouponAmount] = useState<number>(0)
const [couponApplied, setCouponApplied] = useState(false)
const [cashReceived, setCashReceived] = useState<number>(0)
const [paidAt] = useState(() => new Date())

function handleConfirmPayment() {
  markCleaning(tableId)
  updateTable(tableId, { orderStage: 'Billed' })
  setViewState('receipt')
}
```

### Pattern 2: Bill assembly from order store
**What:** Flatten all rounds, filter out voided items, compute line totals, sum to subtotal. Apply coupon discount. Apply VAT 7% to discounted subtotal. Sum to grand total.
**When to use:** Every time payment screen renders.

```typescript
// Bill assembly — inline in PaymentPage or extracted to useBillSummary hook
const order = useOrderStore((s) => s.getOrder(tableId))

const billItems = useMemo(() => {
  if (!order) return []
  return order.rounds
    .flatMap((r) => r.items)
    .filter((item) => item.status !== 'voided')
}, [order])

const subtotal = useMemo(
  () => billItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
  [billItems]
)

const discountAmount = couponApplied ? couponAmount : 0
const discountedSubtotal = subtotal - discountAmount
const vatAmount = Math.round(discountedSubtotal * 0.07)
const grandTotal = discountedSubtotal + vatAmount
```

### Pattern 3: Modifier summary reuse
**What:** `buildModifierSummary` from `TicketLineItem.tsx` is a pure function that accepts an `OrderLineItem` and returns a formatted string. It can be imported directly.
**When to use:** Each `BillLineItem` renders the modifier summary line identically to how the order ticket did.

```typescript
// BillLineItem.tsx
import { buildModifierSummary } from '@/components/order/TicketLineItem'

// Use exactly as in TicketLineItem:
const modifierSummary = buildModifierSummary(item)
```

**Note:** `buildModifierSummary` is currently defined as a named export inside `TicketLineItem.tsx`. It can be imported without moving it — no refactoring required.

### Pattern 4: Static SVG QR mock
**What:** An inline SVG that looks like a QR code grid — no real QR data, purely visual.
**When to use:** QR PromptPay panel. Size: 200×200px.

```typescript
// QrPanel.tsx — inline SVG approach
<svg width="200" height="200" viewBox="0 0 200 200" className="border rounded">
  {/* Finder patterns and random fill rectangles to look like a QR */}
  {/* Claude's discretion: any static visually-convincing QR pattern */}
</svg>
```

Alternatively, use a placeholder `<div className="w-[200px] h-[200px] bg-muted border rounded flex items-center justify-center text-xs text-muted-foreground">QR Mock</div>` if full SVG is noisy. Claude's discretion.

### Pattern 5: TableBottomSheet wire-up
**What:** The `CheckRequested` branch in `TableBottomSheet.tsx` currently has a disabled button with "(Phase 5)" label. Phase 5 activates it as a `<Link href={'/payment/${table.id}'}>` wrapped `<Button>`.

```typescript
// TableBottomSheet.tsx — CheckRequested branch (currently lines 173–179)
// BEFORE:
<Button className="w-full" disabled>
  Go to Payment <span className="text-[10px] ml-1">(Phase 5)</span>
</Button>

// AFTER:
<Button className="w-full" asChild>
  <Link href={`/payment/${table.id}`}>Go to Payment</Link>
</Button>
```

### Anti-Patterns to Avoid
- **Separate routes for receipt screen:** Do not create `/payment/[tableId]/receipt` — the receipt is a view state within the same page. The tableId context must persist.
- **Calling markCleaning in useEffect:** Call `markCleaning()` synchronously inside the confirm handler, not in a side effect triggered by state change. Prevents double-fire.
- **Showing voided items on the bill:** Filter `item.status !== 'voided'` before rendering. Do not show struck-through voided items on the bill — they are invisible per CONTEXT.md.
- **VAT on pre-discount subtotal:** VAT 7% applies to `(subtotal − couponDiscount)`, not to `subtotal`. This is the locked calculation order from CONTEXT.md.
- **Floating point currency math:** Use `Math.round()` for VAT and display all amounts with `toFixed(0)` or integer arithmetic. Thai Baht does not use decimals in restaurant context.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast component | Sonner (already installed) | Already wired in OrderPage; consistent UX |
| Back navigation | Custom history management | `useRouter().push('/table-map')` | Standard Next.js pattern in project |
| Modifier summary text | Re-implement formatting | Import `buildModifierSummary` from TicketLineItem | Already tested, matches ticket display |
| Table state update | Direct store mutation | `markCleaning()` + `updateTable()` | Both already exist in table.store.ts |
| Payment method segments | Custom tab/toggle | shadcn/ui Button group with variant toggling | Consistent with project button usage |

---

## Common Pitfalls

### Pitfall 1: VAT calculation order
**What goes wrong:** Staff sees incorrect total when VAT is applied before discount.
**Why it happens:** Calculating `subtotal * 1.07 - discount` instead of `(subtotal - discount) * 1.07`.
**How to avoid:** Always subtract coupon amount first, then apply 7% to the result. Matches CONTEXT.md locked spec.
**Warning signs:** Grand total differs from manual calculation by a few baht.

### Pitfall 2: Rendering voided items on the bill
**What goes wrong:** Items the kitchen was asked to cancel appear on the customer's bill.
**Why it happens:** Flattening all rounds without filtering `status !== 'voided'`.
**How to avoid:** Single filter guard before mapping bill items: `.filter((item) => item.status !== 'voided')`.
**Warning signs:** Test with a table that had a void — the voided item name should not appear anywhere on the bill.

### Pitfall 3: Confirm Payment fires multiple times
**What goes wrong:** `markCleaning()` called twice, potentially causing state corruption or double toast.
**Why it happens:** Button not disabled after first tap, or confirm handler placed in a useEffect that re-runs.
**How to avoid:** Set `viewState` to `'receipt'` synchronously in the confirm handler (which replaces the payment form) — button is unmounted immediately after first tap.

### Pitfall 4: Stale order data on receipt screen
**What goes wrong:** Receipt screen shows outdated totals if store is read again after payment.
**Why it happens:** Zustand state is reactive — if order data were to change after payment confirmation, displayed totals would shift.
**How to avoid:** Capture `grandTotal`, `paymentMethod`, and `paidAt` timestamp as plain state values in the confirm handler before transitioning to receipt view. Receipt screen renders these captured values, not store selectors.

### Pitfall 5: TableBottomSheet Button asChild with Link
**What goes wrong:** TypeScript error or incorrect rendering when wrapping Link in Button.
**Why it happens:** shadcn Button's `asChild` prop uses Radix Slot to merge props; the project uses Base UI, not Radix. Check whether `asChild` is supported.
**How to avoid:** Based on existing project patterns (Phases 1–4), the safest approach is `<Button onClick={() => router.push('/payment/' + table.id)}>Go to Payment</Button>` — using router.push matches how other navigation buttons in the project work (see OrderPage "back" button, TableBottomSheet "View Order" button which uses `router.push`).

### Pitfall 6: Empty order state
**What goes wrong:** Payment page crashes or shows NaN if a table somehow has no order data.
**Why it happens:** `useOrderStore.getOrder(tableId)` returns `undefined` if no order was ever created.
**How to avoid:** Guard at top of bill assembly: `if (!order || order.rounds.length === 0)` render an empty state with "No items — return to floor plan" message. In practice this state should not occur (a table only reaches CheckRequested after ordering), but defensive coding prevents crashes.

---

## Code Examples

Verified patterns from existing codebase:

### Reading order data for bill assembly
```typescript
// Mirrors how KDS and OrderPage read orders
const order = useOrderStore((s) => s.getOrder(tableId))
// or for direct access outside hooks:
const order = useOrderStore.getState().orders[tableId]
```

### markCleaning call (from table.store.ts)
```typescript
// Signature: markCleaning: (id: string) => void
const { markCleaning, updateTable } = useTableStore()

function handleConfirmPayment() {
  markCleaning(tableId)                           // status → 'Cleaning'
  updateTable(tableId, { orderStage: 'Billed' })  // orderStage → 'Billed'
  setViewState('receipt')
}
```

### Sonner toast (from OrderPage pattern)
```typescript
// Already used in project — import pattern:
import { toast } from 'sonner'
import { Toaster } from 'sonner'

// In component:
toast('Receipt sent to printer')

// Toaster must be present in page JSX:
<Toaster position="top-center" />
```

### Dynamic route param (Next.js App Router)
```typescript
// Matches existing pattern in order/[tableId]/page.tsx
'use client'
import { useParams } from 'next/navigation'

const params = useParams<{ tableId: string }>()
const tableId = params.tableId
```

### Currency formatting (Thai Baht — integer amounts)
```typescript
// Consistent with project's basePrice values (integer baht)
const formatBaht = (amount: number): string => `฿${amount.toLocaleString()}`
// Examples: ฿350, ฿1,200
```

### Header back button pattern (from OrderPage)
```typescript
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const router = useRouter()

<button
  onClick={() => router.push('/table-map')}
  className="flex items-center justify-center w-8 h-8 -ml-1 rounded-md hover:bg-accent transition-colors"
  aria-label="Back to floor map"
>
  <ChevronLeft className="w-5 h-5" />
</button>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Split panel (left bill + right payment) | Single column scrollable | CONTEXT.md decision | Simpler, matches receipt format, mobile-first |
| Manager PIN for discounts | Any staff role | CONTEXT.md decision | No ManagerPinModal needed in this phase |
| Post-payment toast + redirect | Dedicated receipt screen | CONTEXT.md decision | More ceremony, better "show moment" for staff |
| CheckRequested → direct order view | CheckRequested → payment screen | Phase 2 stub | TableBottomSheet already routes correctly |

**Already built (do not rebuild):**
- `markCleaning()`: Exists in table.store.ts — just call it
- `requestCheck()`: Exists — already triggered by "Request Check" in TableBottomSheet
- `buildModifierSummary()`: Exists in TicketLineItem.tsx — import it
- `Toaster`: Installed and used in OrderPage — add `<Toaster />` to PaymentPage JSX
- `updateTable()` with `orderStage: 'Billed'`: `OrderStage` type already includes `'Billed'`

---

## Open Questions

1. **`buildModifierSummary` export visibility**
   - What we know: It is a named export in `TicketLineItem.tsx` alongside the component
   - What's unclear: Whether the planner should co-locate it or move it to a shared util
   - Recommendation: Leave it in TicketLineItem.tsx and import from there. No refactoring needed; the planner should note that import path is `@/components/order/TicketLineItem`.

2. **Change due display when cash received is less than total**
   - What we know: User enters cash received amount; system shows "Change due: ฿XX"
   - What's unclear: Should a negative change (underpayment) show an error state?
   - Recommendation: Show "Change due: ฿−XX" in red / destructive color if cashReceived < grandTotal, and disable [Confirm Payment] until cashReceived >= grandTotal.

3. **Receipt screen timestamp format**
   - What we know: CONTEXT.md specifies "timestamp" on the receipt screen
   - What's unclear: Thai locale format vs. ISO vs. human-readable English
   - Recommendation: Use `new Date().toLocaleString('th-TH')` for Thai locale — consistent with the restaurant's operational context.

---

## Validation Architecture

> `nyquist_validation` is enabled (explicitly true in .planning/config.json).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — project uses Next.js build + TypeScript type check as primary validation |
| Config file | none |
| Quick run command | `npx tsc --noEmit` (type check only) |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-01 | Bill shows itemized line items, modifier details, discount, tax, total | manual (browser) | `npm run build` — type check gates; browser verify | ❌ Wave 0 N/A |
| PAY-02 | Payment method selection + confirm → Cleaning status | manual (browser) | `npm run build` | ❌ Wave 0 N/A |
| PAY-03 | Post-payment receipt screen visible + annotated print | manual (browser) | `npm run build` | ❌ Wave 0 N/A |
| PAY-04 | Reprint fires Sonner toast | manual (browser) | `npm run build` | ❌ Wave 0 N/A |
| PAY-05 | Split bill placeholder visible + annotated | manual (browser) | `npm run build` | ❌ Wave 0 N/A |

**Note:** This project has no automated test suite (no Jest, Vitest, or Playwright installed). Validation follows the established pattern from Phases 1–4: TypeScript strict-mode compile (`npx tsc --noEmit`) + `next build` + browser verification checklist. All PAY requirements are UI verification requirements — they are inherently manual.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npm run build`
- **Phase gate:** All 5 PAY success criteria verified in browser before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure to scaffold. TypeScript strict mode is already configured and serves as the primary automated gate.

---

## Sources

### Primary (HIGH confidence)
- `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/src/stores/table.store.ts` — `markCleaning`, `updateTable`, `OrderStage` type, `markReserved`, `requestCheck`
- `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/src/stores/order.store.ts` — `useOrderStore`, `getOrder`, `ActiveOrder`, `OrderLineItem`, `LineItemStatus`
- `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/src/components/order/TicketLineItem.tsx` — `buildModifierSummary` export, rendering pattern
- `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/src/components/table-map/TableBottomSheet.tsx` — existing stub at lines 173–179 (CheckRequested branch)
- `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/src/app/(app)/order/[tableId]/page.tsx` — Sonner Toaster usage, dynamic route pattern, header back button
- `/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe/src/app/(app)/layout.tsx` — AppShell wrapping, auth guard, Kitchen redirect
- `.planning/phases/05-payment/05-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — accumulated decisions across all phases, especially buildModifierSummary locality decision from Phase 3
- `.planning/REQUIREMENTS.md` — PAY-01 through PAY-05 requirement text

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase read directly; no library uncertainty
- Architecture: HIGH — patterns are established across Phases 1–4; payment follows same conventions
- Pitfalls: HIGH — derived from direct code inspection and CONTEXT.md locked decisions
- Bill math: HIGH — VAT 7% locked in CONTEXT.md; integer Baht arithmetic straightforward

**Research date:** 2026-03-11
**Valid until:** Stable — no external library dependencies; valid until codebase structural change
