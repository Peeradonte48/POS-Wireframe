'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
// MergeSheet (Dialog)
// ---------------------------------------------------------------------------

export function MergeSheet({ open, onClose, primaryTableId, onMergeConfirmed }: MergeSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [prevOpen, setPrevOpen] = useState(open)

  const tables = useTableStore((s) => s.tables)
  const { initMerge, isMergedSecondary } = useBillStore()

  const primaryLabel = tables[primaryTableId]?.label ?? primaryTableId

  // Reset selection on every open
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setSelectedIds(new Set())
  }

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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm gap-0 p-6" showCloseButton>
        {/* Header */}
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-semibold leading-none">
            รวมบิล {primaryLabel} กับโต๊ะอื่น
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            เลือกโต๊ะต้องการรวมบิล
          </DialogDescription>
        </DialogHeader>

        {/* Table grid */}
        {eligibleTables.length === 0 ? (
          <p className="pb-4 text-sm text-muted-foreground">
            ไม่มีโต๊ะที่สามารถรวมบิลได้ เฉพาะโต๊ะที่มีลูกค้าหรือรอเช็คบิลเท่านั้น
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-[10px] mb-4">
            {eligibleTables.map((table) => {
              const selected = selectedIds.has(table.id)
              return (
                <button
                  key={table.id}
                  onClick={() => toggleTable(table.id)}
                  className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <span className="text-sm font-medium leading-none">{table.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {table.guestCount ?? '—'} คน
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <Separator className="mb-4" />

        {/* Footer */}
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
          >
            รวมบิล
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
