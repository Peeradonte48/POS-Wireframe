'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LineItemStatus = 'unsent' | 'sent' | 'voided'

export interface ModifierSelection {
  groupId: string
  groupLabel: string
  optionId: string
  optionLabel: string
}

export interface OrderLineItem {
  lineId: string
  menuItemId: string
  menuItemName: string
  basePrice: number
  modifiers: ModifierSelection[]
  spiceLevel: number | null
  specialRequest: string
  quantity: number
  packToGo?: boolean
  status: LineItemStatus
}

export interface OrderRound {
  roundId: string
  sentAt: number | null
  items: OrderLineItem[]
}

export interface ActiveOrder {
  tableId: string
  rounds: OrderRound[]
}

interface OrderStore {
  orders: Record<string, ActiveOrder>
  addItem: (tableId: string, item: OrderLineItem) => void
  editItem: (tableId: string, lineId: string, updated: OrderLineItem) => void
  removeItem: (tableId: string, lineId: string) => void
  sendRound: (tableId: string) => void
  voidItem: (tableId: string, lineId: string) => void
  clearOrder: (tableId: string) => void
  getOrder: (tableId: string) => ActiveOrder | undefined
  togglePackToGo: (tableId: string, lineId: string) => void
}

const newUUID = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
  orders: {},

  addItem: (tableId, item) =>
    set((state) => {
      const existing = state.orders[tableId]

      if (!existing) {
        const round: OrderRound = {
          roundId: newUUID(),
          sentAt: null,
          items: [item],
        }
        return {
          orders: {
            ...state.orders,
            [tableId]: { tableId, rounds: [round] },
          },
        }
      }

      const rounds = existing.rounds
      const lastUnsentIdx = rounds.reduce<number>(
        (acc, r, idx) => (r.sentAt === null ? idx : acc),
        -1,
      )

      if (lastUnsentIdx !== -1) {
        const newRounds = rounds.map((r, idx) =>
          idx === lastUnsentIdx
            ? { ...r, items: [...r.items, item] }
            : r,
        )
        return {
          orders: {
            ...state.orders,
            [tableId]: { ...existing, rounds: newRounds },
          },
        }
      }

      // All rounds are sent — open a new round
      const newRound: OrderRound = {
        roundId: newUUID(),
        sentAt: null,
        items: [item],
      }
      return {
        orders: {
          ...state.orders,
          [tableId]: { ...existing, rounds: [...rounds, newRound] },
        },
      }
    }),

  editItem: (tableId, lineId, updated) =>
    set((state) => {
      const existing = state.orders[tableId]
      if (!existing) return state

      const newRounds = existing.rounds.map((round) => ({
        ...round,
        items: round.items.map((item) =>
          item.lineId === lineId ? updated : item,
        ),
      }))

      return {
        orders: {
          ...state.orders,
          [tableId]: { ...existing, rounds: newRounds },
        },
      }
    }),

  removeItem: (tableId, lineId) =>
    set((state) => {
      const existing = state.orders[tableId]
      if (!existing) return state

      const newRounds = existing.rounds.map((round) => ({
        ...round,
        items: round.items.filter((item) => item.lineId !== lineId),
      }))

      return {
        orders: {
          ...state.orders,
          [tableId]: { ...existing, rounds: newRounds },
        },
      }
    }),

  sendRound: (tableId) =>
    set((state) => {
      const existing = state.orders[tableId]
      if (!existing) return state

      const now = Date.now()
      const newRounds = existing.rounds.map((round) => {
        if (round.sentAt !== null) return round
        return {
          ...round,
          sentAt: now,
          items: round.items.map((item) =>
            item.status === 'unsent' ? { ...item, status: 'sent' as LineItemStatus } : item,
          ),
        }
      })

      return {
        orders: {
          ...state.orders,
          [tableId]: { ...existing, rounds: newRounds },
        },
      }
    }),

  voidItem: (tableId, lineId) =>
    set((state) => {
      const existing = state.orders[tableId]
      if (!existing) return state

      const newRounds = existing.rounds.map((round) => ({
        ...round,
        items: round.items.map((item) =>
          item.lineId === lineId ? { ...item, status: 'voided' as LineItemStatus } : item,
        ),
      }))

      return {
        orders: {
          ...state.orders,
          [tableId]: { ...existing, rounds: newRounds },
        },
      }
    }),

  clearOrder: (tableId) =>
    set((state) => {
      const { [tableId]: _void, ...rest } = state.orders
      return { orders: rest }
    }),

  getOrder: (tableId) => get().orders[tableId],

  togglePackToGo: (tableId, lineId) =>
    set((state) => {
      const existing = state.orders[tableId]
      if (!existing) return state
      const newRounds = existing.rounds.map((round) => ({
        ...round,
        items: round.items.map((item) =>
          item.lineId === lineId
            ? { ...item, packToGo: !item.packToGo }
            : item
        ),
      }))
      return {
        orders: { ...state.orders, [tableId]: { ...existing, rounds: newRounds } },
      }
    }),
    }),
    { name: 'order-store', version: 1, migrate: () => ({}) },
  ),
)
