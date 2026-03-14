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

interface NewTakeawayModalProps {
  open: boolean
  onClose: () => void
}

export function NewTakeawayModal({ open, onClose }: NewTakeawayModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const createTakeaway = useQueueStore((s) => s.createTakeaway)

  function handleConfirm() {
    if (!name.trim()) return
    createTakeaway(name.trim(), phone.trim() || undefined)
    setName('')
    setPhone('')
    onClose()
  }

  function handleClose() {
    setName('')
    setPhone('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New Takeaway Order</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <label className="text-sm font-medium">Customer name *</label>
          <Input
            type="text"
            placeholder="e.g. Somchai P."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
          <label className="text-sm font-medium text-muted-foreground">Phone (optional)</label>
          <Input
            type="tel"
            inputMode="numeric"
            placeholder="e.g. 081-234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleConfirm} disabled={!name.trim()}>
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
