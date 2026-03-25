'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Minus, Plus, NotebookPen, Pill,
  Shell, Soup, Ham, Salad, Flame, Leaf, Droplets,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/lib/mock-data/menu'
import { useOrderStore } from '@/stores/order.store'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ModifierSheetProps {
  open: boolean
  onClose: () => void
  menuItem: MenuItem | null
  tableId: string
  editingLineId: string | null
  editingLineItem: OrderLineItem | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const newLineId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const GROUP_ICONS: Record<string, LucideIcon> = {
  'noodle-firmness': Shell,
  'broth-richness': Soup,
  'chashu': Ham,
  'onion': Salad,
  'spice-level': Flame,
  'garlic': Leaf,
  'broth-oil': Droplets,
}

// ---------------------------------------------------------------------------
// ModifierSheet
// ---------------------------------------------------------------------------

export function ModifierSheet({
  open,
  onClose,
  menuItem,
  tableId,
  editingLineId,
  editingLineItem,
}: ModifierSheetProps) {
  const [activeTab, setActiveTab] = useState<'customize' | 'allergy'>('customize')
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)
  const [specialRequest, setSpecialRequest] = useState('')
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Sync state when sheet opens / item changes
  useEffect(() => {
    if (!menuItem) return
    setActiveTab('customize')
    setValidationErrors(new Set())

    if (editingLineId && editingLineItem) {
      const map: Record<string, string[]> = {}
      editingLineItem.modifiers.forEach((m) => {
        if (!map[m.groupId]) map[m.groupId] = []
        map[m.groupId].push(m.optionId)
      })
      setSelections(map)
      setQuantity(editingLineItem.quantity)
      setSpecialRequest(editingLineItem.specialRequest ?? '')
    } else {
      setSelections({})
      setQuantity(1)
      setSpecialRequest('')
    }
  }, [menuItem?.id, editingLineId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Option toggle ----
  function toggleOption(groupId: string, optionId: string, type: 'single' | 'multi') {
    setSelections((prev) => {
      if (type === 'single') return { ...prev, [groupId]: [optionId] }
      const current = prev[groupId] ?? []
      const already = current.includes(optionId)
      return {
        ...prev,
        [groupId]: already ? current.filter((id) => id !== optionId) : [...current, optionId],
      }
    })
    setValidationErrors((prev) => {
      const next = new Set(prev)
      next.delete(groupId)
      return next
    })
  }

  // ---- Confirm ----
  function handleConfirm() {
    if (!menuItem) return

    const errors = new Set<string>()
    menuItem.modifierGroups.forEach((group) => {
      if (group.required && !(selections[group.id]?.length)) errors.add(group.id)
    })

    if (errors.size > 0) {
      setValidationErrors(errors)
      const firstError = menuItem.modifierGroups.find((g) => errors.has(g.id))
      if (firstError) {
        groupRefs.current[firstError.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    const modifiers = menuItem.modifierGroups.flatMap((group) => {
      const selected = selections[group.id] ?? []
      return selected.map((optionId) => ({
        groupId: group.id,
        groupLabel: group.label,
        optionId,
        optionLabel: group.options.find((o) => o.id === optionId)?.label ?? optionId,
      }))
    })

    const newItem: OrderLineItem = {
      lineId: editingLineId ?? newLineId(),
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      basePrice: menuItem.basePrice,
      modifiers,
      spiceLevel: null,
      specialRequest,
      quantity,
      status: editingLineId ? (editingLineItem?.status ?? 'unsent') : 'unsent',
    }

    if (editingLineId) {
      useOrderStore.getState().editItem(tableId, editingLineId, newItem)
    } else {
      useOrderStore.getState().addItem(tableId, newItem)
    }

    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Sheet panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[10px] bg-background border border-border',
          'transition-transform duration-300 ease-out',
          'max-h-[92vh]',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ boxShadow: 'var(--shadow-panel)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-0 shrink-0">
          <div className="h-2 w-24 rounded-full bg-muted" />
        </div>

        {menuItem && (
          <>
            {/* Item name */}
            <div className="px-4 pt-4 pb-4 shrink-0">
              <h2 className="text-lg font-semibold leading-none text-foreground">{menuItem.name}</h2>
            </div>

            {/* Quantity row */}
            <div className="flex items-center gap-2 px-4 pb-4 shrink-0">
              <span className="flex-1 text-base font-semibold leading-none text-card-foreground">จำนวน</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="ลด"
                  className="flex items-center justify-center size-9 rounded-md border border-input bg-background disabled:opacity-40"
                  style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                >
                  <Minus size={16} />
                </button>
                <span className="w-7 text-center text-sm tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="เพิ่ม"
                  className="flex items-center justify-center size-9 rounded-md border border-input bg-background"
                  style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-border shrink-0 mx-4" />

            {/* Segmented tab control */}
            <div className="px-4 pt-4 pb-0 shrink-0">
              <div className="flex h-9 items-center bg-muted rounded-lg p-[3px] gap-0">
                <button
                  onClick={() => setActiveTab('customize')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 h-full rounded-md text-sm font-medium transition-all',
                    activeTab === 'customize'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-foreground hover:text-foreground',
                  )}
                >
                  <NotebookPen size={14} />
                  ปรับแต่ง
                </button>
                <button
                  onClick={() => setActiveTab('allergy')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 h-full rounded-md text-sm font-medium transition-all',
                    activeTab === 'allergy'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-foreground hover:text-foreground',
                  )}
                >
                  <Pill size={14} />
                  แพ้อาหาร
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto pb-32">
              {activeTab === 'customize' ? (
                <div className="flex flex-col gap-4 px-4 pt-4">
                  {menuItem.modifierGroups.length > 0 ? (
                    menuItem.modifierGroups.map((group) => {
                      const hasError = validationErrors.has(group.id)
                      const selected = selections[group.id] ?? []
                      const IconComp = GROUP_ICONS[group.id]

                      return (
                        <div
                          key={group.id}
                          ref={(el) => { groupRefs.current[group.id] = el }}
                          className="flex flex-col gap-2"
                        >
                          {/* Group header */}
                          <div className="flex items-center gap-1.5">
                            {IconComp && (
                              <IconComp
                                size={16}
                                className={cn(
                                  'shrink-0',
                                  hasError ? 'text-destructive' : 'text-foreground',
                                )}
                              />
                            )}
                            <span
                              className={cn(
                                'text-base font-semibold leading-none',
                                hasError ? 'text-destructive' : 'text-card-foreground',
                              )}
                            >
                              {group.label}
                            </span>
                            <span
                              className={cn(
                                'text-sm font-normal leading-snug',
                                hasError ? 'text-destructive' : 'text-muted-foreground',
                              )}
                            >
                              {group.required ? '(required)' : '(optional)'}
                            </span>
                          </div>

                          {/* Option pills */}
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((option) => {
                              const isSelected = selected.includes(option.id)
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => toggleOption(group.id, option.id, group.type)}
                                  className={cn(
                                    'px-3 py-3 rounded-lg text-sm font-medium border transition-colors leading-none',
                                    isSelected
                                      ? 'border-primary bg-primary/10 text-foreground'
                                      : hasError
                                        ? 'border-destructive/50 bg-background text-foreground'
                                        : 'border-border bg-background text-foreground hover:border-primary/50',
                                  )}
                                >
                                  {option.label}
                                  {option.priceAdj > 0 && (
                                    <span className="ml-1 text-xs opacity-60">+฿{option.priceAdj}</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                      <p className="text-sm">ไม่มีตัวเลือกปรับแต่ง</p>
                    </div>
                  )}

                  {/* Notes / Special request */}
                  <div className="flex flex-col gap-2 pb-2">
                    <span className="text-base font-semibold leading-none text-card-foreground">
                      หมายเหตุ
                    </span>
                    <textarea
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      placeholder="Placeholder"
                      rows={3}
                      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]"
                      style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                    />
                  </div>
                </div>
              ) : (
                /* แพ้อาหาร tab — placeholder */
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 px-4 mt-4">
                  <Pill size={32} className="opacity-30" />
                  <p className="text-sm text-center">
                    ระบุอาหารที่แพ้ — ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้
                  </p>
                </div>
              )}
            </div>
          {/* Sticky footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 flex flex-col gap-2 shrink-0">
            <Button
              className="w-full h-9"
              onClick={handleConfirm}
            >
              {editingLineId ? 'อัปเดตคำสั่งซื้อ' : 'เพิ่มลงในคำสั่งซื้อ'}
            </Button>
            <Button
              variant="outline"
              className="w-full h-9"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
          </div>
          </>
        )}
      </div>
    </>
  )
}
