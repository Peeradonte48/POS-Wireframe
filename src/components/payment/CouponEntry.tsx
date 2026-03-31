'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BadgePercent,
  Calendar,
  CheckCircle2,
  HandPlatter,
  ScanBarcode,
  ShoppingBag,
  Truck,
  X,
  XCircle,
  QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MENU_ITEMS } from '@/lib/mock-data/menu'
import type { Promotion } from '@/lib/mock-data/promotions'
import type { CouponCodeState } from '@/components/payment/usePromotionValidation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderItem {
  lineId: string
  menuItemId: string
  menuItemName: string
  basePrice: number
  quantity: number
}

interface CouponEntryProps {
  promo: Promotion
  codeInput: string
  codeState: CouponCodeState
  orderItems: OrderItem[]
  onCodeChange: (value: string) => void
  onApply: (selectedLineIds: string[]) => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// CouponEntry
// ---------------------------------------------------------------------------

export function CouponEntry({
  promo,
  codeInput,
  codeState,
  orderItems,
  onCodeChange,
  onApply,
  onCancel,
}: CouponEntryProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [scannerOpen, setScannerOpen] = useState(false)

  // Auto-select all items when code becomes valid; clear when invalidated
  // Using key-based remount is not applicable here because we need to auto-select
  // all items reactively when codeState transitions to valid
  useEffect(() => {
    if (codeState === 'valid') {
      setSelectedItems(new Set(orderItems.map((i) => i.lineId)))
    } else {
      setSelectedItems(new Set())
    }
  }, [codeState, orderItems])

  function handleQrScanned() {
    setScannerOpen(false)
    onCodeChange(promo.referenceCode)
  }

  function toggleItem(lineId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(lineId)) next.delete(lineId)
      else next.add(lineId)
      return next
    })
  }

  const isValid = codeState === 'valid'

  const selectedSubtotal = orderItems
    .filter((i) => selectedItems.has(i.lineId))
    .reduce((sum, i) => sum + i.basePrice * i.quantity, 0)

  const discountAmount = promo.discountFixed > 0
    ? Math.min(promo.discountFixed, selectedSubtotal)
    : Math.round(selectedSubtotal * (promo.discountPercent / 100))

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

            {/* Promo info */}
            <div className="flex flex-col flex-1 min-w-0 self-stretch justify-between">
              {/* Top group */}
              <div className="flex flex-col gap-2">
                {/* Channel badges */}
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
                    <HandPlatter size={12} />
                    Dine-in
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
                    <ShoppingBag size={12} />
                    Takeaway
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
                    <Truck size={12} />
                    Delivery
                  </span>
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
              <div className="size-3 rounded-full bg-status-warning animate-pulse shrink-0" />
              <p className="text-xs font-medium text-status-warning">กำลังตรวจสอบ...</p>
            </div>
          )}
          {codeState === 'valid' && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-status-success shrink-0" />
              <p className="text-xs font-medium text-status-success">รหัสอ้างอิงถูกต้อง</p>
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
            <div className="flex items-center justify-between bg-status-success-bg rounded-xl px-4 py-3 border border-status-success/30">
              <p className="font-medium text-sm text-status-success">ส่วนลดที่จะได้รับ</p>
              <p className="font-semibold text-base text-status-success">
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
// QrScannerOverlay (co-located helper)
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
