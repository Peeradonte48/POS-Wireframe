# Payment Resume & Cancel — Design Spec

**Date:** 2026-04-21
**Scope:** Back-navigation, resume entry points, and Manager-gated payment cancellation across the POS payment flows.

---

## 1. Goal

When a user navigates away in the middle of a payment flow — normal checkout (cash / QR / card), a partially-completed split payment, or a confirmed merge awaiting payment — two things must happen:

1. **No silent loss.** A confirmation dialog surfaces before navigation with explicit options: stay, resume later, or cancel the payment.
2. **Clear resume path.** Paused payments are visible on the floor plan via a tile badge. Tapping the tile jumps straight back into the exact state the user left.

Cancellation is Manager-PIN-gated in all cases, because once a method sheet is open (or seat payments exist), "cancel" is a business event, not a UI dismissal.

---

## 2. Non-goals

- Full payment-log display UI (Manager dashboard / shift-close drill-in). Covered by a follow-up spec. This spec only writes the minimal log entry on void so the follow-up has data to render.
- Voiding *completed* payments from outside the exit-dialog flow (e.g., after the table is billed and closed). Manager tools territory.
- Intercepting browser back button, sidebar navigation, or OS-level gestures. Out of scope — the tablet prototype's canonical exit is the header ChevronLeft button.
- Role-based access for initiating cancel. Any staff can trigger the Manager PIN modal; only Manager PIN executes the cancel.

---

## 3. Trigger thresholds ("what counts as in-progress")

| Flow | Paused when |
|------|-------------|
| **Normal payment** | A method is selected **and** its sheet/panel is open: cash dialog open, QR sheet open, or card panel visible on the checkout view. Method-selected-but-no-sheet does not count. |
| **Split payment** | `splits[tableId].payments` has ≥1 but < `seatCount` entries. Initiating a split with zero seats paid is not paused. |
| **Split bill / Merge bill setup** | Only counts *after* the sheet is confirmed (the split/merge is written to store). Cancelling the setup sheet is clean — no paused state. |

Early setup states (method picker without a sheet open, empty split scaffolding, unconfirmed merge sheet) discard cleanly on back. This keeps the "paused" indicator meaningful.

---

## 4. Data model

### 4.1 New state in `bill.store`

```ts
export interface PaymentSession {
  tableId: string
  context: 'normal' | 'per-seat'     // per-seat = one seat inside split-summary mid-payment
  seatIndex?: number                 // only for per-seat context
  method: 'Cash' | 'QR PromptPay' | 'Card'
  activeSheet: 'cash' | 'qr' | 'card'
  cashAmount?: number                // partial cash entry preserved across pauses
  startedAt: number                  // Date.now()
}

export interface PaymentLogEntry {
  id: string                         // uuid
  tableId: string
  type: 'completed' | 'voided'
  reason?: 'normal-cancel' | 'split-cancel'   // only for voided
  method?: 'Cash' | 'QR PromptPay' | 'Card'   // absent for split-cancel that voids multiple
  amount: number
  authorizedBy?: { staffId: string; role: 'Manager' }   // only for voided
  seatIndex?: number                 // for per-seat voids
  at: number                         // Date.now()
}

interface BillStore {
  // ...existing fields
  paymentSessions: Record<string, PaymentSession>    // keyed by tableId
  paymentLog: PaymentLogEntry[]                       // append-only, persisted

  setPaymentSession: (tableId: string, session: PaymentSession) => void
  updatePaymentSession: (tableId: string, patch: Partial<PaymentSession>) => void
  clearPaymentSession: (tableId: string) => void
  getPaymentSession: (tableId: string) => PaymentSession | undefined

  appendPaymentLog: (entry: PaymentLogEntry) => void
}
```

Bump `persist` version to `4` and keep the existing `migrate: () => ({})` pattern (prototype has no production data to migrate).

### 4.2 Derived states (no new storage)

- **Split paused:** `const split = splits[tableId]; const paid = Object.keys(split?.payments ?? {}).length; const isPaused = split && paid > 0 && paid < split.seatCount`
- **Merge awaiting payment:** table is primary of a merge (`getMergedSecondaries(id).length > 0`) AND either a `paymentSession` exists OR the split is paused. Merge itself does not create a paused state — it inherits from the underlying payment flow.

### 4.3 Session lifecycle

| Event | Effect on session |
|-------|-------------------|
| Cash dialog opens with method selected | `setPaymentSession({ method: 'Cash', activeSheet: 'cash', cashAmount: 0 })` |
| Cash amount typed | `updatePaymentSession({ cashAmount })` |
| QR sheet opens | `setPaymentSession({ method: 'QR PromptPay', activeSheet: 'qr' })` |
| Card panel shown (checkout view, method = Card) | `setPaymentSession({ method: 'Card', activeSheet: 'card' })` |
| Payment confirmed | `clearPaymentSession` + `appendPaymentLog({ type: 'completed' })` |
| "Resume Later" picked | Session preserved, user navigates to `/table-map` |
| "Cancel Payment" authorized | `clearPaymentSession` + `appendPaymentLog({ type: 'voided', reason })` |

For split per-seat payments, the session exists only for the seat actively being paid. Completed seat payments live in `splits[tableId].payments` as they do today.

---

## 5. Exit-dialog component

**File:** `src/components/payment/PauseConfirmDialog.tsx`

**Props:**
```ts
interface PauseConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenario: 'normal' | 'split-partial'
  tableLabel: string
  paidSeats?: number       // for split-partial
  totalSeats?: number      // for split-partial
  onResumeLater: () => void
  onCancelAuthorized: () => void    // called after Manager PIN verified
}
```

Internally wraps `ManagerPinModal` for the cancel action. The dialog itself is a standard shadcn `Dialog`.

### 5.1 Normal payment scenario

> **กำลังชำระเงิน** (Payment in progress)
> การชำระเงินสำหรับ {tableLabel} ยังไม่เสร็จสิ้น / A payment for {tableLabel} hasn't been completed.

Actions (top to bottom):
- **อยู่ต่อ (Stay)** — outline; dismisses dialog
- **กลับมาทำต่อ (Resume Later)** — primary; calls `onResumeLater`
- **ยกเลิกการชำระ (Cancel Payment)** — destructive, visually separated by a divider; opens `ManagerPinModal` with `actionLabel="Authorize: Cancel Payment"`; on PIN success, calls `onCancelAuthorized`

### 5.2 Split-partial scenario

> **ชำระบางส่วนแล้ว** (Some payments completed)
> {tableLabel} ชำระแล้ว {paidSeats}/{totalSeats} ที่นั่ง / {paidSeats} of {totalSeats} seats paid.

Actions:
- **อยู่ต่อ (Stay)** — outline
- **กลับมาทำต่อ (Resume Later)** — primary
- **ยกเลิกการชำระทั้งหมด (Cancel All Payments)** — destructive, with warning subtext "ธุรกรรมที่ชำระแล้วจะถูกยกเลิกโดยผู้จัดการ" (Paid transactions will be voided by Manager); opens `ManagerPinModal` with `actionLabel="Authorize: Cancel Split Payment"`; on PIN success:
  - Writes one `paymentLog` entry per paid seat (`type: 'voided', reason: 'split-cancel', seatIndex, amount, authorizedBy`)
  - Calls `cancelSplit(tableId)` — tears down the split entirely
  - Clears any active `paymentSession` for that table
  - Navigates user to `/payment/[tableId]` (single-bill CheckBill view)
  - Toast: `ยกเลิกการแบ่งจ่ายแล้วโดยผู้จัดการ` (Split payment cancelled by Manager)

---

## 6. Page-level integration

### 6.1 `src/app/(app)/payment/[tableId]/page.tsx`

**Back interception:** replace the existing `onClick={() => router.push('/table-map')}` on the header back button with:

```ts
function handleBackPress() {
  const session = useBillStore.getState().getPaymentSession(tableId)
  if (session) {
    setPauseDialogScenario('normal')
    setPauseDialogOpen(true)
    return
  }
  router.push('/table-map')
}
```

The checkout-view back button (which goes to CheckBill view) does **not** trigger the dialog — moving between sub-views of the same page is not "leaving the payment".

**Session writes:** wire into the existing `onPaymentMethodSelect` / sheet-open handlers:
- When `CashDialog` opens with `paymentMethod === 'Cash'` → `setPaymentSession({ context: 'normal', method: 'Cash', activeSheet: 'cash', cashAmount: 0 })`
- When `QrSheet` opens → `setPaymentSession({ ..., method: 'QR PromptPay', activeSheet: 'qr' })`
- When `CardPanel` is visible on checkout view → same pattern
- `CashDialog` writes `cashAmount` through `updatePaymentSession` on each keypad interaction

**Session reads on mount (resume restoration):**

```ts
useEffect(() => {
  const session = useBillStore.getState().getPaymentSession(tableId)
  if (!session) return
  setPaymentMethod(session.method)
  setViewState('checkout')
  if (session.activeSheet === 'cash') setCashDialogOpen(true)
  else if (session.activeSheet === 'qr') setQrSheetOpen(true)
  // card panel renders inline when method === 'Card' on checkout view
}, [tableId])
```

`CashDialog` reads `session.cashAmount` on open to prefill its internal state.

**On confirm payment** (existing `handleConfirmPayment`): append a `paymentLog` entry with `type: 'completed'`, clear the session. Existing behavior (toast, receipt view) unchanged.

### 6.2 `src/app/(app)/payment/[tableId]/split-summary/page.tsx`

**Back interception** in the header back button:
- If `paidCount > 0` → show dialog with `scenario='split-partial'` (voiding paid seats requires manager PIN).
- Else if a per-seat `paymentSession` exists but no seats paid yet → show dialog with `scenario='normal'` (only the active-seat sheet is in-flight; cancel clears that one session).
- Else → navigate freely.

**Session writes / reads** for the seat currently being paid: same pattern as normal page, but with `context: 'per-seat'` and `seatIndex` set. The existing seat panels (`PerSeatPaymentPanel`, `CustomSplitPaymentPanel`) need handler updates at the sheet-open / sheet-close boundaries.

On "Cancel All Payments" authorized (split-partial scenario):
- Iterate existing `split.payments` → append one `paymentLog` void entry per paid seat
- `cancelSplit(tableId)` + `clearPaymentSession(tableId)`
- `router.replace('/payment/${tableId}')`

On "Cancel Payment" authorized (normal scenario on this page — per-seat session, no seats paid): append one `paymentLog` entry for the aborted seat, `clearPaymentSession(tableId)`, dismiss the seat sheet; the split itself remains (user can reassign seats or cancel the split via CheckBill).

---

## 7. Floor-plan integration

### 7.1 `src/components/table-map/TableTile.tsx`

Add a new badge, derived from:

```ts
const session = useBillStore((s) => s.paymentSessions[table.id])
const splits = useBillStore((s) => s.splits)
const split = useMemo(() => splits?.[table.id], [splits, table.id])
const paidCount = split ? Object.keys(split.payments).length : 0
const isSplitPaused = split && paidCount > 0 && paidCount < split.seatCount
const isPaused = Boolean(session) || isSplitPaused
```

**Visual:** a pill using `lucide-react`'s `Pause` icon + label `รอชำระ`. Colors use an amber warning tone — add `variant="paused"` to `badge.tsx` CVA if no existing variant fits. Placement: top-right stack with existing split/merge chips.

Existing split/merge chip conditions remain unchanged — a merged primary with a paused normal payment shows both the merge chip and the paused chip.

### 7.2 Direct-resume tap handler

In `TableGrid.tsx` (or wherever the tile's `onTap` lives), short-circuit the bottom-sheet flow when paused:

```ts
function handleTap(table: TableRecord) {
  const session = useBillStore.getState().getPaymentSession(table.id)
  const split = useBillStore.getState().splits[table.id]
  const paid = split ? Object.keys(split.payments).length : 0
  const isSplitPaused = split && paid > 0 && paid < split.seatCount

  if (session) {
    router.push(`/payment/${table.id}`)
    return
  }
  if (isSplitPaused) {
    router.push(`/payment/${table.id}/split-summary`)
    return
  }
  openBottomSheet(table)   // existing behavior
}
```

When both conditions hold (e.g., normal payment session AND a partial split from a prior flow), the session takes priority — the user was most recently in normal payment context.

### 7.3 Accessibility

Paused tiles should have an `aria-label` variant: `"{tableLabel} — รอชำระ, แตะเพื่อกลับไปทำต่อ"` so screen readers announce the shortcut.

---

## 8. Affected files

| File | Change |
|------|--------|
| `src/stores/bill.store.ts` | Add `paymentSessions`, `paymentLog`, associated actions; bump persist version |
| `src/components/payment/PauseConfirmDialog.tsx` | **New** — exit-confirmation dialog with both scenarios |
| `src/app/(app)/payment/[tableId]/page.tsx` | Back intercept, session writes on sheet open/close, session-based auto-restore on mount, log entry on confirm |
| `src/components/payment/CashDialog.tsx` | Write `cashAmount` updates to session; read on open |
| `src/components/payment/QrSheet.tsx` | Write session on open/close |
| `src/app/(app)/payment/[tableId]/split-summary/page.tsx` | Back intercept; "Cancel All Payments" flow; per-seat session handling |
| `src/components/payment/PerSeatPaymentPanel.tsx`, `CustomSplitPaymentPanel.tsx` | Per-seat session writes at sheet boundaries |
| `src/components/table-map/TableTile.tsx` | Paused badge rendering + aria-label variant |
| `src/components/table-map/TableGrid.tsx` | Direct-resume tap short-circuit |
| `src/components/ui/badge.tsx` | Add `variant="paused"` if needed |
| `src/components/auth/ManagerPinModal.tsx` | No change — reused as-is |

---

## 9. Edge cases & behavior notes

- **Cash dialog with `cashAmount === 0`** is still considered paused. Opening the sheet is the commitment point, not the first keystroke.
- **Method-selected-but-no-sheet** is not paused. If the staff picked Cash on the method selector but dismissed the auto-opened cash dialog without typing, no session was ever written.
- **Receipt view** never triggers the exit dialog. The payment is complete; back-to-floor is intended behavior.
- **Empty-order guard** (no line items) short-circuits before any session logic — no paused state possible.
- **Multiple pauses** across different tables are independent; `paymentSessions` is a per-table map.
- **Floor plan refresh during an active pause** — all stores are reactive, badge appears/disappears without manual re-render.
- **Role permissions** — current `canDoAction(role, 'confirm-payment')` is unchanged. Manager PIN for cancel bypasses role entirely; this is intentional (Waiters can request a cancel; Manager physically authorizes).

---

## 10. Out-of-scope follow-ups

These were discussed but deliberately excluded from this spec:

- **Payment log display UI.** Data is captured (`paymentLog`); rendering it (shift-close drill-in, Manager dashboard, exportable history) is a separate spec.
- **Browser / OS back interception.** Prototype assumes header back is canonical.
- **Void reason selection.** Current design uses fixed reason codes (`normal-cancel`, `split-cancel`). A reason-picker UI is a follow-up if audit requirements grow.
- **Partial seat void** (cancel one seat's payment without tearing down the whole split). Manager-tools territory, not exit-dialog territory.
