'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronUp, Crown, TicketPercent, ScissorsLineDashed, Link, HandPlatter, Banknote, QrCode, CreditCard, Coins, Trash2, BadgePercent, Calendar, CheckCircle2, X } from 'lucide-react'
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
import { CrmLookupDialog, type CrmMember } from '@/components/payment/CrmLookupDialog'
import { CrmMemberCard } from '@/components/payment/CrmMemberCard'
import { useBillStore } from '@/stores/bill.store'
import { useQueueStore } from '@/stores/queue.store'
import { useKdsStore } from '@/stores/kds.store'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PROMOTIONS, type Promotion } from '@/lib/mock-data/promotions'
import { MENU_ITEMS } from '@/lib/mock-data/menu'

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
  // ---- Cash dialog ----
  const [cashDialogOpen, setCashDialogOpen] = useState(false)

  // ---- Payment method dialog ----
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)

  // ---- CRM member lookup ----
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)
  const crmMember = useBillStore((s) => s.crmMembers[tableId] ?? null)
  const promotionDiscountsRaw = useBillStore((s) => s.promotionDiscounts[tableId])
  const promotionDiscounts = useMemo(() => promotionDiscountsRaw ?? [], [promotionDiscountsRaw])
  const { setCrmMember, clearCrmMember, removePromotionDiscount } = useBillStore()



  // ---- QR sheet ----
  const [qrSheetOpen, setQrSheetOpen] = useState(false)

  // ---- Split sheet ----
  const [splitSheetOpen, setSplitSheetOpen] = useState(false)

  // ---- Value split confirm dialog + sheet ----
  const [splitConfirmDialogOpen, setSplitConfirmDialogOpen] = useState(false)
  const [valueSplitSheetOpen, setValueSplitSheetOpen] = useState(false)

  // ---- Item split sheet ----
  const [itemSplitSheetOpen, setItemSplitSheetOpen] = useState(false)

  // ---- Promo applied toast ----
  const searchParams = useSearchParams()
  const promoToastFired = useRef(false)
  useEffect(() => {
    if (searchParams.get('promoApplied') === '1' && !promoToastFired.current) {
      promoToastFired.current = true
      toast.success('ใช้โปรโมชันสำเร็จ')
      router.replace(`/payment/${tableId}`)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Discount accordion ----
  const [discountExpanded, setDiscountExpanded] = useState(true)

  // ---- Coupon list overflow (show first 3; toggle expand/collapse when > 3) ----
  const [showAllCoupons, setShowAllCoupons] = useState(false)
  const visibleCoupons = showAllCoupons ? promotionDiscounts : promotionDiscounts.slice(0, 3)

  // ---- Promo detail sheet (read-only view of applied coupon) ----
  type PromoDetailState = { promo: Promotion; couponCode: string; amount: number; selectedLineIds: string[] } | null
  const [promoDetail, setPromoDetail] = useState<PromoDetailState>(null)

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
  const hasEligibleMergeTarget = Object.values(tables).some(
    (t) =>
      (t.status === 'Occupied' || t.status === 'CheckRequested') &&
      t.id !== tableId &&
      !(t.id in merges)
  )

  // ---- Receipt data ----
  const [receiptData, setReceiptData] = useState<{
    grandTotal: number
    paymentMethod: PaymentMethod
    paidAt: Date
    crmMember: CrmMember | null
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
  const totalBillUnits = billItems.reduce((sum, item) => sum + item.quantity, 0)
  const itemSplitDisabled = isMerged || totalBillUnits <= 1

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

  const discountAmount = promotionDiscounts.reduce((sum, d) => sum + d.amount, 0)
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
    setReceiptData({ grandTotal, paymentMethod, paidAt: new Date(), crmMember })
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
        onBackToFloor={() => { clearCrmMember(tableId); router.push('/table-map') }}
        crmMember={receiptData.crmMember}
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
              setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date(), crmMember })
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
                <div className="flex flex-col">
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => discountAmount > 0 && setDiscountExpanded((v) => !v)}
                  >
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-base text-muted-foreground leading-6">ส่วนลดท้ายใบเสร็จ</p>
                      {discountAmount > 0
                        ? (discountExpanded
                            ? <ChevronUp size={16} className="text-muted-foreground" />
                            : <ChevronDown size={16} className="text-muted-foreground" />)
                        : <ChevronDown size={16} className="text-muted-foreground" />
                      }
                    </div>
                    <p className={`font-medium text-base leading-6 ${discountAmount > 0 ? 'text-amber-500' : 'text-foreground'}`}>
                      {discountAmount > 0 ? `-฿${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `฿0.00`}
                    </p>
                  </button>

                  {/* Collapsible promo rows */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      discountExpanded && discountAmount > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={`flex flex-col gap-1 pt-1 transition-[transform,opacity] duration-300 ease-in-out ${
                          discountExpanded && discountAmount > 0 ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                        }`}
                      >
                        {promotionDiscounts.map((d) => (
                          <div key={d.couponCode} className="flex items-center justify-between pl-3">
                            <p className="text-sm text-amber-500 leading-5">{d.couponCode}</p>
                            <p className="text-sm text-amber-500 leading-5">
                              -฿{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
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
            <div className="bg-background border border-border rounded-2xl overflow-hidden flex flex-col flex-1">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-3">
              {/* Grand total display */}
              <div className="flex flex-col gap-4 items-center justify-center h-32 leading-none p-4 whitespace-nowrap">
                <p className="font-medium text-xl text-muted-foreground">รวมสุทธิ</p>
                <p className="font-semibold text-3xl text-destructive">
                  ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Member section */}
              {crmMember ? (
                <CrmMemberCard
                  member={crmMember}
                  onChangeMember={() => setCrmDialogOpen(true)}
                />
              ) : (
                <button
                  className="border border-border rounded-[14px] flex items-center justify-center gap-2 min-h-[104px] p-4 w-full cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setCrmDialogOpen(true)}
                >
                  <Crown size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-sm text-primary leading-5">เพิ่มเบอร์สมาชิกลูกค้า</span>
                </button>
              )}

              {/* Coupon section */}
              {!isTakeaway && (
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-sm text-muted-foreground leading-5">คูปองส่วนลด</p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => router.push(`/payment/${tableId}/promotions`)}
                  >
                    <TicketPercent size={16} />
                    โปรโมชัน
                  </Button>
                  {/* Applied coupons list — always show first 3, expand when more */}
                  {visibleCoupons.map((d) => {
                    const promo = PROMOTIONS.find((p) => p.id === d.promotionId)
                    return (
                      <div
                        key={d.couponCode}
                        role="button"
                        tabIndex={0}
                        onClick={() => promo && setPromoDetail({ promo, couponCode: d.couponCode, amount: d.amount, selectedLineIds: d.selectedLineIds ?? [] })}
                        onKeyDown={(e) => e.key === 'Enter' && promo && setPromoDetail({ promo, couponCode: d.couponCode, amount: d.amount, selectedLineIds: d.selectedLineIds ?? [] })}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        <TicketPercent size={16} className="text-amber-500 shrink-0" />
                        <span className="text-sm font-medium flex-1 text-foreground">{d.couponCode}</span>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          -฿{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => { e.stopPropagation(); removePromotionDiscount(tableId, d.couponCode) }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )
                  })}
                  {promotionDiscounts.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 px-0 text-primary font-medium w-full justify-center hover:bg-transparent hover:opacity-80"
                      onClick={() => setShowAllCoupons((v) => !v)}
                    >
                      <TicketPercent size={14} />
                      {showAllCoupons
                        ? 'ซ่อนส่วนลด'
                        : `ดูส่วนลดทั้งหมด (${promotionDiscounts.length})`}
                    </Button>
                  )}
                </div>
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
                      disabled={isMerged || !hasEligibleMergeTarget}
                    >
                      <Link size={16} />
                      รวมบิล
                    </Button>
                  </div>
                </div>
              )}

              </div>{/* end scrollable content */}

              {/* Pinned proceed button */}
              <div className="shrink-0 p-3 border-t">
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
            setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date(), crmMember })
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

      {/* CRM member lookup dialog */}
      <CrmLookupDialog
        open={crmDialogOpen}
        onClose={() => setCrmDialogOpen(false)}
        onMemberFound={(member) => {
          setCrmMember(tableId, member)
          setCrmDialogOpen(false)
        }}
      />

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

      {/* Promo detail sheet — read-only view of an applied coupon */}
      <Sheet open={!!promoDetail} onOpenChange={(open) => { if (!open) setPromoDetail(null) }}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl p-0 max-h-[92vh] flex flex-col">
          {promoDetail && (
            <>
              {/* Header */}
              <div className="relative flex items-start gap-[10px] px-6 pt-6 pb-0 shrink-0">
                <Button variant="secondary" size="icon" className="size-9 rounded-md shrink-0">
                  <TicketPercent size={16} />
                </Button>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="font-semibold text-lg leading-7 text-foreground">รายละเอียดโปรโมชัน</p>
                  <p className="text-sm text-muted-foreground leading-5">โปรโมชันที่ใช้งานกับบิลนี้</p>
                </div>
                <button
                  onClick={() => setPromoDetail(null)}
                  className="absolute right-4 top-[15px] size-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
                {/* Promo card — landscape */}
                <div className="flex gap-6 items-start">
                  {/* Promo image */}
                  <div className="size-[200px] rounded-xl bg-muted shrink-0 overflow-hidden">
                    {promoDetail.promo.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={promoDetail.promo.imagePath} alt={promoDetail.promo.title} className="size-full object-cover rounded-xl" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-7xl">
                        {promoDetail.promo.imagePlaceholder}
                      </div>
                    )}
                  </div>

                  {/* Promo info */}
                  <div className="flex flex-col flex-1 min-w-0 self-stretch justify-between">
                    <div className="flex flex-col gap-3">
                      <p className="font-semibold text-base text-foreground leading-6">{promoDetail.promo.title}</p>
                      <p className="text-sm text-muted-foreground leading-5">{promoDetail.promo.description}</p>
                      <div className="flex items-center gap-2">
                        <BadgePercent size={18} className="text-foreground shrink-0" />
                        <span className="text-2xl font-semibold text-foreground leading-none">
                          {promoDetail.promo.discountPercent > 0
                            ? `ลด ${promoDetail.promo.discountPercent}%`
                            : `ลด ฿${promoDetail.promo.discountFixed}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {promoDetail.promo.validFrom} – {promoDetail.promo.validUntil}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Applied coupon chip */}
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-sm text-muted-foreground">คูปองที่ใช้งาน</p>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                    <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-sm font-semibold text-foreground flex-1">{promoDetail.couponCode}</span>
                    <span className="text-base font-bold text-green-700 dark:text-green-400">
                      -฿{promoDetail.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Selected items */}
                {(() => {
                  const selectedItems = billItems.filter((i) => promoDetail.selectedLineIds.includes(i.lineId))
                  if (selectedItems.length === 0) return null
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-muted-foreground">รายการที่ร่วมโปรโมชัน</p>
                        <p className="text-sm text-muted-foreground">{selectedItems.length} รายการ</p>
                      </div>
                      <div className="bg-muted border border-border rounded-lg p-2">
                        <div className="grid grid-cols-5 gap-2">
                          {selectedItems.map((item, idx) => {
                            const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
                            const imageSrc = menuItem?.imagePath ?? '/images/promotions/item-bg.png'
                            const overlayImg = idx % 3 === 0
                              ? '/images/promotions/item-overlay-a.png'
                              : '/images/promotions/item-overlay-b.png'
                            const discountedPrice = promoDetail.promo.discountPercent > 0
                              ? Math.round(item.basePrice * (1 - promoDetail.promo.discountPercent / 100))
                              : Math.max(0, item.basePrice - promoDetail.promo.discountFixed)
                            return (
                              <div
                                key={item.lineId}
                                className="relative flex flex-col items-start overflow-hidden rounded-[14px] border border-primary"
                                style={{
                                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9))',
                                  backgroundColor: 'var(--primary)',
                                  boxShadow: 'var(--shadow-card)',
                                }}
                              >
                                {/* Image section */}
                                <div className="h-24 w-full relative overflow-hidden shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={imageSrc} alt={item.menuItemName} className="absolute inset-0 size-full object-cover" />
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={overlayImg} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover pointer-events-none" />
                                </div>
                                {/* Content section */}
                                <div className="flex flex-col gap-2 p-2 w-full min-h-[96px]">
                                  <p className="font-semibold text-base leading-6 overflow-hidden text-ellipsis whitespace-nowrap text-card-foreground">
                                    {item.menuItemName}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs leading-none line-through text-muted-foreground">
                                      ฿{item.basePrice.toLocaleString()}
                                    </p>
                                    <p className="text-sm font-bold leading-5 text-foreground">
                                      ฿{discountedPrice.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-4 shrink-0">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-semibold"
                  onClick={() => setPromoDetail(null)}
                >
                  ปิด
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
