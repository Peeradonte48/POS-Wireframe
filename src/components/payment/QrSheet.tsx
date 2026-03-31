'use client'

import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

// ---------------------------------------------------------------------------
// Figma design assets — PromptPay QR card
// ---------------------------------------------------------------------------

const THAI_QR_CROSS   = 'https://www.figma.com/api/mcp/asset/79c8acdc-f5cf-4b9b-8940-8b4e3d160b82'  // medical cross left-side of header
const THAI_QR_TEXT_1  = 'https://www.figma.com/api/mcp/asset/6ea39039-02fd-4ed8-bb80-e826a9f4179e'  // "THAI QR" line
const THAI_QR_TEXT_2  = 'https://www.figma.com/api/mcp/asset/2586dc52-178d-4d83-a54b-6d274f5fd16e'  // "PAYMENT" line
const PROMPTPAY_LOGO  = 'https://www.figma.com/api/mcp/asset/97477087-a081-4be6-81a5-052821f29d17'  // PromptPay logo
const QR_CODE_IMG     = 'https://www.figma.com/api/mcp/asset/9c98c584-7b10-49b1-ad2b-bd4e4d7e7b80'  // QR code

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

          {/* Card */}
          <div className="bg-white border border-border rounded-md overflow-hidden w-full max-w-[350px]">

            {/* Dark navy THAI QR PAYMENT header */}
            <div className="bg-[var(--color-thai-qr-header)] h-[71px] flex items-center justify-center px-[10px]">
              <div className="flex items-center gap-3">
                {/* Medical cross / logo mark */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src={THAI_QR_CROSS}
                  style={{ width: 49, height: 36 }}
                  className="object-contain shrink-0"
                />
                {/* "THAI QR" + "PAYMENT" text stacked */}
                <div className="flex flex-col justify-center gap-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="THAI QR"
                    src={THAI_QR_TEXT_1}
                    style={{ width: 73, height: 11 }}
                    className="object-contain"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="PAYMENT"
                    src={THAI_QR_TEXT_2}
                    style={{ width: 73, height: 14 }}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* PromptPay logo */}
            <div className="flex justify-center pt-2 pb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="PromptPay"
                src={PROMPTPAY_LOGO}
                style={{ width: 96, height: 32 }}
                className="object-contain"
              />
            </div>

            {/* QR code image */}
            <div className="flex justify-center px-4 pb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QR Code"
                src={QR_CODE_IMG}
                style={{ width: 221, height: 221 }}
                className="object-cover rounded-[6px]"
              />
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
