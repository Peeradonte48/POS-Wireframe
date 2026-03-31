'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { MENU_CATEGORIES, MENU_ITEMS } from '@/lib/mock-data/menu'
import { useManagerStore } from '@/stores/manager.store'
import { useSessionStore } from '@/stores/session.store'
import { canDoAction } from '@/lib/role-permissions'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function EightySixTab() {
  const { eightySixedIds, toggleEightySix } = useManagerStore()
  const role = useSessionStore((s) => s.role)!
  const [pendingToggle, setPendingToggle] = useState<{ id: string; name: string } | null>(null)

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
            <p className="caps">
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
                <label className="flex items-center justify-center p-3 -m-3 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    id={`86d-${item.id}`}
                    checked={is86d}
                    onChange={() => {
                      if (!canDoAction(role, 'eighty-six-toggle')) return
                      if (!is86d) {
                        // marking as 86'd — requires confirmation
                        setPendingToggle({ id: item.id, name: item.name })
                      } else {
                        // un-86-ing — not destructive, no confirmation needed
                        toggleEightySix(item.id)
                        toast(`${item.name} available`)
                      }
                    }}
                    disabled={!canDoAction(role, 'eighty-six-toggle')}
                    className="accent-primary h-4 w-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
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

      <Dialog open={pendingToggle !== null} onOpenChange={(open) => { if (!open) setPendingToggle(null) }}>
        <DialogContent className="w-[320px] max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>86 รายการนี้?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &ldquo;{pendingToggle?.name}&rdquo; จะไม่สามารถสั่งได้จนกว่าจะยกเลิก 86
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingToggle(null)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!pendingToggle) return
                toggleEightySix(pendingToggle.id)
                toast.success(`${pendingToggle.name} 86'd`)
                setPendingToggle(null)
              }}
            >
              86 รายการนี้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
