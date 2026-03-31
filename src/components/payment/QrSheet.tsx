'use client'

import Image from 'next/image'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QrSheetProps {
  open: boolean
  onClose: () => void
  grandTotal: number
  onConfirm: () => void
}

// ---------------------------------------------------------------------------
// QrSheet
// ---------------------------------------------------------------------------

export function QrSheet({ open, onClose, grandTotal, onConfirm }: QrSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className="h-auto flex flex-col gap-4 items-center px-6 py-6 overflow-y-auto"
        showCloseButton
      >
        {/* Header row */}
        <div className="flex gap-[10px] items-start w-full">
          <Button variant="secondary" size="icon" className="shrink-0" aria-label="QR PromptPay">
            <QrCode size={16} />
          </Button>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="font-semibold text-lg leading-7">QR PromptPay</p>
            <p className="text-sm text-muted-foreground leading-5">แสดง QR Code ให้ลูกค้าเพื่อชำระเงิน</p>
          </div>
        </div>

        {/* QR card + payment info */}
        <div className="flex flex-col gap-4 items-center w-full">

          {/* Thai QR Payment card — matches Figma node 2539:30730 */}
          <div className="bg-white border border-border rounded-md overflow-hidden w-full max-w-[347px] flex flex-col items-center gap-4">

            {/* Dark navy header */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div className="bg-[#113e67] h-[71px] w-full flex items-center justify-center p-[10px]">
                <div className="flex items-center">
                  {/* Cross logo mark */}
                  <Image
                    src="/images/payment/thai-qr-cross.svg"
                    alt=""
                    width={49}
                    height={36}
                    className="object-contain shrink-0"
                  />
                  {/* "THAI QR" + "PAYMENT" stacked text */}
                  <div className="flex flex-col justify-center gap-0.5 ml-[3px]">
                    <Image
                      src="/images/payment/thai-qr-text-2.svg"
                      alt="THAI QR"
                      width={73}
                      height={14}
                      className="object-contain"
                    />
                    <Image
                      src="/images/payment/thai-qr-text-1.svg"
                      alt="PAYMENT"
                      width={73}
                      height={11}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* PromptPay logo */}
              <Image
                src="/images/payment/promptpay-logo.png"
                alt="PromptPay"
                width={96}
                height={32}
                className="object-contain"
              />
            </div>

            {/* QR code with center logo overlay */}
            <div className="relative w-[221px] h-[221px] rounded-[6px] overflow-hidden">
              <Image
                src="/images/payment/qr-code.png"
                alt="QR Code"
                width={221}
                height={221}
                className="size-full object-cover rounded-[6px]"
              />
              {/* Center logo overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="bg-[#1a3763] size-[32px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <Image
                    src="/images/payment/qr-center-logo.svg"
                    alt=""
                    width={53}
                    height={40}
                    className="relative object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Account info */}
            <div className="flex flex-col items-center gap-1 pb-4 text-base font-medium text-muted-foreground leading-6">
              <p>ชื่อบัญชี: เอราเมน</p>
              <p>เลขพร้อมเพย์: 0999991221</p>
            </div>
          </div>

          {/* Payment info */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-normal text-muted-foreground leading-7">ชำระภายใน: 14:56</p>
            <p className="text-5xl font-semibold text-destructive leading-[48px]">
              ฿{grandTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full">
          <Button size="cta" className="w-full h-14 text-base font-semibold" onClick={onConfirm}>
            ยืนยันการชำระเงิน
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
