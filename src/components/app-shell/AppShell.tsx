'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'
import { ThemedToaster } from './ThemedToaster'

/** True on detail pages (/order/[tableId], /payment/[tableId]) */
function useIsInsidePage() {
  const pathname = usePathname()
  return (
    /^\/order\/[^/]+/.test(pathname) ||
    /^\/payment\/[^/]+/.test(pathname)
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isInside = useIsInsidePage()

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-sidebar">
      <ThemedToaster />

      {/* Main wrapper — adds padding around the white card */}
      <div className="flex-1 flex flex-col min-h-0 px-2 pt-2">
        {/* White rounded card */}
        <div
          className="flex-1 flex flex-col min-h-0 bg-background rounded-xl overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {!isInside && <AppHeader />}
          <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom navigation — hidden on inside pages */}
      {!isInside && <BottomNav />}
    </div>
  )
}
