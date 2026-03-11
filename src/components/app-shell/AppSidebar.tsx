'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { canAccess } from '@/lib/role-permissions'
import type { NavSlug } from '@/lib/role-permissions'
import { cn } from '@/lib/utils'
import {
  LayoutGrid,
  ClipboardList,
  Monitor,
  CreditCard,
  BarChart3,
  Lock,
} from 'lucide-react'

interface NavItem {
  slug: NavSlug
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { slug: 'table-map', label: 'Table Map',  href: '/table-map', icon: LayoutGrid },
  { slug: 'orders',    label: 'Orders',     href: '/orders',    icon: ClipboardList },
  { slug: 'kds',       label: 'KDS',        href: '/kds',       icon: Monitor },
  { slug: 'payment',   label: 'Payment',    href: '/payment',   icon: CreditCard },
  { slug: 'manager',   label: 'Manager',    href: '/manager',   icon: BarChart3 },
]

interface AppSidebarProps {
  collapsed: boolean
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname()
  const { role, shiftOpen } = useSessionStore()

  return (
    <nav
      className={cn(
        'border-r border-border bg-card flex flex-col shrink-0 transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Shift-open lock banner (shown when shift is not open) */}
      {!shiftOpen && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs',
          collapsed && 'justify-center px-0'
        )}>
          <Lock size={12} className="shrink-0" />
          {!collapsed && <span>Open a shift first</span>}
        </div>
      )}

      <ul className="flex flex-col gap-1 p-2 flex-1">
        {NAV_ITEMS.map(({ slug, label, href, icon: Icon }) => {
          if (slug === 'manager' && role !== 'Manager') return null
          const hasRoleAccess = role ? canAccess(role, slug) : false
          const isAccessible = hasRoleAccess && shiftOpen
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <li key={slug}>
              {isAccessible ? (
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    collapsed && 'justify-center px-2',
                    'text-muted-foreground/40 cursor-not-allowed select-none'
                  )}
                  title={!hasRoleAccess ? `${label} — not available for ${role}` : 'Open a shift first'}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
