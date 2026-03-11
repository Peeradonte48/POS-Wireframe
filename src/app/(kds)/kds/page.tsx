'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { useKdsStore } from '@/stores/kds.store'

export default function KdsPage() {
  const router = useRouter()
  const { role } = useSessionStore()
  const { demoActive, toggleDemoActive, tickets } = useKdsStore()

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

  const ticketCount = Object.keys(tickets).length

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">

      {/* ── Header bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <span className="font-semibold text-base">Kitchen Display</span>

        <div className="flex items-center gap-3">
          {/* DEMO badge — visible only when demoActive */}
          {demoActive && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              DEMO
            </span>
          )}

          {/* Demo Mode toggle button */}
          <button
            onClick={toggleDemoActive}
            className="rounded border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            {demoActive ? 'Exit Demo' : 'Demo Mode'}
          </button>
        </div>
      </header>

      {/* ── Board area (three-column scaffold) ── */}
      <main className="flex flex-1 overflow-hidden">
        {/* NEW column */}
        <section className="flex flex-1 flex-col border-r">
          <div className="border-b px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New
            </span>
          </div>
          <div className="flex-1 p-4 text-sm text-muted-foreground">
            {ticketCount === 0
              ? 'No tickets — board components wired in Plan 02'
              : `${ticketCount} ticket(s) — board components wired in Plan 02`}
          </div>
        </section>

        {/* IN PROGRESS column */}
        <section className="flex flex-1 flex-col border-r">
          <div className="border-b px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              In Progress
            </span>
          </div>
          <div className="flex-1 p-4 text-sm text-muted-foreground">
            Board components wired in Plan 02
          </div>
        </section>

        {/* READY column */}
        <section className="flex flex-1 flex-col">
          <div className="border-b px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ready
            </span>
          </div>
          <div className="flex-1 p-4 text-sm text-muted-foreground">
            Board components wired in Plan 02
          </div>
        </section>
      </main>

      {/* ── Recall tray (placeholder) ── */}
      <footer className="shrink-0 border-t px-4 py-2 text-xs text-muted-foreground">
        Recall tray — wired in Plan 02
      </footer>
    </div>
  )
}
