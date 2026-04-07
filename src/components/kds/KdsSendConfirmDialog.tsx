'use client'

import { X, HandPlatter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { KdsTicket } from '@/stores/kds.store'
import { useKdsTimer } from '@/components/kds/useKdsTimer'

interface AffectedTable {
  tableLabel: string
  itemCount: number
  earliestAddedAt: number
}

interface KdsSendConfirmDialogProps {
  /** Menu item name being sent */
  itemName: string
  /** Total count of items across all tables */
  totalCount: number
  /** Tables affected by this send action */
  affectedTables: AffectedTable[]
  onConfirm: () => void
  onCancel: () => void
}

function TableRow({ table }: { table: AffectedTable }) {
  const { display, urgency } = useKdsTimer(table.earliestAddedAt)

  const timerBadgeClass =
    urgency === 'green'
      ? 'bg-[#16a34a] text-white border-transparent'
      : urgency === 'amber'
        ? 'bg-[#d97706] text-white border-transparent'
        : 'bg-[#dc2626] text-white border-transparent'

  return (
    <div
      className="bg-card border border-border rounded-xl flex items-center justify-between p-4"
      style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)' }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="bg-card border border-input flex items-center justify-center rounded-md shrink-0 size-9"
          style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
        >
          <HandPlatter size={16} className="text-foreground" />
        </div>
        <span className="font-semibold text-base text-card-foreground">{table.tableLabel}</span>
        <Badge variant="outline" className="text-xs font-semibold">
          {table.itemCount}x
        </Badge>
      </div>
      <Badge className={`text-xs font-semibold ${timerBadgeClass}`}>
        {display}
      </Badge>
    </div>
  )
}

export function KdsSendConfirmDialog({
  itemName,
  totalCount,
  affectedTables,
  onConfirm,
  onCancel,
}: KdsSendConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div
        className="relative bg-background border border-border rounded-lg flex flex-col gap-4 p-6 w-full max-w-[420px] max-h-[80vh] animate-in zoom-in-95 duration-200"
        style={{ boxShadow: '0px 10px 15px 0px rgba(0,0,0,0.1), 0px 4px 6px 0px rgba(0,0,0,0.1)' }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-foreground/70 hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5 text-center">
          <p className="text-lg font-semibold text-foreground leading-none">
            ส่ง{itemName}ทั้งหมด
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center overflow-auto">
          <div className="flex flex-col gap-2.5 items-center w-full">
            <p className="text-sm text-muted-foreground text-center">
              {totalCount} รายการจะถูกส่งพร้อมกัน
              <br />
              <span className="text-base font-bold text-foreground">ที่ออร์เดอร์</span>
            </p>

            {/* Affected tables list */}
            <div className="flex flex-col gap-2.5 w-full">
              {affectedTables.map((table) => (
                <TableRow key={table.tableLabel} table={table} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="flex w-full h-12 items-center justify-center rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            ยืนยัน
          </button>
          <button
            onClick={onCancel}
            className="flex w-full h-12 items-center justify-center rounded-md border border-input bg-background text-foreground text-sm font-medium hover:bg-muted active:scale-[0.97] transition-all"
            style={{ boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}
