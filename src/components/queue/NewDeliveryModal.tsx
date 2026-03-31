'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import type { DeliveryPlatform } from '@/stores/queue.store'

interface NewDeliveryModalProps {
  open: boolean
  onClose: () => void
}

// Inner component — remounted via key when modal opens, resetting state naturally
function NewDeliveryModalContent({ onClose }: Omit<NewDeliveryModalProps, 'open'>) {
  const [platform, setPlatform] = useState<DeliveryPlatform | null>(null)
  const [externalId, setExternalId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const createDeliveryOrder = useQueueStore((s) => s.createDeliveryOrder)
  const router = useRouter()

  const canSubmit = platform !== null && externalId.trim() !== ''

  function handleSubmit() {
    if (!canSubmit) return
    const orderId = createDeliveryOrder(
      platform,
      externalId.trim(),
      customerName.trim() || undefined,
      customerPhone.trim() || undefined,
    )
    onClose()
    router.push(`/order/delivery/${orderId}`)
  }

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>New Delivery Order</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        {/* Platform selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="delivery-platform" className="text-xs font-semibold uppercase text-muted-foreground">
            Platform <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={`flex-1 ${platform === 'grab' ? 'border-primary bg-primary/10 text-primary font-semibold' : ''}`}
              onClick={() => setPlatform('grab')}
              data-selected={platform === 'grab'}
            >
              Grab
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`flex-1 ${platform === 'lineman' ? 'border-primary bg-primary/10 text-primary font-semibold' : ''}`}
              onClick={() => setPlatform('lineman')}
              data-selected={platform === 'lineman'}
            >
              LINE MAN
            </Button>
          </div>
        </div>

        {/* External Order ID */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="delivery-order-id" className="text-xs font-semibold uppercase text-muted-foreground">
            Order ID <span className="text-destructive">*</span>
          </label>
          <Input
            id="delivery-order-id"
            type="text"
            placeholder="e.g. GR-4401"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>

        {/* Customer Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="delivery-customer-name" className="text-xs font-semibold uppercase text-muted-foreground">
            Customer Name{' '}
            <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
          </label>
          <Input
            id="delivery-customer-name"
            type="text"
            placeholder="e.g. Somchai"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>

        {/* Customer Phone */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="delivery-customer-phone" className="text-xs font-semibold uppercase text-muted-foreground">
            Customer Phone{' '}
            <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
          </label>
          <Input
            id="delivery-customer-phone"
            type="tel"
            inputMode="numeric"
            placeholder="e.g. 08X-XXX-XXXX"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button size="lg" onClick={handleSubmit} disabled={!canSubmit}>
          Start Adding Items →
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function NewDeliveryModal({ open, onClose }: NewDeliveryModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }} disablePointerDismissal>
      <NewDeliveryModalContent
        key={String(open)}
        onClose={onClose}
      />
    </Dialog>
  )
}
