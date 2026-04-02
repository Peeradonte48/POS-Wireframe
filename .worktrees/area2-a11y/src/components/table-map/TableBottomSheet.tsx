'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { useBillStore } from '@/stores/bill.store'
import { canDoAction } from '@/lib/role-permissions'
import { useDwellTimer } from '@/components/table-map/useDwellTimer'
import type { TableRecord } from '@/stores/table.store'
import { MergeSheet } from '@/components/table-map/MergeSheet'
import { OrderTimeline } from '@/components/table-map/OrderTimeline'

interface TableBottomSheetProps {
  table: TableRecord | null  // null = sheet closed
  onClose: () => void
  onOpenTableModal: () => void  // called when user taps [Open Table]
}

export function TableBottomSheet({
  table,
  onClose,
  onOpenTableModal,
}: TableBottomSheetProps) {
  const open = table !== null
  const router = useRouter()
  const role = useSessionStore((s) => s.role)!
  const { markReserved, undoReserved, requestCheck, markClean, markServed, updateTable } = useTableStore()
  const tables = useTableStore((s) => s.tables)
  const merges = useBillStore((s) => s.merges)
  const hasEligibleMergeTarget = Object.values(tables).some(
    (t) =>
      (t.status === 'Occupied' || t.status === 'CheckRequested') &&
      t.id !== table?.id &&
      !(t.id in merges)
  )

  // Local editable state for waiter name and note (Occupied sheet)
  const [localWaiter, setLocalWaiter] = useState('')
  const [localNote, setLocalNote] = useState('')
  const [mergeSheetOpen, setMergeSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'actions' | 'timeline'>('actions')

  // Sync local state when the selected table changes
  useEffect(() => {
    if (table) {
      setLocalWaiter(table.waiterName ?? '')
      setLocalNote(table.note ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table?.id])

  // Reset tab to actions whenever the selected table changes
  useEffect(() => {
    setActiveTab('actions')
  }, [table?.id])

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const dwellTimer = useDwellTimer(table?.openedAt ?? null)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div
        style={{ boxShadow: 'var(--shadow-floating)' }}
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
          transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {table && (
          <>
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
                      onClick={() => setMergeSheetOpen(true)}
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
                      onClick={() => setMergeSheetOpen(true)}
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
        )}
      </div>

      <MergeSheet
        open={mergeSheetOpen}
        onClose={() => setMergeSheetOpen(false)}
        primaryTableId={table?.id ?? ''}
        onMergeConfirmed={() => { setMergeSheetOpen(false); onClose() }}
      />
    </>
  )
}
