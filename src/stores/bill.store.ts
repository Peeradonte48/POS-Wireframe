'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTableStore } from './table.store'

export type SplitMode = 'custom' | 'per-seat'

export interface SeatAssignment {
  lineId: string        // references OrderLineItem.lineId
  seatIndex: number     // 0-based seat index
  assignedQty: number   // partial qty assigned to this seat (for qty>1 items)
}

export interface SeatPaymentRecord {
  method: 'Cash' | 'QR PromptPay' | 'Card'
  paidAt: number        // Date.now()
  amount: number        // satang-rounded seat total
}

export interface BillSplit {
  tableId: string
  mode: SplitMode
  seatCount: number
  customAmounts: number[]                         // for custom mode: payer amounts, length === seatCount, initialized to 0s
  assignments: SeatAssignment[]                   // for per-seat mode
  payments: Record<number, SeatPaymentRecord>     // keyed by seatIndex; undefined = unpaid
}

interface BillStore {
  splits: Record<string, BillSplit>
  merges: Record<string, string>  // key = secondaryTableId, value = primaryTableId
  initCustomSplit: (tableId: string, payerCount: number) => void
  addCustomPayer: (tableId: string) => void
  setCustomAmount: (tableId: string, payerIndex: number, amount: number) => void
  initPerSeatSplit: (tableId: string, seatCount: number) => void
  assignItem: (tableId: string, lineId: string, seatIndex: number, qty: number) => void
  removeAssignment: (tableId: string, lineId: string, seatIndex: number) => void
  unassignItem: (tableId: string, lineId: string) => void
  recordPayment: (tableId: string, seatIndex: number, record: SeatPaymentRecord) => void
  cancelSplit: (tableId: string) => void
  getSplit: (tableId: string) => BillSplit | undefined
  initMerge: (primaryTableId: string, secondaryTableIds: string[]) => void
  dissolveAll: (primaryTableId: string) => void
  isMergedSecondary: (tableId: string) => boolean
  getPrimaryTable: (tableId: string) => string | undefined
  getMergedSecondaries: (primaryTableId: string) => string[]
}

export const useBillStore = create<BillStore>()(
  persist(
    (set, get) => ({
      splits: {},
      merges: {},

      initCustomSplit: (tableId, payerCount) =>
        set((state) => {
          const split: BillSplit = {
            tableId,
            mode: 'custom',
            seatCount: payerCount,
            customAmounts: Array.from({ length: payerCount }, () => 0),
            assignments: [],
            payments: {},
          }
          return { splits: { ...state.splits, [tableId]: split } }
        }),

      addCustomPayer: (tableId) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state
          return {
            splits: {
              ...state.splits,
              [tableId]: {
                ...existing,
                seatCount: existing.seatCount + 1,
                customAmounts: [...existing.customAmounts, 0],
              },
            },
          }
        }),

      setCustomAmount: (tableId, payerIndex, amount) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state
          const updated = [...existing.customAmounts]
          updated[payerIndex] = amount
          return {
            splits: {
              ...state.splits,
              [tableId]: { ...existing, customAmounts: updated },
            },
          }
        }),

      initPerSeatSplit: (tableId, seatCount) =>
        set((state) => {
          const canonicalSeatCount =
            useTableStore.getState().tables[tableId]?.guestCount ?? seatCount
          const split: BillSplit = {
            tableId,
            mode: 'per-seat',
            seatCount: canonicalSeatCount,
            customAmounts: [],
            assignments: [],
            payments: {},
          }
          return { splits: { ...state.splits, [tableId]: split } }
        }),

      assignItem: (tableId, lineId, seatIndex, qty) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state

          // Accumulate into existing seat assignment (don't replace — a seat can receive
          // multiple partial assignments of the same item from the unassigned bucket)
          const existingForSeat = existing.assignments.find(
            (a) => a.lineId === lineId && a.seatIndex === seatIndex,
          )
          const filtered = existing.assignments.filter(
            (a) => !(a.lineId === lineId && a.seatIndex === seatIndex),
          )
          const newQty = existingForSeat ? existingForSeat.assignedQty + qty : qty
          const updated: SeatAssignment[] = [...filtered, { lineId, seatIndex, assignedQty: newQty }]

          return {
            splits: {
              ...state.splits,
              [tableId]: { ...existing, assignments: updated },
            },
          }
        }),

      removeAssignment: (tableId, lineId, seatIndex) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state

          const updated = existing.assignments.filter(
            (a) => !(a.lineId === lineId && a.seatIndex === seatIndex),
          )
          return {
            splits: {
              ...state.splits,
              [tableId]: { ...existing, assignments: updated },
            },
          }
        }),

      unassignItem: (tableId, lineId) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state

          const updated = existing.assignments.filter((a) => a.lineId !== lineId)
          return {
            splits: {
              ...state.splits,
              [tableId]: { ...existing, assignments: updated },
            },
          }
        }),

      recordPayment: (tableId, seatIndex, record) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state

          return {
            splits: {
              ...state.splits,
              [tableId]: {
                ...existing,
                payments: { ...existing.payments, [seatIndex]: record },
              },
            },
          }
        }),

      cancelSplit: (tableId) =>
        set((state) => {
          const { [tableId]: _, ...rest } = state.splits
          return { splits: rest }
        }),

      getSplit: (tableId) => get().splits[tableId],

      initMerge: (primaryTableId, secondaryTableIds) =>
        set((state) => {
          // One primary per secondary: filter out IDs already assigned to another primary
          const eligibleIds = secondaryTableIds.filter((id) => !(id in state.merges))
          return {
            merges: {
              ...state.merges,
              ...Object.fromEntries(eligibleIds.map((id) => [id, primaryTableId])),
            },
          }
        }),

      dissolveAll: (primaryTableId) =>
        set((state) => ({
          merges: Object.fromEntries(
            Object.entries(state.merges).filter(([, v]) => v !== primaryTableId),
          ),
        })),

      isMergedSecondary: (tableId) => tableId in get().merges,

      getPrimaryTable: (tableId) => get().merges[tableId],

      getMergedSecondaries: (primaryTableId) =>
        Object.keys(get().merges).filter((k) => get().merges[k] === primaryTableId),
    }),
    { name: 'bill-store' },
  ),
)
