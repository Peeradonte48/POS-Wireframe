'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Coins, Crown, UserSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const promotionDiscountsRaw = useBillStore((s) => s.promotionDiscounts[tableId])
  const promotionDiscounts = promotionDiscountsRaw ?? []
  const { setCrmMember } = useBillStore()
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)

  const order = useOrderStore((s) => s.orders[tableId])
  const orderItems = useMemo(
    () => (order ? order.rounds.flatMap((r) => r.items).filter((i) => i.status !== 'voided') : []),
    [order],
  )

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
        <header className="border-b flex items-center gap-2 px-6 py-3 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </Button>
          <span className="font-medium text-base leading-none truncate">
            โปรโมชัน · {tableLabel}
          </span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">

            {/* CRM member card */}
            {crmMember ? (
              <div className="bg-muted border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-2">
                {/* Top row: avatar + name + search button */}
                <div className="flex gap-2 items-center h-12 px-0 py-2">
                  {/* Avatar */}
                  <div className="size-8 rounded-full bg-muted shrink-0 overflow-hidden">
                    <div className="size-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {crmMember.name.charAt(0)}
                    </div>
                  </div>
                  {/* Name + level */}
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <p className="font-medium text-sm text-foreground truncate leading-5">
                      {crmMember.name}
                    </p>
                    <Badge variant="default" className="w-fit text-xs">
                      ระดับ: {crmMember.level}
                    </Badge>
                  </div>
                  {/* Search button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => setCrmDialogOpen(true)}
                    aria-label="ค้นหาสมาชิก"
                  >
                    <UserSearch size={16} />
                  </Button>
                </div>
                {/* Points row */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 items-center">
                    <Coins size={16} className="text-accent-foreground" />
                    <span className="font-medium text-base text-accent-foreground">คะแนนสะสม</span>
                  </div>
                  <span className="font-semibold text-base text-primary">{crmMember.points}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCrmDialogOpen(true)}
                className="bg-background border border-border rounded-[14px] flex items-center justify-center gap-2 p-4 w-full h-[104px] hover:bg-accent transition-colors cursor-pointer"
              >
                <Crown size={16} className="text-primary shrink-0" />
                <span className="font-medium text-sm text-foreground">เพิ่มเบอร์สมาชิกลูกค้า</span>
              </button>
            )}

            {/* Filter + promotion list */}
            <div className="flex flex-col flex-1 gap-4 min-h-0">
              {/* Filter dropdown buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="h-9 gap-2 px-4">
                  <span className="text-sm font-medium">ทั้งหมด</span>
                  <ChevronDown size={16} />
                </Button>
                <Button variant="outline" className="h-9 gap-2 px-4">
                  <span className="text-sm font-medium">ล่าสุด</span>
                  <ChevronDown size={16} />
                </Button>
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
