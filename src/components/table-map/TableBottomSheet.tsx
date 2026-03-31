'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { useBillStore } from '@/stores/bill.store'
import { canDoAction } from '@/lib/role-permissions'
import { useDwellTimer } from '@/components/table-map/useDwellTimer'
import type { TableRecord } from '@/stores/table.store'
import { MergeDialog } from '@/components/table-map/MergeDialog'
import { OrderTimeline } from '@/components/table-map/OrderTimeline'

interface TableBottomSheetProps {
  table: TableRecord | null  // null = sheet closed
  onClose: () => void
  onOpenTableModal: () => void  // called when user taps [Open Table]
}

// Inner component — remounted via key when table.id changes, resetting tab and local fields naturally
function TableBottomSheetContent({
  table,
  onClose,
  onOpenTableModal,
  onMergeOpen,
}: {
  table: TableRecord
  onClose: () => void
  onOpenTableModal: () => void
  onMergeOpen: () => void
}) {
  const router = useRouter()
  const role = useSessionStore((s) => s.role)!
  const { markReserved, undoReserved, requestCheck, markClean, markServed, updateTable } = useTableStore()
  const tables = useTableStore((s) => s.tables)
  const merges = useBillStore((s) => s.merges)
  const hasEligibleMergeTarget = Object.values(tables).some(
    (t) =>
      (t.status === 'Occupied' || t.status === 'CheckRequested') &&
      t.id !== table.id &&
      !(t.id in merges)
  )

  const [localWaiter, setLocalWaiter] = useState(table.waiterName ?? '')
  const [localNote, setLocalNote] = useState(table.note ?? '')
  const [activeTab, setActiveTab] = useState<'actions' | 'timeline'>('actions')

  const dwellTimer = useDwellTimer(table.openedAt ?? null)

  return (
    <>
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Table label */}
      <h2 className="text-base font-semibold px-4 pb-2">{table.label}</h2>

      {/* Content by status */}
      {table.status === 'Open' && (
        <div className="px-4 pb-6 flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={onOpenTableModal}
            disabled={!canDoAction(role, 'open-table')}
          >
            Open Table
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              markReserved(table.id)
              toast('Table reserved')
              onClose()
            }}
            disabled={!canDoAction(role, 'mark-reserved')}
          >
            Mark Reserved
          </Button>
        </div>
      )}

      {table.status === 'Occupied' && (
        <div className="flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-border mx-4 mb-3">
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'actions'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground'
              }`}
            >
              Actions
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground'
              }`}
            >
              Timeline
            </button>
          </div>

          {/* Actions tab — existing content */}
          {activeTab === 'actions' && (
            <div className="px-4 pb-6 flex flex-col gap-3">
              {/* Guest count and dwell timer */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {table.guestCount} guests
                </span>
                <span className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
                  <Clock size={14} />
                  {dwellTimer}
                </span>
              </div>

              {/* Waiter name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Waiter</label>
                <Input
                  value={localWaiter}
                  onChange={(e) => setLocalWaiter(e.target.value)}
                  onBlur={() =>
                    updateTable(table.id, { waiterName: localWaiter || null })
                  }
                  placeholder="Assign waiter"
                />
              </div>

              {/* Table note */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Note</label>
                <Input
                  value={localNote}
                  onChange={(e) => setLocalNote(e.target.value)}
                  onBlur={() =>
                    updateTable(table.id, { note: localNote || null })
                  }
                  placeholder="Table note"
                />
              </div>

              {/* Served-at timestamp — visible only after Served is tapped */}
              {table.servedAt !== null && (
                <p className="text-sm text-muted-foreground">
                  Served at {new Date(table.servedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/order/${table.id}`)}
                >
                  View Order
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { markServed(table.id); toast('Table served') }}
                  disabled={!canDoAction(role, 'mark-served')}
                >
                  Served
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    requestCheck(table.id)
                    onClose()
                  }}
                  disabled={!canDoAction(role, 'request-check')}
                >
                  Request Check
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={onMergeOpen}
                disabled={!canDoAction(role, 'open-table') || !hasEligibleMergeTarget}
              >
                Merge Bill
              </Button>
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <OrderTimeline tableId={table.id} />
          )}
        </div>
      )}

      {table.status === 'CheckRequested' && (
        <div className="flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-border mx-4 mb-3">
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'actions'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground'
              }`}
            >
              Actions
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground'
              }`}
            >
              Timeline
            </button>
          </div>

          {activeTab === 'actions' && (
            <div className="px-4 pb-6 flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={onMergeOpen}
                disabled={!canDoAction(role, 'open-table') || !hasEligibleMergeTarget}
              >
                Merge Bill
              </Button>
              <Button className="w-full" onClick={() => router.push(`/payment/${table.id}`)}>
                Go to Payment
              </Button>
            </div>
          )}

          {activeTab === 'timeline' && (
            <OrderTimeline tableId={table.id} />
          )}
        </div>
      )}

      {table.status === 'Cleaning' && (
        <div className="px-4 pb-6 flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => {
              useBillStore.getState().cancelSplit(table.id)
              useBillStore.getState().dissolveAll(table.id)
              markClean(table.id)
              onClose()
            }}
          >
            Mark Clean
          </Button>
        </div>
      )}

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
    </>
  )
}

export function TableBottomSheet({
  table,
  onClose,
  onOpenTableModal,
}: TableBottomSheetProps) {
  const open = table !== null
  const [mergeSheetOpen, setMergeSheetOpen] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl max-h-[80vh] overflow-y-auto p-0">
          {table && (
            <TableBottomSheetContent
              key={table.id}
              table={table}
              onClose={onClose}
              onOpenTableModal={onOpenTableModal}
              onMergeOpen={() => setMergeSheetOpen(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      <MergeDialog
        open={mergeSheetOpen}
        onClose={() => setMergeSheetOpen(false)}
        primaryTableId={table?.id ?? ''}
        onMergeConfirmed={() => { setMergeSheetOpen(false); onClose() }}
      />
    </>
  )
}
