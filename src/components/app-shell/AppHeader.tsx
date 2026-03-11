'use client'

import { useSessionStore } from '@/stores/session.store'
import { Badge } from '@/components/ui/badge'
import { Logout3Linear } from 'solar-icon-set'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useRouter } from 'next/navigation'

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Waiter:  'secondary',
  Cashier: 'default',
  Manager: 'destructive',
  Kitchen: 'outline',
}

export function AppHeader() {
  const { role, staffName, branchName, logout } = useSessionStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      {/* A Ramen wordmark */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="font-bold text-lg tracking-tight text-primary">A</span>
        <span className="font-semibold text-base text-foreground truncate">
          {branchName ?? 'Ramen'}
        </span>
      </div>

      {/* Role badge */}
      {role && (
        <Badge variant={ROLE_BADGE_VARIANT[role] ?? 'secondary'} className="shrink-0">
          {role}
        </Badge>
      )}

      {/* Staff name */}
      {staffName && (
        <span className="text-sm text-muted-foreground truncate max-w-[120px] shrink-0">
          {staffName}
        </span>
      )}

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Logout */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="shrink-0"
        aria-label="Log out"
      >
        <Logout3Linear size={16} />
      </Button>
    </header>
  )
}
