# Undo Reserved Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Release Reservation" button to the Reserved table bottom sheet so Waiter, Cashier, and Manager can revert a Reserved table back to Open in one tap.

**Architecture:** Three-file change: add `undoReserved` store action, register `'undo-reserved'` permission key, and add the button to the Reserved status block in `TableBottomSheet`. No new files needed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 (strict), Zustand 5 with persist, Tailwind CSS 4, sonner for toasts.

---

## File Map

| File | Change |
|------|--------|
| `src/stores/table.store.ts` | Add `undoReserved` to `TableStore` interface + implement action |
| `src/lib/role-permissions.ts` | Add `'undo-reserved'` to `ActionKey` union + `ACTION_PERMISSIONS` record |
| `src/components/table-map/TableBottomSheet.tsx` | Destructure `undoReserved` from store; add button to Reserved block |

---

## Task 1: Add `undoReserved` store action

**Files:**
- Modify: `src/stores/table.store.ts:36-45` (interface) and `:70-79` (after `markReserved` implementation)

- [ ] **Step 1: Add `undoReserved` to the `TableStore` interface**

Open `src/stores/table.store.ts`. In the `interface TableStore` block (lines 36–45), add the new method after `markReserved`:

```ts
interface TableStore {
  tables: Record<string, TableRecord>
  openTable: (id: string, guestCount: number) => void
  markReserved: (id: string) => void
  undoReserved: (id: string) => void   // ← add this line
  requestCheck: (id: string) => void
  markCleaning: (id: string) => void
  markClean: (id: string) => void
  markServed: (id: string) => void
  updateTable: (id: string, patch: Partial<Pick<TableRecord, 'waiterName' | 'note' | 'orderStage' | 'paidAmount' | 'paymentMethod' | 'discountApplied'>>) => void
}
```

- [ ] **Step 2: Implement the action in the store**

After the `markReserved` implementation (ending at line 79), add:

```ts
  undoReserved: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'Open',
        },
      },
    })),
```

Pattern note: this mirrors `markReserved` exactly — minimal spread, only `status` overridden. No explicit nulling needed because a Reserved table never receives occupancy data (`guestCount`, `openedAt`, etc. remain `null` from when the table was Open).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no type errors. If you see `Property 'undoReserved' does not exist on type 'TableStore'`, double-check the interface was updated in step 1.

- [ ] **Step 4: Commit**

```bash
git add src/stores/table.store.ts
git commit -m "feat(table-store): add undoReserved action"
```

---

## Task 2: Register `'undo-reserved'` permission

**Files:**
- Modify: `src/lib/role-permissions.ts:20-47`

- [ ] **Step 1: Add `'undo-reserved'` to the `ActionKey` union**

Open `src/lib/role-permissions.ts`. In the `ActionKey` union (lines 20–32), insert a single line after `| 'mark-reserved'`:

```ts
  | 'undo-reserved'
```

Do a targeted insert — do **not** replace the entire union block, as that would silently drop the inline comment on the `'void-post-send'` line. The result should look like:

```ts
export type ActionKey =
  | 'open-table'
  | 'mark-reserved'
  | 'undo-reserved'      // ← inserted
  | 'request-check'
  | 'send-to-kitchen'
  | 'void-pre-send'
  | 'void-post-send'   // void after order sent to kitchen
  | 'confirm-payment'
  | 'eighty-six-toggle'
  | 'close-shift'
  | 'kds-bump'
  | 'mark-served'
  | 'new-takeaway'
```

- [ ] **Step 2: Add the entry to `ACTION_PERMISSIONS`**

In the `ACTION_PERMISSIONS` record (lines 34–47), add the entry after `'mark-reserved'`:

```ts
export const ACTION_PERMISSIONS: Record<ActionKey, Role[]> = {
  'open-table':        ['Waiter', 'Cashier', 'Manager'],
  'mark-reserved':     ['Waiter', 'Cashier', 'Manager'],
  'undo-reserved':     ['Waiter', 'Cashier', 'Manager'],   // ← add this line
  'request-check':     ['Waiter', 'Cashier', 'Manager'],
  // ... rest unchanged
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no type errors. If you see `Object literal may only specify known properties`, the `ActionKey` union in step 1 may be missing the new key.

- [ ] **Step 4: Commit**

```bash
git add src/lib/role-permissions.ts
git commit -m "feat(permissions): add undo-reserved action key for Waiter/Cashier/Manager"
```

---

## Task 3: Add "Release Reservation" button to the bottom sheet

**Files:**
- Modify: `src/components/table-map/TableBottomSheet.tsx:32` (destructure) and `:301-305` (Reserved block)

- [ ] **Step 1: Destructure `undoReserved` from the store**

On line 32, the store is already destructured:

```ts
const { markReserved, requestCheck, markClean, markServed, updateTable } = useTableStore()
```

Add `undoReserved`:

```ts
const { markReserved, undoReserved, requestCheck, markClean, markServed, updateTable } = useTableStore()
```

- [ ] **Step 2: Replace the read-only Reserved block with an action button**

Lines 301–305 currently render:

```tsx
{table.status === 'Reserved' && (
  <p className="text-sm text-muted-foreground px-4 pb-4">
    Table is reserved
  </p>
)}
```

Replace with:

```tsx
{table.status === 'Reserved' && (
  <div className="px-4 pb-6 flex flex-col gap-3">
    <p className="text-sm text-muted-foreground">Table is reserved</p>
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        undoReserved(table.id)
        toast('Table unreserved')
        onClose()
      }}
      disabled={!canDoAction(role, 'undo-reserved')}
    >
      Release Reservation
    </Button>
  </div>
)}
```

Design notes:
- `variant="outline"` matches the "Mark Reserved" button style in the Open block
- Toast string `'Table unreserved'` follows the `'Table [past-tense verb]'` convention used throughout this file (`'Table reserved'` line 108, `'Table served'` line 203)
- `onClose()` closes the sheet after the action, same pattern as `markReserved` (line 109) and `requestCheck` (line 213)
- `TableTile` re-renders automatically via Zustand subscription — no additional changes needed

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no type errors. Also verify with `npm run lint` — no new warnings expected.

- [ ] **Step 4: Manual smoke test**

1. Run `npm run dev` and open `localhost:3000`
2. Log in as Waiter or Cashier
3. Navigate to the table map — tables T10 and T11 start as Reserved
4. Tap T10 → bottom sheet opens showing "Table is reserved" and "Release Reservation" button
5. Tap "Release Reservation" → sheet closes, toast "Table unreserved" appears, T10 tile updates to Open styling
6. Tap T10 again → bottom sheet shows "Open Table" and "Mark Reserved" (back to normal Open state)
7. Permission gating is verified by code inspection: Kitchen role is excluded from `'undo-reserved'` in `ACTION_PERMISSIONS`, and Kitchen cannot reach the table map at all (redirected to `/kds` by the auth guard) — no runtime test needed for the disabled state

- [ ] **Step 5: Commit**

```bash
git add src/components/table-map/TableBottomSheet.tsx
git commit -m "feat(table-map): add Release Reservation button for Reserved tables"
```
