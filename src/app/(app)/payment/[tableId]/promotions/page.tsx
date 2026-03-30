'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Crown, QrCode, ScanBarcode, CheckCircle2, XCircle, X, BadgePercent, Calendar, HandPlatter, ShoppingBag, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
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
  const { addPromotionDiscount, setCrmMember } = useBillStore()
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

  function handleApply(selectedLineIds: string[]) {
    if (!selectedPromo || codeState !== 'valid') return

    const selectedSubtotal = orderItems
      .filter((i) => selectedLineIds.includes(i.lineId))
      .reduce((sum, item) => sum + item.basePrice * item.quantity, 0)

    let amount: number
    if (selectedPromo.discountFixed > 0) {
      amount = Math.min(selectedPromo.discountFixed, selectedSubtotal)
    } else {
      amount = Math.round(selectedSubtotal * (selectedPromo.discountPercent / 100))
    }

    addPromotionDiscount(tableId, {
      promotionId: selectedPromo.id,
      couponCode: codeInput.trim().toUpperCase(),
      amount,
      selectedLineIds,
    })

    handleCloseSheet()
    router.push(`/payment/${tableId}?promoApplied=1`)
  }

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
                  <div className="size-20 rounded-xl bg-muted flex items-center justify-center shrink-0 text-4xl overflow-hidden">
                    {promo.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={promo.imagePath} alt={promo.title} className="size-full object-cover" />
                    ) : (
                      promo.imagePlaceholder
                    )}
                  </div>
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
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl p-0 max-h-[92vh] flex flex-col">
          {selectedPromo && (
            <CouponSheet
              promo={selectedPromo}
              codeInput={codeInput}
              codeState={codeState}
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
  orderItems: OrderItem[]
  onCodeChange: (v: string) => void
  onApply: (selectedLineIds: string[]) => void
  onCancel: () => void
}

function CouponSheet({
  promo,
  codeInput,
  codeState,
  orderItems,
  onCodeChange,
  onApply,
  onCancel,
}: CouponSheetProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [scannerOpen, setScannerOpen] = useState(false)

  function handleQrScanned() {
    setScannerOpen(false)
    onCodeChange(promo.referenceCode)
  }

  // Auto-select all items when code becomes valid; clear when invalidated
  useEffect(() => {
    if (codeState === 'valid') {
      setSelectedItems(new Set(orderItems.map((i) => i.lineId)))
    } else {
      setSelectedItems(new Set())
    }
  }, [codeState, orderItems])

  function toggleItem(lineId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(lineId)) next.delete(lineId)
      else next.add(lineId)
      return next
    })
  }

  const selectedSubtotal = orderItems
    .filter((i) => selectedItems.has(i.lineId))
    .reduce((sum, i) => sum + i.basePrice * i.quantity, 0)

  const discountAmount = promo.discountFixed > 0
    ? Math.min(promo.discountFixed, selectedSubtotal)
    : Math.round(selectedSubtotal * (promo.discountPercent / 100))

  const isValid = codeState === 'valid'

  return (
    <>
      {/* Sheet header */}
      <div className="relative flex items-start gap-[10px] px-6 pt-6 pb-0 shrink-0">
        <Button variant="secondary" size="icon" className="size-9 rounded-md shrink-0">
          <QrCode size={16} />
        </Button>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="font-semibold text-lg leading-7 text-foreground">ใช้คูปองส่วนลด</p>
          <p className="text-sm text-muted-foreground leading-5">
            กรอกรหัสอ้างอิงหรือสแกน QRCode เพื่อใช้งานส่วนลด
          </p>
        </div>
        <button
          onClick={onCancel}
          className="absolute right-4 top-[15px] size-4 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">

        {/* Promotion card — landscape */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-6 items-start">
            {/* Promo image 200×200 */}
            <div className="size-[200px] rounded-xl bg-muted shrink-0 overflow-hidden">
              {promo.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={promo.imagePath} alt={promo.title} className="size-full object-cover rounded-xl" />
              ) : (
                <div className="size-full flex items-center justify-center text-7xl">
                  {promo.imagePlaceholder}
                </div>
              )}
            </div>

            {/* Promo info — justify-between to push date to bottom */}
            <div className="flex flex-col flex-1 min-w-0 self-stretch justify-between">
              {/* Top group */}
              <div className="flex flex-col gap-2">
                {/* Channel badges */}
                <div className="flex gap-2 items-center flex-wrap">
                  <Badge variant="default" className="text-xs font-semibold gap-1 px-2 py-0.5 rounded-md">
                    <HandPlatter size={12} />
                    Dine-in
                  </Badge>
                  <Badge variant="default" className="text-xs font-semibold gap-1 px-2 py-0.5 rounded-md">
                    <ShoppingBag size={12} />
                    Dine-in
                  </Badge>
                  <Badge variant="default" className="text-xs font-semibold gap-1 px-2 py-0.5 rounded-md">
                    <Truck size={12} />
                    Delivery
                  </Badge>
                </div>

                {/* Title + description */}
                <div className="flex flex-col gap-3">
                  <p className="font-semibold text-base text-foreground leading-6">{promo.title}</p>
                  <p className="text-sm text-muted-foreground leading-5 line-clamp-4">{promo.description}</p>
                </div>

                {/* Discount row */}
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <BadgePercent size={18} className="text-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">โปรโมชัน</span>
                  </div>
                  <span className="text-2xl font-semibold text-foreground leading-none">
                    {promo.discountPercent > 0 ? `ลด ${promo.discountPercent}%` : `ลด ฿${promo.discountFixed}`}
                  </span>
                </div>
              </div>

              {/* Date row — pushed to bottom */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar size={18} className="text-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">ระยะเวลาโปรโมชัน</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {promo.validFrom} – {promo.validUntil}
                </span>
              </div>
            </div>
          </div>

          {/* Code input + scan button */}
          <div className="flex gap-[10px]">
            <Input
              placeholder="กรอกรหัสส่วนลด"
              value={codeInput}
              onChange={(e) => onCodeChange(e.target.value)}
              className={`flex-1 ${codeState === 'invalid' ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            <Button variant="outline" className="gap-2 shrink-0" size="default" onClick={() => setScannerOpen(true)}>
              <ScanBarcode size={16} />
              สแกนคูปอง
            </Button>
          </div>

          {/* Validation status */}
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

        {/* Eligible items */}
        <div className="flex flex-col gap-4">
          {/* Section header */}
          <div className="flex items-center justify-between leading-none">
            <p className="font-medium text-base text-foreground">สินค้าที่ร่วมรายการ</p>
            <p className="text-base text-muted-foreground">{orderItems.length} รายการ</p>
          </div>

          {/* Items grid — bento card style */}
          <div className="bg-muted border border-border rounded-lg p-2 min-h-[80px]">
            <div className="grid grid-cols-5 gap-2">
              {orderItems.map((item, idx) => {
                const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
                const imageSrc = menuItem?.imagePath ?? '/images/promotions/item-bg.png'
                const overlayImg = idx % 3 === 0
                  ? '/images/promotions/item-overlay-a.png'
                  : '/images/promotions/item-overlay-b.png'
                const isSelected = selectedItems.has(item.lineId)
                const discountedPrice = promo.discountPercent > 0
                  ? Math.round(item.basePrice * (1 - promo.discountPercent / 100))
                  : Math.max(0, item.basePrice - promo.discountFixed)

                return (
                  <button
                    key={item.lineId}
                    onClick={() => isValid && toggleItem(item.lineId)}
                    disabled={!isValid}
                    className={`relative flex flex-col items-start overflow-hidden rounded-[14px] border text-left transition-all ${
                      !isValid
                        ? 'opacity-50 cursor-not-allowed border-border bg-card'
                        : isSelected
                          ? 'border-primary cursor-pointer'
                          : 'border-border bg-card cursor-pointer hover:border-muted-foreground'
                    }`}
                    style={isSelected ? {
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9))',
                      backgroundColor: 'var(--primary)',
                      boxShadow: 'var(--shadow-card)',
                    } : { boxShadow: 'var(--shadow-card)' }}
                  >
                    {/* Image section: 96px tall, two-layer */}
                    <div className="h-24 w-full relative overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={item.menuItemName}
                        className="absolute inset-0 size-full object-cover"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={overlayImg}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 size-full object-cover pointer-events-none"
                      />
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
                  </button>
                )
              })}
            </div>
          </div>

          {/* Discount preview */}
          {isValid && (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 rounded-xl px-4 py-3 border border-green-200 dark:border-green-900">
              <p className="font-medium text-sm text-green-700 dark:text-green-400">ส่วนลดที่จะได้รับ</p>
              <p className="font-semibold text-base text-green-700 dark:text-green-400">
                -฿{discountAmount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 flex flex-col gap-2 shrink-0">
        <Button
          className="w-full h-12 text-base font-semibold"
          disabled={codeState !== 'valid' || selectedItems.size === 0}
          onClick={() => onApply([...selectedItems])}
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

      {/* QR Scanner overlay */}
      {scannerOpen && (
        <QrScannerOverlay
          onScanned={handleQrScanned}
          onCancel={() => setScannerOpen(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// QrScannerOverlay
// ---------------------------------------------------------------------------

function QrScannerOverlay({
  onScanned,
  onCancel,
}: {
  onScanned: () => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const scannedRef = useRef(false)

  useEffect(() => {
    let active = true

    async function init() {
      // Dynamically import jsqr to avoid SSR issues
      const { default: jsQR } = await import('jsqr')
      if (!active) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        // Camera unavailable — fall back gracefully (overlay stays open)
        return
      }

      function tick() {
        if (!active) return
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code && !scannedRef.current) {
          scannedRef.current = true
          onScanned()
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    init()

    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [onScanned])

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex flex-col items-center justify-center gap-6">
      <p className="text-white text-2xl font-semibold text-center">
        สแกน QR Code คูปอง
      </p>
      <div className="relative size-[248px] rounded-[10px] border-[3px] border-destructive overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        {/* Scanning line */}
        <div className="absolute inset-x-0 h-0.5 bg-destructive/70 animate-[scanline_2s_ease-in-out_infinite]" />
      </div>
      <p className="text-white/90 text-base font-medium text-center max-w-xs leading-6">
        หันกล้องไปทาง QR Code คูปองให้อยู่ในกรอบสีแดง
      </p>
      <Button
        variant="destructive"
        className="w-60 h-14 text-base font-semibold"
        onClick={onCancel}
      >
        ยกเลิก
      </Button>
    </div>
  )
}
