'use client'

import { useEffect } from 'react'
import { Camera, X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CameraSheetProps {
  open: boolean
  onClose: () => void
  onCouponScanned: (code: string, amount: number) => void
}

// ---------------------------------------------------------------------------
// CameraSheet
// ---------------------------------------------------------------------------

export function CameraSheet({ open, onClose, onCouponScanned }: CameraSheetProps) {
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      onCouponScanned('RAMEN50', 50)
      onClose()
    }, 1500)

    return () => clearTimeout(timer)
  }, [open, onClose, onCouponScanned])

  return (
    <>
      {/* Backdrop (z-40) */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel (z-50) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background shadow-lg transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4 space-y-4 pb-8">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={20} />
              <span className="font-medium">Scan Coupon QR</span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md hover:bg-accent transition-colors"
              aria-label="Close camera scanner"
            >
              <X size={20} />
            </button>
          </div>

          {/* Viewfinder box */}
          <div className="flex flex-col items-center gap-3">
            <div className="mx-auto w-48 h-48 rounded-lg animate-pulse border-2 border-primary bg-muted/30" />

            {/* Label */}
            <p className="text-sm text-muted-foreground text-center">
              Point at customer&apos;s coupon QR code
            </p>

            {/* Simulation annotation */}
            <p className="text-xs text-muted-foreground text-center">
              [Simulated — auto-closes after 1.5s with mock scan result]
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
