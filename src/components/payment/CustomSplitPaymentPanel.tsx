'use client'

import { useState } from 'react'
import {
  Banknote,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Coins,
  CreditCard,
  Crown,
  HandPlatter,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BillLineItem } from '@/components/payment/BillLineItem'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { QrSheet } from '@/components/payment/QrSheet'
import { CrmLookupDialog } from '@/components/payment/CrmLookupDialog'
import { CrmMemberCard } from '@/components/payment/CrmMemberCard'
import { CashDialog } from '@/components/payment/CashDialog'
import { CardPanel } from '@/components/payment/CardPanel'
import { useBillStore } from '@/stores/bill.store'
import type { CrmMember } from '@/components/payment/CrmLookupDialog'
import type { OrderLineItem } from '@/stores/order.store'
import type { PromotionDiscount } from '@/stores/bill.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'

interface CustomSplitPaymentPanelProps {
  tableId: string
  tableLabel: string
  splitAmounts: number[]
  billItems: OrderLineItem[]
  subtotal: number
  vatAmount: number
  promotions: PromotionDiscount[]
  discountTotal: number
  guestCount: number | null
  crmMember: CrmMember | null
  onCrmChange: () => void
  onAllPaid: () => void
  onBack: () => void
}

// ---------------------------------------------------------------------------
// CustomSplitPaymentPanel — value-split (แบ่งจ่าย) layout
// ---------------------------------------------------------------------------

export function CustomSplitPaymentPanel({
  tableId,
  tableLabel,
  splitAmounts,
  billItems,
  subtotal,
  vatAmount,
  promotions,
  discountTotal,
  guestCount,
  crmMember,
  onCrmChange,
  onAllPaid,
  onBack,
}: CustomSplitPaymentPanelProps) {
  const router = useRouter()
  const { setCrmMember, recordPayment } = useBillStore()
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)

  const persistedPayments = useBillStore((s) => s.splits[tableId]?.payments ?? {})
  const [paidIndexes, setPaidIndexes] = useState<Set<number>>(
    () => new Set(Object.keys(persistedPayments).map(Number))
  )
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(() => {
    const paid = new Set(Object.keys(persistedPayments).map(Number))
    const firstUnpaid = splitAmounts.findIndex((_, i) => !paid.has(i))
    return firstUnpaid === -1 ? 0 : firstUnpaid
  })
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod | null>(null)
  const [cashDialogOpen, setCashDialogOpen] = useState(false)
  const [qrSheetOpen, setQrSheetOpen] = useState(false)
  const [discountExpanded, setDiscountExpanded] = useState(discountTotal > 0)

  const selectedAmount = splitAmounts[selectedTabIndex] ?? 0
  const isCurrentPaid = paidIndexes.has(selectedTabIndex)

  const discountedSubtotal = subtotal - discountTotal
  const billTotal = billItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0)

  function handleConfirmPayment(method: PaymentMethod) {
    const newPaid = new Set(paidIndexes).add(selectedTabIndex)
    setPaidIndexes(newPaid)
    const timestamp = Date.now()
    recordPayment(tableId, selectedTabIndex, {
      method,
      paidAt: timestamp,
      amount: selectedAmount,
    })
    setCheckoutMethod(null)
    setQrSheetOpen(false)
    setCashDialogOpen(false)
    toast.success(`ชำระเงินแบ่งจ่าย #${selectedTabIndex + 1} สำเร็จ`)

    const allDone = newPaid.size >= splitAmounts.length
    if (allDone) {
      onAllPaid()
    } else {
      const nextUnpaid = splitAmounts.findIndex((_, i) => !newPaid.has(i))
      if (nextUnpaid !== -1) setSelectedTabIndex(nextUnpaid)
    }
  }

  // ---- Card checkout sub-view ----
  if (checkoutMethod === 'Card') {
    return (
      <div className="flex flex-col h-full">
        <header className="h-[52px] border-b flex items-center gap-2 px-6 shrink-0">
          <Button variant="outline" size="icon" className="size-9" onClick={() => { setCheckoutMethod(null); useBillStore.getState().clearPaymentSession(tableId) }} aria-label="Back">
            <ChevronLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none">
            แบ่งจ่าย #{selectedTabIndex + 1} — บัตรเครดิต
          </span>
        </header>
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
            <CardPanel grandTotal={selectedAmount} />
          </div>
        </div>
        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="max-w-2xl mx-auto">
            <Button size="cta" className="w-full text-base" onClick={() => { useBillStore.getState().clearPaymentSession(tableId); handleConfirmPayment('Card') }}>
              ยืนยันการชำระเงิน — ฿{selectedAmount.toLocaleString()}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b flex items-center gap-2 px-6 py-2 shrink-0">
        <Button variant="outline" size="icon" className="size-9" onClick={onBack} aria-label="Back">
          <ChevronLeft size={16} />
        </Button>
        <span className="font-medium text-base leading-none">สรุปรายการชำระ</span>
      </header>

      {/* Payer tabs */}
      <div className="border-b flex items-center gap-4 px-6 py-4 shrink-0 overflow-x-auto">
        {splitAmounts.map((amount, index) => {
          const isActive = index === selectedTabIndex
          const isPaid = paidIndexes.has(index)
          return (
            <button
              key={index}
              onClick={() => setSelectedTabIndex(index)}
              className={`flex flex-col gap-1.5 items-start p-3 rounded-lg border shrink-0 w-[176px] text-left transition-colors ${
                isPaid
                  ? 'border-border bg-muted opacity-60'
                  : isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background hover:border-primary/40'
              }`}
            >
              <span className={`font-medium text-sm leading-none ${isActive ? 'text-foreground' : 'text-foreground'}`}>
                แบ่งจ่าย #{index + 1}
              </span>
              <span className={`text-sm leading-5 ${isPaid ? 'text-status-success font-medium' : 'text-muted-foreground'}`}>
                ฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {isPaid && (
                <span className="text-xs font-semibold text-green-600 leading-none">ชำระแล้ว</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Two-column content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: bill summary + items */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-4">
            <div className="bg-muted border border-border rounded-md overflow-hidden px-4 py-4">
              <div className="flex flex-col gap-4 px-2 py-4">
                {/* Summary rows */}
                <div className="flex flex-col gap-4">
                  {/* ราคารวม */}
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-base text-muted-foreground leading-6">ราคารวม</p>
                    <p className="font-medium text-base text-foreground leading-6">
                      ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* ส่วนลดท้ายใบเสร็จ — expandable accordion */}
                  <div className="flex flex-col gap-2">
                    <button
                      className="flex items-center justify-between w-full"
                      onClick={() => setDiscountExpanded((v) => !v)}
                    >
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-base text-muted-foreground leading-6">ส่วนลดท้ายใบเสร็จ</p>
                        {discountExpanded ? (
                          <ChevronUp size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        )}
                      </div>
                      <p className={`font-medium text-base leading-6 ${discountTotal > 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {discountTotal > 0 ? `-฿${discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '฿0.00'}
                      </p>
                    </button>
                    {discountExpanded && promotions.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {promotions.map((d) => (
                          <div key={d.couponCode} className="flex items-center justify-between">
                            <p className="text-sm text-destructive leading-5">{d.couponCode}</p>
                            <p className="text-sm text-destructive leading-5">
                              -฿{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ก่อนรวม VAT */}
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-base text-muted-foreground leading-6">ก่อนรวม VAT</p>
                    <p className="font-medium text-base text-foreground leading-6">
                      ฿{discountedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* VAT */}
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-base text-muted-foreground leading-6">VAT</p>
                    <p className="font-medium text-base text-foreground leading-6">
                      ฿{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Table header */}
                <div className="flex items-center gap-[10px] py-2">
                  <Button variant="secondary" size="icon" className="size-8 shrink-0" aria-label="Table">
                    <HandPlatter size={16} />
                  </Button>
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <p className="font-semibold text-lg leading-7 shrink-0">{tableLabel}</p>
                    <p className="text-sm text-muted-foreground leading-5 shrink-0">
                      ลูกค้า {guestCount ?? '-'} คน
                    </p>
                  </div>
                  <p className="font-semibold text-lg leading-7 text-right shrink-0">
                    ฿{billTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Bill items */}
                <div className="flex flex-col gap-4">
                  {billItems.map((item) => (
                    <BillLineItem key={item.lineId} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: summary panel */}
        <div className="flex flex-col gap-6 h-full px-2 py-4 shrink-0 w-[250px] overflow-y-auto">
          <div className="flex flex-col gap-4 items-center justify-center h-32 leading-none p-4 whitespace-nowrap">
            <p className="font-medium text-xl text-muted-foreground">แบ่งจ่าย #{selectedTabIndex + 1}</p>
            <p className={`font-semibold text-3xl ${isCurrentPaid ? 'text-status-success' : 'text-destructive'}`}>
              ฿{selectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {isCurrentPaid && (
              <span className="text-sm font-semibold text-green-600">ชำระแล้ว</span>
            )}
          </div>

          <div className="bg-background border border-border rounded-[14px] overflow-hidden p-4">
            {crmMember ? (
              <CrmMemberCard member={crmMember} onChangeMember={onCrmChange} />
            ) : (
              <button
                className="flex items-center justify-center gap-2 h-10 w-full"
                onClick={onCrmChange}
              >
                <Crown size={16} className="text-primary shrink-0" />
                <span className="font-medium text-sm text-primary leading-5">เพิ่มเบอร์สมาชิกลูกค้า</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="font-medium text-base text-muted-foreground leading-6">จัดการบิล</p>
            <button className="flex items-center gap-2" onClick={() => router.back()}>
              <Coins size={16} className="text-foreground" />
              <span className="font-medium text-sm text-foreground leading-5">แบ่งจ่าย</span>
            </button>
          </div>

          <div className="flex-1" />

          <Button
            className="w-full h-14 text-base font-semibold"
            disabled={isCurrentPaid}
            onClick={() => setPaymentMethodDialogOpen(true)}
          >
            {isCurrentPaid ? 'ชำระแล้ว' : 'ดำเนินการชำระเงิน'}
          </Button>
        </div>
      </div>

      {/* Payment method dialog */}
      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">วิธีการชำระเงิน</DialogTitle>
            <DialogDescription>
              แบ่งจ่าย #{selectedTabIndex + 1} — ฿{selectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {([
              { method: 'Cash' as PaymentMethod, label: 'เงินสด', icon: Banknote },
              { method: 'QR PromptPay' as PaymentMethod, label: 'QR Code Promptpay', icon: QrCode },
              { method: 'Card' as PaymentMethod, label: 'Credit Card', icon: CreditCard },
            ] as { method: PaymentMethod; label: string; icon: React.ElementType }[]).map(({ method, label, icon: Icon }) => (
              <Button
                key={method}
                variant="outline"
                className="h-14 w-full gap-2 text-sm font-medium"
                onClick={() => {
                  setPaymentMethodDialogOpen(false)
                  const base = {
                    tableId,
                    context: 'per-seat' as const,
                    seatIndex: selectedTabIndex,
                    startedAt: Date.now(),
                  }
                  if (method === 'Cash') {
                    setCashDialogOpen(true)
                    useBillStore.getState().setPaymentSession(tableId, {
                      ...base,
                      method: 'Cash',
                      activeSheet: 'cash',
                      cashAmount: 0,
                    })
                  } else if (method === 'QR PromptPay') {
                    setQrSheetOpen(true)
                    useBillStore.getState().setPaymentSession(tableId, {
                      ...base,
                      method: 'QR PromptPay',
                      activeSheet: 'qr',
                    })
                  } else {
                    setCheckoutMethod(method)
                    useBillStore.getState().setPaymentSession(tableId, {
                      ...base,
                      method: 'Card',
                      activeSheet: 'card',
                    })
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <CrmLookupDialog
        open={crmDialogOpen}
        onClose={() => setCrmDialogOpen(false)}
        onMemberFound={(member) => {
          setCrmMember(tableId, member)
          setCrmDialogOpen(false)
        }}
      />

      <QrSheet
        open={qrSheetOpen}
        onClose={() => {
          setQrSheetOpen(false)
          useBillStore.getState().clearPaymentSession(tableId)
        }}
        grandTotal={selectedAmount}
        onConfirm={() => {
          setQrSheetOpen(false)
          useBillStore.getState().clearPaymentSession(tableId)
          handleConfirmPayment('QR PromptPay')
        }}
      />

      <CashDialog
        open={cashDialogOpen}
        onClose={() => {
          setCashDialogOpen(false)
          useBillStore.getState().clearPaymentSession(tableId)
        }}
        grandTotal={selectedAmount}
        onConfirm={() => {
          setCashDialogOpen(false)
          useBillStore.getState().clearPaymentSession(tableId)
          handleConfirmPayment('Cash')
        }}
      />
    </div>
  )
}
