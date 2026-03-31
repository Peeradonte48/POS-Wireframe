'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { MENU_ITEMS } from '@/lib/mock-data/menu'
import { useManagerStore } from '@/stores/manager.store'
import { useOrderStore } from '@/stores/order.store'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MenuPanelProps {
  onItemTap: (itemId: string) => void
  activeCategory: string
  tableId?: string
}

function MenuCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-6 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function MenuPanel({ onItemTap, activeCategory, tableId }: MenuPanelProps) {
  const eightySixedIds = useManagerStore((s) => s.eightySixedIds)

  const orderRounds = useOrderStore((s) => tableId ? s.orders[tableId]?.rounds : undefined)
  const itemCountMap = useMemo(() => {
    if (!orderRounds) return {} as Record<string, number>
    const map: Record<string, number> = {}
    for (const round of orderRounds) {
      for (const item of round.items) {
        if (item.status === 'unsent') {
          map[item.menuItemId] = (map[item.menuItemId] ?? 0) + item.quantity
        }
      }
    }
    return map
  }, [orderRounds])

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  const filteredItems =
    activeCategory === 'all'
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.categoryId === activeCategory)

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">No items in this category</p>
      </div>
    )
  }

  return (
    <div className="p-4 grid grid-cols-3 gap-3">
      {filteredItems.map((item) => {
        const is86d = eightySixedIds.includes(item.id)
        return (
          <button
            key={item.id}
            disabled={is86d}
            onClick={is86d ? undefined : () => onItemTap(item.id)}
            className={cn(
              'group bg-card rounded-xl overflow-hidden border text-left transition-all duration-200',
              is86d
                ? 'opacity-50 cursor-not-allowed border-border'
                : 'border-border hover:border-primary/50 hover:shadow-lg cursor-pointer active:scale-[0.98]'
            )}
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {/* Photo */}
            <div className="aspect-[4/3] relative bg-muted overflow-hidden">
              {item.imagePath ? (
                <Image
                  src={item.imagePath}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="33vw"
                />
              ) : item.unsplashId ? (
                <Image
                  src={`https://images.unsplash.com/photo-${item.unsplashId}?auto=format&fit=crop&w=400&q=80`}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-4xl bg-muted">
                  {item.thumbnailPlaceholder}
                </div>
              )}
              {is86d && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Badge variant="outline" className="bg-background text-sm font-semibold">
                    86&apos;d
                  </Badge>
                </div>
              )}
            </div>

            {/* Info */}
            {(() => {
              const count = itemCountMap[item.id] ?? 0
              return (
                <div className="p-6 flex items-end justify-between gap-2">
                  <div className="flex flex-col gap-2 min-w-0">
                    <p className="text-[18px] font-semibold leading-7 truncate">{item.name}</p>
                    <p className="text-sm font-bold leading-5 text-primary">฿{item.basePrice}</p>
                  </div>
                  {count > 0 && (
                    <div
                      className="shrink-0 size-9 rounded-full border border-primary bg-card text-foreground flex items-center justify-center"
                      style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
                    >
                      <span className="text-sm font-medium leading-none">{count}</span>
                    </div>
                  )}
                </div>
              )
            })()}
          </button>
        )
      })}
    </div>
  )
}
