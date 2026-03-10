'use client'

import { useSessionStore } from '@/stores/session.store'
import { Badge } from '@/components/ui/badge'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      {/* Branch name */}
      <span className="font-semibold text-sm truncate flex-1">
        {branchName ?? 'A Ramen POS'}
      </span>

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

      {/* Logout */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="shrink-0"
        aria-label="Log out"
      >
        <LogOut size={16} />
      </Button>
    </header>
  )
}
