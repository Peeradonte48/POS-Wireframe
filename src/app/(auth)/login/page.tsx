'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RoleSelector } from '@/components/auth/RoleSelector'
import { PinNumpad } from '@/components/auth/PinNumpad'
import { verifyPin } from '@/lib/mock-data/staff'
import { useSessionStore } from '@/stores/session.store'
import type { Role } from '@/stores/session.store'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type LoginStep = 'role' | 'pin'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useSessionStore()

  const [step, setStep] = useState<LoginStep>('role')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [pinError, setPinError] = useState(false)

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setStep('pin')
  }

  const handlePinComplete = useCallback(
    (pin: string) => {
      if (!selectedRole) return
      const staff = verifyPin(selectedRole, pin)
      if (staff) {
        login(staff.role, staff.name, staff.id)
        router.replace('/shift-open')
      } else {
        setPinError(true)
      }
    },
    [selectedRole, login, router]
  )

  const handleErrorClear = useCallback(() => {
    setPinError(false)
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {step === 'role' && (
        <RoleSelector onSelect={handleRoleSelect} />
      )}

      {step === 'pin' && selectedRole && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-full flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStep('role'); setSelectedRole(null); setPinError(false) }}
              className="gap-1"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-center">{selectedRole}</h2>
            <p className="text-muted-foreground text-center text-sm mt-1">Enter your PIN</p>
          </div>
          <PinNumpad
            onComplete={handlePinComplete}
            error={pinError}
            onErrorClear={handleErrorClear}
          />
          {pinError && (
            <p className="text-sm text-destructive">Incorrect PIN. Try again.</p>
          )}
        </div>
      )}
    </div>
  )
}
