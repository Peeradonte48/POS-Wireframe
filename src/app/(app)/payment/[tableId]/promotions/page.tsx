'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useBillStore } from '@/stores/bill.store'
import { useTableStore } from '@/stores/table.store'
import { useOrderStore } from '@/stores/order.store'
import { PROMOTIONS } from '@/lib/mock-data/promotions'
import { CrmLookupDialog } from '@/components/payment/CrmLookupDialog'
import { CouponEntry } from '@/components/payment/CouponEntry'
import { PromotionList } from '@/components/payment/PromotionList'
import { usePromotionValidation } from '@/components/payment/usePromotionValidation'

// ---------------------------------------------------------------------------
// PromotionsPage — orchestrator
// ---------------------------------------------------------------------------

export default function PromotionsPage() {
  const params = useParams<{ tableId: string }>()
  const tableId = params.tableId
  const router = useRouter()

  const tables = useTableStore((s) => s.tables)
  const tableLabel = tables[tableId]?.label ?? tableId

  const crmMember = useBillStore((s) => s.crmMembers[tableId] ?? null)
  const promotionDiscounts = useBillStore((s) => s.promotionDiscounts[tableId] ?? [])
  const { setCrmMember } = useBillStore()
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)

  const order = useOrderStore((s) => s.getOrder(tableId))
  const orderItems = useMemo(
    () => (order ? order.rounds.flatMap((r) => r.items).filter((i) => i.status !== 'voided') : []),
    [order],
  )

  // ---- Filter tabs ----
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent'>('all')

  // ---- Selected promotion (opens coupon entry sheet) ----
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null)
  const selectedPromo = PROMOTIONS.find((p) => p.id === selectedPromoId) ?? null

  // ---- Promotion validation hook ----
  const { codeInput, codeState, handleCodeChange, handleApply, resetCoupon } =
    usePromotionValidation(tableId)

  const appliedIds = promotionDiscounts.map((d) => d.promotionId)

  function handleCloseSheet() {
    setSelectedPromoId(null)
    resetCoupon()
  }

  function handleApplyAndNavigate(selectedLineIds: string[]) {
    if (!selectedPromoId) return
    handleApply(selectedPromoId, selectedLineIds, codeInput)
    handleCloseSheet()
    router.push(`/payment/${tableId}?promoApplied=1`)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-[52px] border-b flex items-center gap-2 px-6 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none">
            โปรโมชัน · {tableLabel}
          </span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">

            {/* CRM member card or placeholder */}
            {crmMember ? (
              <div className="bg-background border border-border rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Crown size={18} className="text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <p className="font-semibold text-base text-foreground truncate">{crmMember.name}</p>
                    <span className="inline-flex items-center text-xs font-semibold text-primary-foreground bg-destructive px-2 py-0.5 rounded-md w-fit">
                      ระดับ: {crmMember.level}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">คะแนนสะสม</p>
                    <p className="font-semibold text-base text-destructive">{crmMember.points}</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCrmDialogOpen(true)}
                className="border border-dashed border-border rounded-2xl flex items-center justify-center gap-2 py-6 w-full hover:bg-accent transition-colors cursor-pointer"
              >
                <Crown size={18} className="text-destructive shrink-0" />
                <span className="font-medium text-sm text-destructive">เพิ่มเบอร์สมาชิกลูกค้า</span>
              </button>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(['all', 'recent'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeFilter === f
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                >
                  {f === 'all' ? 'ทั้งหมด' : 'ล่าสุด'}
                </button>
              ))}
            </div>

            {/* Promotion list */}
            <PromotionList
              promotions={PROMOTIONS}
              appliedIds={appliedIds}
              onSelect={(promoId) => { setSelectedPromoId(promoId) }}
            />

          </div>
        </div>
      </div>

      {/* CRM member lookup dialog */}
      <CrmLookupDialog
        open={crmDialogOpen}
        onClose={() => setCrmDialogOpen(false)}
        onMemberFound={(member) => {
          setCrmMember(tableId, member)
          setCrmDialogOpen(false)
        }}
      />

      {/* Coupon entry bottom sheet */}
      <Sheet open={!!selectedPromo} onOpenChange={(open) => { if (!open) handleCloseSheet() }}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl p-0 max-h-[92vh] flex flex-col">
          {selectedPromo && (
            <CouponEntry
              promo={selectedPromo}
              codeInput={codeInput}
              codeState={codeState}
              orderItems={orderItems}
              onCodeChange={(value) => handleCodeChange(value, selectedPromo.referenceCode)}
              onApply={handleApplyAndNavigate}
              onCancel={handleCloseSheet}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
