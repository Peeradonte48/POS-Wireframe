'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { useKdsStore } from '@/stores/kds.store'
import { KdsBoard } from '@/components/kds/KdsBoard'
import { KdsRecallTray } from '@/components/kds/KdsRecallTray'

export default function KdsPage() {
  const router = useRouter()
  const { role } = useSessionStore()
  const { demoActive, toggleDemoActive } = useKdsStore()

  // Auth guard: Kitchen staff only
  useEffect(() => {
    if (role === null) {
      router.replace('/login')
    } else if (role !== 'Kitchen') {
      // Non-kitchen roles routed away — send to table-map as their home
      router.replace('/table-map')
    }
  }, [role, router])

  // Don't render until auth state is known
  if (role === null) return null

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* KDS Header */}
      <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4">
        <span className="font-semibold text-base">Kitchen Display</span>
        <div className="flex items-center gap-3">
          {demoActive && (
            <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
              DEMO
            </span>
          )}
          <button
            onClick={toggleDemoActive}
            className="text-xs border border-border rounded px-3 py-1.5 hover:bg-accent transition-colors"
          >
            Demo Mode
          </button>
        </div>
      </header>

      {/* Board */}
      <div className="flex flex-1 overflow-hidden">
        <KdsBoard />
      </div>

      {/* Recall Tray */}
      <KdsRecallTray />
    </div>
  )
}
