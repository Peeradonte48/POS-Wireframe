'use client'

import { useState } from 'react'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { ThemedToaster } from './ThemedToaster'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ThemedToaster />
      <AppHeader onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AppSidebar collapsed={sidebarCollapsed} />

        <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
