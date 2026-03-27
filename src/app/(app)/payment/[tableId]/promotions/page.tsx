'use client'

import { useMemo, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Crown, ScanLine, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useBillStore } from '@/stores/bill.store'
import { useTableStore } from '@/stores/table.store'
import { useOrderStore } from '@/stores/order.store'
import { MENU_ITEMS } from '@/lib/mock-data/menu'
import { PROMOTIONS, type Promotion } from '@/lib/mock-data/promotions'
import { CrmLookupDialog } from '@/components/payment/CrmLookupDialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CodeState = 'idle' | 'checking' | 'valid' | 'invalid'

// ---------------------------------------------------------------------------
// PromotionsPage
// ---------------------------------------------------------------------------

export default function PromotionsPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  const tables = useTableStore((s) => s.tables)
  const tableLabel = tables[tableId]?.label ?? tableId

  const crmMember = useBillStore((s) => s.crmMembers[tableId] ?? null)
  const { setPromotionDiscount, setCrmMember } = useBillStore()
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)

  const order = useOrderStore((s) => s.getOrder(tableId))
  const orderItems = useMemo(
    () => (order ? order.rounds.flatMap((r) => r.items).filter((i) => i.status !== 'voided') : []),
    [order],
  )

  // ---- Filter tabs (mock) ----
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent'>('all')

  // ---- Selected promotion (opens bottom sheet) ----
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null)

  // ---- Coupon sheet state ----
  const [codeInput, setCodeInput] = useState('')
  const [codeState, setCodeState] = useState<CodeState>('idle')
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCodeChange(value: string) {
    setCodeInput(value)
    setCodeState('idle')
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current)

    if (!value.trim()) return

    setCodeState('checking')
    checkTimerRef.current = setTimeout(() => {
      if (selectedPromo && value.trim().toUpperCase() === selectedPromo.referenceCode) {
        setCodeState('valid')
      } else {
        setCodeState('invalid')
      }
    }, 1200)
  }

  function handleCloseSheet() {
    setSelectedPromo(null)
    setCodeInput('')
    setCodeState('idle')
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
  }

  function handleApply() {
    if (!selectedPromo || codeState !== 'valid') return

    const subtotal = orderItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0)
    let amount: number
    if (selectedPromo.discountFixed > 0) {
      amount = Math.min(selectedPromo.discountFixed, subtotal)
    } else {
      amount = Math.round(subtotal * (selectedPromo.discountPercent / 100))
    }

    setPromotionDiscount(tableId, {
      promotionId: selectedPromo.id,
      couponCode: codeInput.trim().toUpperCase(),
      amount,
    })

    handleCloseSheet()
    router.back()
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0)

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-[52px] border-b flex items-center gap-2 px-6 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none">
            โปรโมชัน · {tableLabel}
          </span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">

            {/* CRM member card or placeholder */}
            {crmMember ? (
              <div className="bg-background border border-border rounded-2xl p-4 flex flex-col gap-3">
                {/* Member info row */}
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Crown size={18} className="text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <p className="font-semibold text-base text-foreground truncate">{crmMember.name}</p>
                    <span className="inline-flex items-center text-xs font-semibold text-primary-foreground bg-destructive px-2 py-0.5 rounded-md w-fit">
                      ระดับ: {crmMember.level}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">คะแนนสะสม</p>
                    <p className="font-semibold text-base text-destructive">{crmMember.points}</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCrmDialogOpen(true)}
                className="border border-dashed border-border rounded-2xl flex items-center justify-center gap-2 py-6 w-full hover:bg-accent transition-colors cursor-pointer"
              >
                <Crown size={18} className="text-destructive shrink-0" />
                <span className="font-medium text-sm text-destructive">เพิ่มเบอร์สมาชิกลูกค้า</span>
              </button>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(['all', 'recent'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeFilter === f
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                >
                  {f === 'all' ? 'ทั้งหมด' : 'ล่าสุด'}
                </button>
              ))}
            </div>

            {/* Promotion cards */}
            <div className="flex flex-col gap-3">
              {PROMOTIONS.map((promo) => (
                <button
                  key={promo.id}
                  onClick={() => { setSelectedPromo(promo); setCodeInput(''); setCodeState('idle') }}
                  className="bg-background border border-border rounded-2xl p-4 flex items-start gap-4 text-left hover:bg-accent transition-colors w-full"
                >
                  {/* Image placeholder */}
                  <div className="size-20 rounded-xl bg-muted flex items-center justify-center shrink-0 text-4xl">
                    {promo.imagePlaceholder}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="font-semibold text-base text-foreground leading-snug">{promo.title}</p>
                    <p className="text-sm text-muted-foreground leading-snug line-clamp-2">{promo.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {promo.discountPercent > 0 ? (
                        <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                          ลด {promo.discountPercent}%
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                          ลด ฿{promo.discountFixed}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ถึง {promo.validUntil}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* CRM member lookup dialog */}
      <CrmLookupDialog
        open={crmDialogOpen}
        onClose={() => setCrmDialogOpen(false)}
        onMemberFound={(member) => {
          setCrmMember(tableId, member)
          setCrmDialogOpen(false)
        }}
      />

      {/* Coupon bottom sheet */}
      <Sheet open={!!selectedPromo} onOpenChange={(open) => { if (!open) handleCloseSheet() }}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[90vh] flex flex-col">
          {selectedPromo && (
            <CouponSheet
              promo={selectedPromo}
              codeInput={codeInput}
              codeState={codeState}
              subtotal={subtotal}
              orderItems={orderItems}
              onCodeChange={handleCodeChange}
              onApply={handleApply}
              onCancel={handleCloseSheet}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// CouponSheet (inline sub-component)
// ---------------------------------------------------------------------------

interface OrderItem {
  lineId: string
  menuItemId: string
  menuItemName: string
  basePrice: number
  quantity: number
}

interface CouponSheetProps {
  promo: Promotion
  codeInput: string
  codeState: CodeState
  subtotal: number
  orderItems: OrderItem[]
  onCodeChange: (v: string) => void
  onApply: () => void
  onCancel: () => void
}

function CouponSheet({
  promo,
  codeInput,
  codeState,
  subtotal,
  orderItems,
  onCodeChange,
  onApply,
  onCancel,
}: CouponSheetProps) {
  const discountAmount = promo.discountFixed > 0
    ? Math.min(promo.discountFixed, subtotal)
    : Math.round(subtotal * (promo.discountPercent / 100))

  return (
    <>
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1 shrink-0">
        <div className="w-10 h-1 rounded-full bg-border" />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">

        {/* Promotion summary card */}
        <div className="flex items-start gap-3 bg-muted rounded-xl p-3">
          <div className="size-14 rounded-lg bg-background flex items-center justify-center text-3xl shrink-0">
            {promo.imagePlaceholder}
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground leading-snug">{promo.title}</p>
            <p className="text-xs text-muted-foreground leading-snug">{promo.description}</p>
            <span className="text-xs font-semibold text-destructive">
              {promo.discountPercent > 0 ? `ลด ${promo.discountPercent}%` : `ลด ฿${promo.discountFixed}`}
            </span>
          </div>
        </div>

        {/* Reference code input */}
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm text-foreground">รหัสอ้างอิง</p>
          <div className="flex gap-2">
            <Input
              placeholder="กรอกรหัสอ้างอิง"
              value={codeInput}
              onChange={(e) => onCodeChange(e.target.value)}
              className={`flex-1 ${codeState === 'invalid' ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            <Button variant="outline" className="gap-1.5 shrink-0" size="default">
              <ScanLine size={16} />
              สแกน
            </Button>
          </div>

          {/* Status text */}
          {codeState === 'checking' && (
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="text-xs font-medium text-amber-600">กำลังตรวจสอบ...</p>
            </div>
          )}
          {codeState === 'valid' && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              <p className="text-xs font-medium text-green-600">รหัสอ้างอิงถูกต้อง</p>
            </div>
          )}
          {codeState === 'invalid' && (
            <div className="flex items-center gap-1.5">
              <XCircle size={14} className="text-muted-foreground shrink-0" />
              <p className="text-xs font-medium text-muted-foreground">ไม่พบรหัสอ้างอิง กรุณาลองอีกครั้ง</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Eligible items */}
        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm text-foreground">สินค้าที่ร่วมรายการ</p>
          <div className="grid grid-cols-3 gap-2">
            {orderItems.map((item) => {
              const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
              const imagePath = menuItem?.imagePath
              return (
                <div
                  key={item.lineId}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-background transition-opacity ${
                    codeState === 'valid' ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className="size-14 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                    {imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePath} alt={item.menuItemName} className="size-full object-cover" />
                    ) : (
                      <span className="text-2xl">{menuItem?.thumbnailPlaceholder ?? '🍜'}</span>
                    )}
                  </div>
                  <p className="text-xs text-center text-foreground font-medium leading-tight line-clamp-2">
                    {item.menuItemName}
                  </p>
                  <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Discount preview */}
        {codeState === 'valid' && (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 rounded-xl px-4 py-3 border border-green-200 dark:border-green-900">
            <p className="font-medium text-sm text-green-700 dark:text-green-400">ส่วนลดที่จะได้รับ</p>
            <p className="font-semibold text-base text-green-700 dark:text-green-400">
              -฿{discountAmount.toLocaleString()}
            </p>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="border-t px-4 py-4 flex flex-col gap-2 shrink-0">
        <Button
          className="w-full h-12 text-base font-semibold"
          disabled={codeState !== 'valid'}
          onClick={onApply}
        >
          ใช้งาน
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 text-base font-semibold"
          onClick={onCancel}
        >
          ยกเลิก
        </Button>
      </div>
    </>
  )
}
