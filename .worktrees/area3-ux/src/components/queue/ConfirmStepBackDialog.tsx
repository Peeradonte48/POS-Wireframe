'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmStepBackDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  currentStatus: 'Sent' | 'Ready'
}

const CONTENT = {
  Sent: {
    title: 'Move back to Taking?',
    message: 'This will reopen the order for editing. The kitchen ticket will not be recalled.',
  },
  Ready: {
    title: 'Move back to Sent?',
    message: 'Order will be marked as still preparing.',
  },
}

export function ConfirmStepBackDialog({
  open,
  onClose,
  onConfirm,
  currentStatus,
}: ConfirmStepBackDialogProps) {
  const { title, message } = CONTENT[currentStatus]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">{message}</p>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" size="lg" onClick={onConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
