'use client'

import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null
  onChange: (method: PaymentMethod) => void
}

// ---------------------------------------------------------------------------
// PaymentMethodSelector
// ---------------------------------------------------------------------------

export function PaymentMethodSelector({ selected, onChange }: PaymentMethodSelectorProps) {
  const methods: PaymentMethod[] = ['Cash', 'QR PromptPay', 'Card']

  return (
    <div className="grid grid-cols-3 gap-2">
      {methods.map((method) => (
        <Button
          key={method}
          variant={selected === method ? 'default' : 'outline'}
          className="w-full"
          onClick={() => onChange(method)}
        >
          {method}
        </Button>
      ))}
    </div>
  )
}
