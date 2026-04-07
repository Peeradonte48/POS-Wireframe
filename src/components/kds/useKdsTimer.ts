'use client'
import { useNowTimer } from '@/lib/hooks/useNowTimer'

/**
 * Ticking MM:SS elapsed timer for KDS tickets.
 *
 * Color thresholds:
 *   elapsedSeconds < 30   → green  (just arrived)
 *   elapsedSeconds 30–59  → amber  (aging)
 *   elapsedSeconds ≥ 60   → red    (overdue)
 */
export function useKdsTimer(addedAt: number): {
  display: string
  elapsedSeconds: number
  urgency: 'green' | 'amber' | 'red'
} {
  const now = useNowTimer(1000)

  const elapsedSeconds = Math.floor((now - addedAt) / 1000)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const urgency: 'green' | 'amber' | 'red' =
    elapsedSeconds >= 60 ? 'red' : elapsedSeconds >= 30 ? 'amber' : 'green'

  return { display, elapsedSeconds, urgency }
}
