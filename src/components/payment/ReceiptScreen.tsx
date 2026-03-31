'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Printer, Coins, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { CrmMember } from '@/components/payment/CrmLookupDialog'

const IMG_CHECKMARK = 'https://www.figma.com/api/mcp/asset/f9fa5459-bab2-4284-b6f8-71a6e33e04e0'

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
  ctaLabel?: string
  crmMember?: CrmMember | null
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
  ctaLabel = 'เสร็จสิ้น',
  crmMember,
}: ReceiptScreenProps) {
  const [tip, setTip] = useState('')
  const [fullTaxInvoice, setFullTaxInvoice] = useState(false)

  // Simple mock receipt number
  const receiptNo = 'P6X' + Math.abs(paidAt.getTime() % 1000).toString().padStart(3, '0')

  const formattedDate = paidAt.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Mock earned points: 1 pt per ฿50 spent
  const earnedPoints = Math.floor(grandTotal / 50)

  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted overflow-y-auto py-12 px-4">
      <div className="flex flex-col gap-6 items-center w-full">

        {/* Header */}
        <div className="flex flex-col gap-3 items-center">
          <Image src={IMG_CHECKMARK} alt="Payment complete" width={48} height={48} className="size-12 block" />
          <p className="font-semibold text-2xl text-foreground leading-none">ใบเสร็จชำระเงิน</p>
        </div>

        <div className="flex flex-col gap-4 items-start w-full max-w-sm">

          {/* Receipt details card */}
          <div className="bg-background border border-border rounded-[14px] flex flex-col gap-5 items-start p-6 w-full">

            {/* Row: โต๊ะ */}
            <div className="flex items-center justify-between w-full h-5 text-base leading-6">
              <p className="font-medium text-muted-foreground">โต๊ะ</p>
              <p className="font-semibold text-foreground">{tableId}</p>
            </div>

            {/* Row: Receipt No */}
            <div className="flex items-center justify-between w-full h-5 text-base leading-6">
              <p className="font-medium text-muted-foreground">Receipt No</p>
              <p className="font-semibold text-foreground">{receiptNo}</p>
            </div>

            {/* Row: ช่องทางการชำระ */}
            <div className="flex items-center justify-between w-full h-5 text-base leading-6">
              <p className="font-medium text-muted-foreground">ช่องทางการชำระ</p>
              <p className="font-semibold text-foreground">{paymentMethod}</p>
            </div>

            {/* Row: ยอดชำระ */}
            <div className="flex items-center justify-between w-full h-5 text-base leading-6">
              <p className="font-medium text-muted-foreground">ยอดชำระ</p>
              <p className="font-semibold text-foreground">฿{grandTotal.toLocaleString()}</p>
            </div>

            {/* Row: เวลา */}
            <div className="flex items-center justify-between w-full h-5 text-base leading-6">
              <p className="font-medium text-muted-foreground">เวลา</p>
              <p className="font-semibold text-foreground">{formattedDate}</p>
            </div>

            {/* Row: ทิป */}
            <div className="flex items-center justify-between w-full gap-4">
              <p className="font-medium text-muted-foreground text-base leading-6 shrink-0">ทิป</p>
              <Input
                className="text-right h-9"
                placeholder="฿0.00"
                inputMode="decimal"
                value={tip}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^\d*\.?\d{0,2}$/.test(val)) setTip(val)
                }}
              />
            </div>

            {/* Auto-print note */}
            <div className="flex items-center justify-center gap-2 w-full">
              <Printer size={16} className="text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground leading-none">ใบเสร็จจะพิมพ์อัตโนมัติ</p>
            </div>

            <div className="py-2 w-full"><Separator /></div>

            {/* Full tax invoice checkbox */}
            <button
              className="flex items-start gap-2 cursor-pointer"
              onClick={() => setFullTaxInvoice((v) => !v)}
            >
              <div
                className={`size-4 rounded-[4px] border border-input shrink-0 flex items-center justify-center mt-px transition-colors ${
                  fullTaxInvoice ? 'bg-primary border-primary' : 'bg-background'
                }`}
              >
                {fullTaxInvoice && (
                  <svg viewBox="0 0 12 12" className="size-3 text-primary-foreground" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p className="font-medium text-sm text-foreground leading-none">ต้องการใบกำกับภาษีเต็มรูปแบบ</p>
            </button>
          </div>

          {/* CRM member card — only shown when a member was applied */}
          {crmMember && (
            <div className="bg-background border border-border rounded-[14px] p-4 flex flex-col gap-2 w-full">
              {/* Member info row */}
              <div className="flex items-center gap-2 py-2">
                <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User size={16} className="text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="font-medium text-sm leading-5 text-foreground truncate">{crmMember.name}</p>
                  <span className="inline-flex items-center text-xs font-semibold text-primary-foreground bg-destructive px-2 py-0.5 rounded-md w-fit">
                    ระดับ: {crmMember.level}
                  </span>
                </div>
                <Search size={16} className="opacity-50 shrink-0" />
              </div>

              {/* Earned points row */}
              <div className="flex items-center justify-between bg-muted rounded-sm px-2 py-1">
                <div className="flex items-center gap-1">
                  <Coins size={16} className="text-accent-foreground shrink-0" />
                  <span className="font-medium text-base leading-6 text-accent-foreground">คะแนนสะสม</span>
                </div>
                <span className="font-semibold text-base leading-6 text-status-success">+{earnedPoints}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Button
            variant="outline"
            className="w-full h-14 text-base font-semibold"
            onClick={onReprint}
          >
            พิมพ์ใบเสร็จอีกครั้ง
          </Button>
          <Button
            className="w-full h-14 text-base font-semibold"
            onClick={onBackToFloor}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
