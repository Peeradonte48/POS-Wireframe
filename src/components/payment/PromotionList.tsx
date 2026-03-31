'use client'

import Image from 'next/image'
import { BadgePercent, Calendar, HandPlatter, ShoppingBag, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type Promotion, type PromotionChannel } from '@/lib/mock-data/promotions'

// ---------------------------------------------------------------------------
// Channel badge config
// ---------------------------------------------------------------------------

const CHANNEL_CONFIG: Record<PromotionChannel, { label: string; icon: typeof HandPlatter }> = {
  'dine-in':  { label: 'Dine-in',  icon: HandPlatter },
  'takeaway': { label: 'Takeaway', icon: ShoppingBag },
  'delivery': { label: 'Delivery', icon: Truck },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromotionListProps {
  promotions: Promotion[]
  appliedIds: string[]
  onSelect: (promotionId: string) => void
}

// ---------------------------------------------------------------------------
// PromotionList
// ---------------------------------------------------------------------------

export function PromotionList({ promotions, appliedIds, onSelect }: PromotionListProps) {
  return (
    <div className="bg-muted border border-border rounded-md px-3 py-2 flex flex-col gap-4">
      {promotions.map((promo) => {
        const isApplied = appliedIds.includes(promo.id)
        const discountLabel = promo.discountPercent > 0
          ? `ลด ${promo.discountPercent}%`
          : `ลด ฿${promo.discountFixed}`

        return (
          <button
            key={promo.id}
            onClick={() => !isApplied && onSelect(promo.id)}
            disabled={isApplied}
            className={`w-full text-left transition-colors ${
              isApplied ? 'opacity-80 cursor-default' : 'cursor-pointer'
            }`}
          >
            <div
              className="bg-popover border border-border rounded-md p-4 flex gap-6 items-start"
              style={{ boxShadow: 'var(--shadow-card, 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.1))' }}
            >
              {/* Image */}
              <div className="size-[200px] rounded-lg shrink-0 overflow-hidden bg-muted">
                {promo.imagePath ? (
                  <Image src={promo.imagePath} alt={promo.title} width={200} height={200} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-5xl">
                    {promo.imagePlaceholder}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 justify-between self-stretch">
                <div className="flex flex-col gap-2">
                  {/* Channel badges */}
                  <div className="flex gap-2 items-center flex-wrap">
                    {promo.channels.map((ch) => {
                      const cfg = CHANNEL_CONFIG[ch]
                      const Icon = cfg.icon
                      return (
                        <Badge key={ch} variant="default" className="gap-1 text-xs">
                          <Icon size={12} />
                          {cfg.label}
                        </Badge>
                      )
                    })}
                    {isApplied && (
                      <Badge variant="settled" className="text-xs ml-auto">
                        ใช้งานแล้ว
                      </Badge>
                    )}
                  </div>

                  {/* Title + description */}
                  <div className="flex flex-col gap-3">
                    <p className="font-semibold text-base text-foreground leading-normal">
                      {promo.title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-snug line-clamp-3">
                      {promo.description}
                    </p>
                  </div>

                  {/* Discount */}
                  <div className="flex gap-2 items-end">
                    <div className="flex gap-2 items-center">
                      <BadgePercent size={18} className="text-foreground" />
                      <span className="text-sm font-medium text-foreground">โปรโมชัน</span>
                    </div>
                    <span className="text-2xl font-semibold text-primary leading-none">
                      {discountLabel}
                    </span>
                  </div>
                </div>

                {/* Date range */}
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2 items-center">
                    <Calendar size={18} className="text-foreground" />
                    <span className="text-sm font-medium text-foreground">ระยะเวลาโปรโมชัน</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {promo.validFrom} - {promo.validUntil}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
