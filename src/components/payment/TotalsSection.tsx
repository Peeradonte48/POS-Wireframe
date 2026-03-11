'use client'

import { useState } from 'react'
import { CameraLinear } from 'solar-icon-set'
import { Button } from '@/components/ui/button'
import { CameraSheet } from './CameraSheet'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TotalsSectionProps {
  subtotal: number
  couponCode: string
  setCouponCode: (v: string) => void
  couponAmount: number
  setCouponAmount: (v: number) => void
  couponApplied: boolean
  onApplyCoupon: () => void
  setCouponApplied: (v: boolean) => void
  vatAmount: number
  grandTotal: number
  discountAmount: number
}

// ---------------------------------------------------------------------------
// TotalsSection
// ---------------------------------------------------------------------------

export function TotalsSection({
  subtotal,
  couponCode,
  setCouponCode,
  couponAmount,
  setCouponAmount,
  couponApplied,
  setCouponApplied,
  vatAmount,
  grandTotal,
}: TotalsSectionProps) {
  const [scannerOpen, setScannerOpen] = useState(false)

  return (
    <div className="space-y-3 pt-4">
      {/* Subtotal row */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>฿{subtotal.toLocaleString()}</span>
      </div>

      {/* Coupon area */}
      {couponApplied ? (
        /* Applied coupon line */
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Coupon {couponCode}</span>
          <span className="text-green-600 font-medium">−฿{couponAmount.toLocaleString()}</span>
        </div>
      ) : null}

      {/* Scan Coupon QR button — active when not yet applied */}
      {!couponApplied && (
        <Button variant="outline" className="w-full" onClick={() => setScannerOpen(true)}>
          <CameraLinear size={16} className="mr-2" />
          Scan Coupon QR
        </Button>
      )}

      {/* Scan Coupon QR button — disabled when coupon already applied */}
      {couponApplied && (
        <Button variant="outline" className="w-full" disabled>
          <CameraLinear size={16} className="mr-2" />
          Scan Coupon QR
        </Button>
      )}

      {/* Camera sheet */}
      <CameraSheet
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCouponScanned={(code, amount) => {
          setCouponCode(code)
          setCouponAmount(amount)
          setCouponApplied(true)
          setScannerOpen(false)
        }}
      />

      {/* VAT row */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">VAT 7%</span>
        <span>฿{vatAmount.toLocaleString()}</span>
      </div>

      {/* Total row */}
      <div className="flex justify-between border-t pt-3">
        <span className="font-bold text-base">Total</span>
        <span className="font-bold text-base">฿{grandTotal.toLocaleString()}</span>
      </div>

      {/* PAY-05: Split Bill placeholder */}
      <Button variant="outline" disabled className="w-full mt-4 opacity-50">
        Split Bill → v2
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-1">
        ⓘ Seat-level split planned for v2
      </p>
    </div>
  )
}
