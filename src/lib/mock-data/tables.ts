import type { TableRecord } from '@/stores/table.store'

function makeTable(num: number): TableRecord {
  const id = `t${String(num).padStart(2, '0')}`
  const label = `T${String(num).padStart(2, '0')}`
  return {
    id,
    label,
    status: 'Open',
    guestCount: null,
    openedAt: null,
    waiterId: null,
    waiterName: null,
    note: null,
    orderStage: null,
    servedAt: null,
    paidAmount: null,
    paymentMethod: null,
    discountApplied: null,
  }
}

const BASE_TABLES = Array.from({ length: 20 }, (_, i) => makeTable(i + 1))

export const INITIAL_TABLES: Record<string, TableRecord> = Object.fromEntries(
  BASE_TABLES.map((t) => [t.id, t])
)
