# Delivery Order Flow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace auto-receive delivery orders with staff-initiated manual entry — matching the real workflow where orders arrive on a separate Grab/LINE MAN tablet.

**Architecture:** Strip the reactive Pending/Rejected flow and all demo machinery from `queue.store`. Add `createDeliveryOrder()` for staff-initiated creation. New `NewDeliveryModal` collects metadata; a new `/order/delivery/[orderId]` page reuses the existing MenuPanel + ModifierSheet + TicketPanel triplet for item entry.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5 strict, Zustand 5, Tailwind CSS 4, shadcn/ui (Base UI), Solar icon set. No test framework — use `npm run build` to verify TypeScript correctness after each task.

**Spec:** `docs/specs/2026-03-17-delivery-order-flow-redesign.md`

---

## Chunk 1: Store Cleanup & New Actions

### Task 1: Strip dead delivery code from queue.store

**Files:**
- Modify: `src/stores/queue.store.ts`

- [ ] **Step 1: Remove the `delivery-demo` import and all dead store members**

Open `src/stores/queue.store.ts`. Apply these changes:

```ts
// DELETE both of these imports at the top (lines 5–6):
import { buildMockDeliveryOrder } from '@/lib/mock-data/delivery-demo'
import { useKdsStore } from '@/stores/kds.store'
// Note: useKdsStore was only used by acceptOrder, which is being removed.

// REPLACE the QueueOrderStatus type — remove 'Pending' and 'Rejected':
export type QueueOrderStatus =
  | 'Confirmed'     // delivery accepted by staff
  | 'Preparing'     // delivery being cooked (KDS in progress)
  | 'ReadyForRider' // delivery ready, waiting for rider pickup
  | 'PickedUp'      // delivery complete
  | 'Taking'        // takeaway being created / order entry not yet sent
  | 'Sent'          // takeaway sent to KDS
  | 'Ready'         // takeaway ready for collection (KDS complete)
  | 'Collected'     // takeaway collected by customer
  | 'Cancelled'     // takeaway cancelled before sending to kitchen

// REPLACE the QueueOrder interface — remove pendingAt/rejectionReason, add externalId?, make customerName optional:
export interface QueueOrder {
  orderId: string
  channel: OrderChannel
  platform?: DeliveryPlatform
  externalId?: string           // delivery only: platform order ref e.g. "GR-4401"
  customerName?: string
  customerPhone?: string
  itemsSummary: string
  status: QueueOrderStatus
  createdAt: number
}

// REPLACE the QueueStore interface — remove dead actions, add new ones:
interface QueueStore {
  orders: Record<string, QueueOrder>
  takeawayCounter: number

  createDeliveryOrder: (platform: DeliveryPlatform, externalId: string, customerName?: string, customerPhone?: string) => string
  updateItemsSummary: (orderId: string, summary: string) => void
  advanceStatus: (orderId: string) => void
  createTakeaway: (customerName: string, customerPhone?: string) => string
  updateCustomer: (orderId: string, name: string, phone?: string) => void
  cancelOrder: (orderId: string) => void
}
```

- [ ] **Step 2: Replace the store implementation body**

Replace everything inside `persist((set, get) => ({ ... }), ...)` with:

```ts
(set, get) => ({
  orders: {},
  takeawayCounter: 0,

  createDeliveryOrder: (platform, externalId, customerName, customerPhone) => {
    const orderId = `DL-${platform}-${Date.now()}`
    const order: QueueOrder = {
      orderId,
      channel: 'delivery',
      platform,
      externalId,
      customerName,
      customerPhone,
      itemsSummary: '',
      status: 'Confirmed',
      createdAt: Date.now(),
    }
    set((state) => ({ orders: { ...state.orders, [orderId]: order } }))
    return orderId
  },

  updateItemsSummary: (orderId, summary) => {
    set((state) => ({
      orders: {
        ...state.orders,
        [orderId]: { ...state.orders[orderId], itemsSummary: summary },
      },
    }))
  },

  advanceStatus: (orderId) => {
    const order = get().orders[orderId]
    if (!order) return

    const transitions: Partial<Record<QueueOrderStatus, QueueOrderStatus>> = {
      Confirmed: 'Preparing',
      Preparing: 'ReadyForRider',
      ReadyForRider: 'PickedUp',
      Taking: 'Sent',
      Sent: 'Ready',
      Ready: 'Collected',
    }

    const next = transitions[order.status]
    if (!next) return

    set((state) => ({
      orders: {
        ...state.orders,
        [orderId]: { ...state.orders[orderId], status: next },
      },
    }))
  },

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
}),
{
  name: 'queue-store',
  partialize: (state) => ({
    orders: state.orders,
    takeawayCounter: state.takeawayCounter,
  }),
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build 2>&1 | grep -E "error|warning|✓"
```

Expected: no errors in `queue.store.ts`. Errors in other files are fine for now — they reference removed types and will be fixed in subsequent tasks. (If `useKdsStore` was not removed from imports, you will see a TS6133 unused-import error — go back and remove it.)

- [ ] **Step 4: Commit**

```bash
git add src/stores/queue.store.ts
git commit -m "refactor(queue-store): replace reactive delivery flow with staff-initiated model

- Remove Pending/Rejected statuses, pendingAt, rejectionReason
- Remove simulateOrder, acceptOrder, rejectOrder, demoActive, autoAccept actions
- Add createDeliveryOrder() and updateItemsSummary() actions
- externalId field for platform order reference
- customerName made optional (delivery orders may omit it)"
```

---

### Task 2: Delete dead files

**Files:**
- Delete: `src/lib/mock-data/delivery-demo.ts`
- Delete: `src/components/queue/RejectReasonDialog.tsx`

- [ ] **Step 1: Delete both files**

```bash
rm "src/lib/mock-data/delivery-demo.ts"
rm "src/components/queue/RejectReasonDialog.tsx"
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: delete delivery-demo.ts and RejectReasonDialog.tsx

Both files are dead code after removing the auto-receive delivery flow."
```

---

## Chunk 2: Fix Existing Components

### Task 3: Fix TicketPanel — sendLabel, headerLabel, isTakeaway

**Files:**
- Modify: `src/components/order/TicketPanel.tsx`

- [ ] **Step 1: Add new props to the interface**

Find the `TicketPanelProps` interface and replace it:

```ts
interface TicketPanelProps {
  tableId: string
  onEditLineItem: (lineId: string) => void
  onSend?: () => void
  hideSend?: boolean
  sendLabel?: string    // overrides "Send to Kitchen" button text
  headerLabel?: string  // overrides table?.label ?? tableId in panel header
}
```

- [ ] **Step 2: Destructure new props in the component signature**

```ts
export function TicketPanel({ tableId, onEditLineItem, onSend, hideSend, sendLabel, headerLabel }: TicketPanelProps) {
```

- [ ] **Step 3: Fix isTakeaway detection**

Find:
```ts
const isTakeaway = !!useQueueStore.getState().orders[tableId]
```
Replace with:
```ts
const isTakeaway = useQueueStore.getState().orders[tableId]?.channel === 'takeaway'
```

- [ ] **Step 4: Apply headerLabel to panel header**

Find:
```tsx
<p className="font-bold text-sm leading-tight truncate">
  {table?.label ?? tableId}
</p>
```
Replace with:
```tsx
<p className="font-bold text-sm leading-tight truncate">
  {headerLabel ?? table?.label ?? tableId}
</p>
```

- [ ] **Step 5: Apply sendLabel to the send button**

Find:
```tsx
Send to Kitchen
```
Replace with:
```tsx
{sendLabel ?? 'Send to Kitchen'}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS"
```

Expected: no errors in `TicketPanel.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/order/TicketPanel.tsx
git commit -m "feat(TicketPanel): add sendLabel/headerLabel props and fix isTakeaway detection

- sendLabel?: string overrides 'Send to Kitchen' button text
- headerLabel?: string overrides table label in panel header
- isTakeaway now checks channel === 'takeaway' to prevent delivery
  orders being misidentified (both live in queue.store)"
```

---

### Task 4: Fix isTakeaway in /order/[tableId]/page.tsx

**Files:**
- Modify: `src/app/(app)/order/[tableId]/page.tsx`

- [ ] **Step 1: Fix the isTakeaway check**

Find:
```ts
const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
```
Replace with:
```ts
const isTakeaway = useQueueStore.getState().orders[tableId]?.channel === 'takeaway'
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/order/[tableId]/page.tsx"
git commit -m "fix(order-page): isTakeaway now checks channel to prevent delivery misidentification"
```

---

### Task 5: Fix badge filters in AppSidebar and table-map

**Files:**
- Modify: `src/components/app-shell/AppSidebar.tsx`
- Modify: `src/app/(app)/table-map/page.tsx`

- [ ] **Step 1: Fix AppSidebar delivery filter**

In `src/components/app-shell/AppSidebar.tsx`, find the `activeQueueCount` useMemo.

Find:
```ts
return ['Pending', 'Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
```
Replace with:
```ts
return ['Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
```

- [ ] **Step 2: Fix table-map delivery badge filter + add controlled Tabs**

Open `src/app/(app)/table-map/page.tsx`.

Add `useSearchParams` to the import:
```ts
import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
```

Add after the existing `useState` declarations at the top of the component:
```ts
const searchParams = useSearchParams()
const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'dine-in')
```

Find the `activeDeliveryCount` filter:
```ts
['Pending', 'Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
```
Replace with:
```ts
['Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
```

Find the Tabs component:
```tsx
<Tabs defaultValue="dine-in" className="flex flex-col h-full">
```
Replace with:
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS|useSearchParams"
```

Expected: no TypeScript errors. Next.js may emit a Suspense warning for `useSearchParams` — this is a non-breaking warning, acceptable for a wireframe. Ignore it and proceed.

- [ ] **Step 4: Commit**

```bash
git add src/components/app-shell/AppSidebar.tsx "src/app/(app)/table-map/page.tsx"
git commit -m "fix: remove Pending from delivery badge filters; add controlled Tabs with searchParams

Badge counts no longer include removed Pending status.
table-map Tabs now reads ?tab= query param on mount so back-navigation
from the delivery order entry page lands on the Delivery tab."
```

---

## Chunk 3: Update Delivery UI Components

### Task 6: Rewrite DeliveryCard

**Files:**
- Modify: `src/components/queue/DeliveryCard.tsx`

- [ ] **Step 1: Replace the entire file**

The file currently has `CountdownRing`, `getCtaLabel`, `getStatusVariant`, `getStatusLabel`, `RejectReasonDialog` usage, and Accept/Reject buttons. Replace the full file content with:

```tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQueueStore } from '@/stores/queue.store'
import type { QueueOrder } from '@/stores/queue.store'

function getCtaLabel(status: QueueOrder['status']): string | null {
  switch (status) {
    case 'Confirmed':      return 'Mark Preparing'
    case 'Preparing':      return 'Mark Ready for Rider'
    case 'ReadyForRider':  return 'Confirm Picked Up'
    default:               return null
  }
}

function getStatusVariant(
  status: QueueOrder['status']
): 'outline' | 'ordered' | 'cooking' | 'ready' | 'settled' {
  switch (status) {
    case 'Confirmed':      return 'ordered'
    case 'Preparing':      return 'cooking'
    case 'ReadyForRider':  return 'ready'
    case 'PickedUp':       return 'settled'
    default:               return 'outline'
  }
}

function getStatusLabel(status: QueueOrder['status']): string {
  switch (status) {
    case 'Confirmed':      return 'Accepted'
    case 'Preparing':      return 'Preparing'
    case 'ReadyForRider':  return 'Ready for Rider'
    case 'PickedUp':       return 'Picked Up'
    default:               return status
  }
}

interface DeliveryCardProps {
  order: QueueOrder
}

export function DeliveryCard({ order }: DeliveryCardProps) {
  const advanceStatus = useQueueStore((s) => s.advanceStatus)

  const platformLabel = order.platform === 'grab' ? 'Grab' : 'LINE MAN'
  const platformVariant = order.platform === 'grab' ? 'grab' : 'lineman'
  const ctaLabel = getCtaLabel(order.status)

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={platformVariant}>{platformLabel}</Badge>
          {order.externalId && (
            <span className="text-xs font-mono text-muted-foreground">{order.externalId}</span>
          )}
        </div>
        <Badge variant={getStatusVariant(order.status)}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Customer + items */}
      <div className="flex flex-col gap-0.5">
        {order.customerName && (
          <span className="text-sm font-semibold text-foreground">{order.customerName}</span>
        )}
        {order.itemsSummary && (
          <span className="text-xs text-muted-foreground">{order.itemsSummary}</span>
        )}
      </div>

      {/* CTA */}
      {ctaLabel && (
        <Button
          size="sm"
          variant={order.status === 'ReadyForRider' ? 'default' : 'outline'}
          onClick={() => advanceStatus(order.orderId)}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/queue/DeliveryCard.tsx
git commit -m "refactor(DeliveryCard): remove pending/reject UI, show externalId, conditional fields

- CountdownRing and Accept/Reject buttons removed
- externalId shown in header (human-facing platform reference)
- customerName and itemsSummary render conditionally (may be absent)"
```

---

### Task 7: Rewrite DeliveryPanel

**Files:**
- Modify: `src/components/queue/DeliveryPanel.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useQueueStore } from '@/stores/queue.store'
import { DeliveryCard } from './DeliveryCard'
import { NewDeliveryModal } from './NewDeliveryModal'

export function DeliveryPanel() {
  const orders = useQueueStore((s) => s.orders)
  const [showNewModal, setShowNewModal] = useState(false)

  const activeOrders = useMemo(
    () =>
      Object.values(orders)
        .filter(
          (o) =>
            o.channel === 'delivery' &&
            o.status !== 'PickedUp'
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground mr-auto">Delivery Queue</span>
        <button
          onClick={() => setShowNewModal(true)}
          className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-semibold hover:bg-primary/90 transition-colors"
        >
          + New Order
        </button>
      </div>

      {/* Scrollable order list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-3">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <DeliveryCard key={order.orderId} order={order} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-16">
            <span className="text-3xl">🛵</span>
            <p className="text-sm font-medium text-foreground">No delivery orders</p>
            <p className="text-xs text-muted-foreground">
              Tap &quot;+ New Order&quot; to add a delivery order
            </p>
          </div>
        )}
      </div>

      <NewDeliveryModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify — TypeScript will error on missing NewDeliveryModal, that's expected**

```bash
npm run build 2>&1 | grep "NewDeliveryModal"
```

Expected: error about `NewDeliveryModal` not found — will be fixed in Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/components/queue/DeliveryPanel.tsx
git commit -m "refactor(DeliveryPanel): remove demo controls, add New Order button

- Simulate/demo/auto-accept controls removed
- Pending section removed
- + New Order button opens NewDeliveryModal (created next task)
- Empty state copy updated"
```

---

## Chunk 4: New Files

### Task 8: Create NewDeliveryModal

**Files:**
- Create: `src/components/queue/NewDeliveryModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueueStore } from '@/stores/queue.store'
import type { DeliveryPlatform } from '@/stores/queue.store'
import { cn } from '@/lib/utils'

interface NewDeliveryModalProps {
  open: boolean
  onClose: () => void
}

export function NewDeliveryModal({ open, onClose }: NewDeliveryModalProps) {
  const router = useRouter()
  const createDeliveryOrder = useQueueStore((s) => s.createDeliveryOrder)

  const [platform, setPlatform] = useState<DeliveryPlatform>('grab')
  const [externalId, setExternalId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const canSubmit = externalId.trim().length > 0

  function handleSubmit() {
    if (!canSubmit) return
    const orderId = createDeliveryOrder(
      platform,
      externalId.trim(),
      customerName.trim() || undefined,
      customerPhone.trim() || undefined,
    )
    onClose()
    // Reset form for next use
    setExternalId('')
    setCustomerName('')
    setCustomerPhone('')
    router.push(`/order/delivery/${orderId}`)
  }

  function handleClose() {
    setExternalId('')
    setCustomerName('')
    setCustomerPhone('')
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border p-6 flex flex-col gap-5"
        style={{ boxShadow: 'var(--shadow-floating)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">New Delivery Order</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            Cancel
          </button>
        </div>

        {/* Platform toggle */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Platform</p>
          <div className="flex gap-2">
            {(['grab', 'lineman'] as DeliveryPlatform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={cn(
                  'flex-1 border rounded-lg py-2 text-sm font-semibold transition-colors',
                  platform === p
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {p === 'grab' ? 'Grab' : 'LINE MAN'}
              </button>
            ))}
          </div>
        </div>

        {/* Order ID */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Order ID <span className="text-destructive">*</span>
          </p>
          <input
            type="text"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder={platform === 'grab' ? 'e.g. GR-4401' : 'e.g. LM-8821'}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Customer name (optional) */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Customer Name <span className="text-muted-foreground font-normal">(optional)</span>
          </p>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Somchai"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Phone (optional) */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Phone <span className="text-muted-foreground font-normal">(optional)</span>
          </p>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="e.g. 08X-XXX-XXXX"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-bold transition-colors',
            canSubmit
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          Start Adding Items →
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS"
```

Expected: no new errors (the DeliveryPanel import should now resolve).

- [ ] **Step 3: Commit**

```bash
git add src/components/queue/NewDeliveryModal.tsx
git commit -m "feat(NewDeliveryModal): staff-initiated delivery order creation sheet

Platform toggle (Grab/LINE MAN), required Order ID, optional customer
name and phone. Calls createDeliveryOrder() and navigates to
/order/delivery/[orderId] for item entry."
```

---

### Task 9: Create the delivery order entry page

**Files:**
- Create: `src/app/(app)/order/delivery/[orderId]/page.tsx`

This page reuses the MenuPanel + ModifierSheet + TicketPanel triplet with delivery context.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p "src/app/(app)/order/delivery/[orderId]"
```

Create `src/app/(app)/order/delivery/[orderId]/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AltArrowLeftLinear } from 'solar-icon-set'
import { useQueueStore } from '@/stores/queue.store'
import { useOrderStore } from '@/stores/order.store'
import { useKdsStore } from '@/stores/kds.store'
import { MenuPanel } from '@/components/order/MenuPanel'
import { ModifierSheet } from '@/components/order/ModifierSheet'
import { TicketPanel } from '@/components/order/TicketPanel'
import { Badge } from '@/components/ui/badge'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/mock-data/menu'
import { cn } from '@/lib/utils'

const ALL_CATEGORY_ID = 'all'

const CATEGORY_NAV = [
  { id: ALL_CATEGORY_ID, label: 'All Items' },
  ...MENU_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
]

export default function DeliveryOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId
  const router = useRouter()

  // Non-reactive read — captured once at render time (sufficient: page only mounts after createDeliveryOrder populates store)
  const order = useQueueStore.getState().orders[orderId]

  // ALL hooks must be declared before any conditional return (Rules of Hooks)
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

  // Redirect guard — fires on mount if order is missing (stale link / page refresh)
  // redirect() is server-only; use router.replace() in client components
  useEffect(() => {
    if (!order || order.channel !== 'delivery') {
      router.replace('/table-map?tab=delivery')
    }
  }, [order, router])

  // Early return AFTER all hooks — renders nothing while redirect fires
  if (!order || order.channel !== 'delivery') return null

  const platformLabel = order.platform === 'grab' ? 'Grab' : 'LINE MAN'
  const platformVariant = order.platform === 'grab' ? 'grab' : 'lineman'

  const selectedMenuItem = selectedMenuItemId
    ? (MENU_ITEMS.find((i) => i.id === selectedMenuItemId) ?? null)
    : null

  const editingLineItem = editingLineId
    ? (useOrderStore.getState().orders[orderId]?.rounds
        .flatMap((r) => r.items)
        .find((i) => i.lineId === editingLineId) ?? null)
    : null

  function handleCloseModifier() {
    setSelectedMenuItemId(null)
    setEditingLineId(null)
  }

  function handleConfirmOrder() {
    // Compute itemsSummary from confirmed line items
    const orderRecord = useOrderStore.getState().orders[orderId]
    const allItems = orderRecord?.rounds.flatMap((r) => r.items) ?? []
    const nonVoided = allItems.filter((i) => i.status !== 'voided')

    // Build summary: "Tonkotsu ×2, Shoyu ×1"
    const counts: Record<string, number> = {}
    for (const item of nonVoided) {
      counts[item.menuItemId] = (counts[item.menuItemId] ?? 0) + item.quantity
    }
    const summary = Object.entries(counts)
      .map(([menuItemId, qty]) => {
        const menuItem = MENU_ITEMS.find((m) => m.id === menuItemId)
        return `${menuItem?.name ?? menuItemId} ×${qty}`
      })
      .join(', ')

    useQueueStore.getState().updateItemsSummary(orderId, summary)
    useKdsStore.getState().addTicket(orderId, order.externalId ?? orderId, 'delivery', order.platform)
    router.push('/table-map?tab=delivery')
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <button
          onClick={() => router.push('/table-map?tab=delivery')}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Back to delivery queue"
        >
          <AltArrowLeftLinear size={20} />
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Badge variant={platformVariant}>{platformLabel}</Badge>
            <span className="text-sm font-semibold">{order.externalId}</span>
          </div>
          {order.customerName && (
            <span className="text-xs text-muted-foreground">{order.customerName} · Delivery</span>
          )}
          {!order.customerName && (
            <span className="text-xs text-muted-foreground">Delivery</span>
          )}
        </div>

        {/* Spacer to balance the back button */}
        <div className="w-11" />
      </header>

      {/* 3-column body */}
      <div className="flex flex-row flex-1 min-h-0 overflow-hidden">

        {/* Column 1: Category sidebar */}
        <aside className="w-32 md:w-36 lg:w-44 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto py-2">
          {CATEGORY_NAV.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'w-full text-left px-3 lg:px-4 py-3 text-xs md:text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </aside>

        {/* Column 2: Menu grid */}
        <div className="flex-1 overflow-y-auto bg-background">
          <MenuPanel
            onItemTap={(itemId) => setSelectedMenuItemId(itemId)}
            activeCategory={activeCategory}
          />
        </div>

        {/* Column 3: Ticket */}
        <div
          className="w-56 md:w-64 lg:w-72 xl:w-80 border-l border-border flex flex-col bg-card shrink-0 overflow-hidden"
          style={{ boxShadow: 'var(--shadow-panel)' }}
        >
          <TicketPanel
            tableId={orderId}
            headerLabel={order.externalId ?? orderId}
            sendLabel="Confirm Order"
            onEditLineItem={(lineId) => {
              const orderRecord = useOrderStore.getState().orders[orderId]
              const item = orderRecord?.rounds
                .flatMap((r) => r.items)
                .find((i) => i.lineId === lineId)
              if (item) {
                setEditingLineId(lineId)
                setSelectedMenuItemId(item.menuItemId)
              }
            }}
            onSend={handleConfirmOrder}
          />
        </div>
      </div>

      {/* ModifierSheet — global overlay */}
      <ModifierSheet
        open={selectedMenuItemId !== null}
        onClose={handleCloseModifier}
        menuItem={selectedMenuItem}
        tableId={orderId}
        editingLineId={editingLineId}
        editingLineItem={editingLineItem}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — clean build**

```bash
npm run build 2>&1 | grep -E "error TS|✓ Compiled"
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/order/delivery"
git commit -m "feat: delivery order entry page at /order/delivery/[orderId]

Reuses MenuPanel + ModifierSheet + TicketPanel triplet with delivery context.
- Header shows platform badge + externalId
- TicketPanel relabelled 'Confirm Order' via sendLabel prop
- On confirm: itemsSummary computed, KDS ticket added, navigate to /table-map?tab=delivery
- Redirects to /table-map?tab=delivery if orderId not in store (stale link)"
```

---

## Chunk 5: Final Verification

### Task 10: Full build + browser smoke test

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`. Zero TypeScript errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Log in, open a shift, navigate to Table Map → Delivery tab.

Verify the following in order:

| # | Action | Expected |
|---|--------|----------|
| 1 | Delivery tab initial state | No demo controls, no simulate button, empty state says "Tap '+ New Order'" |
| 2 | Tap "+ New Order" | Bottom sheet opens with platform toggle (Grab selected), Order ID field, Name + Phone optional fields |
| 3 | Leave Order ID empty, tap Submit | Button remains disabled |
| 4 | Enter Order ID "GR-4401", tap "Start Adding Items →" | Navigates to `/order/delivery/DL-grab-...` |
| 5 | Order entry page header | Shows Grab badge + "GR-4401", subtitle says "Delivery" |
| 6 | TicketPanel header | Shows "GR-4401" (not the internal orderId) |
| 7 | Add items with modifiers | Works same as dine-in |
| 8 | TicketPanel send button | Reads "Confirm Order" (not "Send to Kitchen") |
| 9 | Tap "Confirm Order" | Navigates back to `/table-map?tab=delivery` and lands on Delivery tab |
| 10 | Delivery tab after confirm | Card shows Grab badge, "GR-4401", items summary, "Accepted" status badge |
| 11 | Tap "Mark Preparing" | Status badge changes to "Preparing" |
| 12 | Tap "Mark Ready for Rider" | Status badge changes to "Ready for Rider" |
| 13 | Tap "Confirm Picked Up" | Card disappears from active list (PickedUp is filtered out) |
| 14 | Navigate to KDS | Delivery ticket visible with "GR-4401" label and delivery badge |
| 15 | Takeaway tab | Completely unchanged — create a takeaway order and verify it still works |
| 16 | Navigate directly to `/order/delivery/nonexistent-id` | Redirects back to `/table-map?tab=delivery` (stale-link guard) |

- [ ] **Step 4: Final commit if any lint/build fixes were needed**

```bash
git add -A
git commit -m "chore: fix any lint/build issues from final verification"
```
