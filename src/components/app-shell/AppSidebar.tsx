'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { useQueueStore } from '@/stores/queue.store'
import { canAccess } from '@/lib/role-permissions'
import type { NavSlug } from '@/lib/role-permissions'
import { cn } from '@/lib/utils'
import {
  Package2,
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  slug: NavSlug
  label: string
  href: string
  icon: LucideIcon
}

const TOP_NAV_ITEMS: NavItem[] = [
  { slug: 'table-map', label: 'Table Map', href: '/table-map',  icon: Home },
  { slug: 'orders',    label: 'Orders',    href: '/orders',     icon: ShoppingCart },
  { slug: 'kds',       label: 'KDS',       href: '/kds',        icon: Package },
  // queue points to /table-map — both show as active on that route (wireframe acceptable)
  { slug: 'queue',     label: 'Queue',     href: '/table-map',  icon: Users },
  { slug: 'dashboard', label: 'Dashboard', href: '/dashboard',  icon: LineChart },
]

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { slug: 'manager', label: 'Manager', href: '/manager', icon: Settings },
]

interface AppSidebarProps {
  collapsed: boolean
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname()
  const { role, shiftOpen } = useSessionStore()

  // Zustand selector safety — raw Record, derive in useMemo
  const orders = useQueueStore((s) => s.orders)
  const activeQueueCount = useMemo(
    () =>
      Object.values(orders).filter((o) => {
        if (o.channel === 'delivery') {
          return ['Confirmed', 'Preparing', 'ReadyForRider'].includes(o.status)
        }
        if (o.channel === 'takeaway') {
          return ['Taking', 'Sent', 'Ready'].includes(o.status)
        }
        return false
      }).length,
    [orders]
  )

  function renderNavItem({ slug, label, href, icon: Icon }: NavItem) {
    // Hide items the current role can't access at all
    const hasRoleAccess = role ? canAccess(role, slug) : false
    if (!hasRoleAccess) return null

    const isActive = pathname === href || pathname.startsWith(href + '/')

    const iconEl = (
      <span
        className={cn(
          'flex items-center justify-center h-8 w-8 rounded-lg transition-colors shrink-0',
          isActive
            ? 'bg-accent text-foreground'
            : shiftOpen
            ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
            : 'text-muted-foreground/30'
        )}
      >
        <Icon size={16} />
      </span>
    )

    return (
      <li key={slug} className="relative">
        {shiftOpen ? (
          <Link
            href={href}
            className={cn(
              'flex items-center rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'justify-center' : 'gap-3 px-2 py-1'
            )}
            title={collapsed ? label : undefined}
          >
            {iconEl}
            {!collapsed && <span className="truncate">{label}</span>}
            {slug === 'queue' && !collapsed && activeQueueCount > 0 && (
              <span className="ml-auto h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {activeQueueCount}
              </span>
            )}
          </Link>
        ) : (
          <div
            className={cn(
              'flex items-center rounded-lg text-sm font-medium cursor-not-allowed select-none',
              collapsed ? 'justify-center' : 'gap-3 px-2 py-1'
            )}
            title="Open a shift first"
          >
            {iconEl}
            {!collapsed && <span className="truncate text-muted-foreground/30">{label}</span>}
          </div>
        )}
        {/* Collapsed dot indicator for queue pending count */}
        {slug === 'queue' && collapsed && activeQueueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
        )}
      </li>
    )
  }

  return (
    <nav
      className={cn(
        'border-r border-border bg-card flex flex-col shrink-0 transition-all duration-200',
        collapsed ? 'w-12' : 'w-56'
      )}
    >
      {/* Top section: brand logo + main nav */}
      <div
        className={cn(
          'flex flex-col items-center px-2 py-5 gap-4',
          !collapsed && 'items-stretch px-3'
        )}
      >
        {/* Brand logo */}
        <div className={cn('flex items-center', !collapsed && 'gap-3 px-2 py-1')}>
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground shrink-0">
            <Package2 size={16} />
          </span>
          {!collapsed && <span className="font-semibold text-sm truncate">A Ramen</span>}
        </div>

        <ul className={cn('flex flex-col', collapsed ? 'gap-4 items-center' : 'gap-1 w-full')}>
          {TOP_NAV_ITEMS.map((item) => renderNavItem(item))}
        </ul>
      </div>

      {/* Bottom section: settings / manager */}
      <div
        className={cn(
          'mt-auto flex flex-col items-center px-2 py-5',
          !collapsed && 'items-stretch px-3'
        )}
      >
        <ul className={cn('flex flex-col', collapsed ? 'items-center' : 'w-full gap-1')}>
          {BOTTOM_NAV_ITEMS.map((item) => renderNavItem(item))}
        </ul>
      </div>
    </nav>
  )
}
