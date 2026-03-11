'use client'

import { CheckCircleLinear } from 'solar-icon-set'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReceiptScreenProps {
  tableId: string
  grandTotal: number
  paymentMethod: 'Cash' | 'QR PromptPay' | 'Card'
  paidAt: Date
  onReprint: () => void
  onBackToFloor: () => void
}

// ---------------------------------------------------------------------------
// ReceiptScreen
// ---------------------------------------------------------------------------

export function ReceiptScreen({
  tableId,
  grandTotal,
  paymentMethod,
  paidAt,
  onReprint,
  onBackToFloor,
}: ReceiptScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
      {/* Success icon block */}
      <div className="flex flex-col items-center gap-2">
        <CheckCircleLinear size={64} className="text-green-500" />
        <h1 className="text-2xl font-bold">Payment Received</h1>
      </div>

      {/* Details card */}
      <div className="rounded-xl border bg-card p-6 w-full max-w-sm space-y-3">
        {/* Table row */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Table</span>
          <span className="text-sm font-medium">{tableId}</span>
        </div>

        {/* Total paid row */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Paid</span>
          <span className="text-sm font-bold">฿{grandTotal.toLocaleString()}</span>
        </div>

        {/* Method row */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Method</span>
          <span className="text-sm font-medium">{paymentMethod}</span>
        </div>

        {/* Time row */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Time</span>
          <span className="text-xs font-medium">{paidAt.toLocaleString('th-TH')}</span>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Auto-print annotation */}
        <p className="text-xs text-muted-foreground text-center">
          🖶 Invoice auto-printed <span className="italic">[annotated]</span>
        </p>
      </div>

      {/* Loyalty Section — CRM Type 2 (Smart Loyalty) */}
      <div className="rounded-xl border bg-card p-4 w-full max-w-sm space-y-3">
        {/* Member tier and point balance */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-amber-500">Gold Member</span>
          <span className="text-sm text-muted-foreground">1,240 pts</span>
        </div>

        {/* QR placeholder — customer scans to earn points */}
        <div className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center bg-muted/30">
          <span className="text-xs text-muted-foreground text-center px-2">
            Customer scans to earn points
          </span>
        </div>

        {/* Wireframe annotation */}
        <p className="text-xs text-muted-foreground text-center">
          [Smart loyalty QR — unique per bill, baked with spend + branch]
        </p>
      </div>

      {/* Actions block */}
      <div className="w-full max-w-sm space-y-3">
        <Button variant="outline" className="w-full" onClick={onReprint}>
          Reprint Receipt
        </Button>
        <p className="text-xs text-muted-foreground text-center -mt-2">
          (annotated — no printer)
        </p>

        <Button className="w-full" onClick={onBackToFloor}>
          Back to Floor Plan
        </Button>
      </div>
    </div>
  )
}
