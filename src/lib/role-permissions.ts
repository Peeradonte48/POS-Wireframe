import type { Role } from '@/stores/session.store'

export type NavSlug = 'table-map' | 'orders' | 'kds' | 'payment' | 'manager'

export const ROLE_NAV_ACCESS: Record<Role, NavSlug[]> = {
  Waiter:  ['table-map', 'orders'],
  Cashier: ['table-map', 'orders', 'payment'],
  Manager: ['table-map', 'orders', 'kds', 'payment', 'manager'],
  Kitchen: ['kds'],
}

export function canAccess(role: Role, slug: NavSlug): boolean {
  return ROLE_NAV_ACCESS[role].includes(slug)
}
