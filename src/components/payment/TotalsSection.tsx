'use client'

import { useState } from 'react'
import { Camera, Scissors, Link } from 'lucide-react'
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
  onSplitBill?: () => void
  onMergeBill?: () => void
  isMergeActive?: boolean
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
  onSplitBill,
  onMergeBill,
  isMergeActive,
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
          <span className="text-status-success font-medium">−฿{couponAmount.toLocaleString()}</span>
        </div>
      ) : null}

      {/* Scan Coupon QR button — active when not yet applied */}
      {!couponApplied && (
        <Button variant="outline" className="w-full" onClick={() => setScannerOpen(true)}>
          <Camera size={16} className="mr-2" />
          Scan Coupon QR
        </Button>
      )}

      {/* Scan Coupon QR button — disabled when coupon already applied */}
      {couponApplied && (
        <Button variant="outline" className="w-full" disabled>
          <Camera size={16} className="mr-2" />
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
        <span className="caps">Total</span>
        <span className="text-2xl font-black text-primary">฿{grandTotal.toLocaleString()}</span>
      </div>

      {/* Billing actions — hidden for takeaway orders (onSplitBill/onMergeBill are undefined) */}
      {onSplitBill !== undefined && !isMergeActive && (
        <Button variant="outline" className="w-full mt-4" onClick={onSplitBill}>
          <Scissors size={16} className="mr-2" />
          Split Bill
        </Button>
      )}
      {onMergeBill !== undefined && (
        <Button variant="outline" className="w-full mt-2" onClick={onMergeBill} disabled={isMergeActive}>
          <Link size={16} className="mr-2" />
          Merge Bill
        </Button>
      )}
    </div>
  )
}
