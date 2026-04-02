'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { AppShell } from '@/components/app-shell/AppShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { role, shiftOpen } = useSessionStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Wait for Zustand persist rehydration before evaluating auth state
    const unsub = useSessionStore.persist.onFinishHydration(() => setHydrated(true))
    // If already hydrated (e.g. store was created synchronously), mark immediately
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (useSessionStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!role) {
      // Not authenticated — go to login
      router.replace('/login')
    } else if (role === 'Kitchen') {
      // Kitchen staff go directly to KDS — no shift-open step
      router.replace('/kds')
    } else if (!shiftOpen && pathname !== '/shift-open') {
      // Authenticated but shift not open — must open shift first
      router.replace('/shift-open')
    }
  }, [hydrated, role, shiftOpen, pathname, router])

  // Hold render until hydration completes to avoid redirect flash
  if (!hydrated || !role || role === 'Kitchen') return null

  return <AppShell>{children}</AppShell>
}
