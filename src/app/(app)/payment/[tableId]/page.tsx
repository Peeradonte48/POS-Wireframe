'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronUp, Crown, ScissorsLineDashed, Link, Unlink, HandPlatter, Coins } from 'lucide-react'
import { toast } from 'sonner'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BillLineItem } from '@/components/payment/BillLineItem'
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector'
import { QrPanel } from '@/components/payment/QrPanel'
import { CardPanel } from '@/components/payment/CardPanel'
import { ReceiptScreen } from '@/components/payment/ReceiptScreen'
import { CrmMemberCard } from '@/components/payment/CrmMemberCard'
import { useBillStore } from '@/stores/bill.store'
import { useQueueStore } from '@/stores/queue.store'
import { useKdsStore } from '@/stores/kds.store'
import { useBillCalculation } from '@/components/payment/useBillCalculation'
import { useCameraScanner } from '@/components/payment/useCameraScanner'
import { PromotionSummary } from '@/components/payment/PromotionSummary'
import { PaymentModals, type PaymentMethod } from '@/components/payment/PaymentModals'
import { PauseConfirmDialog } from '@/components/payment/PauseConfirmDialog'
import { ManagerPinModal } from '@/components/auth/ManagerPinModal'
import type { CrmMember } from '@/components/payment/CrmLookupDialog'

type ViewState = 'checkBill' | 'checkout' | 'receipt'

export default function PaymentPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  // Extracted hooks
  const { lineItems: billItems, tableOrders, subtotal, vatAmount, grandTotal, discountTotal: discountAmount, promotions: promotionDiscounts, isMerged, isTakeaway, mergedTableIds: mergedSecondaryIds } = useBillCalculation(tableId)
  useCameraScanner() // camera scan flow — state managed by hook, ready for wiring

  // Stores
  const order = useOrderStore((s) => s.getOrder(tableId))
  const role = useSessionStore((s) => s.role)!
  const crmMember = useBillStore((s) => s.crmMembers[tableId] ?? null)
  const {
    clearCrmMember,
    dissolveAll,
    clearPromotionDiscounts,
    setPaymentSession,
    updatePaymentSession,
    clearPaymentSession,
    appendPaymentLog,
  } = useBillStore()
  const merges = useBillStore((s) => s.merges)
  const tables = useTableStore((s) => s.tables)

  // View state
  const [viewState, setViewState] = useState<ViewState>('checkBill')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [receiptData, setReceiptData] = useState<{ grandTotal: number; paymentMethod: PaymentMethod; paidAt: Date; crmMember: CrmMember | null } | null>(null)

  // UI state
  const [crmDialogOpen, setCrmDialogOpen] = useState(false); const [qrSheetOpen, setQrSheetOpen] = useState(false); const [cashDialogOpen, setCashDialogOpen] = useState(false)
  const [splitSheetOpen, setSplitSheetOpen] = useState(false); const [mergeSheetOpen, setMergeSheetOpen] = useState(false); const [splitConfirmDialogOpen, setSplitConfirmDialogOpen] = useState(false)
  const [valueSplitSheetOpen, setValueSplitSheetOpen] = useState(false); const [itemSplitSheetOpen, setItemSplitSheetOpen] = useState(false); const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
  const [discountExpanded, setDiscountExpanded] = useState(true)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [dissolveMergePinOpen, setDissolveMergePinOpen] = useState(false)
  const table = useTableStore((s) => s.tables[tableId])
  const tableLabel = table?.label ?? tableId
  const pausedCashAmount = useBillStore((s) => s.paymentSessions[tableId]?.cashAmount)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Auto-restore payment session on mount
  useEffect(() => {
    const session = useBillStore.getState().paymentSessions[tableId]
    if (!session || session.context !== 'normal') return
    setPaymentMethod(session.method)
    setViewState('checkout')
    if (session.activeSheet === 'cash') {
      setCashDialogOpen(true)
    } else if (session.activeSheet === 'qr') {
      setQrSheetOpen(true)
    }
  }, [tableId])

  // Promo toast on redirect back from promotions page
  const searchParams = useSearchParams()
  const promoToastFired = useRef(false)
  useEffect(() => {
    if (searchParams.get('promoApplied') === '1' && !promoToastFired.current) {
      promoToastFired.current = true
      toast.success('ใช้โปรโมชันสำเร็จ')
      router.replace(`/payment/${tableId}`)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Eligibility
  const totalBillUnits = billItems.reduce((sum, item) => sum + item.quantity, 0)
  const itemSplitDisabled = isMerged || totalBillUnits <= 1
  const hasEligibleMergeTarget = Object.values(tables).some(
    (t) => (t.status === 'Occupied' || t.status === 'CheckRequested') && t.id !== tableId && !(t.id in merges),
  )
  const queueOrder = isTakeaway ? useQueueStore.getState().orders[tableId] : undefined

  // Confirm payment handler
  function handleConfirmPayment() {
    if (!paymentMethod) return
    const queueOrder = useQueueStore.getState().orders[tableId]
    if (queueOrder) {
      // Takeaway → Collected (terminal); Delivery → Billed
      const nextStatus = queueOrder.channel === 'takeaway' ? 'Collected' : 'Billed'
      useQueueStore.getState().setStatus(tableId, nextStatus)
      clearPromotionDiscounts(tableId)
      clearPaymentSession(tableId)
      appendPaymentLog({
        tableId,
        type: 'completed',
        method: paymentMethod,
        amount: grandTotal,
        at: Date.now(),
      })
      toast.success('Payment confirmed')
      setReceiptData({ grandTotal, paymentMethod, paidAt: new Date(), crmMember })
      setViewState('receipt')
      return
    }
    const { markCleaning, updateTable } = useTableStore.getState()
    markCleaning(tableId)
    mergedSecondaryIds.forEach((id) => markCleaning(id))
    dissolveAll(tableId)
    clearPromotionDiscounts(tableId)
    clearPaymentSession(tableId)
    updateTable(tableId, { orderStage: 'Billed' })
    updateTable(tableId, { paidAmount: grandTotal, paymentMethod, discountApplied: discountAmount })
    appendPaymentLog({
      tableId,
      type: 'completed',
      method: paymentMethod,
      amount: grandTotal,
      at: Date.now(),
    })
    toast.success('Payment confirmed')
    setReceiptData({ grandTotal, paymentMethod, paidAt: new Date(), crmMember })
    setViewState('receipt')
  }

  const confirmDisabled = (!isTakeaway && !canDoAction(role, 'confirm-payment')) || paymentMethod === null || paymentMethod === 'Cash'
  const confirmHint = !isTakeaway && !canDoAction(role, 'confirm-payment')
    ? `Role "${role}" cannot confirm payment — switch to Cashier or Manager`
    : paymentMethod === null ? 'Select a payment method above to continue' : null

  // Shared modals (hoisted above view split — rendered once for all views)
  const modals = (
    <>
      <PaymentModals
        tableId={tableId} grandTotal={grandTotal} isTakeaway={isTakeaway} isMerged={isMerged}
        mergedSecondaryIds={mergedSecondaryIds} billItems={billItems} crmMember={crmMember}
        crmDialogOpen={crmDialogOpen} setCrmDialogOpen={setCrmDialogOpen}
        qrSheetOpen={qrSheetOpen}
        cashDialogOpen={cashDialogOpen} setCashDialogOpen={setCashDialogOpen}
        splitSheetOpen={splitSheetOpen} setSplitSheetOpen={setSplitSheetOpen}
        mergeSheetOpen={mergeSheetOpen} setMergeSheetOpen={setMergeSheetOpen}
        splitConfirmDialogOpen={splitConfirmDialogOpen} setSplitConfirmDialogOpen={setSplitConfirmDialogOpen}
        valueSplitSheetOpen={valueSplitSheetOpen} setValueSplitSheetOpen={setValueSplitSheetOpen}
        itemSplitSheetOpen={itemSplitSheetOpen} setItemSplitSheetOpen={setItemSplitSheetOpen}
        paymentMethodDialogOpen={paymentMethodDialogOpen} setPaymentMethodDialogOpen={setPaymentMethodDialogOpen}
        onCrmMemberFound={() => {}}
        onConfirmPayment={handleConfirmPayment}
        onAllPaid={() => { setReceiptData({ grandTotal, paymentMethod: 'Cash', paidAt: new Date(), crmMember }); setViewState('receipt') }}
        setQrSheetOpen={(v) => {
          setQrSheetOpen(v)
          if (!v) {
            clearPaymentSession(tableId)
            setPaymentMethod(null)
          }
        }}
        onPaymentMethodSelect={(m) => {
          setPaymentMethod(m)
          if (m === 'Cash') {
            setCashDialogOpen(true)
            setPaymentSession(tableId, {
              tableId,
              context: 'normal',
              method: 'Cash',
              activeSheet: 'cash',
              cashAmount: 0,
              startedAt: Date.now(),
            })
          } else if (m === 'QR PromptPay') {
            setQrSheetOpen(true)
            setPaymentSession(tableId, {
              tableId,
              context: 'normal',
              method: 'QR PromptPay',
              activeSheet: 'qr',
              startedAt: Date.now(),
            })
          } else {
            setViewState('checkout')
            setPaymentSession(tableId, {
              tableId,
              context: 'normal',
              method: 'Card',
              activeSheet: 'card',
              startedAt: Date.now(),
            })
          }
        }}
        onCashClose={() => {
          setCashDialogOpen(false)
          setPaymentMethod(null)
          clearPaymentSession(tableId)
        }}
        initialCashAmount={pausedCashAmount}
        onCashAmountChange={(amount) => {
          const existing = useBillStore.getState().paymentSessions[tableId]
          if (existing) updatePaymentSession(tableId, { cashAmount: amount })
        }}
      />
      <PauseConfirmDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        scenario="normal"
        tableLabel={tableLabel}
        onResumeLater={() => {
          setPauseDialogOpen(false)
          router.push('/table-map')
        }}
        onCancelAuthorized={() => {
          setPauseDialogOpen(false)
          clearPaymentSession(tableId)
          appendPaymentLog({
            tableId,
            type: 'voided',
            reason: 'normal-cancel',
            method: paymentMethod ?? undefined,
            amount: grandTotal,
            authorizedBy: { staffId: 'manager', role: 'Manager' },
            at: Date.now(),
          })
          setPaymentMethod(null)
          setCashDialogOpen(false)
          setQrSheetOpen(false)
          setViewState('checkBill')
          toast.success('ยกเลิกการชำระแล้วโดยผู้จัดการ')
        }}
      />
      <ManagerPinModal
        open={dissolveMergePinOpen}
        onOpenChange={setDissolveMergePinOpen}
        actionLabel="Authorize: Dissolve Merge"
        onAuthorize={() => {
          dissolveAll(tableId)
          toast.success('ยกเลิกการรวมบิลแล้วโดยผู้จัดการ')
        }}
      />
    </>
  )

  // Empty order guard
  if (!order || billItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No order data found.</p>
        <Button onClick={() => router.push('/table-map')}>Back to Floor Plan</Button>
      </div>
    )
  }

  // Receipt view
  if (viewState === 'receipt' && receiptData) {
    return (
      <ReceiptScreen
        tableId={tableId} grandTotal={receiptData.grandTotal} paymentMethod={receiptData.paymentMethod}
        paidAt={receiptData.paidAt} onReprint={() => toast('Receipt sent to printer')}
        onBackToFloor={() => { clearCrmMember(tableId); router.push('/table-map') }}
        crmMember={receiptData.crmMember}
      />
    )
  }

  // Checkout view
  if (viewState === 'checkout') {
    return (
      <>
        <div className="flex flex-col h-full">
          <header className="h-[52px] border-b flex items-center gap-2 px-6 shrink-0">
            <Button variant="outline" size="icon" className="size-9" onClick={() => setViewState('checkBill')} aria-label="Back to bill summary">
              <ChevronLeft size={16} />
            </Button>
            <span className="font-medium text-base leading-none">
              {isTakeaway ? `${tableId} · ${queueOrder?.customerName ?? ''}` : 'ชำระเงิน'}
            </span>
          </header>
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
              <PaymentMethodSelector selected={paymentMethod} onChange={(m) => { setPaymentMethod(m); if (m === 'Cash') setCashDialogOpen(true) }} />
              {paymentMethod === 'QR PromptPay' && <QrPanel grandTotal={grandTotal} discountApplied={discountAmount} />}
              {paymentMethod === 'Card' && <CardPanel grandTotal={grandTotal} />}
            </div>
          </div>
          <div className="sticky bottom-0 bg-background border-t p-4">
            <div className="max-w-2xl mx-auto space-y-2">
              <Button size="cta" className="w-full text-base" disabled={confirmDisabled} onClick={handleConfirmPayment}>
                Confirm Payment — ฿{grandTotal.toLocaleString()}
              </Button>
              {confirmHint && <p className="text-xs text-center text-muted-foreground">{confirmHint}</p>}
            </div>
          </div>
        </div>
        {modals}
      </>
    )
  }

  // Check Bill view (default)
  return (
    <>
      <div className="flex flex-col h-full">
        <header className="border-b flex items-center gap-2 px-6 py-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => {
              const session = useBillStore.getState().paymentSessions[tableId]
              if (session) {
                setPauseDialogOpen(true)
                return
              }
              router.push('/table-map')
            }}
            aria-label="Back to floor plan"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none">สรุปรายการชำระ</span>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panel – scrollable order items */}
          <div className="flex-1 min-w-0 h-full px-2 py-4">
            <div className="bg-muted border border-border rounded-md h-full overflow-y-auto p-2">
              <div className="flex flex-col gap-4 px-4 py-4">
                <div className="flex flex-col gap-4">
                  {/* Subtotal row */}
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-base text-muted-foreground leading-6">ราคารวม</p>
                    <p className="font-medium text-base text-accent-foreground leading-6">฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>

                  {/* Discount accordion */}
                  <div className="flex flex-col">
                    <button className="flex items-center justify-between w-full text-left" onClick={() => discountAmount > 0 && setDiscountExpanded((v) => !v)}>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-base text-muted-foreground leading-6">ส่วนลดท้ายใบเสร็จ</p>
                        {discountExpanded && discountAmount > 0 ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </div>
                      <p className={`font-medium text-base leading-6 ${discountAmount > 0 ? 'text-status-warning' : 'text-accent-foreground'}`}>
                        {discountAmount > 0 ? `-฿${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '฿0.00'}
                      </p>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${discountExpanded && discountAmount > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className={`flex flex-col gap-1 pt-1 transition-[transform,opacity] duration-300 ease-in-out ${discountExpanded && discountAmount > 0 ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
                          {promotionDiscounts.map((d) => (
                            <div key={d.couponCode} className="flex items-center justify-between pl-3">
                              <p className="text-sm text-status-warning leading-5">{d.couponCode}</p>
                              <p className="text-sm text-status-warning leading-5">-฿{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VAT row */}
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-base text-muted-foreground leading-6">VAT</p>
                    <p className="font-medium text-base text-accent-foreground leading-6">฿{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="py-2"><Separator /></div>

                {/* Table groups */}
                <div className="flex flex-col gap-4">
                  {tableOrders.map((group) => {
                    const groupSubtotal = group.items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0)
                    const isOpen = !collapsedGroups.has(group.tableId)
                    return (
                      <div key={group.tableId} className="flex flex-col gap-4">
                        <div
                          role={isMerged ? 'button' : undefined}
                          tabIndex={isMerged ? 0 : undefined}
                          aria-expanded={isMerged ? isOpen : undefined}
                          className={`flex items-center gap-[10px] py-2 ${isMerged ? 'cursor-pointer' : ''}`}
                          onClick={isMerged ? () => setCollapsedGroups((prev) => { const n = new Set(prev); if (n.has(group.tableId)) { n.delete(group.tableId) } else { n.add(group.tableId) } return n }) : undefined}
                          onKeyDown={isMerged ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsedGroups((prev) => { const n = new Set(prev); if (n.has(group.tableId)) { n.delete(group.tableId) } else { n.add(group.tableId) } return n }) } } : undefined}
                        >
                          <Button variant="outline" size="icon" className="size-8 rounded-md shrink-0 pointer-events-none" aria-label="Table"><HandPlatter size={16} /></Button>
                          <div className="flex flex-1 items-center gap-2 min-w-0">
                            <p className="font-semibold text-lg leading-7 shrink-0">{group.label}</p>
                            {group.guestCount !== null && <p className="text-sm text-muted-foreground leading-5 shrink-0">ลูกค้า {group.guestCount} คน</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
                            <p className="font-semibold text-lg leading-7 text-right">฿{groupSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            {isMerged && (isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />)}
                          </div>
                        </div>
                        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                          <div className="overflow-hidden">
                            <div className={`flex flex-col gap-4 transition-[transform,opacity] duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                              {group.items.map((item) => <BillLineItem key={item.lineId} item={item} />)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel – totals & actions */}
          <div className="shrink-0 w-[280px] h-full flex flex-col px-2 py-4">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-6">
                {/* Grand total */}
                <div className="flex flex-col gap-4 items-center justify-center h-32 leading-none p-4 whitespace-nowrap">
                  <p className="font-medium text-xl text-muted-foreground">รวมสุทธิ</p>
                  <p className="font-semibold text-3xl text-destructive">฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>

                {/* CRM member */}
                {crmMember ? (
                  <CrmMemberCard member={crmMember} onChangeMember={() => setCrmDialogOpen(true)} />
                ) : (
                  <button className="bg-background border border-border rounded-[14px] flex items-center justify-center gap-2 min-h-[104px] p-4 w-full cursor-pointer hover:bg-accent transition-colors" onClick={() => setCrmDialogOpen(true)}>
                    <Crown size={16} className="text-primary shrink-0" />
                    <span className="font-medium text-sm text-primary leading-5">เพิ่มเบอร์สมาชิกลูกค้า</span>
                  </button>
                )}

                {/* Promotions */}
                <PromotionSummary
                  promotions={promotionDiscounts}
                  discountTotal={discountAmount}
                  tableId={tableId}
                  lineItems={billItems}
                />

                {/* Bill management */}
                {!isTakeaway && (
                  <div className="flex flex-col gap-2">
                    <p className="font-medium text-base text-muted-foreground leading-6">จัดการบิล</p>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" className="w-full h-14 gap-2" onClick={() => setSplitConfirmDialogOpen(true)} disabled={isMerged}><Coins size={16} />แบ่งจ่าย</Button>
                      <Button variant="outline" className="w-full h-14 gap-2" onClick={() => setItemSplitSheetOpen(true)} disabled={itemSplitDisabled}><ScissorsLineDashed size={16} />แยกบิล</Button>
                      {!isMerged ? (
                        <Button variant="outline" className="w-full h-14 gap-2" onClick={() => setMergeSheetOpen(true)} disabled={!hasEligibleMergeTarget}><Link size={16} />รวมบิล</Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full h-14 gap-2 text-destructive hover:text-destructive"
                          onClick={() => setDissolveMergePinOpen(true)}
                        >
                          <Unlink size={16} />ยกเลิกรวมบิล
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned CTA – always visible */}
            <div className="shrink-0 pt-4">
              <Button className="w-full h-14 text-base font-semibold gap-2" onClick={() => setPaymentMethodDialogOpen(true)}>
                ดำเนินการชำระเงิน
              </Button>
            </div>
          </div>
        </div>
      </div>
      {modals}
    </>
  )
}
