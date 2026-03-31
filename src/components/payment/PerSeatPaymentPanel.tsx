'use client'

import { useMemo, useState } from 'react'
import {
  Banknote,
  ChevronLeft,
  Coins,
  CreditCard,
  Crown,
  HandPlatter,
  QrCode,
  ScissorsLineDashed,
  TicketPercent,
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
import { CashPanel } from '@/components/payment/CashPanel'
import { CardPanel } from '@/components/payment/CardPanel'
import { useBillStore } from '@/stores/bill.store'
import type { CrmMember } from '@/components/payment/CrmLookupDialog'
import type { OrderLineItem } from '@/stores/order.store'
import type { ItemBillEntry } from '@/stores/bill.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'

interface PerSeatPaymentPanelProps {
  tableId: string
  tableLabel: string
  splitAmounts: number[]
  billItems: OrderLineItem[]
  itemBills: ItemBillEntry[][] | undefined
  crmMember: CrmMember | null
  onCrmChange: () => void
  onAllPaid: () => void
}

// ---------------------------------------------------------------------------
// PerSeatPaymentPanel — item-split (แยกบิล) layout
// ---------------------------------------------------------------------------

export function PerSeatPaymentPanel({
  tableId,
  tableLabel,
  splitAmounts,
  billItems,
  itemBills,
  crmMember,
  onCrmChange,
  onAllPaid,
}: PerSeatPaymentPanelProps) {
  const router = useRouter()
  const { setCrmMember, recordPayment } = useBillStore()
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)

  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [paidIndexes, setPaidIndexes] = useState<Set<number>>(new Set())
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod | null>(null)
  const [cashReceived, setCashReceived] = useState(0)
  const [qrSheetOpen, setQrSheetOpen] = useState(false)

  const selectedBillSubtotal = splitAmounts[selectedTabIndex] ?? 0
  const selectedAmount = selectedBillSubtotal + Math.round(selectedBillSubtotal * 0.07)
  const isCurrentPaid = paidIndexes.has(selectedTabIndex)
  const cashUnderTotal = checkoutMethod === 'Cash' && cashReceived > 0 && cashReceived < selectedAmount

  const selectedBillItems = useMemo(() => {
    if (!itemBills) return []
    const entries = itemBills[selectedTabIndex] ?? []
    return entries.flatMap(({ lineId, qty }) => {
      const item = billItems.find((o) => o.lineId === lineId)
      return item ? [{ item, qty }] : []
    })
  }, [itemBills, selectedTabIndex, billItems])

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
    setCashReceived(0)

    const allDone = newPaid.size >= splitAmounts.length
    if (allDone) {
      onAllPaid()
    }
  }

  // ---- Cash / Card checkout sub-view ----
  if (checkoutMethod === 'Cash' || checkoutMethod === 'Card') {
    return (
      <div className="flex flex-col h-full">
        <header className="h-[52px] border-b flex items-center gap-2 px-6 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => { setCheckoutMethod(null); setCashReceived(0) }}
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none">
            บิล #{selectedTabIndex + 1} — {checkoutMethod === 'Cash' ? 'เงินสด' : 'บัตรเครดิต'}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
            {checkoutMethod === 'Cash' && (
              <CashPanel grandTotal={selectedAmount} cashReceived={cashReceived} setCashReceived={setCashReceived} />
            )}
            {checkoutMethod === 'Card' && <CardPanel grandTotal={selectedAmount} />}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="max-w-2xl mx-auto space-y-2">
            <Button
              size="cta"
              className="w-full text-base"
              disabled={cashUnderTotal}
              onClick={() => handleConfirmPayment(checkoutMethod)}
            >
              ยืนยันการชำระเงิน — ฿{selectedAmount.toLocaleString()}
            </Button>
            {cashUnderTotal && (
              <p className="text-xs text-center text-muted-foreground">จำนวนเงินที่รับไม่ครบ</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b flex items-center justify-between px-6 py-2 shrink-0">
        <Button variant="ghost" size="icon" className="size-9" onClick={() => router.back()} aria-label="Back">
          <ChevronLeft size={16} />
        </Button>
        <span className="font-medium text-base leading-none">สรุปรายการชำระ</span>
        <div className="size-9 pointer-events-none" />
      </header>

      {/* Bill tabs */}
      <div className="border-b flex items-center gap-4 px-6 py-4 shrink-0 overflow-x-auto">
        {splitAmounts.map((billSubtotal, index) => {
          const isActive = index === selectedTabIndex
          const isPaid = paidIndexes.has(index)
          const billTotal = billSubtotal + Math.round(billSubtotal * 0.07)
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
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm text-foreground leading-none">
                  บิล #{index + 1}
                </span>
                {isPaid && (
                  <span className="text-[10px] font-semibold text-status-success bg-status-success/10 rounded px-1.5 py-0.5 leading-none">
                    ชำระแล้ว
                  </span>
                )}
              </div>
              <span className={`text-sm leading-5 ${isPaid ? 'text-status-success font-medium' : 'text-muted-foreground'}`}>
                ฿{billTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </button>
          )
        })}
      </div>

      {/* Two-column content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: selected bill totals + items */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-base text-muted-foreground leading-6">ราคารวม</p>
                <p className="font-semibold text-base text-foreground leading-6">
                  ฿{selectedBillSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-base text-muted-foreground leading-6">VAT</p>
                <p className="font-semibold text-base text-foreground leading-6">
                  ฿{Math.round(selectedBillSubtotal * 0.07).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="py-2"><Separator /></div>

            <div className="flex items-center gap-[10px] py-2">
              <Button variant="secondary" size="icon" className="size-8 rounded-md shrink-0 pointer-events-none" aria-label="Table">
                <HandPlatter size={16} />
              </Button>
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <p className="font-semibold text-lg leading-7 shrink-0">{tableLabel}</p>
                <p className="text-sm text-muted-foreground leading-5 shrink-0">
                  บิล #{selectedTabIndex + 1}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {selectedBillItems.map(({ item, qty }) => (
                <BillLineItem key={item.lineId} item={item} qty={qty} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: grand total + actions */}
        <div className="border-l border-border flex flex-col gap-6 h-full px-4 py-6 shrink-0 w-[282px] overflow-y-auto">
          <div className="flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-4 items-center justify-center h-32 leading-none p-4 whitespace-nowrap">
              <p className="font-medium text-xl text-muted-foreground">บิล #{selectedTabIndex + 1}</p>
              <p className={`font-semibold text-3xl ${isCurrentPaid ? 'text-status-success' : 'text-destructive'}`}>
                ฿{selectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              {isCurrentPaid && (
                <span className="text-sm font-semibold text-status-success">ชำระแล้ว</span>
              )}
            </div>

            <div className="bg-background border border-border rounded-[14px] overflow-hidden">
              {crmMember ? (
                <CrmMemberCard member={crmMember} onChangeMember={onCrmChange} />
              ) : (
                <button
                  className="flex items-center justify-center gap-2 h-10 w-full px-8"
                  onClick={onCrmChange}
                >
                  <Crown size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-sm text-primary leading-5">เพิ่มเบอร์สมาชิกลูกค้า</span>
                </button>
              )}
            </div>

            <Button variant="outline" className="w-full h-10 gap-2" onClick={() => toast('Coupon scan coming soon')}>
              <TicketPercent size={16} />
              ใช้คูปองส่วนลด
            </Button>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="font-medium text-base text-muted-foreground leading-6">จัดการบิล</p>
              <button className="flex items-center gap-2" onClick={() => router.back()}>
                <ScissorsLineDashed size={16} className="text-foreground" />
                <span className="font-medium text-sm text-foreground leading-5">แยกบิล</span>
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
      </div>

      {/* Payment method dialog */}
      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">วิธีการชำระเงิน</DialogTitle>
            <DialogDescription>
              บิล #{selectedTabIndex + 1} — ฿{selectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  if (method === 'QR PromptPay') {
                    setQrSheetOpen(true)
                  } else {
                    setCashReceived(0)
                    setCheckoutMethod(method)
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
        onClose={() => setQrSheetOpen(false)}
        grandTotal={selectedAmount}
        onConfirm={() => {
          setQrSheetOpen(false)
          handleConfirmPayment('QR PromptPay')
        }}
      />
    </div>
  )
}
