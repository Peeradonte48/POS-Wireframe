'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ClockCircleLinear } from 'solar-icon-set'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { useDwellTimer } from '@/components/table-map/useDwellTimer'
import type { TableRecord } from '@/stores/table.store'

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
  const { markReserved, requestCheck, markClean, markServed, updateTable } = useTableStore()

  // Local editable state for waiter name and note (Occupied sheet)
  const [localWaiter, setLocalWaiter] = useState('')
  const [localNote, setLocalNote] = useState('')

  // Sync local state when the selected table changes
  useEffect(() => {
    if (table) {
      setLocalWaiter(table.waiterName ?? '')
      setLocalNote(table.note ?? '')
    }
  }, [table?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
          shadow-lg transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto
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
              <div className="px-4 pb-6 flex flex-col gap-3">
                {/* Guest count and dwell timer */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {table.guestCount} guests
                  </span>
                  <span className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
                    <ClockCircleLinear size={14} />
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

                {/* Order stage badge */}
                {table.orderStage && (
                  <div>
                    <Badge variant="outline">{table.orderStage}</Badge>
                  </div>
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
              </div>
            )}

            {table.status === 'CheckRequested' && (
              <div className="px-4 pb-6 flex flex-col gap-3">
                <Button className="w-full" onClick={() => router.push(`/payment/${table.id}`)}>
                  Go to Payment
                </Button>
              </div>
            )}

            {table.status === 'Cleaning' && (
              <div className="px-4 pb-6 flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={() => {
                    markClean(table.id)
                    onClose()
                  }}
                >
                  Mark Clean
                </Button>
              </div>
            )}

            {table.status === 'Reserved' && (
              <p className="text-sm text-muted-foreground px-4 pb-4">
                Table is reserved
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}
