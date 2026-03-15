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
  Widget5Linear,
  NotesLinear,
  MonitorSmartphoneLinear,
  CardTransferLinear,
  ChartSquareLinear,
  LockPasswordLinear,
  InboxLinear,
} from 'solar-icon-set'

type SolarIcon = React.ComponentType<{ size?: number; className?: string; color?: string }>

interface NavItem {
  slug: NavSlug
  label: string
  href: string
  icon: SolarIcon
}

const NAV_ITEMS: NavItem[] = [
  { slug: 'table-map', label: 'Table Map',  href: '/table-map', icon: Widget5Linear },
  { slug: 'orders',    label: 'Orders',     href: '/orders',    icon: NotesLinear },
  // Both table-map and queue point to /table-map — both show as active on this route (wireframe acceptable)
  { slug: 'queue',     label: 'Queue',      href: '/table-map', icon: InboxLinear },
  { slug: 'kds',       label: 'KDS',        href: '/kds',       icon: MonitorSmartphoneLinear },
  { slug: 'payment',   label: 'Payment',    href: '/payment',   icon: CardTransferLinear },
  { slug: 'manager',   label: 'Manager',    href: '/manager',   icon: ChartSquareLinear },
]

interface AppSidebarProps {
  collapsed: boolean
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname()
  const { role, shiftOpen } = useSessionStore()

  // Zustand selector safety — raw Record, derive in useMemo
  const orders = useQueueStore((s) => s.orders)
  const pendingDeliveryCount = useMemo(
    () =>
      Object.values(orders).filter(
        (o) => o.channel === 'delivery' && o.status === 'Pending'
      ).length,
    [orders]
  )

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
          'flex items-center gap-2 px-3 py-2 bg-status-check-requested-bg border-b border-status-check-requested/30 text-status-check-requested text-xs',
          collapsed && 'justify-center px-0'
        )}>
          <LockPasswordLinear size={12} className="shrink-0" />
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
            <li key={slug} className="relative">
              {isAccessible ? (
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {/* Queue badge — expanded: count label; collapsed: dot indicator */}
                  {slug === 'queue' && !collapsed && pendingDeliveryCount > 0 && (
                    <span className="ml-auto h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {pendingDeliveryCount}
                    </span>
                  )}
                </Link>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium',
                    collapsed && 'justify-center px-2',
                    'text-muted-foreground/40 cursor-not-allowed select-none'
                  )}
                  title={!hasRoleAccess ? `${label} — not available for ${role}` : 'Open a shift first'}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </div>
              )}
              {/* Collapsed dot indicator for queue pending count */}
              {slug === 'queue' && collapsed && pendingDeliveryCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
