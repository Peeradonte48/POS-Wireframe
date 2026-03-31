'use client'

import { useMemo } from 'react'
import { useOrderStore } from '@/stores/order.store'
import { useBillStore } from '@/stores/bill.store'
import { useTableStore } from '@/stores/table.store'
import { useQueueStore } from '@/stores/queue.store'
import type { OrderLineItem } from '@/stores/order.store'
import type { PromotionDiscount } from '@/stores/bill.store'

// ---------------------------------------------------------------------------
// useBillCalculation
// ---------------------------------------------------------------------------
// Aggregates all bill calculation concerns for a given table:
// - Line items from order.store (including merged tables)
// - Subtotal, VAT (7%), discount total, grand total
// - Merge awareness (isMerged, mergedTableIds)
// - Takeaway branching
// ---------------------------------------------------------------------------

export interface BillCalculationResult {
  lineItems: OrderLineItem[]
  tableOrders: Array<{
    tableId: string
    label: string
    guestCount: number | null
    items: OrderLineItem[]
  }>
  subtotal: number
  vatAmount: number
  grandTotal: number
  discountTotal: number
  promotions: PromotionDiscount[]
  isMerged: boolean
  isTakeaway: boolean
  mergedTableIds: string[]
}

export function useBillCalculation(tableId: string): BillCalculationResult {
  const order = useOrderStore((s) => s.getOrder(tableId))
  const tables = useTableStore((s) => s.tables)
  const merges = useBillStore((s) => s.merges)
  const promotionDiscountsRaw = useBillStore((s) => s.promotionDiscounts[tableId])

  // Derive merged secondary IDs (CLAUDE.md: derive in useMemo, not selector)
  const mergedTableIds = useMemo(
    () => Object.entries(merges).filter(([, primary]) => primary === tableId).map(([tid]) => tid),
    [merges, tableId],
  )
  const isMerged = mergedTableIds.length > 0

  // Takeaway detection — static read (CLAUDE.md: use getState() for values stable at runtime)
  const isTakeaway = Boolean(useQueueStore.getState().orders[tableId])

  const promotions = useMemo(() => promotionDiscountsRaw ?? [], [promotionDiscountsRaw])

  // Aggregate line items (primary + secondary merged tables)
  const lineItems = useMemo(() => {
    const primaryItems = order
      ? order.rounds.flatMap((r) => r.items).filter((item) => item.status !== 'voided')
      : []
    if (!isMerged) return primaryItems
    const secondaryItems = mergedTableIds.flatMap((tid) => {
      const secOrder = useOrderStore.getState().getOrder(tid)
      if (!secOrder) return []
      return secOrder.rounds.flatMap((r) => r.items).filter((item) => item.status !== 'voided')
    })
    return [...primaryItems, ...secondaryItems]
  }, [order, isMerged, mergedTableIds])

  // Grouped table orders for display (with label + guestCount per table)
  const tableOrders = useMemo(() => {
    if (isMerged) {
      return [tableId, ...mergedTableIds].map((tid) => ({
        tableId: tid,
        label: tables[tid]?.label ?? tid,
        guestCount: tables[tid]?.guestCount ?? null,
        items: (
          tid === tableId
            ? (order?.rounds.flatMap((r) => r.items) ?? [])
            : (useOrderStore.getState().getOrder(tid)?.rounds.flatMap((r) => r.items) ?? [])
        ).filter((item) => item.status !== 'voided'),
      }))
    }
    return [
      {
        tableId,
        label: tables[tableId]?.label ?? tableId,
        guestCount: tables[tableId]?.guestCount ?? null,
        items: lineItems,
      },
    ]
  }, [isMerged, mergedTableIds, tableId, tables, order, lineItems])

  // Financial calculations
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
    [lineItems],
  )

  const discountTotal = promotions.reduce((sum, d) => sum + d.amount, 0)
  const discountedSubtotal = subtotal - discountTotal
  const vatAmount = Math.round(discountedSubtotal * 0.07)
  const grandTotal = discountedSubtotal + vatAmount

  return {
    lineItems,
    tableOrders,
    subtotal,
    vatAmount,
    grandTotal,
    discountTotal,
    promotions,
    isMerged,
    isTakeaway,
    mergedTableIds,
  }
}
