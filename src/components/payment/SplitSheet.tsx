'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useBillStore } from '@/stores/bill.store'
import { useTableStore } from '@/stores/table.store'
import { CustomValueSplitPanel } from '@/components/payment/CustomValueSplitPanel'
import { PerSeatSplitPanel } from '@/components/payment/PerSeatSplitPanel'
import { ItemSplitSheet } from '@/components/payment/ItemSplitSheet'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SplitMode = 'select' | 'custom' | 'per-seat' | 'item'

interface SplitSheetProps {
  open: boolean
  onClose: () => void
  tableId: string
  grandTotal: number
  billItems: OrderLineItem[]
  onAllPaid: () => void
}

// ---------------------------------------------------------------------------
// SplitSheet — orchestrator
// ---------------------------------------------------------------------------

export function SplitSheet({ open, onClose, tableId, grandTotal, billItems, onAllPaid }: SplitSheetProps) {
  const [mode, setMode] = useState<SplitMode>('select')
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)

  const focusTrapRef = useFocusTrap<HTMLDivElement>(open)
  const { initCustomSplit, initPerSeatSplit, cancelSplit } = useBillStore()
  const split = useBillStore((s) => s.splits[tableId])
  const paidCount = split ? Object.keys(split.payments).length : 0
  const defaultGuestCount = useTableStore.getState().tables[tableId]?.guestCount ?? 2

  // Reset mode when sheet opens/closes — key-based reset via useEffect on open flag
  useEffect(() => {
    if (open) {
      setMode('select')
      setShowRevertConfirm(false)
    }
  }, [open])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleAllPaid() {
    onClose()
    onAllPaid()
  }

  function handlePanelCancel() {
    toast('Split cancelled')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Split payment" style={{ boxShadow: 'var(--shadow-floating)' }}
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {open && (
          <>
            {/* Mode select */}
            {mode === 'select' && (
              <div className="px-4 py-4 space-y-4">
                <h2 className="text-lg font-semibold text-center">Split Bill</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="option-card" onClick={() => { initCustomSplit(tableId, 2); setMode('custom') }}>
                    <p className="font-semibold text-sm">Split by Value</p>
                    <p className="text-xs text-muted-foreground">Each person pays a custom amount</p>
                  </Button>
                  <Button variant="option-card" onClick={() => { initPerSeatSplit(tableId, defaultGuestCount); setMode('per-seat') }}>
                    <p className="font-semibold text-sm">Per Seat</p>
                    <p className="text-xs text-muted-foreground">Assign each item to a seat</p>
                  </Button>
                </div>
              </div>
            )}

            {/* Custom value split */}
            {mode === 'custom' && (
              <CustomValueSplitPanel
                tableId={tableId}
                grandTotal={grandTotal}
                onAllPaid={handleAllPaid}
                onCancel={handlePanelCancel}
              />
            )}

            {/* Per-seat split */}
            {mode === 'per-seat' && (
              <PerSeatSplitPanel
                tableId={tableId}
                items={billItems}
                onAllPaid={handleAllPaid}
                onCancel={handlePanelCancel}
              />
            )}

            {/* Item split — delegates to existing ItemSplitSheet */}
            {mode === 'item' && (
              <ItemSplitSheet
                open={mode === 'item'}
                onClose={() => setMode('select')}
                tableId={tableId}
                orderItems={billItems}
                onProceed={handleAllPaid}
              />
            )}

            {/* Revert to Single Bill — only shown when a split is active and mode is not item */}
            {split && mode !== 'item' && (
              <>
                <div className="border-t mx-4" />
                <div className="px-4 pb-6 pt-3">
                  {!showRevertConfirm ? (
                    <>
                      <Button variant="ghost" className="w-full text-muted-foreground"
                        disabled={paidCount > 0} onClick={() => setShowRevertConfirm(true)}>
                        Revert to Single Bill
                      </Button>
                      {paidCount > 0 && (
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          Cannot revert — {paidCount} seat(s) already paid
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-center text-foreground">
                        Revert to single bill? This will remove all seat assignments.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowRevertConfirm(false)}>Keep Split</Button>
                        <Button variant="destructive" className="flex-1" onClick={() => { cancelSplit(tableId); toast('Reverted to single bill'); setShowRevertConfirm(false); onClose() }}>Revert</Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
