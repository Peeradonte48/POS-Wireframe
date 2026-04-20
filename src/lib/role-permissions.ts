import type { Role } from '@/stores/session.store'

export type NavSlug = 'table-map' | 'orders' | 'kds' | 'payment' | 'manager' | 'dashboard' | 'loyalty' | 'settings'

export const ROLE_NAV_ACCESS: Record<Role, NavSlug[]> = {
  Waiter:  ['table-map', 'orders'],
  Cashier: ['table-map', 'orders', 'payment'],
  Manager: ['table-map', 'orders', 'kds', 'payment', 'manager', 'dashboard', 'loyalty', 'settings'],
  Kitchen: ['kds'],
}

export function canAccess(role: Role, slug: NavSlug): boolean {
  return ROLE_NAV_ACCESS[role].includes(slug)
}

// ---------------------------------------------------------------------------
// Action-level permissions
// ---------------------------------------------------------------------------

export type ActionKey =
  | 'open-table'
  | 'mark-reserved'
  | 'undo-reserved'
  | 'request-check'
  | 'send-to-kitchen'
  | 'void-pre-send'
  | 'void-post-send'   // void after order sent to kitchen
  | 'confirm-payment'
  | 'eighty-six-toggle'
  | 'close-shift'
  | 'kds-bump'
  | 'mark-served'
  | 'new-takeaway'

export const ACTION_PERMISSIONS: Record<ActionKey, Role[]> = {
  'open-table':        ['Waiter', 'Cashier', 'Manager'],
  'mark-reserved':     ['Waiter', 'Cashier', 'Manager'],
  'undo-reserved':     ['Waiter', 'Cashier', 'Manager'],
  'request-check':     ['Waiter', 'Cashier', 'Manager'],
  'send-to-kitchen':   ['Waiter', 'Manager'],
  'void-pre-send':     ['Waiter', 'Cashier', 'Manager'],
  'void-post-send':    ['Manager'],
  'confirm-payment':   ['Cashier', 'Manager'],
  'eighty-six-toggle': ['Manager'],
  'close-shift':       ['Manager'],
  'kds-bump':          ['Kitchen', 'Manager'],
  'mark-served':       ['Waiter', 'Cashier', 'Manager'],
  'new-takeaway':      ['Waiter', 'Cashier', 'Manager'],
}

export function canDoAction(role: Role, action: ActionKey): boolean {
  return ACTION_PERMISSIONS[action].includes(role)
}
