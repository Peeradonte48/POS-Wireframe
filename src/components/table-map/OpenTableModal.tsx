'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTableStore } from '@/stores/table.store'

interface OpenTableModalProps {
  tableId: string | null  // null = modal closed
  onClose: () => void
}

export function OpenTableModal({ tableId, onClose }: OpenTableModalProps) {
  const { openTable } = useTableStore()
  const [guestCount, setGuestCount] = useState(1)

  // Reset guest count when tableId changes (different table opened)
  useEffect(() => {
    setGuestCount(1)
  }, [tableId])

  const handleConfirm = () => {
    if (guestCount >= 1 && tableId) {
      openTable(tableId, guestCount)
      onClose()
    }
  }

  const isOpen = tableId !== null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Open Table</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <label className="text-sm font-medium">Number of guests</label>
          <Input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            placeholder="e.g. 2"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={guestCount < 1}>
            Open Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
