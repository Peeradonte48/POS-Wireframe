'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, ShoppingBag, CircleX, CookingPot, Minus, Plus, Shell, Soup, Ham, Salad, Flame, Droplets, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { OrderLineItem } from '@/stores/order.store'
import { MENU_ITEMS } from '@/lib/mock-data/menu'

// ---------------------------------------------------------------------------
// Module-level lookups (stable, no re-computation per render)
// ---------------------------------------------------------------------------

const MENU_ITEM_MAP = new Map(MENU_ITEMS.map((m) => [m.id, m]))

const MODIFIER_LUCIDE_MAP: Record<string, LucideIcon> = {
  'noodle-firmness': Shell,
  'broth-richness': Soup,
  'chashu': Ham,
  'onion': Salad,
  'spice-level': Flame,
  'garlic': Salad,
  'broth-oil': Droplets,
}

// ---------------------------------------------------------------------------
// Helper: build modifier summary string (kept for backward-compat)
// ---------------------------------------------------------------------------

export function buildModifierSummary(item: OrderLineItem): string {
  const parts: string[] = []
  if (item.modifiers.length > 0) {
    parts.push(item.modifiers.map((m) => m.optionLabel).join(' · '))
  }
  if (item.specialRequest && item.specialRequest.trim().length > 0) {
    const req = item.specialRequest.trim()
    parts.push(`"${req.length > 20 ? req.slice(0, 20) + '…' : req}"`)
  }
  return parts.join(' · ')
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ItemThumbnail({ item, size = 60, rounded = 'rounded-xl' }: { item: OrderLineItem; size?: number; rounded?: string }) {
  const menuItem = MENU_ITEM_MAP.get(item.menuItemId)
  return (
    <div
      className={cn('overflow-hidden shrink-0 bg-muted relative', rounded)}
      style={{ width: size, height: size }}
    >
      {menuItem?.imagePath ? (
        <Image
          src={menuItem.imagePath}
          alt={item.menuItemName}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {menuItem?.thumbnailPlaceholder ?? '🍜'}
        </div>
      )}
    </div>
  )
}

function ModifierChips({ item }: { item: OrderLineItem }) {
  if (item.modifiers.length === 0 && !item.specialRequest?.trim()) return null
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0">
      {item.modifiers.map((mod) => {
        const IconComp = MODIFIER_LUCIDE_MAP[mod.groupId]
        return (
          <span key={`${mod.groupId}-${mod.optionId}`} className="text-xs text-muted-foreground leading-4 flex items-center gap-1 py-0.5">
            {IconComp && <IconComp size={12} className="shrink-0" />}
            <span>{mod.optionLabel}</span>
          </span>
        )
      })}
      {item.specialRequest?.trim() && (
        <span className="text-xs text-muted-foreground leading-4 italic py-0.5">
          &ldquo;{item.specialRequest.trim().slice(0, 20)}{item.specialRequest.trim().length > 20 ? '…' : ''}&rdquo;
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TicketLineItemProps {
  item: OrderLineItem
  onRemove: (lineId: string) => void
  onQtyChange: (lineId: string, delta: number) => void
  onEditTap: (lineId: string) => void
  onVoidTap: (lineId: string) => void
  canRemove?: boolean
  showPackToGo?: boolean
  onTogglePackToGo?: (lineId: string) => void
}

// ---------------------------------------------------------------------------
// TicketLineItem
// ---------------------------------------------------------------------------

export function TicketLineItem({
  item,
  onRemove,
  onQtyChange,
  onEditTap,
  onVoidTap,
  canRemove = true,
  showPackToGo = false,
  onTogglePackToGo,
}: TicketLineItemProps) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const lineTotal = (item.basePrice * item.quantity).toFixed(0)

  // ── Voided ──────────────────────────────────────────────────────────────
  if (item.status === 'voided') {
    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Details row */}
        <div className="flex gap-2 items-start">
          <ItemThumbnail item={item} size={84} rounded="rounded-md" />
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{item.menuItemName}</span>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 h-auto shrink-0">
                  {item.quantity}×
                </Badge>
              </div>
              <span className="text-sm text-card-foreground shrink-0">฿{lineTotal}</span>
            </div>
            <ModifierChips item={item} />
          </div>
        </div>

        {/* Voided status button */}
        <Button
          variant="secondary"
          className="w-full h-9 gap-2 opacity-50 cursor-default"
          disabled
        >
          <CircleX size={16} className="text-destructive" />
          ยกเลิกแบบตัดสต๊อก
        </Button>

        <Separator />
      </div>
    )
  }

  // ── Sent ────────────────────────────────────────────────────────────────
  if (item.status === 'sent') {
    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Details row */}
        <div className="flex gap-2 items-start">
          <ItemThumbnail item={item} size={84} rounded="rounded-md" />
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {/* Name + qty badge + price */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{item.menuItemName}</span>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 h-auto shrink-0">
                  {item.quantity}×
                </Badge>
                {showPackToGo && item.packToGo && (
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center shrink-0">
                    <ShoppingBag size={12} />
                  </Badge>
                )}
              </div>
              <span className="text-sm text-card-foreground shrink-0">฿{lineTotal}</span>
            </div>
            {/* Modifier chips */}
            <ModifierChips item={item} />
          </div>
        </div>

        {/* Action row */}
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => onVoidTap(item.lineId)}
            aria-label="Void item"
          >
            <CircleX size={16} />
          </Button>
          <Button
            variant="secondary"
            className="flex-1 h-9 gap-2 opacity-50 cursor-default"
            disabled
            aria-label="Sent to kitchen"
          >
            <CookingPot size={16} />
            ส่งเข้าครัวแล้ว
          </Button>
        </div>

        <Separator />
      </div>
    )
  }

  // ── Unsent ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Details row */}
      <button className="flex gap-2 items-start w-full text-left" onClick={() => onEditTap(item.lineId)}>
        <ItemThumbnail item={item} size={84} rounded="rounded-md" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Name + qty badge + price */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{item.menuItemName}</span>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 h-auto shrink-0">
                {item.quantity}×
              </Badge>
              {showPackToGo && item.packToGo && (
                <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center shrink-0">
                  <ShoppingBag size={12} />
                </Badge>
              )}
            </div>
            <span className="text-sm text-card-foreground shrink-0">฿{lineTotal}</span>
          </div>
          {/* Modifier chips */}
          <ModifierChips item={item} />
        </div>
      </button>

      {/* Actions row */}
      <div className="flex items-center justify-between">
        {/* Number stepper */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-12 shrink-0"
            onClick={() => onQtyChange(item.lineId, -1)}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </Button>
          <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="size-12 shrink-0"
            onClick={() => onQtyChange(item.lineId, 1)}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {showPackToGo && (
            <Button
              variant="outline"
              className={cn(
                'h-12 gap-2 text-sm',
                item.packToGo && 'border-primary text-primary'
              )}
              onClick={() => onTogglePackToGo?.(item.lineId)}
              aria-label={item.packToGo ? 'Remove pack-to-go flag' : 'Flag as pack-to-go'}
            >
              <ShoppingBag size={16} />
              สั่งกลับบ้าน
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-12 shrink-0"
            onClick={() => canRemove && setConfirmRemove(true)}
            disabled={!canRemove}
            aria-label="Remove item"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="w-[320px] max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>ลบรายการ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">&ldquo;{item.menuItemName}&rdquo; จะถูกลบออกจากออร์เดอร์</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRemove(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onRemove(item.lineId)
                setConfirmRemove(false)
              }}
            >
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
