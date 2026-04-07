'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

type CancelType = 'deduct-stock' | 'no-deduct-stock'

interface KdsCancelInfoDialogProps {
  onSave: (cancelType: CancelType, notes: string) => void
  onCancel: () => void
}

export function KdsCancelInfoDialog({ onSave, onCancel }: KdsCancelInfoDialogProps) {
  const [cancelType, setCancelType] = useState<CancelType>('deduct-stock')
  const [notes, setNotes] = useState('')

  function handleSave() {
    onSave(cancelType, notes)
    toast.success('บันทึกข้อมูลสำเร็จ')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div
        className="relative bg-background border border-border rounded-lg flex flex-col gap-4 p-6 w-full max-w-[420px] animate-in zoom-in-95 duration-200"
        style={{ boxShadow: '0px 10px 15px 0px rgba(0,0,0,0.1), 0px 4px 6px 0px rgba(0,0,0,0.1)' }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-foreground/70 hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <p className="text-lg font-semibold text-foreground leading-none text-center">
            ออร์เดอร์ถูกยกเลิก
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2.5">
          {/* Cancel type radio group */}
          <div className="flex flex-col gap-2.5">
            <p className="text-base font-semibold text-card-foreground leading-none">
              รูปแบบการยกเลิก
            </p>

            <div className="flex flex-col gap-3">
              {/* Option 1: Deduct stock */}
              <button
                onClick={() => setCancelType('deduct-stock')}
                className={`flex gap-3 items-start p-3 rounded-lg border w-full text-left transition-colors ${
                  cancelType === 'deduct-stock'
                    ? 'border-foreground bg-foreground/5'
                    : 'border-border'
                }`}
              >
                <div
                  className={`shrink-0 size-4 rounded-full border mt-0.5 flex items-center justify-center ${
                    cancelType === 'deduct-stock'
                      ? 'bg-foreground border-foreground'
                      : 'bg-background border-border'
                  }`}
                >
                  {cancelType === 'deduct-stock' && (
                    <div className="size-2 rounded-full bg-background" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-sm font-medium text-foreground leading-none">
                    ยกเลิกแบบตัดสต๊อก
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ครัวทำไปแล้ว
                  </span>
                </div>
              </button>

              {/* Option 2: No deduct stock */}
              <button
                onClick={() => setCancelType('no-deduct-stock')}
                className={`flex gap-3 items-start p-3 rounded-lg border w-full text-left transition-colors ${
                  cancelType === 'no-deduct-stock'
                    ? 'border-foreground bg-foreground/5'
                    : 'border-border'
                }`}
              >
                <div
                  className={`shrink-0 size-4 rounded-full border mt-0.5 flex items-center justify-center ${
                    cancelType === 'no-deduct-stock'
                      ? 'bg-foreground border-foreground'
                      : 'bg-background border-border'
                  }`}
                >
                  {cancelType === 'no-deduct-stock' && (
                    <div className="size-2 rounded-full bg-background" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-sm font-medium text-foreground leading-none">
                    ยกเลิกแบบไม่ตัดสต๊อก
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ครัวยังไม่ได้ทำ
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Notes textarea */}
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold text-card-foreground leading-none">
              หมายเหตุ
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Placeholder"
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="flex w-full h-14 items-center justify-center rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            บันทึก
          </button>
          <button
            onClick={onCancel}
            className="flex w-full h-14 items-center justify-center rounded-md border border-input bg-background text-foreground text-sm font-medium hover:bg-muted active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}
