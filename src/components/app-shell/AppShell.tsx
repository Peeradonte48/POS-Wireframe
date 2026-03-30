'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { ThemedToaster } from './ThemedToaster'

/** Routes where the top header should be hidden (detail/inside pages) */
function useShowHeader() {
  const pathname = usePathname()
  // Hide on /order/[tableId] and /payment/[tableId] (and their sub-routes)
  const isInsidePage =
    /^\/order\/[^/]+/.test(pathname) ||
    /^\/payment\/[^/]+/.test(pathname)
  return !isInsidePage
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const showHeader = useShowHeader()

  return (
    <div className="flex h-screen overflow-hidden bg-sidebar">
      <ThemedToaster />

      {/* Fixed-width sidebar rail */}
      <AppSidebar />

      {/* Main wrapper — adds padding around the white card */}
      <div className="flex-1 flex flex-col min-w-0 pr-2 py-2">
        {/* White rounded card */}
        <div
          className="flex-1 flex flex-col min-h-0 bg-background rounded-xl overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {showHeader && <AppHeader />}
          <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
