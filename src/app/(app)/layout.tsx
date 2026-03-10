'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { AppShell } from '@/components/app-shell/AppShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { role, shiftOpen } = useSessionStore()

  useEffect(() => {
    if (!role) {
      // Not authenticated — go to login
      router.replace('/login')
    } else if (!shiftOpen && pathname !== '/shift-open') {
      // Authenticated but shift not open — must open shift first
      router.replace('/shift-open')
    }
  }, [role, shiftOpen, pathname, router])

  // Don't render until auth state is known
  if (!role) return null

  return <AppShell>{children}</AppShell>
}
