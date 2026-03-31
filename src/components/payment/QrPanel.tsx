'use client'

import Image from 'next/image'
import { QrCode } from 'lucide-react'
import { PaymentMethodPanel } from '@/components/payment/PaymentMethodPanel'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QrPanelProps {
  grandTotal: number
  discountApplied?: number
}

// ---------------------------------------------------------------------------
// QrPanel
// ---------------------------------------------------------------------------

export function QrPanel({ grandTotal, discountApplied }: QrPanelProps) {
  return (
    <PaymentMethodPanel
      icon={<QrCode size={24} />}
      title="QR PromptPay"
      description="Scan to pay with PromptPay"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Total amount */}
        <p className="font-bold text-xl">฿{grandTotal.toLocaleString()}</p>
        {discountApplied && discountApplied > 0 && (
          <p className="text-sm text-muted-foreground">
            (after ฿{discountApplied.toLocaleString()} discount)
          </p>
        )}

        {/* QR code image */}
        <div className="relative w-[200px] h-[200px]">
          <Image
            src="/images/payment/qr-code.png"
            alt="QR Code"
            width={200}
            height={200}
            className="size-full object-cover rounded-[6px]"
          />
          {/* Center logo overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="bg-[#1a3763] size-[28px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <Image
                src="/images/payment/qr-center-logo.svg"
                alt=""
                width={46}
                height={34}
                className="relative object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </PaymentMethodPanel>
  )
}
