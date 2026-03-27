'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { useKdsStore } from '@/stores/kds.store'
import { KdsBoard } from '@/components/kds/KdsBoard'
import { KdsRecallTray } from '@/components/kds/KdsRecallTray'
import { buildMockDemoTicket } from '@/lib/mock-data/kds-demo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Package2,
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
  PanelLeft,
  EllipsisVertical,
  LogOut,
  ChevronsUpDown,
  User,
} from 'lucide-react'

const TOP_NAV_ICONS = [Home, ShoppingCart, Package, Users, LineChart] as const

export default function KdsPage() {
  const router = useRouter()
  const { role, staffName, branchName, logout } = useSessionStore()
  const { demoActive, toggleDemoActive, injectDemoTicket } = useKdsStore()
  const [staffMenuOpen, setStaffMenuOpen] = useState(false)
  const staffMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (staffMenuRef.current && !staffMenuRef.current.contains(e.target as Node)) {
        setStaffMenuOpen(false)
      }
    }
    if (staffMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [staffMenuOpen])

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

  if (role === null || (role !== 'Kitchen' && role !== 'Manager')) return null

  const roleLabel = role === 'Kitchen' ? 'พ่อครัว' : 'ผู้จัดการ'
  const displayBranch = branchName ?? 'A Ramen — Ekkamai'

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-muted">
      {/* ── Sidebar (55px icon-only nav) ── */}
      <nav className="w-[55px] h-full shrink-0 flex flex-col items-center justify-between py-5 px-2">
        {/* Top: brand + nav */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Brand icon — KDS active state */}
          <button className="bg-primary flex items-center justify-center rounded-full size-8 shrink-0">
            <Package2 size={16} className="text-primary-foreground" />
          </button>

          {TOP_NAV_ICONS.map((Icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center rounded-lg size-8 hover:bg-accent transition-colors"
            >
              <Icon size={20} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Bottom: settings */}
        <button className="flex items-center justify-center rounded-lg size-8 hover:bg-accent transition-colors">
          <Settings size={20} className="text-muted-foreground" />
        </button>
      </nav>

      {/* ── Main wrapper ── */}
      <div className="flex flex-1 min-w-0 flex-col pr-2 py-2">
        <div
          className="flex-1 min-h-0 bg-background rounded-xl overflow-hidden flex flex-col"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {/* ── Header ── */}
          <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
            {/* Left: panel toggle + separator + breadcrumb */}
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center justify-center rounded-md size-7 hover:bg-accent transition-colors">
                <PanelLeft size={16} className="text-foreground" />
              </button>
              <div className="w-px h-[15px] bg-border mx-1" />
              <span className="text-sm text-foreground">{displayBranch}</span>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Demo mode toggle */}
              <button
                onClick={toggleDemoActive}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-semibold transition-colors ${
                  demoActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-input text-muted-foreground hover:bg-accent'
                }`}
                style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
              >
                {demoActive && (
                  <span className="size-1.5 rounded-full bg-primary-foreground shrink-0 animate-pulse" />
                )}
                Demo
              </button>

              {/* Ellipsis button */}
              <button
                className="flex items-center justify-center size-9 border border-input rounded-md bg-background hover:bg-accent transition-colors"
                style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
              >
                <EllipsisVertical size={16} className="text-foreground" />
              </button>

              {/* Staff dropdown */}
              <div ref={staffMenuRef} className="relative">
                <button
                  onClick={() => setStaffMenuOpen((v) => !v)}
                  className="flex items-center gap-2 h-9 px-3 border border-input rounded-md bg-background text-sm font-medium hover:bg-accent transition-colors"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="size-5 rounded-full bg-muted shrink-0 flex items-center justify-center overflow-hidden">
                    <User size={12} className="text-muted-foreground" />
                  </div>
                  <span className="max-w-[180px] truncate">
                    {staffName ?? 'Staff'}{' '}
                    <span className="font-medium">({roleLabel})</span>
                  </span>
                  <ChevronsUpDown size={16} className="text-muted-foreground/50 shrink-0" />
                </button>

                {staffMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg overflow-hidden z-50"
                    style={{ boxShadow: 'var(--shadow-panel)' }}
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs text-muted-foreground">{roleLabel}</p>
                      <p className="text-sm font-medium text-foreground truncate">{staffName ?? 'Staff'}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <LogOut size={14} className="text-muted-foreground" />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>

              {/* Theme toggle */}
              <div
                className="size-9 flex items-center justify-center rounded-md bg-secondary"
                style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
              >
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* ── Board content ── */}
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-6 gap-4">
            <KdsBoard />
          </div>

          {/* ── Recall tray ── */}
          <KdsRecallTray />
        </div>
      </div>
    </div>
  )
}
