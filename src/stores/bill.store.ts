'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTableStore } from './table.store'

export type SplitMode = 'equal' | 'per-seat'

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
  equalAmounts: number[]                          // for equal mode: pre-computed [seat0, seat1, ...], length === seatCount
  assignments: SeatAssignment[]                   // for per-seat mode
  payments: Record<number, SeatPaymentRecord>     // keyed by seatIndex; undefined = unpaid
}

interface BillStore {
  splits: Record<string, BillSplit>
  initEqualSplit: (tableId: string, grandTotal: number, seatCount: number) => void
  initPerSeatSplit: (tableId: string, seatCount: number) => void
  assignItem: (tableId: string, lineId: string, seatIndex: number, qty: number) => void
  removeAssignment: (tableId: string, lineId: string, seatIndex: number) => void
  unassignItem: (tableId: string, lineId: string) => void
  recordPayment: (tableId: string, seatIndex: number, record: SeatPaymentRecord) => void
  cancelSplit: (tableId: string) => void
  getSplit: (tableId: string) => BillSplit | undefined
}

export const useBillStore = create<BillStore>()(
  persist(
    (set, get) => ({
      splits: {},

      initEqualSplit: (tableId, grandTotal, seatCount) =>
        set((state) => {
          const base = Math.floor(grandTotal / seatCount)
          const remainder = grandTotal - base * seatCount
          const equalAmounts = Array.from({ length: seatCount }, (_, i) =>
            i === seatCount - 1 ? base + remainder : base,
          )
          const split: BillSplit = {
            tableId,
            mode: 'equal',
            seatCount,
            equalAmounts,
            assignments: [],
            payments: {},
          }
          return { splits: { ...state.splits, [tableId]: split } }
        }),

      initPerSeatSplit: (tableId, seatCount) =>
        set((state) => {
          const canonicalSeatCount =
            useTableStore.getState().tables[tableId]?.guestCount ?? seatCount
          const split: BillSplit = {
            tableId,
            mode: 'per-seat',
            seatCount: canonicalSeatCount,
            equalAmounts: [],
            assignments: [],
            payments: {},
          }
          return { splits: { ...state.splits, [tableId]: split } }
        }),

      assignItem: (tableId, lineId, seatIndex, qty) =>
        set((state) => {
          const existing = state.splits[tableId]
          if (!existing) return state

          // Remove only the existing assignment for this lineId+seatIndex pair,
          // preserving partial assignments to other seats
          const filtered = existing.assignments.filter(
            (a) => !(a.lineId === lineId && a.seatIndex === seatIndex),
          )
          const updated: SeatAssignment[] = [...filtered, { lineId, seatIndex, assignedQty: qty }]

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
    }),
    { name: 'bill-store' },
  ),
)
