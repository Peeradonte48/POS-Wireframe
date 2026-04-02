'use client'

import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CashDialogProps {
  open: boolean
  onClose: () => void
  grandTotal: number
  onConfirm: () => void
}

// ---------------------------------------------------------------------------
// Numpad layout
// ---------------------------------------------------------------------------

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
]

// ---------------------------------------------------------------------------
// CashDialog
// ---------------------------------------------------------------------------

export function CashDialog({ open, onClose, grandTotal, onConfirm }: CashDialogProps) {
  const [inputStr, setInputStr] = useState('')

  // Reset every time the dialog opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setInputStr('')
  }, [open])

  function handleKey(key: string) {
    if (key === 'del') {
      setInputStr((prev) => prev.slice(0, -1))
      return
    }
    if (key === '.') {
      if (inputStr.includes('.')) return
      setInputStr((prev) => (prev === '' ? '0.' : prev + '.'))
      return
    }
    // Digit
    if (inputStr.length >= 10) return
    setInputStr((prev) => (prev === '0' ? key : prev + key))
  }

  const cashReceived = parseFloat(inputStr) || 0
  const change = Math.max(0, cashReceived - grandTotal)
  const isValid = cashReceived >= grandTotal && cashReceived > 0

  const displayValue = inputStr === '' ? '0.00' : inputStr

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm gap-0 p-6" showCloseButton>
        {/* Header */}
        <DialogHeader className="mb-6">
          <DialogTitle className="text-lg font-semibold leading-none">
            ชำระด้วยเงินสด
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            กรอกจำนวนเงินที่รับมา
          </DialogDescription>
        </DialogHeader>

        {/* Amount display */}
        <div className="flex flex-col gap-2 mb-4">
          <p className="text-base font-semibold text-muted-foreground leading-6">
            ยอดเงินที่รับมา
          </p>
          <div className="bg-muted rounded-lg p-3 flex items-center justify-end gap-1">
            <span className="text-xl font-medium text-muted-foreground">฿</span>
            <span className="text-3xl font-semibold text-foreground leading-9">
              {displayValue}
            </span>
          </div>
        </div>

        {/* Numpad */}
        <div className="flex flex-col gap-[4px] mb-6">
          {ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-[5px]">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className="flex-1 h-16 bg-muted rounded-lg flex items-center justify-center text-[26px] font-normal hover:brightness-95 active:scale-95 transition-transform select-none"
                >
                  {key === 'del' ? <Delete size={22} className="text-foreground" /> : key}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-2xl text-muted-foreground">ยอดสุทธิ</span>
            <span className="text-2xl font-semibold text-destructive">
              ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl text-muted-foreground">ทอน</span>
            <span className="text-2xl font-semibold text-muted-foreground">
              ฿{change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Confirm button */}
        <Button
          className="w-full h-14 text-sm font-medium"
          disabled={!isValid}
          onClick={onConfirm}
        >
          ยืนยันการชำระเงิน
        </Button>
      </DialogContent>
    </Dialog>
  )
}
