# Payment Resume & Cancel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent silent loss of in-progress payments by intercepting back navigation, provide Manager-PIN-gated cancel, and let staff resume paused payments directly from the floor plan.

**Architecture:**
1. Persist a `PaymentSession` per table in `bill.store` when a payment sheet is open.
2. Intercept the header back button on payment pages and show `PauseConfirmDialog` with Stay / Resume Later / Cancel actions when a session (or a partially-paid split) exists.
3. Render an amber "รอชำระ" (paused) badge on the table tile; tapping a paused tile routes directly to `/payment/[tableId]` (or `/split-summary`), where page-mount effects auto-restore the exact sheet + method + cash amount the user left.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (strict), Zustand 5 (with `persist`), shadcn/@base-ui/react, Tailwind v4 (OKLCH tokens), `lucide-react`, sonner, existing `ManagerPinModal`.

**Verification convention:** this repo has no unit-test runner (see `CLAUDE.md`). Each task ends with `npm run build` + `npm run lint`, plus explicit manual-test instructions on a running `npm run dev` server where behavior matters. No Jest/Vitest is introduced.

**Spec reference:** `docs/specs/2026-04-21-payment-resume-and-cancel-design.md`

---

## File Structure

**New files:**
- `src/components/payment/PauseConfirmDialog.tsx` — exit-confirmation dialog (both scenarios)

**Modified files:**
- `src/stores/bill.store.ts` — `paymentSessions` + `paymentLog` + actions
- `src/components/payment/CashDialog.tsx` — controlled `initialAmount` + `onAmountChange`
- `src/app/(app)/payment/[tableId]/page.tsx` — back intercept, session writes, auto-restore
- `src/app/(app)/payment/[tableId]/split-summary/page.tsx` — back intercept, per-seat session wire-up
- `src/components/payment/PerSeatPaymentPanel.tsx` — hydrate `paidIndexes`, session writes on seat checkout
- `src/components/payment/CustomSplitPaymentPanel.tsx` — hydrate `paidIndexes`, session writes on seat checkout
- `src/components/ui/badge.tsx` — add `paused` variant
- `src/components/table-map/TableTile.tsx` — render paused badge + aria-label variant
- `src/components/table-map/TableGrid.tsx` — direct-resume tap short-circuit

Each task is self-contained: one clear responsibility, one commit, full code shown, explicit verification.

---

## Task 1: Extend bill.store with PaymentSession and paymentLog

**Files:**
- Modify: `src/stores/bill.store.ts`

- [ ] **Step 1.1 — Add new types above `BillStore`**

Insert after `PromotionDiscount` interface (around line 43):

```ts
export interface PaymentSession {
  tableId: string
  context: 'normal' | 'per-seat'
  seatIndex?: number
  method: 'Cash' | 'QR PromptPay' | 'Card'
  activeSheet: 'cash' | 'qr' | 'card'
  cashAmount?: number
  startedAt: number
}

export interface PaymentLogEntry {
  id: string
  tableId: string
  type: 'completed' | 'voided'
  reason?: 'normal-cancel' | 'split-cancel'
  method?: 'Cash' | 'QR PromptPay' | 'Card'
  amount: number
  authorizedBy?: { staffId: string; role: 'Manager' }
  seatIndex?: number
  at: number
}
```

- [ ] **Step 1.2 — Add fields & actions to `BillStore` interface**

Insert at the bottom of the interface (before the closing brace):

```ts
  paymentSessions: Record<string, PaymentSession>
  paymentLog: PaymentLogEntry[]

  setPaymentSession: (tableId: string, session: PaymentSession) => void
  updatePaymentSession: (tableId: string, patch: Partial<Omit<PaymentSession, 'tableId'>>) => void
  clearPaymentSession: (tableId: string) => void
  getPaymentSession: (tableId: string) => PaymentSession | undefined

  appendPaymentLog: (entry: Omit<PaymentLogEntry, 'id'>) => void
```

- [ ] **Step 1.3 — Implement the actions inside the `create` body**

Add to the initial state object (alongside `splits`, `merges`, etc.):

```ts
      paymentSessions: {},
      paymentLog: [],
```

Add the action implementations (place after `clearPromotionDiscounts`, before `initCustomSplit`):

```ts
      setPaymentSession: (tableId, session) =>
        set((state) => ({
          paymentSessions: { ...state.paymentSessions, [tableId]: session },
        })),

      updatePaymentSession: (tableId, patch) =>
        set((state) => {
          const existing = state.paymentSessions[tableId]
          if (!existing) return state
          return {
            paymentSessions: {
              ...state.paymentSessions,
              [tableId]: { ...existing, ...patch },
            },
          }
        }),

      clearPaymentSession: (tableId) =>
        set((state) => {
          const { [tableId]: _void, ...rest } = state.paymentSessions
          return { paymentSessions: rest }
        }),

      getPaymentSession: (tableId) => get().paymentSessions[tableId],

      appendPaymentLog: (entry) =>
        set((state) => ({
          paymentLog: [
            ...state.paymentLog,
            {
              ...entry,
              id: `plog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            },
          ],
        })),
```

- [ ] **Step 1.4 — Bump persist version**

Change the last argument of `persist` at the bottom of the file:

```ts
    { name: 'bill-store', version: 4, migrate: () => ({}) },
```

- [ ] **Step 1.5 — Verify build & lint**

Run:
```bash
npm run build
```
Expected: Build succeeds with no TypeScript errors.

Run:
```bash
npm run lint
```
Expected: No new lint errors.

- [ ] **Step 1.6 — Commit**

```bash
git add src/stores/bill.store.ts
git commit -m "feat(bill-store): add paymentSessions and paymentLog state"
```

---

## Task 2: Add `paused` badge variant

**Files:**
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 2.1 — Add the `paused` variant**

In `badgeVariants` CVA (inside `variants.variant`), add below `escalated`:

```ts
        paused:    "bg-status-warning-bg    text-status-warning    border-status-warning/30",
```

Full context — the updated `variant` block should contain (existing items shown for placement only, do not re-add):

```ts
        escalated: "bg-status-escalated-bg text-status-escalated border-status-escalated/30",
        paused:    "bg-status-warning-bg    text-status-warning    border-status-warning/30",
        grab:    "bg-[var(--platform-grab-bg)]    text-[var(--platform-grab)]    border-[var(--platform-grab)]/30",
```

- [ ] **Step 2.2 — Verify build**

```bash
npm run build
```
Expected: PASS.

- [ ] **Step 2.3 — Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat(badge): add paused variant for in-progress payment indicator"
```

---

## Task 3: Create PauseConfirmDialog component

**Files:**
- Create: `src/components/payment/PauseConfirmDialog.tsx`

- [ ] **Step 3.1 — Write the component**

Create `src/components/payment/PauseConfirmDialog.tsx` with the full content:

```tsx
'use client'

import { useState } from 'react'
import { ArrowRightFromLine, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ManagerPinModal } from '@/components/auth/ManagerPinModal'

export type PauseScenario = 'normal' | 'split-partial'

interface PauseConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenario: PauseScenario
  tableLabel: string
  paidSeats?: number
  totalSeats?: number
  onResumeLater: () => void
  onCancelAuthorized: () => void
}

export function PauseConfirmDialog({
  open,
  onOpenChange,
  scenario,
  tableLabel,
  paidSeats,
  totalSeats,
  onResumeLater,
  onCancelAuthorized,
}: PauseConfirmDialogProps) {
  const [pinOpen, setPinOpen] = useState(false)

  const isSplit = scenario === 'split-partial'
  const title = isSplit ? 'ชำระบางส่วนแล้ว' : 'กำลังชำระเงิน'
  const description = isSplit
    ? `${tableLabel} ชำระแล้ว ${paidSeats ?? 0}/${totalSeats ?? 0} ที่นั่ง`
    : `การชำระเงินสำหรับ ${tableLabel} ยังไม่เสร็จสิ้น`
  const cancelLabel = isSplit ? 'ยกเลิกการชำระทั้งหมด' : 'ยกเลิกการชำระ'
  const authorizeLabel = isSplit
    ? 'Authorize: Cancel Split Payment'
    : 'Authorize: Cancel Payment'
  const cancelSubtext = isSplit
    ? 'ธุรกรรมที่ชำระแล้วจะถูกยกเลิกโดยผู้จัดการ'
    : undefined

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full h-14 text-base font-medium"
              onClick={() => onOpenChange(false)}
            >
              อยู่ต่อ
            </Button>
            <Button
              className="w-full h-14 text-base font-medium gap-2"
              onClick={onResumeLater}
            >
              <ArrowRightFromLine size={16} />
              กลับมาทำต่อ
            </Button>

            <div className="pt-2">
              <Separator />
            </div>

            <Button
              variant="destructive"
              className="w-full h-14 text-base font-medium gap-2 mt-2"
              onClick={() => setPinOpen(true)}
            >
              <ShieldAlert size={16} />
              {cancelLabel}
            </Button>
            {cancelSubtext && (
              <p className="text-xs text-center text-muted-foreground px-2">
                {cancelSubtext}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ManagerPinModal
        open={pinOpen}
        onOpenChange={setPinOpen}
        actionLabel={authorizeLabel}
        onAuthorize={() => {
          setPinOpen(false)
          onOpenChange(false)
          onCancelAuthorized()
        }}
      />
    </>
  )
}
```

- [ ] **Step 3.2 — Verify build**

```bash
npm run build
```
Expected: PASS.

- [ ] **Step 3.3 — Commit**

```bash
git add src/components/payment/PauseConfirmDialog.tsx
git commit -m "feat(payment): add PauseConfirmDialog with Manager PIN gate"
```

---

## Task 4: Make CashDialog controllable (preserve cash amount across pauses)

**Files:**
- Modify: `src/components/payment/CashDialog.tsx`

Current `CashDialog` remounts `CashDialogContent` on open so internal state resets. We need to:
1. Support an optional `initialAmount` prop that pre-fills the input when dialog opens
2. Emit `onAmountChange` whenever the user types so the parent can persist to the session

- [ ] **Step 4.1 — Update props and inner component**

Replace the entire contents of `src/components/payment/CashDialog.tsx` with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface CashDialogProps {
  open: boolean
  onClose: () => void
  grandTotal: number
  onConfirm: () => void
  /** Pre-fill amount when the dialog opens (used to restore a paused session) */
  initialAmount?: number
  /** Fires on every keypad interaction so the parent can persist to a session */
  onAmountChange?: (amount: number) => void
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
]

function formatInitial(amount: number | undefined): string {
  if (!amount || amount <= 0) return ''
  // Preserve up to 2 decimals, strip trailing zeros, keep at least an integer
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '')
}

function CashDialogContent({
  grandTotal,
  onConfirm,
  initialAmount,
  onAmountChange,
}: Omit<CashDialogProps, 'open' | 'onClose'>) {
  const [inputStr, setInputStr] = useState(() => formatInitial(initialAmount))

  useEffect(() => {
    onAmountChange?.(parseFloat(inputStr) || 0)
  }, [inputStr, onAmountChange])

  function handleKey(key: string) {
    if (key === 'del') {
      setInputStr((prev) => prev.slice(0, -1))
      return
    }
    if (key === '.') {
      if (inputStr.includes('.')) return
      setInputStr((prev) => (prev === '' ? '0.' : prev + '.'))
      return
    }
    if (inputStr.length >= 10) return
    setInputStr((prev) => (prev === '0' ? key : prev + key))
  }

  const cashReceived = parseFloat(inputStr) || 0
  const change = Math.max(0, cashReceived - grandTotal)
  const isValid = cashReceived >= grandTotal && cashReceived > 0
  const displayValue = inputStr === '' ? '0.00' : inputStr

  return (
    <DialogContent className="max-w-sm gap-0 p-6" showCloseButton>
      <DialogHeader className="mb-6">
        <DialogTitle className="text-lg font-semibold leading-none">
          ชำระด้วยเงินสด
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          กรอกจำนวนเงินที่รับมา
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2 mb-4">
        <p className="text-base font-semibold text-muted-foreground leading-6">
          ยอดเงินที่รับมา
        </p>
        <div className="bg-muted rounded-lg p-3 flex items-center justify-end gap-1">
          <span className="text-xl font-medium text-muted-foreground">฿</span>
          <span className="text-3xl font-semibold text-foreground leading-9">
            {displayValue}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[4px] mb-6">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-[5px]">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="flex-1 h-16 bg-muted rounded-lg flex items-center justify-center text-[26px] font-normal hover:brightness-95 active:scale-95 transition-transform select-none"
              >
                {key === 'del' ? <Delete size={22} className="text-foreground" /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-2xl text-muted-foreground">ยอดสุทธิ</span>
          <span className="text-2xl font-semibold text-destructive">
            ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl text-muted-foreground">ทอน</span>
          <span className="text-2xl font-semibold text-muted-foreground">
            ฿{change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          className="w-full h-14 text-sm font-medium"
          disabled={!isValid}
          onClick={onConfirm}
        >
          ยืนยันการชำระเงิน
        </Button>
        <DialogClose
          render={
            <Button variant="outline" className="w-full h-14 text-sm font-medium" />
          }
        >
          ยกเลิก
        </DialogClose>
      </div>
    </DialogContent>
  )
}

export function CashDialog({
  open,
  onClose,
  grandTotal,
  onConfirm,
  initialAmount,
  onAmountChange,
}: CashDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      {open && (
        <CashDialogContent
          grandTotal={grandTotal}
          onConfirm={onConfirm}
          initialAmount={initialAmount}
          onAmountChange={onAmountChange}
        />
      )}
    </Dialog>
  )
}
```

- [ ] **Step 4.2 — Verify no existing callers broke**

The new props are optional. Existing calls to `<CashDialog open={} onClose={} grandTotal={} onConfirm={} />` still compile unchanged.

```bash
npm run build
npm run lint
```
Expected: PASS on both.

- [ ] **Step 4.3 — Commit**

```bash
git add src/components/payment/CashDialog.tsx
git commit -m "feat(cash-dialog): add initialAmount + onAmountChange for session restore"
```

---

## Task 5: Normal payment page — back intercept, session writes, auto-restore

**Files:**
- Modify: `src/app/(app)/payment/[tableId]/page.tsx`

This task wires three behaviors into the main payment page:
1. Intercept the header back button to open `PauseConfirmDialog` when a session is active
2. Write/update/clear the session as the cash dialog and QR sheet open/close
3. On mount, if a session exists, auto-restore: set method, enter checkout view, re-open the sheet

- [ ] **Step 5.1 — Add imports**

In the imports block at the top of `src/app/(app)/payment/[tableId]/page.tsx`, add:

```tsx
import { PauseConfirmDialog } from '@/components/payment/PauseConfirmDialog'
```

Also add `useOrderStore` is already imported. Confirm `useBillStore` destructures below include `setPaymentSession`, `updatePaymentSession`, `clearPaymentSession`, `appendPaymentLog`.

Change this line (around line 43):

```tsx
const { clearCrmMember, dissolveAll, clearPromotionDiscounts } = useBillStore()
```

to:

```tsx
const {
  clearCrmMember,
  dissolveAll,
  clearPromotionDiscounts,
  setPaymentSession,
  updatePaymentSession,
  clearPaymentSession,
  appendPaymentLog,
} = useBillStore()
```

- [ ] **Step 5.2 — Add pause-dialog state and table label**

Just below the existing `const [discountExpanded, setDiscountExpanded] = useState(true)` line (around line 56), add:

```tsx
const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
const table = useTableStore((s) => s.tables[tableId])
const tableLabel = table?.label ?? tableId
```

- [ ] **Step 5.3 — Write session on sheet open, clear on sheet close**

Find the `onPaymentMethodSelect` prop passed to `<PaymentModals>` (currently around line 126):

```tsx
onPaymentMethodSelect={(m) => { setPaymentMethod(m); if (m === 'Cash') setCashDialogOpen(true); else if (m === 'QR PromptPay') setQrSheetOpen(true); else setViewState('checkout') }}
onCashClose={() => { setCashDialogOpen(false); setPaymentMethod(null) }}
```

Replace it with:

```tsx
onPaymentMethodSelect={(m) => {
  setPaymentMethod(m)
  if (m === 'Cash') {
    setCashDialogOpen(true)
    setPaymentSession(tableId, {
      tableId,
      context: 'normal',
      method: 'Cash',
      activeSheet: 'cash',
      cashAmount: 0,
      startedAt: Date.now(),
    })
  } else if (m === 'QR PromptPay') {
    setQrSheetOpen(true)
    setPaymentSession(tableId, {
      tableId,
      context: 'normal',
      method: 'QR PromptPay',
      activeSheet: 'qr',
      startedAt: Date.now(),
    })
  } else {
    setViewState('checkout')
    setPaymentSession(tableId, {
      tableId,
      context: 'normal',
      method: 'Card',
      activeSheet: 'card',
      startedAt: Date.now(),
    })
  }
}}
onCashClose={() => {
  setCashDialogOpen(false)
  setPaymentMethod(null)
  clearPaymentSession(tableId)
}}
```

- [ ] **Step 5.4 — Handle QR sheet close (clear session)**

Find the `setQrSheetOpen` prop (around line 115) and the `qrSheetOpen` state. In the `<PaymentModals>` block, change:

```tsx
qrSheetOpen={qrSheetOpen} setQrSheetOpen={setQrSheetOpen}
```

to:

```tsx
qrSheetOpen={qrSheetOpen}
setQrSheetOpen={(v) => {
  setQrSheetOpen(v)
  if (!v) {
    // User dismissed QR sheet without confirming — clear session
    clearPaymentSession(tableId)
    setPaymentMethod(null)
  }
}}
```

- [ ] **Step 5.5 — Clear session & append log on confirm**

Inside `handleConfirmPayment` function (around line 79), add `clearPaymentSession` and `appendPaymentLog` calls. Replace the whole function body with:

```tsx
function handleConfirmPayment() {
  if (!paymentMethod) return
  const queueOrder = useQueueStore.getState().orders[tableId]
  if (queueOrder) {
    const nextStatus = queueOrder.channel === 'takeaway' ? 'Collected' : 'Billed'
    useQueueStore.getState().setStatus(tableId, nextStatus)
    clearPromotionDiscounts(tableId)
    clearPaymentSession(tableId)
    appendPaymentLog({
      tableId,
      type: 'completed',
      method: paymentMethod,
      amount: grandTotal,
      at: Date.now(),
    })
    toast.success('Payment confirmed')
    setReceiptData({ grandTotal, paymentMethod, paidAt: new Date(), crmMember })
    setViewState('receipt')
    return
  }
  const { markCleaning, updateTable } = useTableStore.getState()
  markCleaning(tableId)
  mergedSecondaryIds.forEach((id) => markCleaning(id))
  dissolveAll(tableId)
  clearPromotionDiscounts(tableId)
  clearPaymentSession(tableId)
  updateTable(tableId, { orderStage: 'Billed' })
  updateTable(tableId, { paidAmount: grandTotal, paymentMethod, discountApplied: discountAmount })
  appendPaymentLog({
    tableId,
    type: 'completed',
    method: paymentMethod,
    amount: grandTotal,
    at: Date.now(),
  })
  toast.success('Payment confirmed')
  setReceiptData({ grandTotal, paymentMethod, paidAt: new Date(), crmMember })
  setViewState('receipt')
}
```

- [ ] **Step 5.6 — Auto-restore session on mount**

Just below the `const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())` line (around line 57), add a restore effect:

```tsx
// Restore paused session (if any) — runs once on mount per tableId
useEffect(() => {
  const session = useBillStore.getState().paymentSessions[tableId]
  if (!session || session.context !== 'normal') return
  setPaymentMethod(session.method)
  setViewState('checkout')
  if (session.activeSheet === 'cash') {
    setCashDialogOpen(true)
  } else if (session.activeSheet === 'qr') {
    setQrSheetOpen(true)
  }
  // card panel renders inline on checkout view when method === 'Card' — no sheet to open
}, [tableId])
```

Note: `useBillStore` is imported already; `useState` setters are already in scope. The `eslint-disable-next-line react-hooks/exhaustive-deps` may be needed; if the linter complains, add it directly above the closing `}, [tableId])`:

```tsx
}, [tableId]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 5.7 — Pass controlled cash amount to PaymentModals → CashDialog**

First, the `PaymentModals` component (`src/components/payment/PaymentModals.tsx`) currently does not forward `initialAmount`/`onAmountChange` to `CashDialog`. Add two new props and wire them through.

Open `src/components/payment/PaymentModals.tsx` and add to the props interface (inside `PaymentModalsProps`, after `onCashClose`):

```ts
  initialCashAmount?: number
  onCashAmountChange?: (amount: number) => void
```

In the destructuring (around the top of the component body), add them:

```ts
export function PaymentModals({
  // ... existing props
  initialCashAmount,
  onCashAmountChange,
}: PaymentModalsProps) {
```

Find the `<CashDialog>` usage (near the bottom of the file, around line 213–222) and replace it with:

```tsx
<CashDialog
  open={cashDialogOpen}
  onClose={onCashClose}
  grandTotal={grandTotal}
  onConfirm={() => {
    setCashDialogOpen(false)
    onConfirmPayment()
  }}
  initialAmount={initialCashAmount}
  onAmountChange={onCashAmountChange}
/>
```

- [ ] **Step 5.8 — Wire controlled cash amount from the payment page**

Back in `src/app/(app)/payment/[tableId]/page.tsx`, at the top of the component, derive the persisted cash amount:

Just below the destructuring added in Step 5.1, add:

```tsx
const pausedCashAmount = useBillStore((s) => s.paymentSessions[tableId]?.cashAmount)
```

Then pass it through to `<PaymentModals>`. Find the `<PaymentModals ... />` block (around line 110–129) and add at the bottom of its prop list (just before the closing `/>`):

```tsx
initialCashAmount={pausedCashAmount}
onCashAmountChange={(amount) => {
  // Only update if a session already exists (avoids creating one from stray remounts)
  const existing = useBillStore.getState().paymentSessions[tableId]
  if (existing) updatePaymentSession(tableId, { cashAmount: amount })
}}
```

- [ ] **Step 5.9 — Intercept header back button (CheckBill view)**

Find the header "Back to floor plan" button in the CheckBill view (around line 192):

```tsx
<Button variant="outline" size="icon" className="size-9" onClick={() => router.push('/table-map')} aria-label="Back to floor plan">
  <ChevronLeft size={16} />
</Button>
```

Replace with:

```tsx
<Button
  variant="outline"
  size="icon"
  className="size-9"
  onClick={() => {
    const session = useBillStore.getState().paymentSessions[tableId]
    if (session) {
      setPauseDialogOpen(true)
      return
    }
    router.push('/table-map')
  }}
  aria-label="Back to floor plan"
>
  <ChevronLeft size={16} />
</Button>
```

- [ ] **Step 5.10 — Render PauseConfirmDialog**

At the very end of the main return (right after `{modals}` inside the CheckBill view, around line 335), add the dialog render. Also render it inside the Checkout view return block for parity. Simplest: render it once, near the existing `{modals}` blocks.

Replace the CheckBill view's trailing `{modals}` section:

```tsx
    </div>
    {modals}
  </>
)
```

with:

```tsx
    </div>
    {modals}
    <PauseConfirmDialog
      open={pauseDialogOpen}
      onOpenChange={setPauseDialogOpen}
      scenario="normal"
      tableLabel={tableLabel}
      onResumeLater={() => {
        setPauseDialogOpen(false)
        router.push('/table-map')
      }}
      onCancelAuthorized={() => {
        clearPaymentSession(tableId)
        appendPaymentLog({
          tableId,
          type: 'voided',
          reason: 'normal-cancel',
          method: paymentMethod ?? undefined,
          amount: grandTotal,
          authorizedBy: { staffId: 'manager', role: 'Manager' },
          at: Date.now(),
        })
        setPaymentMethod(null)
        setCashDialogOpen(false)
        setQrSheetOpen(false)
        setViewState('checkBill')
        toast.success('ยกเลิกการชำระแล้วโดยผู้จัดการ')
      }}
    />
  </>
)
```

Do the same for the Checkout view's trailing `{modals}` — replace:

```tsx
        {modals}
      </>
    )
```

with:

```tsx
        {modals}
        <PauseConfirmDialog
          open={pauseDialogOpen}
          onOpenChange={setPauseDialogOpen}
          scenario="normal"
          tableLabel={tableLabel}
          onResumeLater={() => {
            setPauseDialogOpen(false)
            router.push('/table-map')
          }}
          onCancelAuthorized={() => {
            clearPaymentSession(tableId)
            appendPaymentLog({
              tableId,
              type: 'voided',
              reason: 'normal-cancel',
              method: paymentMethod ?? undefined,
              amount: grandTotal,
              authorizedBy: { staffId: 'manager', role: 'Manager' },
              at: Date.now(),
            })
            setPaymentMethod(null)
            setCashDialogOpen(false)
            setQrSheetOpen(false)
            setViewState('checkBill')
            toast.success('ยกเลิกการชำระแล้วโดยผู้จัดการ')
          }}
        />
      </>
    )
```

- [ ] **Step 5.11 — Also intercept the Checkout-view back button**

Find the Checkout view's back button (around line 159):

```tsx
<Button variant="outline" size="icon" className="size-9" onClick={() => setViewState('checkBill')} aria-label="Back to bill summary">
```

Leave this one alone — it moves between sub-views of the same page (not "leaving the payment"). Spec §6.1: only cross-page navigation triggers the dialog.

- [ ] **Step 5.12 — Verify build & lint**

```bash
npm run build
npm run lint
```
Expected: PASS on both.

- [ ] **Step 5.13 — Manual test on dev server**

```bash
npm run dev
```

Open `http://localhost:3000/table-map`, log in as Cashier if prompted. Then:

1. Open a table, add a line item, navigate to `/payment/[tableId]`.
2. Tap **ดำเนินการชำระเงิน** → pick **เงินสด**. Cash dialog opens.
3. Type a partial amount (say `5`).
4. Tap the back arrow (top-left header).
5. **Expected:** `PauseConfirmDialog` appears with title "กำลังชำระเงิน" and three actions.
6. Tap **กลับมาทำต่อ** (Resume Later). You should land on `/table-map`.
7. Tap the same table tile.
8. **Expected:** Page opens with the Cash dialog already visible and the previous amount (`5`) prefilled.
9. Back-arrow again → dialog → this time tap **ยกเลิกการชำระ** (destructive). Manager PIN modal opens.
10. Enter a wrong PIN → error shows. Enter the correct Manager PIN (`1234` per mock staff data — verify in `src/lib/mock-data/staff.ts` if the mock changes).
11. **Expected:** toast "ยกเลิกการชำระแล้วโดยผู้จัดการ", cash dialog closes, page lands back on CheckBill view. No session persists after refresh.

If any expectation fails, debug and fix before moving on.

- [ ] **Step 5.14 — Commit**

```bash
git add src/app/\(app\)/payment/\[tableId\]/page.tsx src/components/payment/PaymentModals.tsx
git commit -m "feat(payment): intercept back, persist cash session, auto-restore on mount"
```

---

## Task 6: Split-summary — hydrate paid seats from persisted split

The split panels track `paidIndexes` in local `useState`. If the page unmounts (navigating away), that state is lost even though `bill.store.splits[tableId].payments` retains the real records. This task hydrates the local state from the store on mount so resume works correctly.

**Files:**
- Modify: `src/components/payment/PerSeatPaymentPanel.tsx`
- Modify: `src/components/payment/CustomSplitPaymentPanel.tsx`

- [ ] **Step 6.1 — PerSeatPaymentPanel: hydrate `paidIndexes` and `selectedTabIndex`**

Open `src/components/payment/PerSeatPaymentPanel.tsx`. Replace the existing:

```tsx
const [selectedTabIndex, setSelectedTabIndex] = useState(0)
const [paidIndexes, setPaidIndexes] = useState<Set<number>>(new Set())
```

with:

```tsx
const persistedPayments = useBillStore((s) => s.splits[tableId]?.payments ?? {})
const [paidIndexes, setPaidIndexes] = useState<Set<number>>(
  () => new Set(Object.keys(persistedPayments).map(Number))
)
const [selectedTabIndex, setSelectedTabIndex] = useState<number>(() => {
  const paid = new Set(Object.keys(persistedPayments).map(Number))
  const firstUnpaid = splitAmounts.findIndex((_, i) => !paid.has(i))
  return firstUnpaid === -1 ? 0 : firstUnpaid
})
```

- [ ] **Step 6.2 — CustomSplitPaymentPanel: apply the same hydration**

Open `src/components/payment/CustomSplitPaymentPanel.tsx`. Replace the same two `useState` lines the same way. The code block to insert is identical.

- [ ] **Step 6.3 — Verify build**

```bash
npm run build
npm run lint
```
Expected: PASS.

- [ ] **Step 6.4 — Commit**

```bash
git add src/components/payment/PerSeatPaymentPanel.tsx src/components/payment/CustomSplitPaymentPanel.tsx
git commit -m "fix(split-panels): hydrate paidIndexes from persisted split.payments"
```

---

## Task 7: Split-summary page — back intercept + Cancel-all

**Files:**
- Modify: `src/app/(app)/payment/[tableId]/split-summary/page.tsx`

- [ ] **Step 7.1 — Add imports and intercept state**

At the top of the file, confirm `useState` is already imported (it is — the file uses it for `crmDialogOpen`). Add the new dialog import next to the existing payment component imports:

```tsx
import { PauseConfirmDialog } from '@/components/payment/PauseConfirmDialog'
```

`toast` from `sonner` is already imported at the top of the file — reuse it in Step 7.6.

- [ ] **Step 7.2 — Read paid count and derive paused state**

Inside the `SplitSummaryPage` component, after the existing `const { setCrmMember, clearCrmMember } = useBillStore()` line, add:

```tsx
const { cancelSplit, clearPaymentSession, appendPaymentLog } = useBillStore()
const paidCount = split ? Object.keys(split.payments).length : 0
const totalSeats = split?.seatCount ?? 0
const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
```

- [ ] **Step 7.3 — Intercept `router.back()` paths**

The split panels themselves call `router.back()`. We cannot easily intercept those from the page level. Instead, add a beforepopstate-like guard at the page level by rendering a dedicated "Back to floor" button that runs through our intercept logic, AND override the existing back behavior inside the child panels by passing a new `onBack` prop.

Open `PerSeatPaymentPanel.tsx` — find the header back button (around line 154):

```tsx
<Button variant="ghost" size="icon" className="size-9" onClick={() => router.back()} aria-label="Back">
```

Change `onClick` to use a new prop:

```tsx
<Button variant="ghost" size="icon" className="size-9" onClick={onBack} aria-label="Back">
```

And add `onBack: () => void` to `PerSeatPaymentPanelProps`:

```tsx
interface PerSeatPaymentPanelProps {
  tableId: string
  tableLabel: string
  splitAmounts: number[]
  billItems: OrderLineItem[]
  itemBills: ItemBillEntry[][] | undefined
  crmMember: CrmMember | null
  onCrmChange: () => void
  onAllPaid: () => void
  onBack: () => void
}
```

Destructure it:

```tsx
export function PerSeatPaymentPanel({
  tableId,
  tableLabel,
  splitAmounts,
  billItems,
  itemBills,
  crmMember,
  onCrmChange,
  onAllPaid,
  onBack,
}: PerSeatPaymentPanelProps) {
```

Remove the now-unused `useRouter` import if `router.back()` was its only use. (If `router` is used elsewhere in the file, keep the import.)

- [ ] **Step 7.4 — Same change for CustomSplitPaymentPanel**

Apply the identical pattern to `src/components/payment/CustomSplitPaymentPanel.tsx`:
- Add `onBack: () => void` to props
- Destructure it
- Replace `onClick={() => router.back()}` on the header back button with `onClick={onBack}`
- Remove unused `useRouter` if no longer referenced elsewhere in the file

- [ ] **Step 7.5 — Wire the intercept from the split-summary page**

In `src/app/(app)/payment/[tableId]/split-summary/page.tsx`, find the two `<PerSeatPaymentPanel>` and `<CustomSplitPaymentPanel>` usages in the return block and add an `onBack` prop to each:

```tsx
onBack={() => {
  const session = useBillStore.getState().paymentSessions[tableId]
  if (paidCount > 0 || session) {
    setPauseDialogOpen(true)
    return
  }
  router.back()
}}
```

(The `router` is already in scope from the existing `useRouter()`.)

- [ ] **Step 7.6 — Render the PauseConfirmDialog on the split-summary page**

At the very end of the JSX in `SplitSummaryPage` — just before the closing `</>` — add:

```tsx
<PauseConfirmDialog
  open={pauseDialogOpen}
  onOpenChange={setPauseDialogOpen}
  scenario={paidCount > 0 ? 'split-partial' : 'normal'}
  tableLabel={tableLabel}
  paidSeats={paidCount}
  totalSeats={totalSeats}
  onResumeLater={() => {
    setPauseDialogOpen(false)
    router.push('/table-map')
  }}
  onCancelAuthorized={() => {
    if (paidCount > 0 && split) {
      // Split-partial: void all recorded seat payments, tear down split
      Object.entries(split.payments).forEach(([idxStr, record]) => {
        appendPaymentLog({
          tableId,
          type: 'voided',
          reason: 'split-cancel',
          method: record.method,
          amount: record.amount,
          authorizedBy: { staffId: 'manager', role: 'Manager' },
          seatIndex: Number(idxStr),
          at: Date.now(),
        })
      })
      cancelSplit(tableId)
      clearPaymentSession(tableId)
      toast.success('ยกเลิกการแบ่งจ่ายแล้วโดยผู้จัดการ')
      router.replace(`/payment/${tableId}`)
    } else {
      // Per-seat session in-flight, no seats paid yet
      const session = useBillStore.getState().paymentSessions[tableId]
      if (session) {
        appendPaymentLog({
          tableId,
          type: 'voided',
          reason: 'normal-cancel',
          method: session.method,
          amount: 0,
          authorizedBy: { staffId: 'manager', role: 'Manager' },
          seatIndex: session.seatIndex,
          at: Date.now(),
        })
      }
      clearPaymentSession(tableId)
      toast.success('ยกเลิกการชำระแล้วโดยผู้จัดการ')
    }
  }}
/>
```

- [ ] **Step 7.7 — Write per-seat sessions in split panels on sheet open**

Currently the panels open the cash dialog / QR sheet for the *selected tab* but don't write a session. To enable resume of a mid-seat payment, write a session when a payment sheet opens.

In `PerSeatPaymentPanel.tsx`, find the payment-method dialog callback (around line 302–320, inside the Payment method dialog's `onClick`):

```tsx
onClick={() => {
  setPaymentMethodDialogOpen(false)
  if (method === 'Cash') {
    setCashDialogOpen(true)
  } else if (method === 'QR PromptPay') {
    setQrSheetOpen(true)
  } else {
    setCheckoutMethod(method)
  }
}}
```

Replace with:

```tsx
onClick={() => {
  setPaymentMethodDialogOpen(false)
  const base = {
    tableId,
    context: 'per-seat' as const,
    seatIndex: selectedTabIndex,
    startedAt: Date.now(),
  }
  if (method === 'Cash') {
    setCashDialogOpen(true)
    useBillStore.getState().setPaymentSession(tableId, {
      ...base,
      method: 'Cash',
      activeSheet: 'cash',
      cashAmount: 0,
    })
  } else if (method === 'QR PromptPay') {
    setQrSheetOpen(true)
    useBillStore.getState().setPaymentSession(tableId, {
      ...base,
      method: 'QR PromptPay',
      activeSheet: 'qr',
    })
  } else {
    setCheckoutMethod(method)
    useBillStore.getState().setPaymentSession(tableId, {
      ...base,
      method: 'Card',
      activeSheet: 'card',
    })
  }
}}
```

Find the three sheet close-handlers / cancel paths and clear the session:

Existing `<CashDialog onClose={() => setCashDialogOpen(false)} ... />` — replace with:

```tsx
<CashDialog
  open={cashDialogOpen}
  onClose={() => {
    setCashDialogOpen(false)
    useBillStore.getState().clearPaymentSession(tableId)
  }}
  grandTotal={selectedAmount}
  onConfirm={() => {
    setCashDialogOpen(false)
    useBillStore.getState().clearPaymentSession(tableId)
    handleConfirmPayment('Cash')
  }}
/>
```

Existing `<QrSheet onClose={() => setQrSheetOpen(false)} ... />` — replace with:

```tsx
<QrSheet
  open={qrSheetOpen}
  onClose={() => {
    setQrSheetOpen(false)
    useBillStore.getState().clearPaymentSession(tableId)
  }}
  grandTotal={selectedAmount}
  onConfirm={() => {
    setQrSheetOpen(false)
    useBillStore.getState().clearPaymentSession(tableId)
    handleConfirmPayment('QR PromptPay')
  }}
/>
```

For the Card checkout sub-view (the `if (checkoutMethod === 'Card')` block), update the back button to clear the session:

```tsx
<Button
  variant="outline"
  size="icon"
  className="size-9"
  onClick={() => {
    setCheckoutMethod(null)
    useBillStore.getState().clearPaymentSession(tableId)
  }}
  aria-label="Back"
>
  <ChevronLeft size={16} />
</Button>
```

And the card confirm `onClick={() => handleConfirmPayment('Card')}` should also clear. Find it (around line 140) and change to:

```tsx
onClick={() => {
  useBillStore.getState().clearPaymentSession(tableId)
  handleConfirmPayment('Card')
}}
```

- [ ] **Step 7.8 — Apply identical session wiring to CustomSplitPaymentPanel**

Repeat Step 7.7's logic in `src/components/payment/CustomSplitPaymentPanel.tsx`. The payment-method dialog, cash dialog, QR sheet, and card-checkout back button all need the same session writes/clears. Use the same code blocks.

- [ ] **Step 7.9 — Verify build & lint**

```bash
npm run build
npm run lint
```
Expected: PASS.

- [ ] **Step 7.10 — Manual test on dev server**

```bash
npm run dev
```

1. Open a table, add items, navigate to payment, open **แบ่งจ่าย** (split by value) — confirm split with 2 payers.
2. On split-summary, pay bill #1 with Cash (any sufficient amount). bill #1 shows "ชำระแล้ว".
3. Tap the header back arrow.
4. **Expected:** `PauseConfirmDialog` shows with title "ชำระบางส่วนแล้ว" and "1/2 ที่นั่ง".
5. Tap **กลับมาทำต่อ** → lands on table-map.
6. Tap the same table tile.
7. **Expected:** Route goes to `/payment/[tableId]/split-summary`; bill #1 still shows paid; active tab is bill #2.
8. Pay bill #2 — completion path as normal.
9. Repeat: reach same "1/2 paid" state; this time tap **ยกเลิกการชำระทั้งหมด** → Manager PIN → enter correct PIN.
10. **Expected:** toast "ยกเลิกการแบ่งจ่ายแล้วโดยผู้จัดการ"; route replaces to `/payment/[tableId]` (single-bill CheckBill); the paid seat records are gone.

- [ ] **Step 7.11 — Commit**

```bash
git add src/app/\(app\)/payment/\[tableId\]/split-summary/page.tsx src/components/payment/PerSeatPaymentPanel.tsx src/components/payment/CustomSplitPaymentPanel.tsx
git commit -m "feat(split): back intercept + Manager-gated cancel + per-seat sessions"
```

---

## Task 8: Floor-plan paused badge

**Files:**
- Modify: `src/components/table-map/TableTile.tsx`

- [ ] **Step 8.1 — Read session + derive paused**

Open `src/components/table-map/TableTile.tsx`. Just below the existing `const split = useMemo(() => splits?.[table.id], [splits, table.id])` and `const paidCount = split ? Object.keys(split.payments).length : 0` (around line 47–48), add:

```tsx
const paymentSessions = useBillStore((s) => s.paymentSessions)
const hasActiveSession = Boolean(paymentSessions[table.id])
const isSplitPaused = split !== undefined && paidCount > 0 && paidCount < split.seatCount
const isPaused = hasActiveSession || isSplitPaused
```

- [ ] **Step 8.2 — Add paused badge rendering**

Find the existing corner-badge block (around line 94–111). The current chain is `showSplitBadge ? ... : showMergeBadge ? ... : stage ? ...`. Paused should take priority over split/merge when both would match — it's the most actionable indicator.

Import the `Pause` icon at the top:

```tsx
import { Armchair, Scissors, Link, Pause } from 'lucide-react'
```

Replace the corner-badge ternary chain with:

```tsx
{isPaused ? (
  <Badge variant="paused" className="absolute top-2 right-2 text-sm py-0">
    <Pause size={10} className="mr-0.5" />
    รอชำระ
  </Badge>
) : showSplitBadge ? (
  <Badge className="absolute top-2 right-2 text-sm py-0 bg-status-split-bg text-status-split border-0">
    <Scissors size={10} className="mr-0.5" />
    {paidCount}/{split!.seatCount} paid
  </Badge>
) : showMergeBadge ? (
  <Badge className="absolute top-2 right-2 text-sm py-0 bg-status-merged-bg text-status-merged border-0">
    <Link size={10} className="mr-0.5" />
    {isMergedSecondary ? `→${primaryLabel}` : `+${mergedSecondaryIds.length}`}
  </Badge>
) : table.orderStage !== null && (table.status === 'Occupied' || table.status === 'CheckRequested') ? (
  <Badge
    variant={isEscalated ? 'escalated' : STAGE_VARIANT[table.orderStage]}
    className="absolute top-2 right-2 text-sm py-0"
  >
    {table.orderStage}
  </Badge>
) : null}
```

- [ ] **Step 8.3 — Update aria-label for paused tiles**

Find the existing `aria-label={...}` attribute (around line 89):

```tsx
aria-label={`โต๊ะ ${table.label}, ${table.status}, ${guestCount} ที่นั่ง`}
```

Replace with:

```tsx
aria-label={
  isPaused
    ? `โต๊ะ ${table.label} — รอชำระ, แตะเพื่อกลับไปทำต่อ`
    : `โต๊ะ ${table.label}, ${table.status}, ${guestCount} ที่นั่ง`
}
```

- [ ] **Step 8.4 — Verify build & lint**

```bash
npm run build
npm run lint
```
Expected: PASS.

- [ ] **Step 8.5 — Manual test**

```bash
npm run dev
```

1. Open table, go to payment, open Cash dialog with partial amount, hit back → Resume Later.
2. **Expected:** On `/table-map`, the table's tile shows an amber "รอชำระ" chip in the top-right corner, with a pause icon.
3. Pay the bill to completion → the chip disappears (next render).
4. Initiate a split, pay one of two bills, navigate back.
5. **Expected:** Same "รอชำระ" chip appears, replacing the "x/y paid" split chip.

- [ ] **Step 8.6 — Commit**

```bash
git add src/components/table-map/TableTile.tsx
git commit -m "feat(table-tile): show paused badge for in-progress payments"
```

---

## Task 9: Direct-resume tap short-circuit

**Files:**
- Modify: `src/components/table-map/TableGrid.tsx`
- Modify: `src/components/table-map/TableTile.tsx`

- [ ] **Step 9.1 — Inspect the current tap wiring**

First, read the current `TableGrid.tsx` to see how `onTap` is supplied to each tile. If `TableGrid` passes a closure to each tile's `onTap`, modify that closure. If `TableTile` itself uses `useRouter` to navigate, modify the tile's internal handler.

Looking at `TableTile.tsx` (Step 8 established `useRouter` is already imported): the tile's own `onClick` handler currently handles the `isMergedSecondary` short-circuit to navigate to the primary's payment page. We'll extend that handler to also short-circuit for paused tables.

- [ ] **Step 9.2 — Update the tile's onClick**

Open `src/components/table-map/TableTile.tsx`. Find the outer `<button onClick={...}>` handler (around line 82–88):

```tsx
onClick={() => {
  if (isMergedSecondary && primaryTableId) {
    router.push(`/payment/${primaryTableId}`)
    return
  }
  onTap(table)
}}
```

Replace with:

```tsx
onClick={() => {
  // Paused payment → direct resume, bypass bottom sheet
  if (hasActiveSession) {
    router.push(`/payment/${table.id}`)
    return
  }
  if (isSplitPaused) {
    router.push(`/payment/${table.id}/split-summary`)
    return
  }
  // Merged secondary tables defer to their primary's payment page
  if (isMergedSecondary && primaryTableId) {
    router.push(`/payment/${primaryTableId}`)
    return
  }
  onTap(table)
}}
```

(`hasActiveSession` and `isSplitPaused` were introduced in Step 8.1 — they're in scope.)

- [ ] **Step 9.3 — Verify build & lint**

```bash
npm run build
npm run lint
```
Expected: PASS.

- [ ] **Step 9.4 — Manual test**

```bash
npm run dev
```

1. Trigger a paused normal payment (cash dialog with some amount, back → Resume Later).
2. On table-map, tap the paused tile.
3. **Expected:** Goes directly to `/payment/[tableId]`, cash dialog is already open with the prior amount, skipping any bottom sheet.
4. Trigger a paused split payment (1/2 paid, back → Resume Later).
5. Tap the paused tile.
6. **Expected:** Goes directly to `/payment/[tableId]/split-summary`, with bill #1 still marked paid, bill #2 active.
7. On a non-paused occupied table, tap it — the existing bottom-sheet should still appear (no regression).

- [ ] **Step 9.5 — Commit**

```bash
git add src/components/table-map/TableTile.tsx
git commit -m "feat(table-tile): direct resume tap for paused tables"
```

---

## Task 10: End-to-end smoke verification & final build

**Files:** none (verification only)

- [ ] **Step 10.1 — Run full build and lint clean**

```bash
npm run build
```
Expected: PASS with no errors or warnings.

```bash
npm run lint
```
Expected: PASS.

- [ ] **Step 10.2 — Full manual smoke test**

Run `npm run dev` and walk through the following scenarios in one session (open/clear localStorage between test runs if state piles up):

**Scenario A — Normal cash pause + Resume Later + Cancel by Manager PIN:**
1. Login as Cashier, open a table, add items, go to payment.
2. Tap Pay → Cash → type `100` → back → Resume Later → floor plan shows ⏸ badge.
3. Tap tile → resume → cash dialog open with `100` prefilled.
4. Back → Cancel Payment → Manager PIN → confirmed.
5. Cash dialog closes, CheckBill view active, no badge on tile, no session in localStorage `bill-store`.

**Scenario B — QR pause + resume + complete:**
1. From CheckBill, Pay → QR PromptPay → QR sheet shows.
2. Back → Resume Later → badge visible.
3. Tap tile → QR sheet reopens.
4. Tap ยืนยันการชำระเงิน on QR sheet → receipt view → back to floor plan → tile shows `Cleaning`.

**Scenario C — Split partial + cancel all by Manager:**
1. Open new table, add items, go to payment → แบ่งจ่าย with 2 payers → allocate amounts → proceed.
2. Pay bill #1 cash → "ชำระแล้ว" on bill #1.
3. Back (top header) → dialog says "ชำระบางส่วนแล้ว 1/2 ที่นั่ง" → ยกเลิกการชำระทั้งหมด → Manager PIN.
4. Redirected to `/payment/[tableId]` CheckBill, single bill, no split visible, no paid records.
5. Table-map tile has no ⏸ badge; localStorage `bill-store.splits` has no entry for that table.

**Scenario D — Per-seat mid-payment (no seats paid yet):**
1. New split with 2 payers → on split-summary, tap ดำเนินการชำระเงิน on bill #1 → pick Cash → dialog opens → type `50`.
2. Back (header) → dialog says "กำลังชำระเงิน" (normal scenario, no seats paid yet).
3. Resume Later → badge appears.
4. Tap tile → goes to split-summary → cash dialog reopens with `50` prefilled on bill #1's tab.

**Scenario E — Merged table with paused normal payment:**
1. Open T3 + T4, add items to both, go to `/payment/T3`, merge T4 into T3.
2. Pay merged → Cash → type 200 → back → Resume Later → T3 shows ⏸ badge, T4 still shows merge→T3.
3. Tap T3 → resumes cash dialog. Confirm → both T3 and T4 transition to Cleaning.

Record any regressions or unexpected behavior and fix before declaring done.

- [ ] **Step 10.3 — Final commit (no-op if all prior tasks already committed cleanly)**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

If anything is still uncommitted, investigate — a missed step in earlier tasks. Otherwise, the feature is done.

---

## Out-of-scope (explicit, for plan reviewers)

- Payment log display UI — entries are being written, rendering is a separate spec.
- Browser back button / sidebar nav intercept — prototype uses header back as canonical.
- Voiding individual completed seat payments — Manager-tools territory, not exit-dialog territory.
- Automated tests — this repo has no unit-test runner (see `CLAUDE.md`); verification is via `npm run build` + `npm run lint` + manual dev-server checks. Adding Jest/Vitest or running the existing Playwright stubs is a separate initiative.

---

## Self-review summary

- **Coverage:** All three spec sections (data model, exit-dialog, resume) are implemented across Tasks 1–9. Task 10 is end-to-end verification.
- **Placeholders:** none found. All code blocks show concrete implementations; all commands are exact.
- **Type consistency:** `PaymentSession`, `PaymentLogEntry`, `setPaymentSession`, `clearPaymentSession`, `updatePaymentSession`, `appendPaymentLog` are defined in Task 1 and used verbatim in Tasks 5, 7, 8. `PauseConfirmDialog` props match between definition (Task 3) and consumption (Tasks 5, 7).
- **Decomposition sanity-check:** Each task commits independently. Tasks 1–4 (store, badge variant, dialog component, controllable CashDialog) have no runtime dependency on each other — they could even run in parallel. Tasks 5–7 build on them. Tasks 8–9 depend on Task 1 for the session read.
