'use client'

import type { Role } from '@/stores/session.store'
import { Users, DollarSign, ShieldCheck, ChefHat, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleSelectorProps {
  onSelect: (role: Role) => void
}

const ROLE_CONFIG: { role: Role; label: string; icon: LucideIcon }[] = [
  { role: 'Waiter',   label: 'Waiter',   icon: Users },
  { role: 'Cashier',  label: 'Cashier',  icon: DollarSign },
  { role: 'Manager',  label: 'Manager',  icon: ShieldCheck },
  { role: 'Kitchen',  label: 'Kitchen',  icon: ChefHat },
]

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div>
        <h1 className="text-2xl font-bold text-center">A Ramen POS</h1>
        <p className="text-muted-foreground text-center mt-1">Select your role to continue</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {ROLE_CONFIG.map(({ role, label, icon: Icon }) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            className={cn(
              'flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-border bg-card',
              'hover:border-brand-primary hover:bg-muted/50 active:scale-95 transition-all'
            )}
          >
            <Icon size={28} />
            <span className="font-medium text-sm">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
