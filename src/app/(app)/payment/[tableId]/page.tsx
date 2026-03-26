'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronUp, Crown, TicketPercent, Coins, ScissorsLineDashed, Link, HandPlatter, Banknote, QrCode, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BillLineItem } from '@/components/payment/BillLineItem'
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CashDialog } from '@/components/payment/CashDialog'
import { QrPanel } from '@/components/payment/QrPanel'
import { QrSheet } from '@/components/payment/QrSheet'
import { CardPanel } from '@/components/payment/CardPanel'
import { ReceiptScreen } from '@/components/payment/ReceiptScreen'
import { SplitSheet } from '@/components/payment/SplitSheet'
import { ValueSplitSheet } from '@/components/payment/ValueSplitSheet'
import { ItemSplitSheet } from '@/components/payment/ItemSplitSheet'
import { MergeSheet } from '@/components/table-map/MergeSheet'
import { useBillStore } from '@/stores/bill.store'
import { useQueueStore } from '@/stores/queue.store'
import { useKdsStore } from '@/stores/kds.store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethod = 'Cash' | 'QR PromptPay' | 'Card'
type ViewState = 'checkBill' | 'checkout' | 'receipt'

// ---------------------------------------------------------------------------
// PaymentPage
// ---------------------------------------------------------------------------

export default function PaymentPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  // ---- Takeaway detection ----
  const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])
  const queueOrder = isTakeaway ? useQueueStore.getState().orders[tableId] : undefined

  // ---- Stores ----
  const order = useOrderStore((s) => s.getOrder(tableId))
  const role = useSessionStore((s) => s.role)!

  // ---- View state machine ----
  const [viewState, setViewState] = useState<ViewState>('checkBill')

  // ---- Payment state ----
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponAmount, setCouponAmount] = useState<number>(0)
  const [couponApplied, setCouponApplied] = useState(false)
  // ---- Cash dialog ----
  const [cashDialogOpen, setCashDialogOpen] = useState(false)

  // ---- Payment method dialog ----
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)

  // ---- QR sheet ----
  const [qrSheetOpen, setQrSheetOpen] = useState(false)

  // ---- Split sheet ----
  const [splitSheetOpen, setSplitSheetOpen] = useState(false)

  // ---- Value split confirm dialog + sheet ----
  const [splitConfirmDialogOpen, setSplitConfirmDialogOpen] = useState(false)
  const [valueSplitSheetOpen, setValueSplitSheetOpen] = useState(false)

  // ---- Item split sheet ----
  const [itemSplitSheetOpen, setItemSplitSheetOpen] = useState(false)

  // ---- Accordion: which table groups are collapsed (empty = all expanded) ----
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  function toggleGroup(tid: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(tid)) next.delete(tid)
      else next.add(tid)
      return next
    })
  }

  useEffect(() => {
    if (isTakeaway) return
    const existingSplit = useBillStore.getState().getSplit(tableId)
    if (existingSplit && !useBillStore.getState().getMergedSecondaries(tableId).length) {
      setSplitSheetOpen(true)
    }
  }, [tableId, isTakeaway])

  // ---- Merge state ----
  const merges = useBillStore((s) => s.merges)
  const mergedSecondaryIds = useMemo(
    () => Object.entries(merges).filter(([, primary]) => primary === tableId).map(([tid]) => tid),
    [merges, tableId],
  )
  const isMerged = mergedSecondaryIds.length > 0
  const { dissolveAll } = useBillStore()
  const tables = useTableStore((s) => s.tables)
  const [mergeSheetOpen, setMergeSheetOpen] = useState(false)

  // ---- Receipt data ----
  const [receiptData, setReceiptData] = useState<{
    grandTotal: number
    paymentMethod: PaymentMethod
    paidAt: Date
  } | null>(null)

  // ---- Bill assembly ----
  const billItems = useMemo(() => {
    const primaryItems = order
      ? order.rounds.flatMap((r) => r.items).filter((item) => item.status !== 'voided')
      : []
    if (!isMerged) return primaryItems
    const secondaryItems = mergedSecondaryIds.flatMap((tid) => {
      const secOrder = useOrderStore.getState().getOrder(tid)
      if (!secOrder) return []
      return secOrder.rounds.flatMap((r) => r.items).filter((item) => item.status !== 'voided')
    })
    return [...primaryItems, ...secondaryItems]
  }, [order, isMerged, mergedSecondaryIds])
  const itemSplitDisabled = isMerged || billItems.length <= 1

  // tableOrders for grouped display
  const tableOrders = useMemo(() => {
    if (isMerged) {
      return [tableId, ...mergedSecondaryIds].map((tid) => ({
        tableId: tid,
        label: tables[tid]?.label ?? tid,
        guestCount: tables[tid]?.guestCount ?? null,
        items: (tid === tableId
          ? (order?.rounds.flatMap((r) => r.items) ?? [])
          : (useOrderStore.getState().getOrder(tid)?.rounds.flatMap((r) => r.items) ?? [])
        ).filter((item) => item.status !== 'voided'),
      }))
    }
    return [{
      tableId,
      label: tables[tableId]?.label ?? tableId,
      guestCount: tables[tableId]?.guestCount ?? null,
      items: billItems,
    }]
  }, [isMerged, mergedSecondaryIds, tableId, tables, order, billItems])

  const subtotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
    [billItems],
  )

  const discountAmount = couponApplied ? couponAmount : 0
  const discountedSubtotal = subtotal - discountAmount
  const vatAmount = Math.round(discountedSubtotal * 0.07)
  const grandTotal = discountedSubtotal + vatAmount

  // ---- Confirm payment ----
  function handleConfirmPayment() {
    if (!paymentMethod) return

    if (isTakeaway) {
      useQueueStore.getState().advanceStatus(tableId)
      useKdsStore.getState().addTicket(tableId, tableId, 'takeaway')
      toast.success('Payment confirmed')
      router.push('/table-map')
      return
    }

    const { markCleaning, updateTable } = useTableStore.getState()
    markCleaning(tableId)
    mergedSecondaryIds.forEach((id) => markCleaning(id))
    dissolveAll(tableId)
    updateTable(tableId, { orderStage: 'Billed' })
    updateTable(tableId, {
      paidAmount: grandTotal,
      paymentMethod: paymentMethod,
      discountApplied: discountAmount,
    })
    toast.success('Payment confirmed')
    setReceiptData({ grandTotal, paymentMethod, paidAt: new Date() })
    setViewState('receipt')
  }

  function handleReprint() {
    toast('Receipt sent to printer')
  }

  const confirmDisabled =
    (!isTakeaway && !canDoAction(role, 'confirm-payment')) ||
    paymentMethod === null ||
    paymentMethod === 'Cash'

  const confirmHint = (!isTakeaway && !canDoAction(role, 'confirm-payment'))
    ? `Role "${role}" cannot confirm payment — switch to Cashier or Manager`
    : paymentMethod === null
      ? 'Select a payment method above to continue'
      : null

  // ---- Empty order guard ----
  if (!order || billItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No order data found.</p>
        <Button onClick={() => router.push('/table-map')}>Back to Floor Plan</Button>
      </div>
    )
  }

  // ---- Receipt view ----
  if (viewState === 'receipt' && receiptData) {
    return (
      <ReceiptScreen
        tableId={tableId}
        grandTotal={receiptData.grandTotal}
        paymentMethod={receiptData.paymentMethod}
        paidAt={receiptData.paidAt}
        onReprint={handleReprint}
        onBackToFloor={() => router.push('/table-map')}
      />
    )
  }

  // ---- Checkout view ----
  if (viewState === 'checkout') {
    return (
      <>
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="h-[52px] border-b flex items-center gap-2 px-6 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => setViewState('checkBill')}
              aria-label="Back to bill summary"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="font-medium text-base leading-none">
              {isTakeaway ? `${tableId} · ${queueOrder?.customerName ?? ''}` : 'ชำระเงิน'}
            </span>
          </header>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
              <PaymentMethodSelector
                selected={paymentMethod}
                onChange={(m) => {
                  setPaymentMethod(m)
                  if (m === 'Cash') setCashDialogOpen(true)
                }}
              />
              {paymentMethod === 'QR PromptPay' && (
                <QrPanel grandTotal={grandTotal} discountApplied={discountAmount} />
              )}
              {paymentMethod === 'Card' && <CardPanel grandTotal={grandTotal} />}
            </div>
          </div>

          {/* Sticky bottom */}
          <div className="sticky bottom-0 bg-background border-t p-4">
            <div className="max-w-2xl mx-auto space-y-2">
              <Button
                size="cta"
                className="w-full text-base"
                disabled={confirmDisabled}
                onClick={handleConfirmPayment}
              >
                Confirm Payment — ฿{grandTotal.toLocaleString()}
              </Button>
              {confirmHint && (
                <p className="text-xs text-center text-muted-foreground">{confirmHint}</p>
              )}
            </div>
          </div>
        </div>

        {!isTakeaway && (
          <SplitSheet
            open={splitSheetOpen}
            onClose={() => setSplitSheetOpen(false)}
            tableId={tableId}
            grandTotal={grandTotal}
            billItems={billItems}
            onAllPaid={() => {
              useTableStore.getState().updateTable(tableId, { orderStage: 'Billed' })
              mergedSecondaryIds.forEach((id) => useTableStore.getState().markCleaning(id))
              dissolveAll(tableId)
              setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date() })
              setViewState('receipt')
            }}
          />
        )}

      </>
    )
  }

  // ---- Check Bill view (default) ----
  return (
    <>
      <div className="flex flex-col h-full">
        {/* Sub-header */}
        <header className="border-b flex items-center gap-2 px-6 py-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => router.push('/table-map')}
            aria-label="Back to floor plan"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none">สรุปรายการชำระ</span>
        </header>

        {/* Two-column content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panel – scrollable order items */}
          <div className="flex-1 min-w-0 bg-muted overflow-y-auto px-2 py-4">
            <div className="flex flex-col gap-4 px-2">
              {/* Summary totals */}
              <div className="flex flex-col gap-4">
                {/* ราคารวม */}
                <div className="flex items-center justify-between">
                  <p className="font-medium text-base text-muted-foreground leading-6">ราคารวม</p>
                  <div className="w-20 flex justify-end">
                    <p className="font-medium text-base text-foreground leading-6">
                      ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* ส่วนลดท้ายใบเสร็จ */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-base text-muted-foreground leading-6">ส่วนลดท้ายใบเสร็จ</p>
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </div>
                  <div className="w-20 flex justify-end">
                    <p className="font-medium text-base text-foreground leading-6">
                      ฿{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* VAT */}
                <div className="flex items-start justify-between">
                  <p className="font-medium text-base text-muted-foreground leading-6">VAT</p>
                  <div className="w-20 flex justify-end">
                    <p className="font-medium text-base text-foreground leading-6">
                      ฿{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="py-2">
                <Separator />
              </div>

              {/* Table groups with line items */}
              <div className="flex flex-col gap-4">
                {tableOrders.map((group) => {
                  const groupSubtotal = group.items.reduce(
                    (sum, item) => sum + item.basePrice * item.quantity,
                    0,
                  )
                  const isOpen = !collapsedGroups.has(group.tableId)
                  return (
                    <div key={group.tableId} className="flex flex-col gap-4">
                      {/* Table header row */}
                      <div
                        className={`flex items-center gap-[10px] py-2 ${isMerged ? 'cursor-pointer' : ''}`}
                        onClick={isMerged ? () => toggleGroup(group.tableId) : undefined}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 rounded-md shrink-0 pointer-events-none"
                          aria-label="Table"
                        >
                          <HandPlatter size={16} />
                        </Button>
                        <div className="flex flex-1 items-center gap-2 min-w-0">
                          <p className="font-semibold text-lg leading-7 shrink-0">{group.label}</p>
                          {group.guestCount !== null && (
                            <p className="text-sm text-muted-foreground leading-5 shrink-0">
                              ลูกค้า {group.guestCount} คน
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="font-semibold text-lg leading-7 text-right">
                            ฿{groupSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          {isMerged && (
                            isOpen
                              ? <ChevronUp size={16} className="text-muted-foreground" />
                              : <ChevronDown size={16} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Line items — height collapses while content slides up into header */}
                      <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={`flex flex-col gap-4 transition-[transform,opacity] duration-300 ease-in-out ${
                              isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                            }`}
                          >
                            {group.items.map((item) => (
                              <BillLineItem key={item.lineId} item={item} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right panel – totals & actions */}
          <div className="bg-muted flex flex-col h-full px-2 py-4 shrink-0 w-[282px]">
            <div className="bg-background border border-border rounded-2xl p-3 overflow-hidden flex flex-col gap-6 flex-1">
              {/* Grand total display */}
              <div className="flex flex-col gap-4 items-center justify-center h-32 leading-none p-4 whitespace-nowrap">
                <p className="font-medium text-xl text-muted-foreground">รวมสุทธิ</p>
                <p className="font-semibold text-3xl text-destructive">
                  ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Add member button */}
              <button
                className="border border-border rounded-[14px] flex items-center justify-center gap-2 min-h-[104px] p-4 w-full cursor-pointer hover:bg-accent transition-colors"
                onClick={() => toast('Member lookup coming soon')}
              >
                <Crown size={16} className="text-primary shrink-0" />
                <span className="font-medium text-sm text-primary leading-5">เพิ่มเบอร์สมาชิกลูกค้า</span>
              </button>

              {/* Coupon button */}
              {!isTakeaway && (
                <Button
                  variant="outline"
                  className="w-full h-10 gap-2"
                  onClick={() => toast('Coupon scan coming soon')}
                >
                  <TicketPercent size={16} />
                  ใช้คูปองส่วนลด
                </Button>
              )}

              {/* Bill management */}
              {!isTakeaway && (
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-base text-muted-foreground leading-6">จัดการบิล</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full h-10 gap-2"
                      onClick={() => setSplitConfirmDialogOpen(true)}
                      disabled={isMerged}
                    >
                      <Coins size={16} />
                      แบ่งจ่าย
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-10 gap-2"
                      onClick={() => setItemSplitSheetOpen(true)}
                      disabled={itemSplitDisabled}
                    >
                      <ScissorsLineDashed size={16} />
                      แยกบิล
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-10 gap-2"
                      onClick={() => setMergeSheetOpen(true)}
                      disabled={isMerged}
                    >
                      <Link size={16} />
                      รวมบิล
                    </Button>
                  </div>
                </div>
              )}

              {/* Spacer to push proceed button to bottom */}
              <div className="flex-1" />

              {/* Proceed to payment button */}
              <Button
                className="w-full h-14 text-base font-semibold gap-2"
                onClick={() => setPaymentMethodDialogOpen(true)}
              >
                ดำเนินการชำระเงิน
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!isTakeaway && (
        <SplitSheet
          open={splitSheetOpen}
          onClose={() => setSplitSheetOpen(false)}
          tableId={tableId}
          grandTotal={grandTotal}
          billItems={billItems}
          onAllPaid={() => {
            useTableStore.getState().updateTable(tableId, { orderStage: 'Billed' })
            mergedSecondaryIds.forEach((id) => useTableStore.getState().markCleaning(id))
            dissolveAll(tableId)
            setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date() })
            setViewState('receipt')
          }}
        />
      )}

      {!isTakeaway && (
        <MergeSheet
          open={mergeSheetOpen}
          onClose={() => setMergeSheetOpen(false)}
          primaryTableId={tableId}
          onMergeConfirmed={() => setMergeSheetOpen(false)}
        />
      )}

      {/* Split payment confirm dialog */}
      <Dialog open={splitConfirmDialogOpen} onOpenChange={setSplitConfirmDialogOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">ยืนยันการแบ่งจ่าย</DialogTitle>
            <DialogDescription>
              หลังจากดำเนินการแบ่งจ่ายแล้วจะไม่สามารถใช้ส่วนลดได้ คุณต้องการดำเนินการต่อหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setSplitConfirmDialogOpen(false)
                setValueSplitSheetOpen(true)
              }}
            >
              ยืนยัน
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSplitConfirmDialogOpen(false)}
            >
              ยกเลิก
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Value split sheet */}
      {!isTakeaway && (
        <ValueSplitSheet
          open={valueSplitSheetOpen}
          onClose={() => setValueSplitSheetOpen(false)}
          grandTotal={grandTotal}
          tableId={tableId}
          onProceed={() => {
            setValueSplitSheetOpen(false)
            router.push(`/payment/${tableId}/split-summary`)
          }}
        />
      )}

      {/* Item split sheet */}
      {!isTakeaway && (
        <ItemSplitSheet
          open={itemSplitSheetOpen}
          onClose={() => setItemSplitSheetOpen(false)}
          tableId={tableId}
          orderItems={billItems}
          onProceed={() => {
            setItemSplitSheetOpen(false)
            router.push(`/payment/${tableId}/split-summary`)
          }}
        />
      )}

      {/* QR PromptPay bottom sheet */}
      <QrSheet
        open={qrSheetOpen}
        onClose={() => setQrSheetOpen(false)}
        grandTotal={grandTotal}
        onConfirm={() => {
          setQrSheetOpen(false)
          handleConfirmPayment()
        }}
      />

      {/* Cash payment dialog */}
      <CashDialog
        open={cashDialogOpen}
        onClose={() => { setCashDialogOpen(false); setPaymentMethod(null) }}
        grandTotal={grandTotal}
        onConfirm={() => { setCashDialogOpen(false); handleConfirmPayment() }}
      />

      {/* Payment method selection dialog */}
      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">วิธีการชำระเงิน</DialogTitle>
            <DialogDescription>เลือกวิธีการชำระเงิน</DialogDescription>
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
                  setPaymentMethod(method)
                  setPaymentMethodDialogOpen(false)
                  if (method === 'Cash') {
                    setCashDialogOpen(true)
                  } else if (method === 'QR PromptPay') {
                    setQrSheetOpen(true)
                  } else {
                    setViewState('checkout')
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
    </>
  )
}
