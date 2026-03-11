# Phase 5: Payment - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff closes the bill for a table — views an itemized bill, applies a coupon/discount if applicable, selects a payment method, confirms payment, and returns the table to Cleaning status for the next party. Reprint receipt is available post-payment. Split bill and merge bill are out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Bill layout
- Single focused column layout — full-width scrollable bill, payment actions anchored at the bottom (not a split panel; this is a read + confirm flow, not an editing flow)
- Flat item list — all items regardless of round, matching a printed receipt format
- Each line: item name + modifier summary line + quantity + price
- Voided items are hidden (not shown on the bill)
- Modifier details shown inline beneath each line item (same pattern as TicketLineItem)

### Coupon / discount
- Coupon code text field + discount amount (฿) field — both always visible in the totals section (no tap-to-reveal)
- Staff enters the coupon code AND the discount amount manually (no auto-resolve — wireframe has no backend)
- Any staff role can apply a coupon — no Manager PIN required for discounts
- After [Apply]: coupon line appears in the totals section (e.g. "Coupon ABC123 −฿50")

### Totals section
- Order: Subtotal → Coupon line (if applied) → VAT 7% → Total
- VAT 7% always shown (Thailand standard VAT, applied to subtotal after discount)
- Split bill: disabled [Split Bill → v2] button with annotation "ⓘ Seat-level split planned" — visible placeholder, not interactive

### Payment method UX
- Three methods: Cash / QR PromptPay / Card — segmented selector (one active at a time)
- **Cash:** After selecting, a "Cash received" input appears. System calculates and displays "Change due: ฿XX"
- **QR PromptPay:** Shows a static 200×200 mock QR code image with total amount above it and "Scan to pay with PromptPay" label beneath
- **Card:** Shows total amount + instructional note "Customer taps or swipes at card reader" — no card input fields

### Post-payment screen
- Tapping [Confirm Payment] transitions to a dedicated receipt confirmation screen (not a toast + redirect)
- Receipt screen shows: ✔ Payment Received header, table number, total paid, payment method, timestamp, and a design annotation "🖶 Invoice auto-printed [annotated]"
- Table status transitions to Cleaning immediately on payment confirmation (triggers markCleaning() in table.store)
- [Reprint Receipt] button fires a Sonner toast: "Receipt sent to printer" with a small annotation note "(annotated — no printer)" beneath the button (PAY-04)
- [Back to Floor Plan] navigates to /table-map

### Navigation
- Entry point: `/payment/[tableId]` — accessed only via [Go to Payment] button in TableBottomSheet when table is in CheckRequested status (already stubbed in Phase 2)
- ← back arrow in header returns to /table-map — table stays in CheckRequested, order data untouched (non-destructive back)
- Route: `/payment/[tableId]` inside the (app) route group (uses AppShell)

### Claude's Discretion
- Exact visual styling of the receipt confirmation screen (card, centered, full-screen — whatever reads cleanest)
- Exact QR mock image (static SVG or placeholder image)
- Loading/transition animation between payment screen and receipt screen
- Exact positioning of the annotation note below [Reprint Receipt]

</decisions>

<specifics>
## Specific Ideas

- The coupon flow mimics A Ramen's standalone loyalty mode: staff manually reads the customer's coupon QR and keys in the code + amount — no CRM integration in this phase
- The receipt confirmation screen is intentionally a "show moment" — staff can briefly show it to the customer before tapping Back to Floor Plan
- Thai Baht (฿) prefix on all currency amounts throughout

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useOrderStore` — `orders[tableId]` has all rounds, line items, modifiers, prices; payment screen reads this directly to build the bill
- `useTableStore.markCleaning(tableId)` — already built; payment confirmation just calls this
- `useTableStore.requestCheck(tableId)` — already built; CheckRequested status is the entry trigger
- `ManagerPinModal` — available but NOT used for discounts (any staff can apply)
- `TableBottomSheet` — already has [Go to Payment] placeholder button wired for Phase 5
- Bottom sheet CSS slide-up pattern — reusable if needed for any sub-panels
- Sonner toast — already wired (used in Order Flow for "Order sent to kitchen")

### Established Patterns
- Single-column focused screen pattern: Shift Open screen (Phase 1) is the closest analog — full-width, action at bottom
- Modifier summary inline format: `buildModifierSummary` inline in TicketLineItem — same approach works for bill line items
- Phase 2 state machine: CheckRequested → Cleaning → Open is already fully built; payment just triggers markCleaning()
- AppShell layout wraps this screen (unlike KDS which has its own layout)

### Integration Points
- `TableBottomSheet` [Go to Payment] button — activate the link to `/payment/[tableId]` (was disabled placeholder in Phase 2)
- `useTableStore.markCleaning()` — called on payment confirmation
- `useOrderStore.getOrder(tableId)` — reads order data to build itemized bill
- Table `orderStage` should update to `'Billed'` when payment is confirmed (already exists as an OrderStage value in table.store.ts)

</code_context>

<deferred>
## Deferred Ideas

- **Merge bill** — combining two tables' orders into one bill — not in v1 requirements, noted for future backlog
- **Split bill (actual)** — PAY-V2-01 is already in v2 requirements: seat-level split at order time
- **CRM-integrated coupon scanning** — camera-scan QR coupon from customer's app (described in CLAUDE.md Loyalty section) — FIP module, out of scope for POS wireframe v1

</deferred>

---

*Phase: 05-payment*
*Context gathered: 2026-03-11*
