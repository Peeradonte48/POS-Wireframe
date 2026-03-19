'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INITIAL_TABLES } from '@/lib/mock-data/tables'

export type TableStatus =
  | 'Open'
  | 'Occupied'
  | 'Reserved'
  | 'CheckRequested'
  | 'Cleaning'

export type OrderStage =
  | 'Ordered'
  | 'Cooking'
  | 'Ready'
  | 'Served'
  | 'Billed'

export interface TableRecord {
  id: string
  label: string
  status: TableStatus
  guestCount: number | null
  openedAt: number | null
  waiterId: string | null
  waiterName: string | null
  note: string | null
  orderStage: OrderStage | null
  servedAt: number | null
  paidAmount: number | null
  paymentMethod: 'Cash' | 'QR PromptPay' | 'Card' | null
  discountApplied: number | null
}

interface TableStore {
  tables: Record<string, TableRecord>
  openTable: (id: string, guestCount: number) => void
  markReserved: (id: string) => void
  undoReserved: (id: string) => void
  requestCheck: (id: string) => void
  markCleaning: (id: string) => void
  markClean: (id: string) => void
  markServed: (id: string) => void
  updateTable: (id: string, patch: Partial<Pick<TableRecord, 'waiterName' | 'note' | 'orderStage' | 'paidAmount' | 'paymentMethod' | 'discountApplied'>>) => void
}

export const useTableStore = create<TableStore>()(
  persist(
    (set) => ({
  tables: INITIAL_TABLES,

  openTable: (id, guestCount) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'Occupied',
          guestCount,
          openedAt: Date.now(),
          orderStage: null,
          servedAt: null,
          paidAmount: null,
          paymentMethod: null,
          discountApplied: null,
        },
      },
    })),

  markReserved: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'Reserved',
        },
      },
    })),

  undoReserved: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'Open',
        },
      },
    })),

  requestCheck: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'CheckRequested',
        },
      },
    })),

  markCleaning: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          status: 'Cleaning',
        },
      },
    })),

  markClean: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
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
        },
      },
    })),

  markServed: (id) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [id]: {
          ...state.tables[id],
          orderStage: 'Served',
          servedAt: Date.now(),
        },
      },
    })),

  updateTable: (id, patch) =>
    set((state) => {
      if (!state.tables[id]) return state
      return {
        tables: {
          ...state.tables,
          [id]: { ...state.tables[id], ...patch },
        },
      }
    }),
    }),
    { name: 'table-store' },
  ),
)
