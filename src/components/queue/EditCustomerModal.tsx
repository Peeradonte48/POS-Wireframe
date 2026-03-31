'use client'

import { useState } from 'react'
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

// Inner component — remounted via key when modal opens, resetting state naturally
function EditCustomerModalContent({
  onClose,
  orderId,
  initialName,
  initialPhone,
}: Omit<EditCustomerModalProps, 'open'>) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const updateCustomer = useQueueStore((s) => s.updateCustomer)

  function handleConfirm() {
    if (!name.trim()) return
    updateCustomer(orderId, name.trim(), phone.trim() || undefined)
    onClose()
  }

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Edit Customer</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2 py-2">
        <label htmlFor="edit-customer-name" className="text-sm font-medium">Customer name *</label>
        <Input
          id="edit-customer-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
        />
        <label htmlFor="edit-customer-phone" className="text-sm font-medium text-muted-foreground">Phone (optional)</label>
        <Input
          id="edit-customer-phone"
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
  )
}

export function EditCustomerModal({
  open,
  onClose,
  orderId,
  initialName,
  initialPhone,
}: EditCustomerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} disablePointerDismissal>
      <EditCustomerModalContent
        key={open ? orderId : 'closed'}
        onClose={onClose}
        orderId={orderId}
        initialName={initialName}
        initialPhone={initialPhone}
      />
    </Dialog>
  )
}
