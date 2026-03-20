# Split by Value Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace "Equal Split" with a "Split by Value" mode where each payer enters a custom amount and pays independently, with the last payer auto-locked to the exact remainder.

**Architecture:** Two files change. `bill.store.ts` gets a new `'custom'` SplitMode, renames `equalAmounts` → `customAmounts`, and gains two new actions (`initCustomSplit`, `setCustomAmount`). `SplitSheet.tsx` replaces the `equal-config`/`equal-seats` views with `custom-config`/`custom-pay` and updates the mode-select card. Everything else (SeatPaymentPanel, payment page, receipt) is reused unchanged.

**Tech Stack:** TypeScript 5 (strict), Zustand 5 with persist middleware, React 19, Next.js App Router. No test framework — use `npm run build` to verify TypeScript correctness after each task.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/stores/bill.store.ts` | Modify | `SplitMode` type, `BillSplit` interface, `initPerSeatSplit`, new `initCustomSplit` + `setCustomAmount`, remove `initEqualSplit` |
| `src/components/payment/SplitSheet.tsx` | Modify | `ViewState` type, `mode-select` card, new `renderCustomConfig` + `renderCustomPay`, remove `renderEqualConfig` + `renderEqualSeats` |

---

## Task 1: Update bill.store.ts — data model and actions

**Files:**
- Modify: `src/stores/bill.store.ts`

### Step 1.1 — Update `SplitMode` type and `BillSplit` interface

- [ ] In `src/stores/bill.store.ts`, replace:

```ts
export type SplitMode = 'equal' | 'per-seat'
```

with:

```ts
export type SplitMode = 'custom' | 'per-seat'
```

- [ ] In the `BillSplit` interface, replace:

```ts
  equalAmounts: number[]                          // for equal mode: pre-computed [seat0, seat1, ...], length === seatCount
```

with:

```ts
  customAmounts: number[]                         // for custom mode: payer amounts, length === seatCount, initialized to 0s
```

### Step 1.2 — Update `BillStore` interface

- [ ] In the `BillStore` interface, replace the `initEqualSplit` line:

```ts
  initEqualSplit: (tableId: string, grandTotal: number, seatCount: number) => void
```

with:

```ts
  initCustomSplit: (tableId: string, payerCount: number) => void
  setCustomAmount: (tableId: string, payerIndex: number, amount: number) => void
```

### Step 1.3 — Update `initPerSeatSplit` implementation

- [ ] Inside `initPerSeatSplit`, replace:

```ts
          const split: BillSplit = {
            tableId,
            mode: 'per-seat',
            seatCount: canonicalSeatCount,
            equalAmounts: [],
            assignments: [],
            payments: {},
          }
```

with:

```ts
          const split: BillSplit = {
            tableId,
            mode: 'per-seat',
            seatCount: canonicalSeatCount,
            customAmounts: [],
            assignments: [],
            payments: {},
          }
```

### Step 1.4 — Replace `initEqualSplit` with `initCustomSplit` + `setCustomAmount`

- [ ] Remove the entire `initEqualSplit` action (lines 53–69 in the original file) and replace with:

```ts
      initCustomSplit: (tableId, payerCount) =>
        set((state) => {
          const split: BillSplit = {
            tableId,
            mode: 'custom',
            seatCount: payerCount,
            customAmounts: Array.from({ length: payerCount }, () => 0),
            assignments: [],
            payments: {},
          }
          return { splits: { ...state.splits, [tableId]: split } }
        }),

      setCustomAmount: (tableId, payerIndex, amount) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state
          const updated = [...existing.customAmounts]
          updated[payerIndex] = amount
          return {
            splits: {
              ...state.splits,
              [tableId]: { ...existing, customAmounts: updated },
            },
          }
        }),
```

### Step 1.5 — Verify build passes

- [ ] Run:

```bash
npm run build
```

Expected: no TypeScript errors. If you see `equalAmounts` referenced elsewhere, rename those too.

### Step 1.6 — Commit

- [ ] Stage and commit:

```bash
git add src/stores/bill.store.ts
git commit -m "feat(bill-store): add custom split mode, replace equalAmounts with customAmounts"
```

---

## Task 2: Update SplitSheet — mode-select card + custom-config view

**Files:**
- Modify: `src/components/payment/SplitSheet.tsx`

### Step 2.1 — Update imports and ViewState type

- [ ] In `SplitSheet.tsx`, update the destructure from `useBillStore` — remove `initEqualSplit`, add `initCustomSplit` and `setCustomAmount`:

```ts
  const { initCustomSplit, initPerSeatSplit, assignItem, removeAssignment, recordPayment, cancelSplit, getSplit, setCustomAmount } =
    useBillStore()
```

- [ ] Update `ViewState` type — remove `equal-config` and `equal-seats`, add `custom-config` and `custom-pay`:

```ts
type ViewState =
  | 'mode-select'
  | 'custom-config'
  | 'custom-pay'
  | 'per-seat-assign'
  | 'per-seat-pay'
```

### Step 2.2 — Update `renderModeSelect`

- [ ] Replace the "Equal Split" card inside `renderModeSelect`:

```tsx
          {/* Equal Split card */}
          <Button
            variant="option-card"
            onClick={() => setView('equal-config')}
          >
            <p className="font-semibold text-sm">Equal Split</p>
            <p className="text-xs text-muted-foreground">Divide total equally among guests</p>
          </Button>
```

with:

```tsx
          {/* Split by Value card */}
          <Button
            variant="option-card"
            onClick={() => setView('custom-config')}
          >
            <p className="font-semibold text-sm">Split by Value</p>
            <p className="text-xs text-muted-foreground">Each person pays a custom amount</p>
          </Button>
```

### Step 2.3 — Replace `renderEqualConfig` with `renderCustomConfig`

- [ ] Delete the entire `renderEqualConfig` function and replace with:

```tsx
  // ---------------------------------------------------------------------------
  // View: custom-config
  // ---------------------------------------------------------------------------

  function renderCustomConfig() {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('mode-select')}>← Back</Button>
          <h2 className="text-lg font-semibold">Split by Value</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="payer-count-input">
            Number of payers
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeatCountInput(Math.max(2, seatCountInput - 1))}
              disabled={seatCountInput <= 2}
            >
              −
            </Button>
            <input
              id="payer-count-input"
              type="number"
              min={2}
              max={20}
              value={seatCountInput}
              onChange={(e) => {
                const v = Math.min(20, Math.max(2, Number(e.target.value) || 2))
                setSeatCountInput(v)
              }}
              className="w-16 text-center border rounded-md px-2 py-1 text-base bg-background"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeatCountInput(Math.min(20, seatCountInput + 1))}
              disabled={seatCountInput >= 20}
            >
              +
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Total: ฿{grandTotal.toLocaleString()}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            initCustomSplit(tableId, seatCountInput)
            setView('custom-pay')
          }}
        >
          Continue — {seatCountInput} payers
        </Button>
      </div>
    )
  }
```

### Step 2.4 — Delete `renderEqualSeats`

- [ ] Delete the entire `renderEqualSeats` function (it's replaced by `renderCustomPay` in Task 3).

### Step 2.5 — Verify build passes

- [ ] Run:

```bash
npm run build
```

Expected: no errors. (The render switch in the return will reference `renderCustomPay` which doesn't exist yet — add a temporary stub if build fails: `function renderCustomPay() { return null }`)

### Step 2.6 — Commit

- [ ] Stage and commit:

```bash
git add src/components/payment/SplitSheet.tsx
git commit -m "feat(split-sheet): replace equal-split with split-by-value mode-select and config view"
```

---

## Task 3: Update SplitSheet — custom-pay view and wiring

**Files:**
- Modify: `src/components/payment/SplitSheet.tsx`

### Step 3.1 — Add `renderCustomPay`

- [ ] Add the following function after `renderCustomConfig` (or replace the temporary stub from Task 2):

```tsx
  // ---------------------------------------------------------------------------
  // View: custom-pay
  // ---------------------------------------------------------------------------

  function renderCustomPay() {
    if (!split) return null
    const payers = Array.from({ length: split.seatCount }, (_, i) => i)

    // Running sum of amounts for payers 0..i-1 (confirmed or entered)
    const sumBefore = (upToIndex: number) =>
      split.customAmounts.slice(0, upToIndex).reduce((s, a) => s + a, 0)

    // Remaining = unpaid portion. Use paid amounts from payments record so the
    // footer correctly shows ฿0 once all payers have paid.
    const totalPaid = Object.values(split.payments).reduce((s, p) => s + p.amount, 0)
    const remaining = grandTotal - totalPaid

    return (
      <div className="px-4 py-4 space-y-3">
        <h2 className="text-lg font-semibold">Split by Value</h2>

        <div className="space-y-2">
          {payers.map((i) => {
            const isLast = i === split.seatCount - 1
            const payment = split.payments[i]
            const isSettled = payment !== undefined
            const isActive = activeSeatIndex === i

            // Amount for this payer
            const amountEntered = split.customAmounts[i] ?? 0
            // Remaining balance before this payer (sum of all payers before i)
            const balanceBefore = sumBefore(i)
            const remainingForThis = grandTotal - balanceBefore

            // Last payer: auto-fill with exact remainder
            const displayAmount = isLast ? remainingForThis : amountEntered

            // Validation for non-last payers
            const isOverAmount = !isLast && amountEntered > remainingForThis
            const canPay = isLast
              ? payers.slice(0, i).every((j) => split.payments[j] !== undefined)
              : amountEntered > 0 && !isOverAmount

            return (
              <div
                key={i}
                className={`rounded-xl border p-3 space-y-2 transition-opacity ${isSettled ? 'opacity-60' : ''}`}
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Payer {i + 1}</span>
                    {isSettled && <Badge variant="settled">Settled</Badge>}
                    {isSettled && <span className="text-xs text-muted-foreground">{payment.method}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Amount input or read-only display */}
                    {!isSettled && !isLast && (
                      <input
                        type="number"
                        min={1}
                        max={remainingForThis}
                        value={amountEntered === 0 ? '' : amountEntered}
                        placeholder="฿0"
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value) || 0)
                          setCustomAmount(tableId, i, v)
                        }}
                        className="w-24 text-right border rounded-md px-2 py-1 text-sm bg-background"
                      />
                    )}
                    {!isSettled && isLast && (
                      <span className="font-semibold text-sm">
                        ฿{displayAmount.toLocaleString()}
                        <span className="text-xs text-muted-foreground ml-1">remainder</span>
                      </span>
                    )}
                    {isSettled && (
                      <span className="font-semibold">฿{payment.amount.toLocaleString()}</span>
                    )}
                    {!isSettled && (
                      <Button
                        size="sm"
                        disabled={!canPay}
                        onClick={() => setActiveSeatIndex(isActive ? null : i)}
                      >
                        {isActive ? 'Close' : 'Pay'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Validation hint for non-last payers */}
                {!isSettled && !isLast && isOverAmount && (
                  <p className="text-xs text-destructive">
                    Amount exceeds ฿{remainingForThis.toLocaleString()} remaining
                  </p>
                )}

                {/* Payment panel */}
                {isActive && !isSettled && (
                  <SeatPaymentPanel
                    seatIndex={i}
                    seatTotal={isLast ? displayAmount : amountEntered}
                    tableId={tableId}
                    onPaid={(record) => handleSeatPaid(i, record)}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Remaining balance footer */}
        <div
          className="flex justify-between text-sm border-t pt-3"
        >
          <span className="text-muted-foreground">Remaining</span>
          <span className={remaining === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
            {remaining === 0 ? '฿0 — all covered' : `฿${remaining.toLocaleString()}`}
          </span>
        </div>
      </div>
    )
  }
```

### Step 3.2 — Update `handleSeatPaid` for custom mode (must run before Step 3.3)

- [ ] In `handleSeatPaid`, the `allPaid` check currently filters by seats with assigned items (per-seat logic). For `custom` mode all payers must pay. Update the function to handle both modes:

```ts
  function handleSeatPaid(seatIndex: number, record: SeatPaymentRecord) {
    recordPayment(tableId, seatIndex, record)
    setActiveSeatIndex(null)

    const updatedSplit = useBillStore.getState().getSplit(tableId)
    if (!updatedSplit) return

    let allPaid: boolean
    if (updatedSplit.mode === 'custom') {
      // All payers (0..seatCount-1) must have a payment record
      allPaid = Array.from({ length: updatedSplit.seatCount }, (_, i) => i)
        .every((i) => updatedSplit.payments[i] !== undefined)
    } else {
      // per-seat: only seats that have assigned items need to be paid
      const seatsWithItems = Array.from({ length: updatedSplit.seatCount }, (_, i) => i).filter(
        (i) => updatedSplit.assignments.some((a) => a.seatIndex === i),
      )
      allPaid = seatsWithItems.every((i) => updatedSplit.payments[i] !== undefined)
    }

    if (allPaid) {
      useTableStore.getState().markCleaning(tableId)
      cancelSplit(tableId)
      onClose()
      onAllPaid()
    }
  }
```

### Step 3.3 — Wire up the new views in the render switch (run after Step 3.2)

- [ ] In the render return block, replace:

```tsx
            {view === 'equal-config' && renderEqualConfig()}
            {view === 'equal-seats' && renderEqualSeats()}
```

with:

```tsx
            {view === 'custom-config' && renderCustomConfig()}
            {view === 'custom-pay' && renderCustomPay()}
```

### Step 3.4 — Verify build passes

- [ ] Run:

```bash
npm run build
```

Expected: zero TypeScript errors. Fix any remaining `equalAmounts` references if found.

### Step 3.5 — Manual smoke test

- [ ] Start the dev server: `npm run dev`
- [ ] Open `http://localhost:3000`, log in as Cashier
- [ ] Open a table that has an order, navigate to payment
- [ ] Tap "Split Bill" → verify mode-select shows "Split by Value" and "Per Seat"
- [ ] Choose "Split by Value" → set 2 payers → tap "Continue"
- [ ] Enter ฿400 for Payer 1, tap Pay, confirm with Cash
- [ ] Verify Payer 2 shows ฿242 auto-filled as remainder, tap Pay, confirm
- [ ] Verify receipt screen appears
- [ ] Repeat: choose "Per Seat" → verify per-seat assign/pay flow still works unchanged

### Step 3.6 — Commit

- [ ] Stage and commit:

```bash
git add src/components/payment/SplitSheet.tsx
git commit -m "feat(split-sheet): add custom-pay view with per-payer amount input and remainder auto-fill"
```
