'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  PanelLeft,
  EllipsisVertical,
  ChevronsUpDown,
  User,
  LogOut,
} from 'lucide-react'

const ROLE_LABEL_TH: Record<string, string> = {
  Waiter:  'พนักงานเสิร์ฟ',
  Cashier: 'แคชเชียร์',
  Manager: 'ผู้จัดการ',
  Kitchen: 'พ่อครัว',
}

interface AppHeaderProps {
  onSidebarToggle?: () => void
}

export function AppHeader({ onSidebarToggle }: AppHeaderProps) {
  const { role, staffName, branchName, logout } = useSessionStore()
  const router = useRouter()
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

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  const roleLabel = role ? (ROLE_LABEL_TH[role] ?? role) : ''
  const displayBranch = branchName ?? 'A Ramen'

  return (
    <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between shrink-0">
      {/* Left: sidebar toggle + separator + breadcrumb */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSidebarToggle}
          className="flex items-center justify-center rounded-md size-7 hover:bg-accent transition-colors"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={16} className="text-foreground" />
        </button>
        <div className="w-px h-[15px] bg-border mx-1" />
        <span className="text-sm text-foreground">{displayBranch}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Ellipsis (placeholder) */}
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
  )
}
