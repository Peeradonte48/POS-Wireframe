'use client'

import { useEffect, useState } from 'react'
import { Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBillStore } from '@/stores/bill.store'
import { useTableStore } from '@/stores/table.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MergeSheetProps {
  open: boolean
  onClose: () => void
  primaryTableId: string
  onMergeConfirmed: () => void
}

// ---------------------------------------------------------------------------
// MergeSheet
// ---------------------------------------------------------------------------

export function MergeSheet({ open, onClose, primaryTableId, onMergeConfirmed }: MergeSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const tables = useTableStore((s) => s.tables)
  const { initMerge, isMergedSecondary } = useBillStore()

  // Reset selection state on every open
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set())
    }
  }, [open])

  // Body scroll lock (matches SplitSheet pattern)
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Eligible tables: Occupied or CheckRequested, not the primary, not already a secondary
  const eligibleTables = Object.values(tables).filter(
    (t) =>
      (t.status === 'Occupied' || t.status === 'CheckRequested') &&
      t.id !== primaryTableId &&
      !isMergedSecondary(t.id),
  )

  function handleConfirm() {
    initMerge(primaryTableId, [...selectedIds])
    onMergeConfirmed()
    onClose()
  }

  function toggleTable(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const mergeLabel =
    selectedIds.size > 0 ? `Merge (${selectedIds.size} table${selectedIds.size > 1 ? 's' : ''})` : 'Merge'

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
          transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <h2 className="text-base font-semibold px-4 pb-2">Merge Bill</h2>
        <p className="text-xs text-muted-foreground px-4 pb-3">
          Select tables to combine into one bill
        </p>

        {/* Table picker */}
        {eligibleTables.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">
            No eligible tables to merge. Only Occupied or Check Requested tables can be merged.
          </p>
        ) : (
          <div className="px-4 pb-2 grid grid-cols-2 gap-2">
            {eligibleTables.map((table) => (
              <Button
                key={table.id}
                variant="option-card"
                data-selected={selectedIds.has(table.id)}
                onClick={() => toggleTable(table.id)}
              >
                <p className="font-semibold text-sm">{table.label}</p>
                <p className="text-xs text-muted-foreground">
                  {table.guestCount ?? '—'} guests
                </p>
              </Button>
            ))}
          </div>
        )}

        {/* Confirm section */}
        <div className="px-4 pb-6 pt-3 border-t flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
          >
            <Link />
            {mergeLabel}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
