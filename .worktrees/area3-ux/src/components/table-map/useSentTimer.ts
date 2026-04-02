'use client'
import { useState, useEffect } from 'react'

/**
 * Returns elapsed whole minutes since sentAt.
 * Ticks every 60 seconds to update the display.
 * Returns 0 if sentAt is null (round not yet sent).
 */
export function useSentTimer(sentAt: number | null): number {
  // eslint-disable-next-line react-hooks/purity
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!sentAt) return
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [sentAt])

  if (!sentAt) return 0
  return Math.floor((now - sentAt) / 60_000)
}
