'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQueueStore } from '@/stores/queue.store'

interface EditCustomerModalProps {
  open: boolean
  onClose: () => void
  orderId: string
  initialName: string
  initialPhone?: string
}

export function EditCustomerModal({
  open,
  onClose,
  orderId,
  initialName,
  initialPhone,
}: EditCustomerModalProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const updateCustomer = useQueueStore((s) => s.updateCustomer)

  // Reset fields to latest values each time modal opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initialName)
      setPhone(initialPhone ?? '')
    }
  }, [open, initialName, initialPhone])

  function handleConfirm() {
    if (!name.trim()) return
    updateCustomer(orderId, name.trim(), phone.trim() || undefined)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <label className="text-sm font-medium">Customer name *</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
          <label className="text-sm font-medium text-muted-foreground">Phone (optional)</label>
          <Input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleConfirm} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
