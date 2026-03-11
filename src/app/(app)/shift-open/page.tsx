'use client'

import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session.store'
import { ShiftOpenForm } from '@/components/shift/ShiftOpenForm'
import { AlarmLinear } from 'solar-icon-set' // Solar equivalent for Lucide AlarmClock

export default function ShiftOpenPage() {
  const router = useRouter()
  const { openShift } = useSessionStore()

  const handleShiftOpen = (branchId: string, branchName: string, openingCash: number) => {
    openShift(branchId, branchName, openingCash)
    router.replace('/table-map')
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-full gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <AlarmLinear size={24} className="text-amber-600" />
        </div>
        <h1 className="text-xl font-semibold">Open Your Shift</h1>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          Select your branch and enter the opening cash amount to begin service.
        </p>
      </div>

      <ShiftOpenForm onSubmit={handleShiftOpen} />
    </div>
  )
}
