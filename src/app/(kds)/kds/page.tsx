'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { useKdsStore } from '@/stores/kds.store'
import { KdsBoard } from '@/components/kds/KdsBoard'
import { KdsRecallTray } from '@/components/kds/KdsRecallTray'
import { buildMockDemoTicket } from '@/lib/mock-data/kds-demo'

export default function KdsPage() {
  const router = useRouter()
  const { role } = useSessionStore()
  const { demoActive, toggleDemoActive, injectDemoTicket } = useKdsStore()

  // Auth guard: Kitchen and Manager only
  useEffect(() => {
    if (role === null) {
      router.replace('/login')
    } else if (role !== 'Kitchen' && role !== 'Manager') {
      // Non-kitchen/manager roles routed away — send to table-map as their home
      router.replace('/table-map')
    }
  }, [role, router])

  // Demo injection: setTimeout re-schedule loop fires every 8–12 s when demoActive
  useEffect(() => {
    if (!demoActive) return

    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const delay = 8000 + Math.random() * 4000 // 8–12 seconds
      timeoutId = setTimeout(() => {
        const mockTicket = buildMockDemoTicket()
        // injectDemoTicket writes the ticket into kds.store using the same ticketId
        // that buildMockDemoTicket used to key demoItemsMap — so getDemoOrderItems can look it up.
        injectDemoTicket(mockTicket)
        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [demoActive, injectDemoTicket])

  // Don't render until auth state is known, and block content flash for unpermitted roles
  if (role === null || (role !== 'Kitchen' && role !== 'Manager')) return null

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
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <KdsBoard />
      </div>

      {/* Recall Tray */}
      <KdsRecallTray />
    </div>
  )
}
