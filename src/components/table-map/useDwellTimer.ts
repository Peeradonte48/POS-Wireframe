'use client'
import { useNowTimer } from '@/lib/hooks/useNowTimer'

export function useDwellTimer(openedAt: number | null): string {
  const now = useNowTimer(1000, openedAt !== null)

  if (!openedAt) return ''

  const elapsed = Math.floor((now - openedAt) / 1000) // seconds
  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60

  if (hours >= 1) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
