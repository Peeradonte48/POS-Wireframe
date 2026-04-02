'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /payment (no tableId) — redirect to floor plan.
 * Payment is always entered from a specific table via "Go to Payment" in the
 * TableBottomSheet. Navigating to /payment directly has no context, so we
 * redirect the user back to the Table Map where they can select a table.
 */
export default function PaymentIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/table-map')
  }, [router])

  return null
}
