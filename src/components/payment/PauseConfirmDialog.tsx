'use client'

import { useState } from 'react'
import { ArrowRightFromLine, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ManagerPinModal } from '@/components/auth/ManagerPinModal'

export type PauseScenario = 'normal' | 'split-partial'

interface PauseConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenario: PauseScenario
  tableLabel: string
  paidSeats?: number
  totalSeats?: number
  onResumeLater: () => void
  onCancelAuthorized: () => void
}

export function PauseConfirmDialog({
  open,
  onOpenChange,
  scenario,
  tableLabel,
  paidSeats,
  totalSeats,
  onResumeLater,
  onCancelAuthorized,
}: PauseConfirmDialogProps) {
  const [pinOpen, setPinOpen] = useState(false)

  const isSplit = scenario === 'split-partial'
  const title = 'ยืนยันออกจากหน้าชำระเงิน'
  const description = 'คุณสามารถกลับมาดำเนินการต่อได้ภายหลัง'
  const cancelLabel = isSplit ? 'ยกเลิกการชำระทั้งหมด' : 'ยกเลิกการชำระ'
  const authorizeLabel = isSplit
    ? 'Authorize: Cancel Split Payment'
    : 'Authorize: Cancel Payment'
  const cancelSubtext = isSplit
    ? `ธุรกรรมที่ชำระแล้วจะถูกยกเลิกโดยผู้จัดการ (${tableLabel} ชำระแล้ว ${paidSeats ?? 0}/${totalSeats ?? 0} ที่นั่ง)`
    : undefined

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full h-14 text-base font-medium"
              onClick={() => onOpenChange(false)}
            >
              อยู่ต่อ
            </Button>
            <Button
              className="w-full h-14 text-base font-medium gap-2"
              onClick={onResumeLater}
            >
              <ArrowRightFromLine size={16} />
              ออกจากหน้านี้
            </Button>

            <div className="pt-2">
              <Separator />
            </div>

            <Button
              variant="destructive"
              className="w-full h-14 text-base font-medium gap-2 mt-2"
              onClick={() => setPinOpen(true)}
            >
              <ShieldAlert size={16} />
              {cancelLabel}
            </Button>
            {cancelSubtext && (
              <p className="text-xs text-center text-muted-foreground px-2">
                {cancelSubtext}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ManagerPinModal
        open={pinOpen}
        onOpenChange={setPinOpen}
        actionLabel={authorizeLabel}
        onAuthorize={() => {
          setPinOpen(false)
          onOpenChange(false)
          onCancelAuthorized()
        }}
      />
    </>
  )
}
