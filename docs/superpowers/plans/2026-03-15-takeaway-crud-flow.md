# Takeaway CRUD Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After creating a takeaway order, staff navigate directly to the order entry page; the order entry page adapts its header and Send CTA for takeaway context; staff can edit customer info and cancel while the order is in Taking status.

**Architecture:** The existing `/order/[tableId]` page detects a takeaway order via a non-reactive `useQueueStore.getState()` identity check plus a reactive selector for live status. All dine-in behaviour is unchanged — every takeaway-specific branch is guarded by `isTakeaway`. Two new shared dialog components live in `src/components/queue/`.

**Tech Stack:** Next.js 16 App Router, TypeScript 5 strict, Zustand 5 (`persist`), shadcn/ui (Base UI), Solar icon set, Tailwind CSS 4

---

## Chunk 1: Store Foundation

### Task 1: Extend `queue.store.ts` — type union + new actions

**Files:**
- Modify: `src/stores/queue.store.ts`

The current `createTakeaway` uses `set()` as its arrow body so it returns `void`. We need to restructure it to return the `orderId`. We also need `'Cancelled'` in the union and two new actions.

- [ ] **Step 1: Add `'Cancelled'` to `QueueOrderStatus` union**

Open `src/stores/queue.store.ts`. Change the union type (lines 13–23):

```typescript
export type QueueOrderStatus =
  | 'Pending'       // delivery incoming, awaiting staff accept/reject
  | 'Confirmed'     // delivery accepted by staff
  | 'Preparing'     // delivery being cooked (KDS in progress)
  | 'ReadyForRider' // delivery ready, waiting for rider pickup
  | 'PickedUp'      // delivery complete
  | 'Rejected'      // delivery rejected by staff
  | 'Taking'        // takeaway being created / order entry not yet sent
  | 'Sent'          // takeaway sent to KDS
  | 'Ready'         // takeaway ready for collection (KDS complete)
  | 'Collected'     // takeaway collected by customer
  | 'Cancelled'     // takeaway cancelled before sending to kitchen
```

- [ ] **Step 2: Update `QueueStore` interface — change `createTakeaway` return type + add new actions**

In the `QueueStore` interface (lines 40–53), replace:

```typescript
createTakeaway: (customerName: string, customerPhone?: string) => void
```

with:

```typescript
createTakeaway: (customerName: string, customerPhone?: string) => string
updateCustomer: (orderId: string, name: string, phone?: string) => void
cancelOrder: (orderId: string) => void
```

- [ ] **Step 3: Rewrite `createTakeaway` implementation to return `orderId`**

The current implementation (lines 129–146) uses `set()` as the arrow body which returns `void`. Replace the entire `createTakeaway` implementation with:

```typescript
createTakeaway: (customerName, customerPhone) => {
  const counter = get().takeawayCounter + 1
  const orderId = `TK-${String(counter).padStart(3, '0')}`
  const order: QueueOrder = {
    orderId,
    channel: 'takeaway',
    customerName,
    customerPhone,
    itemsSummary: 'No items yet',
    status: 'Taking',
    createdAt: Date.now(),
  }
  set((state) => ({
    takeawayCounter: counter,
    orders: { ...state.orders, [orderId]: order },
  }))
  return orderId
},
```

- [ ] **Step 4: Add `updateCustomer` and `cancelOrder` implementations**

Add these two actions after `createTakeaway` (before `toggleDemoActive`):

```typescript
updateCustomer: (orderId, name, phone) => {
  set((state) => ({
    orders: {
      ...state.orders,
      [orderId]: { ...state.orders[orderId], customerName: name, customerPhone: phone },
    },
  }))
},

cancelOrder: (orderId) => {
  const order = get().orders[orderId]
  if (!order || order.status !== 'Taking') return
  set((state) => ({
    orders: {
      ...state.orders,
      [orderId]: { ...state.orders[orderId], status: 'Cancelled' },
    },
  }))
},
```

- [ ] **Step 5: Verify TypeScript build passes**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -20
```

Expected: no errors related to `queue.store.ts`. Fix any TypeScript errors before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/stores/queue.store.ts
git commit -m "feat(queue): add Cancelled status, createTakeaway returns orderId, updateCustomer + cancelOrder actions"
```

---

## Chunk 2: Shared Dialog Components

### Task 2: Create `ConfirmCancelDialog`

**Files:**
- Create: `src/components/queue/ConfirmCancelDialog.tsx`

This dialog is used in two places: the order entry page header and `TakeawayCard`. Build it once here.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmCancelDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  orderId: string
  customerName: string
}

export function ConfirmCancelDialog({
  open,
  onClose,
  onConfirm,
  orderId,
  customerName,
}: ConfirmCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          {orderId} · {customerName} will be removed.
        </p>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onClose}>
            Keep
          </Button>
          <Button variant="destructive" size="lg" onClick={onConfirm}>
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/queue/ConfirmCancelDialog.tsx
git commit -m "feat(queue): add ConfirmCancelDialog shared component"
```

---

### Task 3: Create `EditCustomerModal`

**Files:**
- Create: `src/components/queue/EditCustomerModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQueueStore } from '@/stores/queue.store'

interface EditCustomerModalProps {
  open: boolean
  onClose: () => void
  orderId: string
  initialName: string
  initialPhone?: string
}

export function EditCustomerModal({
  open,
  onClose,
  orderId,
  initialName,
  initialPhone,
}: EditCustomerModalProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const updateCustomer = useQueueStore((s) => s.updateCustomer)

  // Reset fields to latest values each time modal opens
  useEffect(() => {
    if (open) {
      setName(initialName)
      setPhone(initialPhone ?? '')
    }
  }, [open, initialName, initialPhone])

  function handleConfirm() {
    if (!name.trim()) return
    updateCustomer(orderId, name.trim(), phone.trim() || undefined)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <label className="text-sm font-medium">Customer name *</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
          <label className="text-sm font-medium text-muted-foreground">Phone (optional)</label>
          <Input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleConfirm} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/queue/EditCustomerModal.tsx
git commit -m "feat(queue): add EditCustomerModal component"
```

---

## Chunk 3: TakeawayPanel + TakeawayCard + NewTakeawayModal

### Task 4: Update `TakeawayPanel` — filter Cancelled

**Files:**
- Modify: `src/components/queue/TakeawayPanel.tsx`

- [ ] **Step 1: Add `'Cancelled'` to the active-orders filter**

Find the `useMemo` filter (currently: `.filter((o) => o.channel === 'takeaway' && o.status !== 'Collected')`).

Change it to:

```typescript
.filter((o) => o.channel === 'takeaway' && o.status !== 'Collected' && o.status !== 'Cancelled')
```

- [ ] **Step 2: Verify build**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/queue/TakeawayPanel.tsx
git commit -m "feat(queue): filter Cancelled orders from TakeawayPanel list"
```

---

### Task 5: Update `TakeawayCard` — navigate + cancel button

**Files:**
- Modify: `src/components/queue/TakeawayCard.tsx`

- [ ] **Step 1: Add router, ConfirmCancelDialog import, cancelOrder selector, and dialog state**

Add to imports:

```tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloseSquareLinear } from 'solar-icon-set'
import { ConfirmCancelDialog } from '@/components/queue/ConfirmCancelDialog'
```

Inside `TakeawayCard`:

```tsx
const router = useRouter()
const cancelOrder = useQueueStore((s) => s.cancelOrder)
const [showCancel, setShowCancel] = useState(false)
```

- [ ] **Step 2: Replace "Start Order" CTA section**

Replace the existing CTA block (the `{order.status === 'Taking' && ...}` block) with:

```tsx
{order.status === 'Taking' && (
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      className="flex-1"
      onClick={() => router.push(`/order/${order.orderId}`)}
    >
      Start Order
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="min-w-[36px] text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => setShowCancel(true)}
      aria-label="Cancel order"
    >
      <CloseSquareLinear size={16} />
    </Button>
  </div>
)}
```

- [ ] **Step 3: Add `ConfirmCancelDialog` at the bottom of the card JSX (before the closing `</div>`)**

```tsx
<ConfirmCancelDialog
  open={showCancel}
  onClose={() => setShowCancel(false)}
  onConfirm={() => {
    cancelOrder(order.orderId)
    setShowCancel(false)
  }}
  orderId={order.orderId}
  customerName={order.customerName}
/>
```

- [ ] **Step 4: Verify build**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add src/components/queue/TakeawayCard.tsx
git commit -m "feat(queue): TakeawayCard navigates to order entry; cancel button with confirmation"
```

---

### Task 6: Update `NewTakeawayModal` — navigate after create

**Files:**
- Modify: `src/components/queue/NewTakeawayModal.tsx`

- [ ] **Step 1: Add `useRouter` import**

Add to imports:

```tsx
import { useRouter } from 'next/navigation'
```

- [ ] **Step 2: Add router instance inside the component**

```tsx
const router = useRouter()
```

- [ ] **Step 3: Update `handleConfirm` — call sequence: createTakeaway → reset state → onClose → navigate**

Replace the existing `handleConfirm`:

```tsx
function handleConfirm() {
  if (!name.trim()) return
  const orderId = createTakeaway(name.trim(), phone.trim() || undefined)
  setName('')
  setPhone('')
  onClose()
  router.push(`/order/${orderId}`)
}
```

Note: `setName('')` / `setPhone('')` and `onClose()` fire before `router.push` so the modal resets cleanly before the navigation animation begins.

- [ ] **Step 4: Verify build**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -10
```

If you see a TypeScript error like `Type 'void' is not assignable to type 'string'` — the `createTakeaway` store interface change from Task 1 must be applied first. Verify Task 1 Step 2 was completed.

- [ ] **Step 5: Commit**

```bash
git add src/components/queue/NewTakeawayModal.tsx
git commit -m "feat(queue): NewTakeawayModal navigates to order entry after create"
```

---

## Chunk 4: TicketPanel + Order Page

### Task 7: Update `TicketPanel` — `onSend` + `hideSend` props

**Files:**
- Modify: `src/components/order/TicketPanel.tsx`

- [ ] **Step 1: Add `onSend` and `hideSend` to `TicketPanelProps` interface**

```typescript
interface TicketPanelProps {
  tableId: string
  onEditLineItem: (lineId: string) => void
  onSend?: () => void      // if provided: called instead of updateTable; sendRound still fires
  hideSend?: boolean       // if true: hides the Send button entirely (read-only state)
}
```

- [ ] **Step 2: Destructure new props in the function signature**

```typescript
export function TicketPanel({ tableId, onEditLineItem, onSend, hideSend }: TicketPanelProps) {
```

- [ ] **Step 3: Update `handleSend` to branch on `onSend`**

Replace the existing `handleSend`:

```typescript
function handleSend() {
  useOrderStore.getState().sendRound(tableId)
  if (onSend) {
    onSend()
  } else {
    updateTable(tableId, { orderStage: 'Ordered' })
  }
  toast('Order sent to kitchen')
}
```

- [ ] **Step 4: Gate the Send button on `hideSend`**

Wrap the Send `<Button>` in the footer with a conditional:

```tsx
{!hideSend && (
  <Button
    size="cta"
    className="w-full"
    onClick={handleSend}
    disabled={!hasUnsentItems || !canDoAction(role, 'send-to-kitchen')}
  >
    Send to Kitchen
  </Button>
)}
```

- [ ] **Step 5: Verify build**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -10
```

Expected: no errors. Dine-in callers pass neither `onSend` nor `hideSend` — zero behaviour change confirmed by build passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/order/TicketPanel.tsx
git commit -m "feat(order): TicketPanel accepts onSend + hideSend props for takeaway context"
```

---

### Task 8: Update order entry page — takeaway context

**Files:**
- Modify: `src/app/(app)/order/[tableId]/page.tsx`

This is the largest task. Work through it in sub-steps.

- [ ] **Step 1: Add imports**

Add to the existing import block:

```tsx
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrderStatus } from '@/stores/queue.store'
import { PenLinear, CloseCircleLinear } from 'solar-icon-set'
import { Badge } from '@/components/ui/badge'
import { EditCustomerModal } from '@/components/queue/EditCustomerModal'
import { ConfirmCancelDialog } from '@/components/queue/ConfirmCancelDialog'
```

- [ ] **Step 2: Add takeaway detection + state inside `OrderPage`**

After `const router = useRouter()` and `const tableId = params.tableId`, add:

```tsx
// Takeaway context detection
// Non-reactive identity check — key never changes during session
const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
// Reactive primitives — drive re-renders when status/name/phone change
const queueStatus = useQueueStore((s) => s.orders[tableId]?.status)
const queueCustomerName = useQueueStore((s) => s.orders[tableId]?.customerName)
const queueCustomerPhone = useQueueStore((s) => s.orders[tableId]?.customerPhone)
const isTakingStatus = queueStatus === 'Taking'

// Takeaway modal state
const [showEditCustomer, setShowEditCustomer] = useState(false)
const [showConfirmCancel, setShowConfirmCancel] = useState(false)
```

Why reactive selectors for `customerName`/`customerPhone`? Because `EditCustomerModal` calls `updateCustomer()` which mutates the store — the header must re-render to show the new name. Per CLAUDE.md: select raw primitive state for values that change at runtime. All three selectors return primitive strings, so no snapshot-caching issue.

- [ ] **Step 3: Add a helper to map `QueueOrderStatus` to a display label**

Add this outside the component (below the `CATEGORY_NAV` block):

```tsx
function queueStatusLabel(status: QueueOrderStatus | undefined): string {
  switch (status) {
    case 'Sent':      return 'Sent to Kitchen'
    case 'Ready':     return 'Ready for Collection'
    case 'Collected': return 'Collected'
    default:          return status ?? ''
  }
}
```

- [ ] **Step 4: Update `headerLabel` to use takeaway customer name when applicable**

Replace the existing `headerLabel` computation:

```tsx
const headerLabel = isTakeaway
  ? `${tableId} · ${queueCustomerName ?? ''}`
  : table
    ? `${table.label} \u2022 ${table.guestCount ?? 0} guests`
    : tableId
```

- [ ] **Step 5: Replace the header JSX**

Replace the entire `<header>` block with:

```tsx
<header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
  <button
    onClick={() => router.back()}
    className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 rounded-lg hover:bg-muted transition-colors"
    aria-label="Back to floor map"
  >
    <AltArrowLeftLinear size={20} />
  </button>

  <div className="flex flex-col items-center">
    <span className="text-sm font-semibold">{headerLabel}</span>
    {isTakeaway && queueCustomerPhone && (
      <span className="text-xs text-muted-foreground">{queueCustomerPhone}</span>
    )}
    {isTakeaway && !isTakingStatus && (
      <Badge variant="outline" className="text-xs mt-0.5">
        {queueStatusLabel(queueStatus)}
      </Badge>
    )}
  </div>

  <div className="flex items-center gap-1">
    {isTakeaway && isTakingStatus && (
      <>
        <button
          onClick={() => setShowEditCustomer(true)}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted transition-colors"
          aria-label="Edit customer"
        >
          <PenLinear size={18} />
        </button>
        <button
          onClick={() => setShowConfirmCancel(true)}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted text-destructive transition-colors"
          aria-label="Cancel order"
        >
          <CloseCircleLinear size={18} />
        </button>
      </>
    )}
    {!isTakeaway && <div className="w-11" />}
  </div>
</header>
```

- [ ] **Step 6: Add read-only wrapper to `MenuPanel` and pass `onSend`/`hideSend` to `TicketPanel`**

In the 3-column body section, replace the `MenuPanel` wrapper and `TicketPanel` usage:

For the MenuPanel column (Column 2), wrap with read-only guard:

```tsx
{/* Column 2: Menu photo grid */}
<div className="flex-1 overflow-y-auto bg-background">
  <div className={isTakeaway && !isTakingStatus ? 'pointer-events-none opacity-50' : ''}>
    <MenuPanel
      onItemTap={(itemId) => setSelectedMenuItemId(itemId)}
      activeCategory={activeCategory}
    />
  </div>
</div>
```

For the TicketPanel (Column 3), add the new props:

```tsx
<TicketPanel
  tableId={tableId}
  onEditLineItem={(lineId) => {
    const order = useOrderStore.getState().orders[tableId]
    const item = order?.rounds
      .flatMap((r) => r.items)
      .find((i) => i.lineId === lineId)
    if (item) {
      setEditingLineId(lineId)
      setSelectedMenuItemId(item.menuItemId)
    }
  }}
  onSend={isTakeaway ? () => {
    useQueueStore.getState().advanceStatus(tableId)
    router.push('/table-map')
  } : undefined}
  hideSend={isTakeaway && !isTakingStatus}
/>
```

- [ ] **Step 7: Add the two modals before the closing `</>`**

After the `<ModifierSheet>` closing tag, add:

```tsx
{isTakeaway && (
  <>
    <EditCustomerModal
      open={showEditCustomer}
      onClose={() => setShowEditCustomer(false)}
      orderId={tableId}
      initialName={queueCustomerName ?? ''}
      initialPhone={queueCustomerPhone}
    />
    <ConfirmCancelDialog
      open={showConfirmCancel}
      onClose={() => setShowConfirmCancel(false)}
      onConfirm={() => {
        useQueueStore.getState().cancelOrder(tableId)
        setShowConfirmCancel(false)
        router.push('/table-map')
      }}
      orderId={tableId}
      customerName={queueCustomerName ?? ''}
    />
  </>
)}
```

- [ ] **Step 8: Verify build**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build 2>&1 | tail -20
```

Fix any TypeScript errors. Common issues:
- `PenLinear` / `CloseCircleLinear` not found in `solar-icon-set` → check exact icon names with `grep -r "Linear" node_modules/solar-icon-set/src/index.ts | grep -i "pen\|edit\|close\|circle"` and use the correct name
- `Badge` variant not matching → use `variant="outline"` which already exists

- [ ] **Step 9: Commit**

```bash
git add src/app/\(app\)/order/\[tableId\]/page.tsx
git commit -m "feat(order): takeaway context in order entry page — header, read-only guard, edit/cancel modals"
```

---

## Chunk 5: Manual Verification

### Task 9: End-to-end walkthrough

No automated tests exist — use `npm run build` for TypeScript correctness and manual browser verification for behaviour.

- [ ] **Step 1: Start dev server**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run dev
```

Open http://localhost:3000. Log in as any role that can create takeaway orders.

- [ ] **Step 2: Verify Create flow**

1. Navigate to floor plan → Takeaway tab
2. Tap FAB (+ button) → `NewTakeawayModal` opens
3. Enter name "Test Customer", phone "081-111-1111" → tap "Create Order"
4. ✓ Modal closes immediately
5. ✓ Browser navigates to `/order/TK-001` (or next TK-NNN)
6. ✓ Header shows "TK-001 · Test Customer" with phone subtitle
7. ✓ Edit (pencil) icon and Cancel (✕) icon visible in header

- [ ] **Step 3: Verify Update — menu items**

1. On the order entry page, tap any menu item → modifier sheet opens
2. Confirm → item appears in TicketPanel
3. ✓ "Send to Kitchen" button appears in TicketPanel footer
4. Tap "Send to Kitchen" → toast fires → browser navigates to `/table-map`
5. ✓ Takeaway tab shows TK-001 card with status "Sent to Kitchen"

- [ ] **Step 4: Verify Update — customer info**

1. Create a new takeaway order → lands on `/order/TK-NNN`
2. Tap pencil icon → `EditCustomerModal` opens with pre-filled name/phone
3. Change name → tap Save
4. ✓ Header updates to show new name

- [ ] **Step 5: Verify Delete (cancel from order page)**

1. Create a new takeaway order → lands on order entry
2. Tap ✕ icon → `ConfirmCancelDialog` opens
3. Tap "Keep" → dialog closes, stays on order page
4. Tap ✕ again → tap "Cancel Order" → navigates to `/table-map`
5. ✓ Takeaway tab no longer shows the cancelled card

- [ ] **Step 6: Verify Delete (cancel from TakeawayCard)**

1. Create a new takeaway order → navigate back to Takeaway tab
2. Card shows "Start Order" (flex-1) and ✕ (ghost, min-w-[36px]) buttons
3. Tap ✕ → `ConfirmCancelDialog` opens
4. Confirm → card disappears

- [ ] **Step 7: Verify read-only guard**

1. Create a takeaway, add items, send to kitchen (status becomes "Sent")
2. Navigate back to Takeaway tab → ✓ `TakeawayCard` for that order shows no action buttons (status is `Sent`, not `Taking` — the CTA row is hidden)
3. Manually navigate to `/order/TK-001` in the browser (type URL directly)
4. ✓ MenuPanel is greyed out (pointer-events-none opacity-50)
5. ✓ Send button is hidden
6. ✓ Edit and Cancel icons in header are hidden
7. ✓ Status badge "Sent to Kitchen" appears in header

- [ ] **Step 8: Verify dine-in regression**

1. Open a dine-in table → navigate to its order entry page
2. ✓ Header shows table label + guest count (no takeaway icons)
3. ✓ Add items → Send to Kitchen works → orderStage updates on floor plan tile
4. ✓ No TK-prefix in URL, no queue store involvement

- [ ] **Step 9: Final build check**

```bash
cd "/Users/peeradonte/Desktop/Tech Basecamp/A RAMEN/POS-wireframe" && npm run build
```

Expected: 0 errors, 0 warnings that weren't already present before this feature.
