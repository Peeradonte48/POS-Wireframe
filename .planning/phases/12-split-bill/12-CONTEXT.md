# Phase 12: Split Bill - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can split a table's bill by equal shares or per-seat item assignment, pay each portion independently using Cash/QR/Card, and the floor plan table tile shows split progress at a glance. Merge bill and order tracking are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Split Entry Flow
- Tapping 'Split Bill' opens a **bottom sheet** (slides up over the payment page — consistent with existing modifier sheet pattern)
- Sheet shows a **mode selector first**: Equal Split vs Per Seat — staff picks mode, then sheet adapts
- If the table already has an active split in bill.store (partial payment), the payment page **auto-detects and opens the split sheet automatically** on entry, resuming mid-split
- Staff can **always cancel a split** and return to normal payment — even after partial payment (bill.store resets, already-paid seats are treated as an edge case for the wireframe)

### Equal Split Mode
- Staff enters guest count N — system divides grand total into N shares using floor + remainder-on-last rounding in satang
- Sheet transitions to show **N seat cards, each payable in-sheet** — staff taps a seat card to pay it
- No separate screen — the whole equal split flow stays inside the bottom sheet

### Per-Seat Item Assignment UX
- Seat count **defaults to the table's guest count** (from table.store), adjustable with +/− buttons
- Item assignment: **tap item → seat picker appears** (numbered seat buttons)
- Items start in an **"Unassigned" bucket at the top**; as assigned, they move to the seat's section below
- **All items must be assigned** before any seat's Pay button is enabled (unassigned bucket = Pay disabled)
- Staff can **re-assign** an already-assigned item by tapping it again — seat picker appears to change destination
- For items with **quantity > 1**, a quantity picker appears in the seat picker (e.g. "How many to Seat 1? [1] of 2")
- Remaining qty stays unassigned until fully distributed

### Seat Payment Flow
- Tapping a seat card to pay opens a **nested panel** (or secondary sheet) with the full Cash/QR/Card selector — reuses existing `PaymentMethodSelector`, `CashPanel`, `QrPanel`, `CardPanel`
- **VAT calculated and shown per seat**: each seat shows its own subtotal + VAT 7% + seat total (floor + remainder-on-last)
- Paid/settled seat card shows: **green 'Settled' badge + payment method label**, card dimmed/muted — cannot be paid again
- When the **last seat is paid**: auto-confirm — `markCleaning(tableId)` called, split sheet closes, navigates to existing `ReceiptScreen`

### Split Progress Badge (TableTile)
- While split is in progress, the **top-right badge on TableTile replaces the orderStage badge** with "2/4 paid"
- Badge style: **amber/orange filled badge** with a split/scissors icon + "X/N paid"
- Table status badge (left border + status pill) stays **'Check Requested'** — split badge is the new info layer, not a new status
- Badge disappears when all seats paid and table transitions to Cleaning (at which point the slot is empty again)

### Claude's Discretion
- Exact Solar icon to use for the split badge (scissors, card, or other)
- Animation/transition between mode selector and seat cards inside the sheet
- Exact amber OKLCH token value (should align with the status token system in globals.css)
- Exact layout of the nested seat payment panel (full sheet vs in-sheet collapse)
- Error/edge case handling when split is cancelled after partial payment (reset state, show toast)

</decisions>

<specifics>
## Specific Ideas

- The flow must feel like a natural extension of the existing payment page — same bottom sheet idiom used for the modifier sheet in ordering
- Unassigned bucket should make it visually obvious how many items still need to be assigned (count badge or distinct section label)
- Per-seat VAT means each seat is a complete, self-contained mini-receipt — customers can see exactly what they owe

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TotalsSection.tsx` — has a disabled `Split Bill → v2` placeholder button that becomes the real entry trigger; replace the disabled Button with a real one that opens the split sheet
- `PaymentMethodSelector`, `CashPanel`, `QrPanel`, `CardPanel` — all reusable for per-seat payment panel (no changes needed to these components)
- `ReceiptScreen.tsx` — existing receipt screen, auto-navigated to when last seat is paid
- `useTableStore.markCleaning(tableId)` — called when all seats settle (same as normal payment flow)
- `useTableStore.getState().tables[tableId].guestCount` — default seat count for both equal and per-seat modes
- `TableTile.tsx` — top-right `orderStage` badge slot (absolute top-2 right-2) is the integration point for the split progress badge

### Established Patterns
- Bottom sheet pattern: exists in the modifier sheet (order flow) — same slide-up idiom
- Single-column payment page with anchored bottom action — phase 5 decision, split sheet overlays this
- VAT 7% floor rounding: `Math.round(subtotal * 0.07)` in payment page — per-seat VAT uses the same formula per seat, with remainder-on-last pattern for equal split
- Shadow tokens via `style={{ boxShadow: 'var(--shadow-*)' }}` — applies to split sheet and seat cards
- Status badge slot in TableTile is already `absolute top-2 right-2` — split progress badge goes here

### Integration Points
- `bill.store.ts` — **new Zustand persist store** to be created; holds split mode, seat definitions, item assignments, and payment state per tableId
- `TotalsSection.tsx` — replace the disabled split button with a real one; pass a callback to open the split sheet
- `TableTile.tsx` — read from bill.store to conditionally render split progress badge in the orderStage slot
- `payment/[tableId]/page.tsx` — detect active split in bill.store on mount, auto-open split sheet if in-progress split exists

</code_context>

<deferred>
## Deferred Ideas

- **Merge bill** — combining two tables' bills — Phase 14
- **Custom amount split** (arbitrary baht per person) — v2 requirement (PAY-01)
- **Percentage split** (e.g. 60/40) — v2 requirement (PAY-02)
- **Unsplit after partial payment** — complex edge case; for now, cancel split always resets (wireframe simplification)

</deferred>

---

*Phase: 12-split-bill*
*Context gathered: 2026-03-12*
