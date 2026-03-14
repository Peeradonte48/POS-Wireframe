'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const REJECT_REASONS = [
  'Sold out',
  'Too busy',
  "Can't fulfil",
  'Other',
] as const

interface RejectReasonDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function RejectReasonDialog({ open, onClose, onConfirm }: RejectReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Reject reason</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-1">
          {REJECT_REASONS.map((reason) => (
            <Button
              key={reason}
              variant="outline"
              size="lg"
              className="justify-start text-sm"
              onClick={() => onConfirm(reason)}
            >
              {reason}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="mt-1">
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  )
}
