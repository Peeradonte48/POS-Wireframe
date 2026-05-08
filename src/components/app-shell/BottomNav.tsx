'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'
import { canAccess, type NavSlug } from '@/lib/role-permissions'

interface NavTab {
  key: NavSlug
  label: string
  icon: LucideIcon
  href: string
  /** Pathname prefix that activates this tab (defaults to href) */
  pathPrefix?: string
  /** Hard-disabled regardless of role (feature not yet shipped) */
  comingSoon?: boolean
}

const NAV_TABS: NavTab[] = [
  { key: 'table-map', label: 'ผังร้าน',   icon: LayoutGrid,    href: '/table-map' },
  { key: 'loyalty',   label: 'CRM',        icon: Users,         href: '/loyalty',   comingSoon: true },
  { key: 'orders',    label: 'ออร์เดอร์', icon: ClipboardList, href: '/orders',    comingSoon: true },
  { key: 'settings',  label: 'ตั้งค่า',    icon: Settings,      href: '/settings'  },
]

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { role, shiftOpen } = useSessionStore()

  function isActive(tab: NavTab): boolean {
    const prefix = tab.pathPrefix ?? tab.href
    return pathname === prefix || pathname.startsWith(prefix + '/')
  }

  function isAccessible(tab: NavTab): boolean {
    if (tab.comingSoon) return false
    if (!role || !shiftOpen) return false
    return canAccess(role, tab.key)
  }

  return (
    <div className="shrink-0 flex items-center justify-center gap-[10px] px-4 py-2 bg-card">
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon
        const active = isActive(tab)
        const accessible = isAccessible(tab)

        return (
          <button
            key={tab.key}
            onClick={() => accessible && router.push(tab.href)}
            disabled={!accessible}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            className={
              `relative flex items-center justify-center gap-2 h-14 px-8 py-2 rounded-md transition-colors ` +
              (accessible
                ? 'cursor-pointer hover:bg-accent/50'
                : 'cursor-not-allowed opacity-40')
            }
          >
            <span className={
              `relative inline-flex items-center gap-2 ` +
              (active ? 'text-primary' : 'text-foreground')
            }>
              <Icon size={16} className="shrink-0" />
              <span className="text-base font-medium leading-6 whitespace-nowrap">
                {tab.label}
              </span>
              {active && (
                <span
                  aria-hidden
                  className="absolute -bottom-[5px] left-0 right-0 h-[2px] bg-primary rounded-full"
                />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
