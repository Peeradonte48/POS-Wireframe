'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TicketPercent, Trash2, BadgePercent, Calendar, CheckCircle2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PROMOTIONS, type Promotion } from '@/lib/mock-data/promotions'
import { MENU_ITEMS } from '@/lib/mock-data/menu'
import { useBillStore } from '@/stores/bill.store'
import type { PromotionDiscount } from '@/stores/bill.store'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PromotionSummaryProps {
  promotions: PromotionDiscount[]
  discountTotal: number
  tableId: string
  lineItems: OrderLineItem[]
}

// ---------------------------------------------------------------------------
// PromoDetailState (local)
// ---------------------------------------------------------------------------

type PromoDetailState = {
  promo: Promotion
  couponCode: string
  amount: number
  selectedLineIds: string[]
} | null

// ---------------------------------------------------------------------------
// PromotionSummary
// ---------------------------------------------------------------------------

export function PromotionSummary({ promotions, discountTotal: _discountTotal, tableId, lineItems }: PromotionSummaryProps) {
  const router = useRouter()
  const { removePromotionDiscount } = useBillStore()

  // ---- Coupon list overflow (show first 3; expand when > 3) ----
  const [showAllCoupons, setShowAllCoupons] = useState(false)
  const visibleCoupons = showAllCoupons ? promotions : promotions.slice(0, 3)

  // ---- Promo detail sheet (read-only view of applied coupon) ----
  const [promoDetail, setPromoDetail] = useState<PromoDetailState>(null)

  return (
    <>
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
              aria-expanded={promoDetail?.couponCode === d.couponCode}
              onClick={() =>
                promo &&
                setPromoDetail({
                  promo,
                  couponCode: d.couponCode,
                  amount: d.amount,
                  selectedLineIds: d.selectedLineIds ?? [],
                })
              }
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                promo &&
                setPromoDetail({
                  promo,
                  couponCode: d.couponCode,
                  amount: d.amount,
                  selectedLineIds: d.selectedLineIds ?? [],
                })
              }
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-status-warning/30 bg-status-warning-bg cursor-pointer transition-colors hover:opacity-90"
            >
              <TicketPercent size={16} className="text-status-warning shrink-0" />
              <span className="text-sm font-medium flex-1 text-foreground">{d.couponCode}</span>
              <span className="text-sm font-semibold text-status-warning">
                -฿{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  removePromotionDiscount(tableId, d.couponCode)
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )
        })}

        {promotions.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-0 text-primary font-medium w-full justify-center hover:bg-transparent hover:opacity-80"
            onClick={() => setShowAllCoupons((v) => !v)}
          >
            <TicketPercent size={14} />
            {showAllCoupons ? 'ซ่อนส่วนลด' : `ดูส่วนลดทั้งหมด (${promotions.length})`}
          </Button>
        )}
      </div>

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
                      <Image
                        src={promoDetail.promo.imagePath}
                        alt={promoDetail.promo.title}
                        width={200}
                        height={200}
                        className="size-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-7xl">
                        {promoDetail.promo.imagePlaceholder}
                      </div>
                    )}
                  </div>

                  {/* Promo info */}
                  <div className="flex flex-col flex-1 min-w-0 self-stretch justify-between">
                    <div className="flex flex-col gap-3">
                      <p className="font-semibold text-base text-foreground leading-6">
                        {promoDetail.promo.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-5">
                        {promoDetail.promo.description}
                      </p>
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
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-status-success/30 bg-status-success-bg">
                    <CheckCircle2 size={18} className="text-status-success shrink-0" />
                    <span className="text-sm font-semibold text-foreground flex-1">
                      {promoDetail.couponCode}
                    </span>
                    <span className="text-base font-bold text-status-success">
                      -฿{promoDetail.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Selected items */}
                {(() => {
                  const selectedItems = lineItems.filter((i) =>
                    promoDetail.selectedLineIds.includes(i.lineId),
                  )
                  if (selectedItems.length === 0) return null
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-muted-foreground">
                          รายการที่ร่วมโปรโมชัน
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedItems.length} รายการ</p>
                      </div>
                      <div className="bg-muted border border-border rounded-lg p-2">
                        <div className="grid grid-cols-5 gap-2">
                          {selectedItems.map((item, idx) => {
                            const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
                            const imageSrc =
                              menuItem?.imagePath ?? '/images/promotions/item-bg.png'
                            const overlayImg =
                              idx % 3 === 0
                                ? '/images/promotions/item-overlay-a.png'
                                : '/images/promotions/item-overlay-b.png'
                            const discountedPrice =
                              promoDetail.promo.discountPercent > 0
                                ? Math.round(
                                    item.basePrice *
                                      (1 - promoDetail.promo.discountPercent / 100),
                                  )
                                : Math.max(
                                    0,
                                    item.basePrice - promoDetail.promo.discountFixed,
                                  )
                            return (
                              <div
                                key={item.lineId}
                                className="relative flex flex-col items-start overflow-hidden rounded-[14px] border border-primary"
                                style={{
                                  backgroundImage:
                                    'linear-gradient(color-mix(in oklch, var(--background) 90%, transparent), color-mix(in oklch, var(--background) 90%, transparent))',
                                  backgroundColor: 'var(--primary)',
                                  boxShadow: 'var(--shadow-card)',
                                }}
                              >
                                {/* Image section */}
                                <div className="h-24 w-full relative overflow-hidden shrink-0">
                                  <Image
                                    src={imageSrc}
                                    alt={item.menuItemName}
                                    width={200}
                                    height={200}
                                    className="absolute inset-0 size-full object-cover"
                                  />
                                  <Image
                                    src={overlayImg}
                                    alt=""
                                    aria-hidden="true"
                                    width={200}
                                    height={200}
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
    </>
  )
}
