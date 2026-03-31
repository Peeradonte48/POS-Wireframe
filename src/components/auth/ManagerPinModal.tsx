'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PinNumpad } from '@/components/auth/PinNumpad'
import { verifyPin } from '@/lib/mock-data/staff'
import { ShieldCheck } from 'lucide-react'

export interface ManagerPinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shown above the PIN numpad, e.g. "Authorize: Void Item" */
  actionLabel: string
  /** Called when the correct manager PIN is entered */
  onAuthorize: () => void
}

export function ManagerPinModal({
  open,
  onOpenChange,
  actionLabel,
  onAuthorize,
}: ManagerPinModalProps) {
  const [pinError, setPinError] = useState(false)

  const handlePinComplete = useCallback(
    (pin: string) => {
      // Verify against Manager role PIN
      const staff = verifyPin('Manager', pin)
      if (staff) {
        onOpenChange(false)
        onAuthorize()
      } else {
        setPinError(true)
      }
    },
    [onAuthorize, onOpenChange]
  )

  const handleErrorClear = useCallback(() => {
    setPinError(false)
  }, [])

  // Reset error state when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setPinError(false)
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="w-10 h-10 rounded-full bg-status-warning-bg flex items-center justify-center">
              <ShieldCheck size={20} className="text-status-warning" />
            </div>
            <DialogTitle className="text-center text-base">Manager Authorization</DialogTitle>
            <p className="text-sm text-muted-foreground text-center">{actionLabel}</p>
          </div>
        </DialogHeader>

        <div className="flex justify-center pb-4">
          <PinNumpad
            onComplete={handlePinComplete}
            error={pinError}
            onErrorClear={handleErrorClear}
            label="Enter Manager PIN"
          />
        </div>

        {pinError && (
          <p className="text-sm text-destructive text-center -mt-2 pb-2">
            Incorrect Manager PIN
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
