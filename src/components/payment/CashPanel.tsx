'use client'

import { Banknote } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { PaymentMethodPanel } from '@/components/payment/PaymentMethodPanel'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CashPanelProps {
  grandTotal: number
  cashReceived: number
  setCashReceived: (v: number) => void
}

// ---------------------------------------------------------------------------
// CashPanel
// ---------------------------------------------------------------------------

export function CashPanel({ grandTotal, cashReceived, setCashReceived }: CashPanelProps) {
  const changedue = Math.max(0, cashReceived - grandTotal)
  const isUnderpayment = cashReceived > 0 && cashReceived < grandTotal

  return (
    <PaymentMethodPanel
      icon={<Banknote size={24} />}
      title="Cash"
      description="Enter the cash amount received from the customer."
    >
      <div className="space-y-4">
        {/* Cash received input */}
        <div>
          <Label htmlFor="cash-received" className="text-sm mb-1.5 block">
            Cash Received (฿)
          </Label>
          <Input
            id="cash-received"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={cashReceived === 0 ? '' : cashReceived}
            onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
            className="text-base"
          />
        </div>

        {/* Change due row */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Change due</span>
          <span className={isUnderpayment ? 'text-destructive font-medium' : ''}>
            ฿{changedue.toLocaleString()}
          </span>
        </div>
      </div>
    </PaymentMethodPanel>
  )
}
