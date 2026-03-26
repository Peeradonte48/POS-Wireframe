# Item Split Drag-and-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-and-drop item assignment to the แยกบิลหารตามรายการ sheet so cashiers can drag item cards from the left panel into bill buckets on the right, while keeping the existing click flow intact.

**Architecture:** All changes are isolated to `src/components/payment/ItemSplitSheet.tsx`. Wrap the two-column layout in `DndContext`, attach `useDraggable` to each item card and `useDroppable` to each bill bucket. A `DragOverlay` renders a ghost card following the pointer. `handleAddToBill` is refactored to accept `lineId` directly instead of reading from `selectedLineId` state.

**Tech Stack:** `@dnd-kit/core` (PointerSensor, DndContext, DragOverlay, useDraggable, useDroppable)

---

## File Map

| File | Change |
|---|---|
| `src/components/payment/ItemSplitSheet.tsx` | All DnD logic, refactor handleAddToBill, visual states |

---

### Task 1: Install @dnd-kit/core

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
npm install @dnd-kit/core
```

Expected: package installs without errors, `@dnd-kit/core` appears in `package.json` dependencies.

- [ ] **Step 2: Verify build still passes**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @dnd-kit/core for drag-and-drop"
```

---

### Task 2: Refactor handleAddToBill to accept lineId directly

**Files:**
- Modify: `src/components/payment/ItemSplitSheet.tsx`

Currently `handleAddToBill(billId)` reads `selectedLineId` from closure. Refactor so both click and drag flows pass `lineId` explicitly.

- [ ] **Step 1: Update handleAddToBill signature and body**

Replace the existing `handleAddToBill` function (lines ~113–147):

```typescript
function handleAddToBill(billId: number, lineId: string) {
  const item = orderItems.find((i) => i.lineId === lineId)
  if (!item) return

  setBills((prev) => {
    const assignedInOtherBills = prev
      .filter((b) => b.id !== billId)
      .reduce((sum, b) => {
        const a = b.assignments.find((a) => a.lineId === lineId)
        return sum + (a?.qty ?? 0)
      }, 0)
    const remaining = item.quantity - assignedInOtherBills
    if (remaining <= 0) return prev

    return prev.map((bill) => {
      if (bill.id !== billId) return bill
      const existing = bill.assignments.find((a) => a.lineId === lineId)
      if (existing) {
        const newQty = Math.min(existing.qty + 1, remaining)
        return {
          ...bill,
          assignments: bill.assignments.map((a) =>
            a.lineId === lineId ? { ...a, qty: newQty } : a,
          ),
        }
      }
      return {
        ...bill,
        assignments: [...bill.assignments, { lineId, qty: 1 }],
      }
    })
  })
  setSelectedLineId(null)
}
```

- [ ] **Step 2: Update all call sites in the render**

Find every `handleAddToBill(bill.id)` call in the JSX (there are two — the empty bucket button and the "add more" button). Replace both with `handleAddToBill(bill.id, selectedLineId!)`.

The `canAdd` guard (`!!selectedLineId && ...`) already ensures `selectedLineId` is non-null when the button is enabled, so the non-null assertion is safe.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/payment/ItemSplitSheet.tsx
git commit -m "refactor: handleAddToBill accepts lineId param directly"
```

---

### Task 3: Add DnD context, sensor, and activeDragLineId state

**Files:**
- Modify: `src/components/payment/ItemSplitSheet.tsx`

- [ ] **Step 1: Add imports at top of file**

Add after the existing imports:

```typescript
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
```

- [ ] **Step 2: Add activeDragLineId state inside the component**

Add after the existing `useState` declarations:

```typescript
const [activeDragLineId, setActiveDragLineId] = useState<string | null>(null)
```

- [ ] **Step 3: Set up sensors**

Add after the state declarations:

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
)
```

- [ ] **Step 4: Add drag event handlers**

Add after the `handleAddBill` function:

```typescript
function handleDragStart(event: DragStartEvent) {
  setActiveDragLineId(event.active.id as string)
}

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  setActiveDragLineId(null)
  if (!over) return
  const lineId = active.id as string
  const billId = Number(over.id)
  const item = orderItems.find((i) => i.lineId === lineId)
  if (!item) return
  const totalAssigned = bills.reduce((sum, b) => {
    const a = b.assignments.find((a) => a.lineId === lineId)
    return sum + (a?.qty ?? 0)
  }, 0)
  if (totalAssigned >= item.quantity) return
  handleAddToBill(billId, lineId)
}
```

- [ ] **Step 5: Wrap the two-column layout in DndContext**

Wrap the `<div className="flex flex-1 min-h-0 gap-6 px-6 pb-4 overflow-hidden">` div and its children with:

```tsx
<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
  {/* ... two-column layout ... */}

  <DragOverlay>
    {activeDragLineId ? (
      <GhostCard lineId={activeDragLineId} orderItems={orderItems} />
    ) : null}
  </DragOverlay>
</DndContext>
```

- [ ] **Step 6: Verify build — expect one error**

```bash
npm run build
```

Expected: TypeScript error `Cannot find name 'GhostCard'`. This is intentional — GhostCard is defined in Task 4. Proceed.

---

### Task 4: Add GhostCard component

**Files:**
- Modify: `src/components/payment/ItemSplitSheet.tsx`

Define `GhostCard` above the `ItemSplitSheet` function (after the `MODIFIER_ICONS` map).

- [ ] **Step 1: Add GhostCard component**

```tsx
function GhostCard({
  lineId,
  orderItems,
}: {
  lineId: string
  orderItems: OrderLineItem[]
}) {
  const item = orderItems.find((i) => i.lineId === lineId)
  const menuItem = item ? MENU_ITEMS.find((m) => m.id === item.menuItemId) : null
  if (!item) return null
  return (
    <div
      className="bg-card border border-primary rounded-xl overflow-hidden opacity-90 w-[280px]"
      style={{ boxShadow: 'var(--shadow-panel)' }}
    >
      <div className="flex gap-3 items-center p-4">
        <div className="relative rounded-md shrink-0 size-[40px] overflow-hidden bg-accent">
          {menuItem?.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={menuItem.imagePath}
              alt={item.menuItemName}
              className="absolute inset-0 size-full object-cover rounded-md"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-lg">
              {menuItem?.thumbnailPlaceholder ?? '🍜'}
            </div>
          )}
        </div>
        <p className="font-medium text-sm leading-5 text-foreground flex-1 min-w-0 truncate">
          {item.menuItemName}
        </p>
        <div className="bg-background border border-border rounded-md px-2 py-0.5 shrink-0">
          <span className="text-xs font-semibold text-foreground">1×</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/payment/ItemSplitSheet.tsx
git commit -m "feat: add DnD context, sensors, ghost card, drag handlers"
```

---

### Task 5: Make item cards draggable

**Files:**
- Modify: `src/components/payment/ItemSplitSheet.tsx`

Add `useDraggable` from `@dnd-kit/core` to each item card in the left panel.

- [ ] **Step 1: Add useDraggable import**

`useDraggable` should already be importable from the `@dnd-kit/core` import added in Task 3. Add it to the existing import:

```typescript
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
```

- [ ] **Step 2: Extract item card into a DraggableItemCard sub-component**

Define this above `GhostCard`:

```tsx
function DraggableItemCard({
  item,
  isSelected,
  assignedQty,
  onSelect,
}: {
  item: OrderLineItem
  isSelected: boolean
  assignedQty: number
  onSelect: (lineId: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.lineId,
  })
  const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
  const remaining = item.quantity - assignedQty
  const isPartial = assignedQty > 0

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bg-card border rounded-xl overflow-hidden transition-colors ${
        isDragging
          ? 'opacity-40 border-border'
          : isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border'
      }`}
      style={{ boxShadow: 'var(--shadow-card)', touchAction: 'none' }}
    >
      {/* Item content */}
      <div className="flex flex-col gap-4 items-start p-6">
        <div className="flex gap-2 items-start w-full">
          {/* Thumbnail */}
          <div className="relative rounded-md shrink-0 size-[54px] overflow-hidden bg-accent">
            {menuItem?.imagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menuItem.imagePath}
                alt={item.menuItemName}
                className="absolute inset-0 size-full object-cover rounded-md"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xl">
                {menuItem?.thumbnailPlaceholder ?? '🍜'}
              </div>
            )}
          </div>
          {/* Name + modifiers */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className="font-medium text-sm leading-5 text-foreground whitespace-nowrap">
              {item.menuItemName}
            </p>
            {item.modifiers.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0">
                {item.modifiers.map((mod) => {
                  const Icon = MODIFIER_ICONS[mod.groupId] ?? Tag
                  return (
                    <span
                      key={`${mod.groupId}-${mod.optionId}`}
                      className="flex items-center gap-1 py-0.5"
                    >
                      <Icon size={12} className="text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {mod.optionLabel}
                      </span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        {/* Qty + remaining + price */}
        <div className="flex items-center gap-2 w-full">
          <div className="bg-background border border-border rounded-md shrink-0 px-2 py-0.5">
            <span className="text-xs font-semibold text-foreground">
              {item.quantity}×
            </span>
          </div>
          {isPartial && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-md shrink-0 px-2 py-0.5">
              <span className="text-xs font-semibold text-amber-600">
                เหลือ {remaining}
              </span>
            </div>
          )}
          <p className="text-sm text-foreground ml-auto">
            ฿{(item.basePrice * item.quantity).toLocaleString()}
          </p>
        </div>
      </div>
      {/* Footer: select button — stop propagation so click doesn't trigger drag listeners */}
      <div
        className="border-t border-border flex gap-2 items-center justify-center p-4"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isSelected ? (
          <Button
            variant="outline"
            className="flex-1 h-9 text-sm"
            onClick={() => onSelect(item.lineId)}
          >
            เลือกแล้ว
          </Button>
        ) : (
          <Button
            className="flex-1 h-9 text-sm"
            onClick={() => onSelect(item.lineId)}
          >
            เลือก
          </Button>
        )}
      </div>
    </div>
  )
}
```

Note: `onPointerDown` stopPropagation on the footer prevents the button row from starting a drag.

- [ ] **Step 3: Replace inline item card in the ScrollArea with DraggableItemCard**

In the `ScrollArea` inside the left panel, replace the existing `.map((item) => { ... return (<div ...>...</div>) })` block with:

```tsx
{orderItems.filter((item) => !isFullyAssigned(item.lineId)).map((item) => (
  <DraggableItemCard
    key={item.lineId}
    item={item}
    isSelected={selectedLineId === item.lineId}
    assignedQty={assignedQtyFor(item.lineId)}
    onSelect={handleSelectItem}
  />
))}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/payment/ItemSplitSheet.tsx
git commit -m "feat: make item cards draggable with useDraggable"
```

---

### Task 6: Make bill buckets droppable

**Files:**
- Modify: `src/components/payment/ItemSplitSheet.tsx`

Add `useDroppable` to each bill bucket. Because hooks can't be called inside `.map()`, extract each bucket into a `DroppableBillBucket` sub-component.

- [ ] **Step 1: Add DroppableBillBucket sub-component**

Define this above `DraggableItemCard`:

```tsx
function DroppableBillBucket({
  bill,
  billIndex,
  billTotal,
  canAdd,
  orderItems,
  selectedLineId,
  onAddToBill,
  onAdjustQty,
  onRemoveFromBill,
  onDeleteBill,
  allBills,
}: {
  bill: BillBucket
  billIndex: number
  billTotal: number
  canAdd: boolean
  orderItems: OrderLineItem[]
  selectedLineId: string | null
  onAddToBill: (billId: number, lineId: string) => void
  onAdjustQty: (billId: number, lineId: string, delta: number) => void
  onRemoveFromBill: (billId: number, lineId: string) => void
  onDeleteBill: (billId: number) => void
  allBills: BillBucket[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bill.id })

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-xl overflow-hidden shrink-0 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'bg-card border-border'
      }`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Bill header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <p className="font-semibold text-base leading-none tracking-tight">
          บิล #{billIndex + 1}
        </p>
        <ChevronUp size={16} className="text-foreground shrink-0" />
      </div>

      {/* Assigned items */}
      <div className="bg-muted border-t border-border flex flex-col isolate items-center min-h-[80px] px-3 py-2 gap-2">
        {bill.assignments.length === 0 ? (
          <Button
            variant="outline"
            className="w-full h-10 gap-2 text-sm"
            disabled={!canAdd}
            onClick={() => selectedLineId && onAddToBill(bill.id, selectedLineId)}
          >
            <CirclePlus size={16} />
            เพิ่มรายการอาหารที่เลือก
          </Button>
        ) : (
          <>
            {bill.assignments.map((assignment) => {
              const item = orderItems.find((o) => o.lineId === assignment.lineId)
              if (!item) return null
              const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
              return (
                <div
                  key={assignment.lineId}
                  className="bg-card border border-border rounded-xl w-full overflow-hidden"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex flex-col gap-4 items-start px-4 py-3.5">
                    {/* Item thumbnail + name */}
                    <div className="flex gap-2 items-start w-full">
                      <div className="relative rounded-md shrink-0 size-[54px] overflow-hidden bg-accent">
                        {menuItem?.imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={menuItem.imagePath}
                            alt={item.menuItemName}
                            className="absolute inset-0 size-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xl">
                            {menuItem?.thumbnailPlaceholder ?? '🍜'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <p className="font-medium text-sm leading-5 text-foreground whitespace-nowrap">
                          {item.menuItemName}
                        </p>
                        {item.modifiers.length > 0 && (
                          <div className="flex flex-wrap gap-x-2 gap-y-0">
                            {item.modifiers.map((mod) => {
                              const Icon = MODIFIER_ICONS[mod.groupId] ?? Tag
                              return (
                                <span
                                  key={`${mod.groupId}-${mod.optionId}`}
                                  className="flex items-center gap-1 py-0.5"
                                >
                                  <Icon size={12} className="text-muted-foreground shrink-0" />
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {mod.optionLabel}
                                  </span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Qty stepper + price + trash */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={() => onAdjustQty(bill.id, assignment.lineId, -1)}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="text-sm text-foreground text-center w-7">
                          {assignment.qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={() => onAdjustQty(bill.id, assignment.lineId, 1)}
                          disabled={
                            assignment.qty >=
                            item.quantity -
                              allBills
                                .filter((b) => b.id !== bill.id)
                                .reduce(
                                  (s, b) =>
                                    s + (b.assignments.find((a) => a.lineId === assignment.lineId)?.qty ?? 0),
                                  0,
                                )
                          }
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <p className="text-base text-foreground">
                        ฿{(item.basePrice * assignment.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-9"
                        onClick={() => onRemoveFromBill(bill.id, assignment.lineId)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Add more button when bill already has items */}
            {canAdd && (
              <Button
                variant="outline"
                className="w-full h-10 gap-2 text-sm"
                onClick={() => selectedLineId && onAddToBill(bill.id, selectedLineId)}
              >
                <CirclePlus size={16} />
                เพิ่มรายการอาหารที่เลือก
              </Button>
            )}
          </>
        )}
      </div>

      {/* Bill total footer */}
      <div className="flex items-center gap-4 px-6 py-2.5">
        <div className="flex flex-1 items-start gap-4 leading-none text-foreground whitespace-nowrap">
          <p className="font-semibold text-base tracking-tight">Total</p>
          <p className="text-sm">
            ฿{billTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          onClick={() => onDeleteBill(bill.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace inline bill bucket in the right panel's .map() with DroppableBillBucket**

Replace the existing `.map((bill, billIndex) => { ... return (<div ...>...</div>) })` block with:

```tsx
{bills.map((bill, billIndex) => {
  const billTotal = getBillTotal(bill)
  const canAdd = !!selectedLineId && !isFullyAssigned(selectedLineId)
  return (
    <DroppableBillBucket
      key={bill.id}
      bill={bill}
      billIndex={billIndex}
      billTotal={billTotal}
      canAdd={canAdd}
      orderItems={orderItems}
      selectedLineId={selectedLineId}
      onAddToBill={handleAddToBill}
      onAdjustQty={handleAdjustQty}
      onRemoveFromBill={handleRemoveFromBill}
      onDeleteBill={handleDeleteBill}
      allBills={bills}
    />
  )
})}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/components/payment/ItemSplitSheet.tsx
git commit -m "feat: add droppable bill buckets with isOver highlight"
```

---

### Task 7: Smoke-test in browser

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to the split sheet**

1. Login → open any occupied table → go to payment
2. Click "แยกบิล" to open ItemSplitSheet

- [ ] **Step 3: Test drag flow**

1. Pick up an item card — confirm it goes to 40% opacity and ghost card appears at pointer
2. Hover over a bill bucket — confirm bucket border turns primary color
3. Drop on the bucket — confirm item appears in the bucket with qty: 1
4. For a qty > 1 item: drag again — confirm it adds another unit and "เหลือ N" badge updates
5. Drag outside any bucket — confirm nothing changes

- [ ] **Step 4: Test click flow still works**

1. Click "เลือก" on an item — card highlights
2. Click "เพิ่มรายการอาหารที่เลือก" on a bucket — item assigned
3. Confirm qty stepper and trash button still function

- [ ] **Step 5: Final build check**

```bash
npm run build
```

Expected: clean build, zero TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/payment/ItemSplitSheet.tsx
git commit -m "feat: drag-and-drop item assignment in แยกบิลหารตามรายการ sheet"
```
