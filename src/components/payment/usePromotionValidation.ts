'use client'

import { useRef, useState } from 'react'
import { useBillStore } from '@/stores/bill.store'
import { useOrderStore } from '@/stores/order.store'
import { PROMOTIONS } from '@/lib/mock-data/promotions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CouponCodeState = 'idle' | 'checking' | 'valid' | 'invalid'

export interface PromotionValidationResult {
  /** Current code input value */
  codeInput: string
  /** Validation state of the current code input */
  codeState: CouponCodeState
  /** Update coupon code input and trigger debounced validation against promoReferenceCode */
  handleCodeChange: (value: string, promoReferenceCode: string) => void
  /** Apply the given promotion to the given line items and record discount in bill store */
  handleApply: (promotionId: string, selectedLineIds: string[], couponCodeInput: string) => void
  /** Reset all coupon state (called on sheet close) */
  resetCoupon: () => void
}

// ---------------------------------------------------------------------------
// usePromotionValidation
// ---------------------------------------------------------------------------

export function usePromotionValidation(storeKey: string): PromotionValidationResult {
  const { addPromotionDiscount } = useBillStore()

  // Extract real table ID from composite split key (e.g. "T01__split__0" → "T01")
  const realTableId = storeKey.includes('__split__') ? storeKey.split('__split__')[0] : storeKey

  const [codeInput, setCodeInput] = useState('')
  const [codeState, setCodeState] = useState<CouponCodeState>('idle')
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCodeChange(value: string, promoReferenceCode: string) {
    setCodeInput(value)
    setCodeState('idle')
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current)

    if (!value.trim()) return

    setCodeState('checking')
    checkTimerRef.current = setTimeout(() => {
      if (value.trim().toUpperCase() === promoReferenceCode) {
        setCodeState('valid')
      } else {
        setCodeState('invalid')
      }
    }, 1200)
  }

  function handleApply(promotionId: string, selectedLineIds: string[], couponCodeInput: string) {
    const promo = PROMOTIONS.find((p) => p.id === promotionId)
    if (!promo || codeState !== 'valid') return

    // Non-reactive read — use real table ID for order lookup, storeKey for discount storage
    const order = useOrderStore.getState().getOrder(realTableId)
    const orderItems = order
      ? order.rounds.flatMap((r) => r.items).filter((i) => i.status !== 'voided')
      : []

    const selectedSubtotal = orderItems
      .filter((i) => selectedLineIds.includes(i.lineId))
      .reduce((sum, item) => sum + item.basePrice * item.quantity, 0)

    let amount: number
    if (promo.discountFixed > 0) {
      amount = Math.min(promo.discountFixed, selectedSubtotal)
    } else {
      amount = Math.round(selectedSubtotal * (promo.discountPercent / 100))
    }

    addPromotionDiscount(storeKey, {
      promotionId: promo.id,
      couponCode: couponCodeInput.trim().toUpperCase(),
      amount,
      selectedLineIds,
    })
  }

  function resetCoupon() {
    setCodeInput('')
    setCodeState('idle')
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
  }

  return {
    codeInput,
    codeState,
    handleCodeChange,
    handleApply,
    resetCoupon,
  }
}
