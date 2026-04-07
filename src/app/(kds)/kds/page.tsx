'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { useKdsStore } from '@/stores/kds.store'
import { KdsBoard } from '@/components/kds/KdsBoard'
import { KdsKpiBar } from '@/components/kds/KdsKpiBar'
import { buildMockDemoTicket, getDemoOrderItems } from '@/lib/mock-data/kds-demo'
import { LogOut } from 'lucide-react'

export default function KdsPage() {
  const router = useRouter()
  const { role, staffName, logout } = useSessionStore()
  const { demoActive, toggleDemoActive, injectDemoTicket } = useKdsStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [demoCancelActive, setDemoCancelActive] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Close settings dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    if (settingsOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  // Auth guard: Kitchen and Manager only
  useEffect(() => {
    if (role === null) {
      router.replace('/login')
    } else if (role !== 'Kitchen' && role !== 'Manager') {
      router.replace('/table-map')
    }
  }, [role, router])

  // Demo injection loop
  useEffect(() => {
    if (!demoActive) return
    let timeoutId: ReturnType<typeof setTimeout>
    function scheduleNext() {
      const delay = 8000 + Math.random() * 4000
      timeoutId = setTimeout(() => {
        injectDemoTicket(buildMockDemoTicket())
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [demoActive, injectDemoTicket])

  // Demo cancel simulation — randomly cancels an item every 15–25 seconds
  useEffect(() => {
    if (!demoActive || !demoCancelActive) return
    let cancelTimeoutId: ReturnType<typeof setTimeout>
    function scheduleCancelDemo() {
      const delay = 5000 + Math.random() * 5000
      cancelTimeoutId = setTimeout(() => {
        const { tickets, cancelLineItem } = useKdsStore.getState()
        const allTickets = Object.values(tickets)
        if (allTickets.length > 0) {
          const ticket = allTickets[Math.floor(Math.random() * allTickets.length)]
          const items = getDemoOrderItems(ticket)
          const eligible = items.filter(
            (i) => i.status !== 'voided' && !ticket.cancelledLineIds.has(i.lineId) && !ticket.sentLineIds.has(i.lineId),
          )
          if (eligible.length > 0) {
            const item = eligible[Math.floor(Math.random() * eligible.length)]
            cancelLineItem(ticket.ticketId, item.lineId)
          }
        }
        scheduleCancelDemo()
      }, delay)
    }
    scheduleCancelDemo()
    return () => clearTimeout(cancelTimeoutId)
  }, [demoActive, demoCancelActive])

  if (role === null || (role !== 'Kitchen' && role !== 'Manager')) return null

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-sidebar">
      {/* ── Main wrapper — no sidebar ── */}
      <div className="flex flex-1 min-w-0 flex-col p-2">
        <div
          className="flex-1 min-h-0 bg-background rounded-xl overflow-hidden flex flex-col"
          style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
        >
          {/* ── Content area ── */}
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-6 gap-4">
            {/* KPI Bar + Settings */}
            <div className="relative" ref={settingsRef}>
              <KdsKpiBar
                avgCookingTime="10 นาที"
                onTimePercent={55}
                onSettingsClick={() => setSettingsOpen((v) => !v)}
              />

              {/* Settings dropdown */}
              {settingsOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg overflow-hidden z-50"
                  style={{ boxShadow: 'var(--shadow-panel)' }}
                >
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground">
                      {role === 'Kitchen' ? 'พ่อครัว' : 'ผู้จัดการ'}
                    </p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {staffName ?? 'Staff'}
                    </p>
                  </div>

                  {/* Demo mode toggle */}
                  <button
                    onClick={toggleDemoActive}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {demoActive && (
                      <span className="size-1.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
                    )}
                    {demoActive ? 'ปิด Demo Mode' : 'เปิด Demo Mode'}
                  </button>

                  {/* Demo cancel toggle — only visible when demo is active */}
                  {demoActive && (
                    <button
                      onClick={() => setDemoCancelActive((v) => !v)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      {demoCancelActive && (
                        <span className="size-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                      )}
                      {demoCancelActive ? 'ปิดจำลองยกเลิกออร์เดอร์' : 'เปิดจำลองยกเลิกออร์เดอร์'}
                    </button>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors border-t border-border"
                  >
                    <LogOut size={14} className="text-muted-foreground" />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>

            {/* Board */}
            <KdsBoard />
          </div>
        </div>
      </div>
    </div>
  )
}
