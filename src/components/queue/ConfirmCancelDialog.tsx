'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmCancelDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  orderId: string
  customerName: string
}

export function ConfirmCancelDialog({
  open,
  onClose,
  onConfirm,
  orderId,
  customerName,
}: ConfirmCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          {orderId} · {customerName} will be removed.
        </p>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onClose}>
            Keep
          </Button>
          <Button variant="destructive" size="lg" onClick={onConfirm}>
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
