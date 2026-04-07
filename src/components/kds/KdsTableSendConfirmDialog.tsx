'use client'

import { X } from 'lucide-react'

interface KdsTableSendConfirmDialogProps {
  tableLabel: string
  totalCount: number
  onConfirm: () => void
  onCancel: () => void
}

export function KdsTableSendConfirmDialog({
  tableLabel,
  totalCount,
  onConfirm,
  onCancel,
}: KdsTableSendConfirmDialogProps) {
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
        <div className="flex flex-col gap-1.5 text-center">
          <p className="text-lg font-semibold text-foreground leading-none">
            ส่งของโต๊ะ {tableLabel} ทั้งหมด
          </p>
          <p className="text-sm text-muted-foreground">
            {totalCount} รายการจะถูกส่งพร้อมกัน
          </p>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="flex w-full h-12 items-center justify-center rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            ยืนยัน
          </button>
          <button
            onClick={onCancel}
            className="flex w-full h-12 items-center justify-center rounded-md border border-input bg-background text-foreground text-sm font-medium hover:bg-muted active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}
