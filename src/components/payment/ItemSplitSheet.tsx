'use client'

import { useState, useMemo } from 'react'
import { ScissorsLineDashed, CirclePlus, Trash2, Minus, Plus, UserPlus, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useBillStore } from '@/stores/bill.store'
import { MENU_ITEMS } from '@/lib/mock-data/menu'
import type { OrderLineItem } from '@/stores/order.store'
import { Shell, Soup, Ham, Salad, Flame, Droplets, Sprout, Tag } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillAssignment {
  lineId: string
  qty: number
}

interface BillBucket {
  id: number
  assignments: BillAssignment[]
}

interface ItemSplitSheetProps {
  open: boolean
  onClose: () => void
  tableId: string
  orderItems: OrderLineItem[]
  onProceed: () => void
}

const MODIFIER_ICONS: Record<string, LucideIcon> = {
  'noodle-firmness': Shell,
  'broth-richness': Soup,
  'chashu': Ham,
  'onion': Salad,
  'spice-level': Flame,
  'garlic': Sprout,
  'broth-oil': Droplets,
}

// ---------------------------------------------------------------------------
// ItemSplitSheet
// ---------------------------------------------------------------------------

export function ItemSplitSheet({
  open,
  onClose,
  tableId,
  orderItems,
  onProceed,
}: ItemSplitSheetProps) {
  const [bills, setBills] = useState<BillBucket[]>([
    { id: 1, assignments: [] },
    { id: 2, assignments: [] },
    { id: 3, assignments: [] },
  ])
  const [nextBillId, setNextBillId] = useState(4)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

  // Reset when sheet opens
  const handleOpenChange = (o: boolean) => {
    if (!o) {
      onClose()
    } else {
      setBills([
        { id: 1, assignments: [] },
        { id: 2, assignments: [] },
        { id: 3, assignments: [] },
      ])
      setNextBillId(4)
      setSelectedLineId(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  // Total qty assigned to all bills for a given lineId
  const assignedQtyFor = (lineId: string) =>
    bills.reduce((sum, bill) => {
      const a = bill.assignments.find((a) => a.lineId === lineId)
      return sum + (a?.qty ?? 0)
    }, 0)

  const isFullyAssigned = (lineId: string) => {
    const item = orderItems.find((i) => i.lineId === lineId)
    return !!item && assignedQtyFor(lineId) >= item.quantity
  }

  const allAssigned = orderItems.every((item) => isFullyAssigned(item.lineId))

  // Error: all items are in exactly 1 bill (no actual split)
  const billsWithItems = bills.filter((b) => b.assignments.length > 0)
  const allInOneBill = allAssigned && billsWithItems.length <= 1

  const canConfirm = allAssigned && !allInOneBill

  // ---------------------------------------------------------------------------
  // Item actions
  // ---------------------------------------------------------------------------

  function handleSelectItem(lineId: string) {
    setSelectedLineId((prev) => (prev === lineId ? null : lineId))
  }

  function handleAddToBill(billId: number) {
    if (!selectedLineId) return
    const item = orderItems.find((i) => i.lineId === selectedLineId)
    if (!item) return

    setBills((prev) => {
      const assignedInOtherBills = prev
        .filter((b) => b.id !== billId)
        .reduce((sum, b) => {
          const a = b.assignments.find((a) => a.lineId === selectedLineId)
          return sum + (a?.qty ?? 0)
        }, 0)
      const remaining = item.quantity - assignedInOtherBills
      if (remaining <= 0) return prev

      return prev.map((bill) => {
        if (bill.id !== billId) return bill
        const existing = bill.assignments.find((a) => a.lineId === selectedLineId)
        if (existing) {
          const newQty = Math.min(existing.qty + 1, remaining)
          return {
            ...bill,
            assignments: bill.assignments.map((a) =>
              a.lineId === selectedLineId ? { ...a, qty: newQty } : a,
            ),
          }
        }
        return {
          ...bill,
          assignments: [...bill.assignments, { lineId: selectedLineId, qty: 1 }],
        }
      })
    })
    setSelectedLineId(null)
  }

  function handleAdjustQty(billId: number, lineId: string, delta: number) {
    const item = orderItems.find((i) => i.lineId === lineId)
    if (!item) return

    setBills((prev) => {
      const assignedInOtherBills = prev
        .filter((b) => b.id !== billId)
        .reduce((sum, b) => {
          const a = b.assignments.find((a) => a.lineId === lineId)
          return sum + (a?.qty ?? 0)
        }, 0)
      const maxForThisBill = item.quantity - assignedInOtherBills

      return prev.map((bill) => {
        if (bill.id !== billId) return bill
        return {
          ...bill,
          assignments: bill.assignments
            .map((a) => {
              if (a.lineId !== lineId) return a
              const newQty = Math.max(0, Math.min(a.qty + delta, maxForThisBill))
              return { ...a, qty: newQty }
            })
            .filter((a) => a.qty > 0),
        }
      })
    })
  }

  function handleRemoveFromBill(billId: number, lineId: string) {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== billId) return bill
        return { ...bill, assignments: bill.assignments.filter((a) => a.lineId !== lineId) }
      }),
    )
  }

  function handleDeleteBill(billId: number) {
    setBills((prev) => prev.filter((b) => b.id !== billId))
  }

  function handleAddBill() {
    setBills((prev) => [...prev, { id: nextBillId, assignments: [] }])
    setNextBillId((n) => n + 1)
  }

  // ---------------------------------------------------------------------------
  // Confirm
  // ---------------------------------------------------------------------------

  function handleConfirm() {
    if (!canConfirm) return
    const { initCustomSplit, setCustomAmount } = useBillStore.getState()
    const activeBills = bills.filter((b) => b.assignments.length > 0)
    initCustomSplit(tableId, activeBills.length)
    activeBills.forEach((bill, i) => {
      const total = bill.assignments.reduce((sum, a) => {
        const item = orderItems.find((o) => o.lineId === a.lineId)
        return sum + (item?.basePrice ?? 0) * a.qty
      }, 0)
      setCustomAmount(tableId, i, total)
    })
    onProceed()
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function getBillTotal(bill: BillBucket) {
    return bill.assignments.reduce((sum, a) => {
      const item = orderItems.find((o) => o.lineId === a.lineId)
      return sum + (item?.basePrice ?? 0) * a.qty
    }, 0)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className="h-[95vh] flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <div className="flex gap-[10px] items-start px-6 pt-6 pb-4 shrink-0">
          <Button variant="secondary" size="icon" className="shrink-0" aria-label="แยกบิล">
            <ScissorsLineDashed size={16} />
          </Button>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="font-semibold text-lg leading-7">แยกบิลหารตามรายการ</p>
            <p className="text-sm text-muted-foreground leading-5">
              เลือกรายการอาหารที่ต้องแยกแบบกำหนดเอง
            </p>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 gap-6 px-6 pb-4 overflow-hidden">

          {/* Left: order items */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div
              className="bg-card border border-border rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="px-6 py-4 shrink-0">
                <p className="font-semibold text-base tracking-tight truncate">รายการอาหาร</p>
              </div>
              <div className="flex-1 bg-muted border-t border-border min-h-[80px] overflow-hidden">
                {allAssigned ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8 px-6">
                    <p className="font-medium text-base text-foreground leading-none">
                      รายการอาหารแยกบิลครบแล้ว
                    </p>
                    <p className="text-sm text-muted-foreground leading-5">
                      ยืนยันข้อมูลและทำการชำระเงิน
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full px-3 py-2">
                    <div className="flex flex-col gap-2">
                      {orderItems.filter((item) => !isFullyAssigned(item.lineId)).map((item) => {
                        const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
                        const isSelected = selectedLineId === item.lineId
                        const assigned = assignedQtyFor(item.lineId)
                        const remaining = item.quantity - assigned
                        const isPartial = assigned > 0
                        return (
                          <div
                            key={item.lineId}
                            className={`bg-card border rounded-xl overflow-hidden transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                            style={{ boxShadow: 'var(--shadow-card)' }}
                          >
                            {/* Item content */}
                            <div className="flex flex-col gap-4 items-start p-6">
                              <div className="flex gap-2 items-start w-full">
                                {/* Thumbnail */}
                                <div className="relative rounded-md shrink-0 size-[54px] overflow-hidden bg-accent">
                                  {menuItem?.imagePath ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={menuItem.imagePath}
                                      alt={item.menuItemName}
                                      className="absolute inset-0 size-full object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-xl">
                                      {menuItem?.thumbnailPlaceholder ?? '🍜'}
                                    </div>
                                  )}
                                </div>
                                {/* Name + modifiers */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                  <p className="font-medium text-sm leading-5 text-foreground whitespace-nowrap">
                                    {item.menuItemName}
                                  </p>
                                  {item.modifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-x-2 gap-y-0">
                                      {item.modifiers.map((mod) => {
                                        const Icon = MODIFIER_ICONS[mod.groupId] ?? Tag
                                        return (
                                          <span
                                            key={`${mod.groupId}-${mod.optionId}`}
                                            className="flex items-center gap-1 py-0.5"
                                          >
                                            <Icon size={12} className="text-muted-foreground shrink-0" />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                              {mod.optionLabel}
                                            </span>
                                          </span>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Qty + remaining + price */}
                              <div className="flex items-center gap-2 w-full">
                                <div className="bg-background border border-border rounded-md shrink-0 px-2 py-0.5">
                                  <span className="text-xs font-semibold text-foreground">
                                    {item.quantity}×
                                  </span>
                                </div>
                                {/* Remaining badge — only shown when partially assigned */}
                                {isPartial && (
                                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-md shrink-0 px-2 py-0.5">
                                    <span className="text-xs font-semibold text-amber-600">
                                      เหลือ {remaining}
                                    </span>
                                  </div>
                                )}
                                <p className="text-sm text-foreground ml-auto">
                                  ฿{(item.basePrice * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {/* Footer: select button */}
                            <div className="border-t border-border flex gap-2 items-center justify-center p-4">
                              {isSelected ? (
                                <Button
                                  variant="outline"
                                  className="flex-1 h-9 text-sm"
                                  onClick={() => setSelectedLineId(null)}
                                >
                                  เลือกแล้ว
                                </Button>
                              ) : (
                                <Button
                                  className="flex-1 h-9 text-sm"
                                  onClick={() => handleSelectItem(item.lineId)}
                                >
                                  เลือก
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>

          {/* Right: bill buckets */}
          <div className="w-[320px] shrink-0 flex flex-col overflow-hidden">
            <ScrollArea className="h-full pr-1">
              <div className="flex flex-col gap-4 pb-2">
                {bills.map((bill, billIndex) => {
                  const billTotal = getBillTotal(bill)
                  const canAdd = !!selectedLineId && !isFullyAssigned(selectedLineId ?? '')
                  return (
                    <div
                      key={bill.id}
                      className="bg-card border border-border rounded-xl overflow-hidden shrink-0"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      {/* Bill header */}
                      <div className="flex items-center justify-between px-6 py-4 shrink-0">
                        <p className="font-semibold text-base leading-none tracking-tight">
                          บิล #{billIndex + 1}
                        </p>
                        <ChevronUp size={16} className="text-foreground shrink-0" />
                      </div>

                      {/* Assigned items */}
                      <div className="bg-muted border-t border-border flex flex-col isolate items-center min-h-[80px] px-3 py-2 gap-2">
                        {bill.assignments.length === 0 ? (
                          <Button
                            variant="outline"
                            className="w-full h-10 gap-2 text-sm"
                            disabled={!canAdd}
                            onClick={() => handleAddToBill(bill.id)}
                          >
                            <CirclePlus size={16} />
                            เพิ่มรายการอาหารที่เลือก
                          </Button>
                        ) : (
                          <>
                            {bill.assignments.map((assignment) => {
                              const item = orderItems.find((o) => o.lineId === assignment.lineId)
                              if (!item) return null
                              const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
                              return (
                                <div
                                  key={assignment.lineId}
                                  className="bg-card border border-border rounded-xl w-full overflow-hidden"
                                  style={{ boxShadow: 'var(--shadow-card)' }}
                                >
                                  <div className="flex flex-col gap-4 items-start px-4 py-3.5">
                                    {/* Item thumbnail + name */}
                                    <div className="flex gap-2 items-start w-full">
                                      <div className="relative rounded-md shrink-0 size-[54px] overflow-hidden bg-accent">
                                        {menuItem?.imagePath ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={menuItem.imagePath}
                                            alt={item.menuItemName}
                                            className="absolute inset-0 size-full object-cover rounded-md"
                                          />
                                        ) : (
                                          <div className="absolute inset-0 flex items-center justify-center text-xl">
                                            {menuItem?.thumbnailPlaceholder ?? '🍜'}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <p className="font-medium text-sm leading-5 text-foreground whitespace-nowrap">
                                          {item.menuItemName}
                                        </p>
                                        {item.modifiers.length > 0 && (
                                          <div className="flex flex-wrap gap-x-2 gap-y-0">
                                            {item.modifiers.map((mod) => {
                                              const Icon = MODIFIER_ICONS[mod.groupId] ?? Tag
                                              return (
                                                <span
                                                  key={`${mod.groupId}-${mod.optionId}`}
                                                  className="flex items-center gap-1 py-0.5"
                                                >
                                                  <Icon size={12} className="text-muted-foreground shrink-0" />
                                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {mod.optionLabel}
                                                  </span>
                                                </span>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* Qty stepper + price + trash */}
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="size-9"
                                          onClick={() => handleAdjustQty(bill.id, assignment.lineId, -1)}
                                        >
                                          <Minus size={16} />
                                        </Button>
                                        <span className="text-sm text-foreground text-center w-7">
                                          {assignment.qty}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="size-9"
                                          onClick={() => handleAdjustQty(bill.id, assignment.lineId, 1)}
                                          disabled={assignment.qty >= item.quantity - bills.filter((b) => b.id !== bill.id).reduce((s, b) => s + (b.assignments.find((a) => a.lineId === assignment.lineId)?.qty ?? 0), 0)}
                                        >
                                          <Plus size={16} />
                                        </Button>
                                      </div>
                                      <p className="text-base text-foreground">
                                        ฿{(item.basePrice * assignment.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-9"
                                        onClick={() => handleRemoveFromBill(bill.id, assignment.lineId)}
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            {/* Add more button when bill already has items */}
                            {canAdd && (
                              <Button
                                variant="outline"
                                className="w-full h-10 gap-2 text-sm"
                                onClick={() => handleAddToBill(bill.id)}
                              >
                                <CirclePlus size={16} />
                                เพิ่มรายการอาหารที่เลือก
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Bill total footer */}
                      <div className="flex items-center gap-4 px-6 py-2.5">
                        <div className="flex flex-1 items-start gap-4 leading-none text-foreground whitespace-nowrap">
                          <p className="font-semibold text-base tracking-tight">Total</p>
                          <p className="text-sm">
                            ฿{billTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={() => handleDeleteBill(bill.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {/* Add bill button */}
                <button
                  className="bg-card border border-dashed border-border rounded-xl flex gap-2 h-[88px] items-center justify-center p-4 w-full shrink-0 hover:border-muted-foreground transition-colors"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                  onClick={handleAddBill}
                >
                  <UserPlus size={16} className="text-foreground shrink-0" />
                  <span className="font-medium text-sm text-foreground">เพิ่มบิลแยก</span>
                </button>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 items-start px-6 pb-6 pt-2 shrink-0">
          {allInOneBill && (
            <p className="text-sm text-destructive leading-5 w-full">
              รายการทั้งหมดถูกเลือกไว้ในบิลเดียว ไม่สามารถดำเนินการแยกบิลได้
              กรุณาเพิ่มรายการอาหารไปที่ลูกค้าคนอื่น
            </p>
          )}
          <Button
            className="w-full h-9 text-sm font-medium"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            ยืนยัน
          </Button>
          <Button
            variant="outline"
            className="w-full h-9 text-sm font-medium"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
