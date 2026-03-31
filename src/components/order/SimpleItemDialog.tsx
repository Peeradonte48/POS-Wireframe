'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SimpleItemDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (quantity: number) => void
  itemName?: string
}

export function SimpleItemDialog({
  open,
  onClose,
  onConfirm,
  itemName,
}: SimpleItemDialogProps) {
  const [quantity, setQuantity] = useState(1)

  // Reset quantity each time dialog opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setQuantity(1)
  }, [open])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={itemName ?? 'รายการสินค้า'}
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[425px] max-w-[calc(100vw-2rem)] flex flex-col gap-4 p-6 bg-background border border-border rounded-[10px]"
        style={{ boxShadow: 'var(--shadow-panel)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-[15px] top-[15px] size-4 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <p className="text-lg font-semibold leading-none text-foreground text-center w-full">
          รายการสินค้า
        </p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-2 w-full">
          {/* Minus */}
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="ลด"
            className={cn(
              'flex items-center justify-center size-8 rounded-full border border-input bg-background shrink-0',
              'disabled:opacity-40 transition-opacity',
            )}
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <Minus size={16} />
          </button>

          {/* Number display */}
          <div className="flex flex-1 flex-col items-center text-center">
            <span className="text-[72px] font-bold leading-none tracking-tighter text-foreground tabular-nums">
              {quantity}
            </span>
            <span className="text-xs text-muted-foreground uppercase leading-5">
              รายการ
            </span>
          </div>

          {/* Plus */}
          <button
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            aria-label="เพิ่ม"
            className="flex items-center justify-center size-8 rounded-full border border-input bg-background shrink-0"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 w-full">
          <Button
            className="w-full h-10"
            onClick={() => onConfirm(quantity)}
          >
            บันทึก
          </Button>
          <Button
            variant="outline"
            className="w-full h-10"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
        </div>
      </div>
    </>
  )
}
