'use client'
import { useNowTimer } from '@/lib/hooks/useNowTimer'

/**
 * Returns elapsed whole minutes since sentAt.
 * Ticks every 60 seconds to update the display.
 * Returns 0 if sentAt is null (round not yet sent).
 */
export function useSentTimer(sentAt: number | null): number {
  const now = useNowTimer(60_000, sentAt !== null)

  if (!sentAt) return 0
  return Math.floor((now - sentAt) / 60_000)
}
