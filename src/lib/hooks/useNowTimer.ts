'use client'
import { useState, useEffect } from 'react'

/**
 * Returns a ticking `Date.now()` value, updated every `intervalMs`.
 * Starts ticking only when `active` is true (or always if omitted).
 * Replaces useDwellTimer, useSentTimer, and useKdsTimer internals.
 */
export function useNowTimer(intervalMs = 1000, active = true): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, active])
  return now
}
