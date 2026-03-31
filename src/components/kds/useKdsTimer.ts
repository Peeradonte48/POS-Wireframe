'use client'
import { useNowTimer } from '@/lib/hooks/useNowTimer'

/**
 * Ticking MM:SS elapsed timer for KDS tickets.
 *
 * Color thresholds for caller use (not enforced in hook):
 *   elapsedSeconds < 600  → green
 *   elapsedSeconds 600–899 → amber
 *   elapsedSeconds ≥ 900  → red
 */
export function useKdsTimer(addedAt: number): {
  display: string
  elapsedSeconds: number
} {
  const now = useNowTimer(1000)

  const elapsedSeconds = Math.floor((now - addedAt) / 1000)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { display, elapsedSeconds }
}
