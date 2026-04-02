'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { canAccess } from '@/lib/role-permissions'
import type { NavSlug } from '@/lib/role-permissions'
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
  { slug: 'loyalty',   label: 'Loyalty',   href: '/loyalty',    icon: Users },
  { slug: 'dashboard', label: 'Dashboard', href: '/dashboard',  icon: LineChart },
]

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { slug: 'manager', label: 'Manager', href: '/manager', icon: Settings },
]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { role, shiftOpen } = useSessionStore()

  function renderNavItem({ slug, label, href, icon: Icon }: NavItem) {
    const hasRoleAccess = role ? canAccess(role, slug) : false
    const isClickable = hasRoleAccess && shiftOpen
    const isActive = isClickable && (pathname === href || pathname.startsWith(href + '/'))
    const disabledTitle = !shiftOpen ? 'Open a shift first' : 'Access restricted for your role'

    if (isClickable && !isActive) {
      return (
        <button
          key={slug}
          onClick={() => router.push(href)}
          title={label}
          className="flex items-center justify-center rounded-lg size-8 text-muted-foreground hover:bg-accent transition-colors"
        >
          <Icon size={20} />
        </button>
      )
    }

    return (
      <button
        key={slug}
        title={isActive ? label : disabledTitle}
        disabled={!isClickable}
        className={
          isActive
            ? 'flex items-center justify-center rounded-lg size-8 bg-accent text-foreground transition-colors'
            : 'flex items-center justify-center rounded-lg size-8 text-muted-foreground/30 cursor-not-allowed'
        }
      >
        <Icon size={20} />
      </button>
    )
  }

  return (
    <nav className="w-12 h-full shrink-0 flex flex-col items-center justify-between py-5 px-2">
      {/* Top: brand + main nav */}
      <div className="flex flex-col items-center gap-4 w-full">
        <button className="bg-primary flex items-center justify-center rounded-full size-8 shrink-0">
          <Package2 size={16} className="text-primary-foreground" />
        </button>
        {TOP_NAV_ITEMS.map((item) => renderNavItem(item))}
      </div>

      {/* Bottom: settings / manager */}
      <div className="flex flex-col items-center gap-4 w-full">
        {BOTTOM_NAV_ITEMS.map((item) => renderNavItem(item))}
      </div>
    </nav>
  )
}
