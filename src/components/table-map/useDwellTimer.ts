'use client'
import { useState, useEffect } from 'react'

export function useDwellTimer(openedAt: number | null): string {
  // eslint-disable-next-line react-hooks/purity
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!openedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [openedAt])

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
