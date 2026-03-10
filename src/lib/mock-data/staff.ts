import type { Role } from '@/stores/session.store'

export interface StaffMember {
  id: string
  name: string
  role: Role
  pin: string // 4-digit string
}

export const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Somchai',  role: 'Waiter',   pin: '1234' },
  { id: 's2', name: 'Nida',     role: 'Cashier',  pin: '2345' },
  { id: 's3', name: 'Prayuth',  role: 'Manager',  pin: '9999' },
  { id: 's4', name: 'Malee',    role: 'Kitchen',  pin: '5678' },
]

export function verifyPin(role: Role, pin: string): StaffMember | null {
  return MOCK_STAFF.find((s) => s.role === role && s.pin === pin) ?? null
}
