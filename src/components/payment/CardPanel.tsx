'use client'

import { CreditCard } from 'lucide-react'
import { PaymentMethodPanel } from '@/components/payment/PaymentMethodPanel'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CardPanelProps {
  grandTotal: number
}

// ---------------------------------------------------------------------------
// CardPanel
// ---------------------------------------------------------------------------

export function CardPanel({ grandTotal }: CardPanelProps) {
  return (
    <PaymentMethodPanel
      icon={<CreditCard size={24} />}
      title="Card"
      description="Customer taps or swipes at card reader"
    >
      <p className="text-2xl font-bold text-center">฿{grandTotal.toLocaleString()}</p>
    </PaymentMethodPanel>
  )
}
