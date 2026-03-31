'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'
import { useTableStore } from '@/stores/table.store'
import { useOrderStore } from '@/stores/order.store'

const MIN_GUESTS = 1
const MAX_GUESTS = 10

interface OpenTableModalProps {
  tableId: string | null  // null = modal closed
  onClose: () => void
}

// Inner component — remounted via key when tableId changes, resetting state naturally
function OpenTableModalContent({
  tableId,
  onClose,
}: { tableId: string; onClose: () => void }) {
  const { openTable, tables } = useTableStore()
  const [guestCount, setGuestCount] = useState(MIN_GUESTS)

  const handleConfirm = () => {
    useOrderStore.getState().clearOrder(tableId)
    openTable(tableId, guestCount)
    const tableLabel = tables[tableId]?.label ?? tableId
    toast(`${tableLabel} opened — ${guestCount} guests`)
    onClose()
  }

  const decrement = () => setGuestCount((c) => Math.max(MIN_GUESTS, c - 1))
  const increment = () => setGuestCount((c) => Math.min(MAX_GUESTS, c + 1))

  return (
    <DialogContent className="max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="text-center">Open Table</DialogTitle>
      </DialogHeader>

      {/* Stepper */}
      <div className="flex items-center gap-3 py-2">
        {/* Minus button */}
        <button
          onClick={decrement}
          disabled={guestCount <= MIN_GUESTS}
          className="flex items-center justify-center size-8 rounded-full border border-input bg-background shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          aria-label="Decrease guest count"
        >
          <Minus size={16} />
        </button>

        {/* Count + label */}
        <div className="flex flex-1 flex-col items-center text-center">
          <span className="text-[72px] font-bold leading-none tracking-tighter text-foreground tabular-nums">
            {guestCount}
          </span>
          <span className="caps mt-1">Number of guests</span>
        </div>

        {/* Plus button */}
        <button
          onClick={increment}
          disabled={guestCount >= MAX_GUESTS}
          className="flex items-center justify-center size-8 rounded-full border border-input bg-background shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          aria-label="Increase guest count"
        >
          <Plus size={16} />
        </button>
      </div>

      <DialogFooter className="flex-col gap-2 sm:flex-col">
        <Button className="w-full" onClick={handleConfirm}>
          Open Table
        </Button>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function OpenTableModal({ tableId, onClose }: OpenTableModalProps) {
  const isOpen = tableId !== null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }} disablePointerDismissal>
      {tableId !== null && (
        <OpenTableModalContent
          key={tableId}
          tableId={tableId}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}
