'use client'

import { type Promotion } from '@/lib/mock-data/promotions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromotionListProps {
  promotions: Promotion[]
  /** IDs of promotions already applied */
  appliedIds: string[]
  /** Called when a promotion tile is tapped to open the coupon entry sheet */
  onSelect: (promotionId: string) => void
}

// ---------------------------------------------------------------------------
// PromotionList
// ---------------------------------------------------------------------------

export function PromotionList({ promotions, appliedIds, onSelect }: PromotionListProps) {
  return (
    <div className="flex flex-col gap-3">
      {promotions.map((promo) => {
        const isApplied = appliedIds.includes(promo.id)

        return (
          <button
            key={promo.id}
            onClick={() => !isApplied && onSelect(promo.id)}
            disabled={isApplied}
            className={`bg-background border rounded-2xl p-4 flex items-start gap-4 text-left w-full transition-colors ${
              isApplied
                ? 'border-status-success/40 bg-status-success-bg opacity-80 cursor-default'
                : 'border-border hover:bg-accent cursor-pointer'
            }`}
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
                {isApplied && (
                  <span className="text-xs font-semibold text-status-success bg-status-success/10 px-2 py-0.5 rounded-md ml-auto">
                    ใช้งานแล้ว
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
