'use client'

import { useState } from 'react'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { ThemedToaster } from './ThemedToaster'
import { SidebarMinimalisticLinear } from 'solar-icon-set'
import { Button } from '@/components/ui/button'

export function AppShell({ children }: { children: React.ReactNode }) {
  // Start collapsed — maximises content area on tablet screens
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ThemedToaster />
      {/* Top header — full width */}
      <AppHeader />

      {/* Body: sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="relative flex">
          <AppSidebar collapsed={sidebarCollapsed} />
          {/* Collapse toggle button — sits at the bottom of sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="absolute bottom-3 right-2 h-10 w-10"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <SidebarMinimalisticLinear size={18} />
          </Button>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
