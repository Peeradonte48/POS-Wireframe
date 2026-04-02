'use client'
import { useMemo } from 'react'
import { useOrderStore } from '@/stores/order.store'
import { useKdsStore } from '@/stores/kds.store'
import { useTableStore } from '@/stores/table.store'
import { deriveRoundStage, isRoundEscalated } from '@/lib/order-tracking'
import { useSentTimer } from './useSentTimer'
import type { OrderRound } from '@/stores/order.store'
import type { OrderStage } from '@/stores/table.store'

const STAGE_DOT_CLASS: Record<OrderStage, string> = {
  Ordered: 'bg-status-ordered',
  Cooking:  'bg-status-cooking',
  Ready:    'bg-status-ready',
  Served:   'bg-status-settled',
  Billed:   'bg-status-settled',
}

interface RoundSectionProps {
  round: OrderRound
  index: number
  stage: OrderStage
}

function RoundSection({ round, index, stage }: RoundSectionProps) {
  // One useSentTimer per round — must be at component level, not inside a loop
  const elapsed = useSentTimer(round.sentAt)
  const escalated = isRoundEscalated(round.sentAt)

  const sentTime = round.sentAt
    ? new Date(round.sentAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : null

  const visibleItems = round.items.filter((i) => i.status !== 'voided')

  return (
    <div className="flex flex-col gap-1">
      {/* Round header */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Round {index + 1}{sentTime ? ` · ${sentTime}` : ''}
      </p>

      {/* Item rows */}
      {visibleItems.map((item) => (
        <div
          key={item.lineId}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-md ${
            escalated ? 'bg-status-escalated-bg/40' : ''
          }`}
        >
          {/* Stage dot */}
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_DOT_CLASS[stage]}`}
          />
          {/* Item name */}
          <span className="flex-1 text-sm">{item.menuItemName}</span>
          {/* Elapsed time */}
          <span
            className={`text-xs font-mono ${
              escalated ? 'text-status-escalated' : 'text-muted-foreground'
            }`}
          >
            {elapsed} min
          </span>
        </div>
      ))}
    </div>
  )
}

interface OrderTimelineProps {
  tableId: string
}

export function OrderTimeline({ tableId }: OrderTimelineProps) {
  const tickets = useKdsStore((s) => s.tickets)
  const orders = useOrderStore((s) => s.orders)
  // table read for potential future servedAt-based display extensions
  useTableStore((s) => s.tables[tableId])

  // Only show rounds that have been sent (sentAt !== null)
  const sentRounds = useMemo(
    () => orders[tableId]?.rounds.filter((r) => r.sentAt !== null) ?? [],
    [orders, tableId],
  )

  // Derive the overall stage from KDS ticket
  const stage = useMemo(
    () => deriveRoundStage(tableId, tickets),
    [tableId, tickets],
  )

  // Collect escalated rounds for the summary banner
  const escalatedRounds = useMemo(
    () => sentRounds.filter((r) => isRoundEscalated(r.sentAt)),
    [sentRounds],
  )

  // Empty state
  if (sentRounds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-3">No order sent yet.</p>
    )
  }

  return (
    <div className="px-4 pb-4 flex flex-col gap-4">
      {/* Round sections — each calls useSentTimer via RoundSection sub-component */}
      {sentRounds.map((round, idx) => (
        <RoundSection
          key={round.roundId}
          round={round}
          index={idx}
          stage={stage}
        />
      ))}

      {/* Escalation summary banner — only shown when at least one round is over threshold */}
      {escalatedRounds.length > 0 && (
        <div className="rounded-lg bg-status-escalated-bg text-status-escalated px-3 py-2 text-xs font-medium flex flex-col gap-0.5">
          {escalatedRounds.flatMap((r) =>
            r.items
              .filter((i) => i.status !== 'voided')
              .map((item) => (
                <span key={item.lineId}>
                  Delayed: {item.menuItemName} — {Math.floor((Date.now() - r.sentAt!) / 60_000)} min in {stage}
                </span>
              )),
          )}
        </div>
      )}
    </div>
  )
}
