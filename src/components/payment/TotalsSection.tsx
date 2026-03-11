'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  onApplyCoupon,
  vatAmount,
  grandTotal,
}: TotalsSectionProps) {
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
      ) : (
        /* Coupon input row */
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="coupon-code" className="text-xs text-muted-foreground mb-1 block">
              Coupon Code
            </Label>
            <Input
              id="coupon-code"
              type="text"
              placeholder="e.g. RAMEN10"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="w-28">
            <Label htmlFor="coupon-amount" className="text-xs text-muted-foreground mb-1 block">
              Discount (฿)
            </Label>
            <Input
              id="coupon-amount"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={couponAmount === 0 ? '' : couponAmount}
              onChange={(e) => setCouponAmount(Number(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0"
            onClick={onApplyCoupon}
            disabled={!couponCode.trim() || couponAmount <= 0}
          >
            Apply
          </Button>
        </div>
      )}

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
