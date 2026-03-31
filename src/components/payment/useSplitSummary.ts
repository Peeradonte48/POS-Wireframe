'use client'

import { useMemo } from 'react'
import { useBillStore } from '@/stores/bill.store'
import { useOrderStore } from '@/stores/order.store'
import type { BillSplit, PromotionDiscount } from '@/stores/bill.store'
import type { OrderLineItem } from '@/stores/order.store'
import type { CrmMember } from '@/components/payment/CrmLookupDialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SplitSummaryData {
  /** 'item' for per-bill item assignment split (แยกบิล), 'value' for custom value split (แบ่งจ่าย) */
  splitOrigin: 'item' | 'value'
  /** Pre-VAT amounts per payer/bill (for value-split) or pre-VAT per-bill subtotals (for item-split) */
  splitAmounts: number[]
  /** Non-voided bill items for the full order */
  billItems: OrderLineItem[]
  /** CRM member linked to this table, or null */
  crmMember: CrmMember | null
  /** Raw split record from bill.store */
  split: BillSplit | undefined
  /** Full-order subtotal (pre-VAT) */
  subtotal: number
  /** Full-order VAT amount */
  vatAmount: number
  /** Applied promotions before split */
  promotions: PromotionDiscount[]
  /** Total discount from promotions */
  discountTotal: number
}

// ---------------------------------------------------------------------------
// useSplitSummary
// ---------------------------------------------------------------------------

export function useSplitSummary(tableId: string): SplitSummaryData {
  const split = useBillStore((s) => s.getSplit(tableId))
  const crmMember = useBillStore((s) => s.crmMembers[tableId] ?? null)
  const promotionDiscountsRaw = useBillStore((s) => s.promotionDiscounts[tableId])
  const promotions = useMemo(() => promotionDiscountsRaw ?? [], [promotionDiscountsRaw])
  const discountTotal = useMemo(() => promotions.reduce((sum, d) => sum + d.amount, 0), [promotions])

  // Select raw orders object; derive items in useMemo per CLAUDE.md Zustand patterns
  const orders = useOrderStore((s) => s.orders)
  const billItems = useMemo(() => {
    const order = orders[tableId]
    return order
      ? order.rounds.flatMap((r) => r.items).filter((i) => i.status !== 'voided')
      : []
  }, [orders, tableId])

  const subtotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),
    [billItems],
  )
  const vatAmount = Math.round(subtotal * 0.07)

  const splitAmounts: number[] = split?.customAmounts ?? []
  const splitOrigin: 'item' | 'value' = split?.splitOrigin === 'item' ? 'item' : 'value'

  return {
    splitOrigin,
    splitAmounts,
    billItems,
    crmMember,
    split,
    subtotal,
    vatAmount,
    promotions,
    discountTotal,
  }
}
