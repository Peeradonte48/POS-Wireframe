'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, NotebookPen, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/lib/mock-data/menu'
import { useOrderStore } from '@/stores/order.store'
import type { OrderLineItem } from '@/stores/order.store'
import { ForcedModifiersPanel } from '@/components/order/ForcedModifiersPanel'

export interface ModifierSheetProps {
  open: boolean
  onClose: () => void
  menuItem: MenuItem | null
  tableId: string
  editingLineId: string | null
  editingLineItem: OrderLineItem | null
}

const newLineId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

// ModifierSheetContent — key-remounted per item/edit session

function ModifierSheetContent({
  menuItem,
  tableId,
  editingLineId,
  editingLineItem,
  onClose,
}: Omit<ModifierSheetProps, 'open'> & { menuItem: MenuItem }) {
  const [activeTab, setActiveTab] = useState<'customize' | 'allergy'>('customize')
  const [quantity, setQuantity] = useState(() => editingLineItem?.quantity ?? 1)
  const [specialRequest, setSpecialRequest] = useState(() => editingLineItem?.specialRequest ?? '')
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    if (!editingLineItem) return {}
    const map: Record<string, string[]> = {}
    editingLineItem.modifiers.forEach((m) => {
      if (!map[m.groupId]) map[m.groupId] = []
      map[m.groupId].push(m.optionId)
    })
    return map
  })
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

  function handleSelect(groupId: string, optionId: string, type: 'single' | 'multi') {
    setSelections((prev) => {
      if (type === 'single') return { ...prev, [groupId]: [optionId] }
      const current = prev[groupId] ?? []
      const already = current.includes(optionId)
      return { ...prev, [groupId]: already ? current.filter((id) => id !== optionId) : [...current, optionId] }
    })
    setValidationErrors((prev) => { const next = new Set(prev); next.delete(groupId); return next })
  }

  function handleConfirm() {
    const errors = new Set<string>()
    menuItem.modifierGroups.forEach((g) => { if (g.required && !selections[g.id]?.length) errors.add(g.id) })
    if (errors.size > 0) {
      setValidationErrors(errors)
      const first = menuItem.modifierGroups.find((g) => errors.has(g.id))
      if (first) groupRefs.current[first.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const modifiers = menuItem.modifierGroups.flatMap((group) =>
      (selections[group.id] ?? []).map((optionId) => ({
        groupId: group.id,
        groupLabel: group.label,
        optionId,
        optionLabel: group.options.find((o) => o.id === optionId)?.label ?? optionId,
      })),
    )
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
    if (editingLineId) useOrderStore.getState().editItem(tableId, editingLineId, newItem)
    else useOrderStore.getState().addItem(tableId, newItem)
    onClose()
  }

  return (
    <>
      <div className="px-4 pt-4 pb-4 shrink-0">
        <h2 className="text-lg font-semibold leading-none text-foreground">{menuItem.name}</h2>
      </div>

      {/* Quantity row */}
      <div className="flex items-center gap-2 px-4 pb-4 shrink-0">
        <span className="flex-1 text-base font-semibold leading-none text-card-foreground">จำนวน</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="ลด"
            className="flex items-center justify-center size-9 rounded-md border border-input bg-background disabled:opacity-40"
            style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
            <Minus size={16} />
          </button>
          <span className="w-7 text-center text-sm tabular-nums">{quantity}</span>
          <button onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="เพิ่ม"
            className="flex items-center justify-center size-9 rounded-md border border-input bg-background"
            style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="h-px bg-border shrink-0 mx-4" />

      {/* Segmented tab control */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <div className="flex h-9 items-center bg-muted rounded-lg p-[3px] gap-0">
          {(['customize', 'allergy'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 h-full rounded-md text-sm font-medium transition-all',
                activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-foreground hover:text-foreground',
              )}
            >
              {tab === 'customize' ? <><NotebookPen size={14} /> ปรับแต่ง</> : <><Pill size={14} /> แพ้อาหาร</>}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-32">
        {activeTab === 'customize' ? (
          <div className="flex flex-col gap-4 px-4 pt-4">
            <ForcedModifiersPanel
              modifierGroups={menuItem.modifierGroups}
              selections={selections}
              onSelect={handleSelect}
              errors={validationErrors}
              groupRefs={groupRefs}
            />
            <div className="flex flex-col gap-2 pb-2">
              <span className="text-base font-semibold leading-none text-card-foreground">หมายเหตุ</span>
              <textarea value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="Placeholder" rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]"
                style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 px-4 mt-4">
            <Pill size={32} className="opacity-30" />
            <p className="text-sm text-center">ระบุอาหารที่แพ้ — ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้</p>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 flex flex-col gap-2 shrink-0">
        <Button className="w-full h-9" onClick={handleConfirm}>
          {editingLineId ? 'อัปเดตคำสั่งซื้อ' : 'เพิ่มลงในคำสั่งซื้อ'}
        </Button>
        <Button variant="outline" className="w-full h-9" onClick={onClose}>ยกเลิก</Button>
      </div>
    </>
  )
}

// ModifierSheet — orchestrator

export function ModifierSheet({ open, onClose, menuItem, tableId, editingLineId, editingLineItem }: ModifierSheetProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[10px] bg-background border border-border',
          'transition-transform duration-300 ease-out max-h-[92vh]',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ boxShadow: 'var(--shadow-panel)' }}
      >
        <div className="flex justify-center pt-4 pb-0 shrink-0">
          <div className="h-2 w-24 rounded-full bg-muted" />
        </div>
        {menuItem && (
          <ModifierSheetContent
            key={`${menuItem.id}-${editingLineId ?? 'new'}`}
            menuItem={menuItem}
            tableId={tableId}
            editingLineId={editingLineId}
            editingLineItem={editingLineItem}
            onClose={onClose}
          />
        )}
      </div>
    </>
  )
}
