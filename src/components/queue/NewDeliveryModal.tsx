'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQueueStore } from '@/stores/queue.store'
import type { DeliveryPlatform } from '@/stores/queue.store'

interface NewDeliveryModalProps {
  open: boolean
  onClose: () => void
}

// Inner component — remounted via key when modal opens, resetting state naturally
function NewDeliveryModalContent({ onClose }: Omit<NewDeliveryModalProps, 'open'>) {
  const [platform, setPlatform] = useState('')
  const [externalId, setExternalId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const createDeliveryOrder = useQueueStore((s) => s.createDeliveryOrder)
  const router = useRouter()

  const canSubmit = platform !== '' && externalId.trim() !== ''

  function handleSubmit() {
    if (!canSubmit) return
    const orderId = createDeliveryOrder(
      platform as DeliveryPlatform,
      externalId.trim(),
      customerName.trim() || undefined,
      customerPhone.trim() || undefined,
    )
    onClose()
    router.push(`/order/${orderId}`)
  }

  return (
    <DialogContent className="sm:max-w-[425px] p-6 gap-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-center w-full">
          New Delivery Order
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-2.5">
        {/* Platform selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Platform <span className="text-foreground">*</span>
          </label>
          <Select
            value={platform}
            onValueChange={(val) => setPlatform(val ?? '')}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Placeholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grab">Grab</SelectItem>
              <SelectItem value="lineman">LINE MAN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* External Order ID */}
        <div className="flex flex-col gap-2">
          <label htmlFor="delivery-order-id" className="text-sm font-medium text-foreground">
            Order ID <span className="text-foreground">*</span>
          </label>
          <Input
            id="delivery-order-id"
            type="text"
            placeholder="Placeholder"
            className="h-9"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>

        {/* Customer Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="delivery-customer-name" className="text-sm font-medium text-foreground">
            Customer Name (optional)
          </label>
          <Input
            id="delivery-customer-name"
            type="text"
            placeholder="Placeholder"
            className="h-9"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>

        {/* Customer Phone */}
        <div className="flex flex-col gap-2">
          <label htmlFor="delivery-customer-phone" className="text-sm font-medium text-foreground">
            Customer Phone (optional)
          </label>
          <Input
            id="delivery-customer-phone"
            type="tel"
            inputMode="numeric"
            placeholder="Placeholder"
            className="h-9"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>
      </div>

      {/* Footer — stacked full-width buttons */}
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full h-14"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Create Order
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14"
          onClick={onClose}
        >
          ยกเลิก
        </Button>
      </div>
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
