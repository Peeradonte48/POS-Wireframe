'use client'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useOrderStore } from '@/stores/order.store'
import { useTableStore } from '@/stores/table.store'
import { useSessionStore } from '@/stores/session.store'
import { useManagerStore } from '@/stores/manager.store'
import { canDoAction } from '@/lib/role-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm tabular-nums', bold && 'font-semibold text-foreground')}>{value}</span>
    </div>
  )
}

export function EodSummaryTab() {
  const orders = useOrderStore((s) => s.orders)
  const tables = useTableStore((s) => s.tables)
  const { openingCash, logout, role } = useSessionStore()
  const { shiftClosed, closeShift } = useManagerStore()

  const [closingCash, setClosingCash] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const {
    grossRevenue,
    vatAmount,
    netSales,
    coverCount,
    voidCount,
    cashTotal,
    qrTotal,
    cardTotal,
    discountTotal,
  } = useMemo(() => {
    const allItems = Object.values(orders).flatMap((o) => o.rounds.flatMap((r) => r.items))
    const soldItems = allItems.filter((i) => i.status !== 'voided')
    const voidedItems = allItems.filter((i) => i.status === 'voided')
    const grossRevenue = soldItems.reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
    const vatAmount = Math.round(grossRevenue * 0.07)
    const netSales = grossRevenue + vatAmount
    const voidCount = voidedItems.length
    const coverCount = Object.values(tables)
      .filter((t) => t.openedAt !== null)
      .reduce((sum, t) => sum + (t.guestCount ?? 0), 0)
    const paidTables = Object.values(tables).filter((t) => t.paidAmount !== null)
    const cashTotal = paidTables
      .filter((t) => t.paymentMethod === 'Cash')
      .reduce((sum, t) => sum + (t.paidAmount ?? 0), 0)
    const qrTotal = paidTables
      .filter((t) => t.paymentMethod === 'QR PromptPay')
      .reduce((sum, t) => sum + (t.paidAmount ?? 0), 0)
    const cardTotal = paidTables
      .filter((t) => t.paymentMethod === 'Card')
      .reduce((sum, t) => sum + (t.paidAmount ?? 0), 0)
    const discountTotal = paidTables.reduce((sum, t) => sum + (t.discountApplied ?? 0), 0)
    return { grossRevenue, vatAmount, netSales, coverCount, voidCount, cashTotal, qrTotal, cardTotal, discountTotal }
  }, [orders, tables])

  const variance = closingCash - (openingCash ?? 0) - cashTotal

  return (
    <div className="p-4 space-y-4">
      {shiftClosed && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-sm font-medium text-green-800">Shift Closed</span>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      )}

      {!shiftClosed && (
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => setConfirmOpen(true)}
          disabled={!role || !canDoAction(role, 'close-shift')}
        >
          Close Shift
        </Button>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Close Shift?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will lock the EOD summary. You can review before logging out.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={() => { closeShift(); toast.success('Shift closed'); setConfirmOpen(false) }}>Close Shift</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty state — no orders this shift */}
      {grossRevenue === 0 && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No orders this shift
        </div>
      )}

      {/* Sales Summary */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="caps">Sales Summary</p>
        <div className="space-y-1.5">
          <Row label="Gross Revenue" value={`฿${grossRevenue.toLocaleString()}`} />
          <Row label="VAT (7%)" value={`฿${vatAmount.toLocaleString()}`} />
          <Row label="Net Sales" value={`฿${netSales.toLocaleString()}`} bold />
          <Row label="Cover Count" value={`${coverCount} pax`} />
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="caps">Payment Breakdown</p>
        <div className="space-y-1.5">
          <Row label="Cash" value={`฿${cashTotal.toLocaleString()}`} />
          <Row label="QR PromptPay" value={`฿${qrTotal.toLocaleString()}`} />
          <Row label="Card" value={`฿${cardTotal.toLocaleString()}`} />
        </div>
      </div>

      {/* Adjustments */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="caps">Adjustments</p>
        <div className="space-y-1.5">
          <Row label="Void Count" value={`${voidCount} items`} />
          <Row label="Discount Total" value={`฿${discountTotal.toLocaleString()}`} />
        </div>
      </div>

      {/* Cash Reconciliation */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="caps">Cash Reconciliation</p>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Closing Cash (฿)</label>
          <Input
            type="number"
            value={closingCash || ''}
            onChange={(e) => setClosingCash(Number(e.target.value) || 0)}
            disabled={shiftClosed}
            placeholder="0"
            className="tabular-nums"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Variance</span>
          <span className={cn('text-sm font-medium tabular-nums', variance >= 0 ? 'text-green-600' : 'text-red-500')}>
            {variance >= 0
              ? `Over ฿${variance.toLocaleString()}`
              : `Short ฿${Math.abs(variance).toLocaleString()}`}
          </span>
        </div>
      </div>
    </div>
  )
}
