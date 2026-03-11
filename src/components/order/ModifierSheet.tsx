'use client'

import { useEffect, useRef, useState } from 'react'
import { CloseCircleLinear, FireBold } from 'solar-icon-set'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/lib/mock-data/menu'
import { useOrderStore } from '@/stores/order.store'
import type { OrderLineItem } from '@/stores/order.store'

// ---------------------------------------------------------------------------
// Props interface (exported — consumed by OrderPage in Plan 04)
// ---------------------------------------------------------------------------

export interface ModifierSheetProps {
  open: boolean
  onClose: () => void
  menuItem: MenuItem | null           // null = sheet is closed
  tableId: string
  editingLineId: string | null        // null = adding new, string = editing existing line
  editingLineItem: OrderLineItem | null  // pre-fill values when editing
}

// ---------------------------------------------------------------------------
// Helper: generate a unique line id
// ---------------------------------------------------------------------------

const newLineId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

// ---------------------------------------------------------------------------
// Helper: look up an option label within a menuItem's modifier groups
// ---------------------------------------------------------------------------

function getOptionLabel(
  menuItem: MenuItem,
  groupId: string,
  optionId: string,
): string {
  const group = menuItem.modifierGroups.find((g) => g.id === groupId)
  const option = group?.options.find((o) => o.id === optionId)
  return option?.label ?? optionId
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
  // ---- Internal state ----
  const [selectedBroth, setSelectedBroth] = useState<string | null>(null)
  const [selectedFirmness, setSelectedFirmness] = useState<string | null>(null)
  const [selectedToppings, setSelectedToppings] = useState<Set<string>>(new Set())
  const [spiceLevel, setSpiceLevel] = useState<number | null>(null)
  const [specialRequest, setSpecialRequest] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // ---- Refs for scroll-to-error ----
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // ---- Body scroll lock (copy from TableBottomSheet.tsx) ----
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // ---- State sync on open / item change ----
  useEffect(() => {
    if (!menuItem) return

    if (editingLineId !== null && editingLineItem !== null) {
      // Pre-fill from existing line item
      const brothMod = editingLineItem.modifiers.find((m) => m.groupId === 'broth')
      const firmnessMod = editingLineItem.modifiers.find((m) => m.groupId === 'noodle-firmness')
      const toppingMods = editingLineItem.modifiers
        .filter((m) => m.groupId === 'toppings')
        .map((m) => m.optionId)

      setSelectedBroth(brothMod?.optionId ?? null)
      setSelectedFirmness(firmnessMod?.optionId ?? null)
      setSelectedToppings(new Set(toppingMods))
      setSpiceLevel(editingLineItem.spiceLevel)
      setSpecialRequest(editingLineItem.specialRequest)
      setQuantity(editingLineItem.quantity)
    } else {
      // Reset for new item
      setSelectedBroth(null)
      setSelectedFirmness(null)
      setSelectedToppings(new Set())
      setSpiceLevel(null)
      setSpecialRequest('')
      setQuantity(1)
    }

    setValidationErrors([])
  }, [menuItem?.id, editingLineId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Derived: is this a ramen item (has broth group)? ----
  const isRamen = menuItem?.modifierGroups.some((g) => g.id === 'broth') ?? false

  // ---- Toggle topping ----
  function toggleTopping(optionId: string) {
    setSelectedToppings((prev) => {
      const next = new Set(prev)
      if (next.has(optionId)) {
        next.delete(optionId)
      } else {
        next.add(optionId)
      }
      return next
    })
  }

  // ---- Add / Update handler ----
  function handleConfirm() {
    if (!menuItem) return

    // Validate required fields for ramen items
    const errors: string[] = []
    if (isRamen) {
      if (!selectedBroth) errors.push('broth')
      if (spiceLevel === null) errors.push('spice')
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      // Scroll to first error
      const firstErrorRef = groupRefs.current[errors[0]]
      firstErrorRef?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Build modifiers array
    const brothLabel = selectedBroth
      ? getOptionLabel(menuItem, 'broth', selectedBroth)
      : ''
    const firmnessLabel = selectedFirmness
      ? getOptionLabel(menuItem, 'noodle-firmness', selectedFirmness)
      : ''

    const newItem: OrderLineItem = {
      lineId: editingLineId ?? newLineId(),
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      basePrice: menuItem.basePrice,
      modifiers: [
        ...(selectedBroth
          ? [{ groupId: 'broth', groupLabel: 'Broth', optionId: selectedBroth, optionLabel: brothLabel }]
          : []),
        ...(selectedFirmness
          ? [{ groupId: 'noodle-firmness', groupLabel: 'Noodle Firmness', optionId: selectedFirmness, optionLabel: firmnessLabel }]
          : []),
        ...Array.from(selectedToppings).map((tid) => ({
          groupId: 'toppings',
          groupLabel: 'Toppings',
          optionId: tid,
          optionLabel: getOptionLabel(menuItem, 'toppings', tid),
        })),
      ],
      spiceLevel: spiceLevel,
      specialRequest: specialRequest.trim(),
      quantity: quantity,
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
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background
          shadow-lg transition-transform duration-300 ease-out max-h-[70vh] overflow-y-auto
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {menuItem && (
          <div className="flex flex-col pb-24">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-2">
              <h2 className="text-lg font-semibold flex-1 pr-2">{menuItem.name}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <CloseCircleLinear size={20} />
              </button>
            </div>

            {/* Quantity control */}
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-sm font-medium text-muted-foreground w-16">Quantity</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </Button>
                <span className="w-8 text-center font-medium tabular-nums">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="w-full border-t border-border/50 my-1" />

            {/* Modifier groups */}
            {menuItem.modifierGroups.map((group) => {
              const hasError = validationErrors.includes(group.id)
              return (
                <div
                  key={group.id}
                  ref={(el) => { groupRefs.current[group.id] = el }}
                  className="px-4 py-3"
                >
                  {/* Group label */}
                  <div className="mb-2">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        hasError && 'text-destructive',
                      )}
                    >
                      {group.label}
                    </span>
                    <span
                      className={cn(
                        'text-xs ml-1.5',
                        hasError ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {group.required ? '(required)' : '(optional)'}
                    </span>
                  </div>

                  {/* Single-select (broth, noodle-firmness) */}
                  {group.type === 'single' && (
                    <div
                      className={cn(
                        'flex flex-wrap gap-2',
                        hasError && 'border border-destructive rounded-md p-2',
                      )}
                    >
                      {group.options.map((option) => {
                        const isSelected =
                          group.id === 'broth'
                            ? selectedBroth === option.id
                            : selectedFirmness === option.id
                        return (
                          <Button
                            key={option.id}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              if (group.id === 'broth') {
                                setSelectedBroth(option.id)
                              } else {
                                setSelectedFirmness(option.id)
                              }
                              // Clear validation error for this group
                              setValidationErrors((prev) =>
                                prev.filter((e) => e !== group.id),
                              )
                            }}
                          >
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {/* Multi-select (toppings) */}
                  {group.type === 'multi' && (
                    <div
                      className={cn(
                        'flex flex-col gap-2',
                        hasError && 'border border-destructive rounded-md p-2',
                      )}
                    >
                      {group.options.map((option) => {
                        const isChecked = selectedToppings.has(option.id)
                        return (
                          <label
                            key={option.id}
                            className="flex items-center gap-3 cursor-pointer py-1"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTopping(option.id)}
                              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                            />
                            <span className="flex-1 text-sm">{option.label}</span>
                            {option.priceAdj > 0 && (
                              <span className="text-xs text-muted-foreground">
                                +฿{option.priceAdj}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Spice Level — only for ramen items */}
            {isRamen && (
              <div
                ref={(el) => { groupRefs.current['spice'] = el }}
                className="px-4 py-3"
              >
                <div className="mb-2">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      validationErrors.includes('spice') && 'text-destructive',
                    )}
                  >
                    Spice Level
                  </span>
                  <span
                    className={cn(
                      'text-xs ml-1.5',
                      validationErrors.includes('spice')
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                    )}
                  >
                    (required)
                  </span>
                </div>
                <div
                  className={cn(
                    'flex flex-col gap-2',
                    validationErrors.includes('spice') &&
                      'border border-destructive rounded-md p-2',
                  )}
                >
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setSpiceLevel(level)
                          setValidationErrors((prev) => prev.filter((e) => e !== 'spice'))
                        }}
                        className={cn(
                          'flex flex-col items-center gap-0.5 transition-opacity',
                          spiceLevel !== null && level <= spiceLevel
                            ? 'opacity-100 text-primary'
                            : 'opacity-30',
                        )}
                        aria-label={`Spice level ${level}`}
                      >
                        <FireBold size={22} />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <span
                        key={level}
                        className={cn(
                          'w-[22px] text-center text-xs tabular-nums',
                          spiceLevel !== null && level <= spiceLevel
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Special Request */}
            <div className="px-4 py-3">
              <label className="block text-sm font-semibold mb-2">
                Special Request
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  (optional)
                </span>
              </label>
              <textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="e.g. no onion, extra firm noodles"
                maxLength={100}
                rows={2}
                className={cn(
                  'w-full resize-none rounded-md border border-input bg-background px-3 py-2',
                  'text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
                  'transition-colors',
                )}
              />
            </div>
          </div>
        )}

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 z-[51] bg-background border-t border-border px-4 py-3">
          <Button className="w-full" onClick={handleConfirm}>
            {editingLineId ? 'Update Order' : 'Add to Order'}
          </Button>
        </div>
      </div>
    </>
  )
}
