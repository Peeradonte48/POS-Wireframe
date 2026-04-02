import type { KdsStage } from '@/stores/kds.store'
import type { OrderStage } from '@/stores/table.store'

/**
 * Elapsed time threshold for escalation warning (15 minutes).
 * Hardcoded per Phase 15 locked decision — no manager-configurable threshold.
 */
export const ESCALATION_THRESHOLD_MS = 15 * 60 * 1000

/**
 * Map KDS ticket stage to the display OrderStage.
 * "No ticket found" is treated as Served (wireframe simplification — acceptable per CONTEXT.md).
 */
export function deriveRoundStage(
  tableId: string,
  tickets: Record<string, { tableId: string; stage: KdsStage }>,
): OrderStage {
  const ticket = Object.values(tickets).find((t) => t.tableId === tableId)
  if (!ticket) return 'Served'
  if (ticket.stage === 'New') return 'Ordered'
  if (ticket.stage === 'InProgress') return 'Cooking'
  return 'Ready'
}

/**
 * Returns true if a sent round has been in its current stage for longer than
 * ESCALATION_THRESHOLD_MS. Guards against null sentAt (unsent rounds must never escalate).
 */
export function isRoundEscalated(sentAt: number | null): boolean {
  if (sentAt === null) return false
  return Date.now() - sentAt > ESCALATION_THRESHOLD_MS
}
