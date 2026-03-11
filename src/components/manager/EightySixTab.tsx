'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { MENU_CATEGORIES, MENU_ITEMS } from '@/lib/mock-data/menu'
import { useManagerStore } from '@/stores/manager.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { Badge } from '@/components/ui/badge'

export function EightySixTab() {
  const { eightySixedIds, toggleEightySix } = useManagerStore()
  const role = useSessionStore((s) => s.role)!

  const grouped = useMemo(() => {
    return MENU_CATEGORIES.map((cat) => ({
      category: cat,
      items: MENU_ITEMS.filter((item) => item.categoryId === cat.id),
    })).filter((g) => g.items.length > 0)
  }, [])

  return (
    <div className="divide-y">
      {grouped.map(({ category, items }) => (
        <div key={category.id}>
          {/* Category header */}
          <div className="px-4 py-2 bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {category.label}
            </p>
          </div>
          {/* Items */}
          {items.map((item) => {
            const is86d = eightySixedIds.includes(item.id)
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              >
                <input
                  type="checkbox"
                  id={`86d-${item.id}`}
                  checked={is86d}
                  onChange={() => {
                    if (!canDoAction(role, 'eighty-six-toggle')) return
                    const willBe86d = !is86d
                    toggleEightySix(item.id)
                    if (willBe86d) {
                      toast.success(`${item.name} 86'd`)
                    } else {
                      toast(`${item.name} available`)
                    }
                  }}
                  disabled={!canDoAction(role, 'eighty-six-toggle')}
                  className="accent-primary h-4 w-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor={`86d-${item.id}`}
                  className="flex-1 text-sm cursor-pointer select-none"
                >
                  {item.name}
                  <span className="text-xs text-muted-foreground ml-1">({item.nameTh})</span>
                </label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  ฿{item.basePrice.toLocaleString()}
                </span>
                {is86d && (
                  <Badge variant="outline" className="text-xs">86&apos;d</Badge>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
