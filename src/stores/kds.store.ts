'use client'

import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

export type KdsStage = 'New' | 'InProgress' | 'Ready'

export type KdsStation = 'hot' | 'bar'

export interface KdsTicket {
  ticketId: string
  tableId: string
  tableLabel: string
  addedAt: number
  stage: KdsStage
  checkedItems: Set<string>
  station: KdsStation
  senderName?: string
  orderType?: 'dine-in' | 'takeaway' | 'delivery'
  platform?: 'grab' | 'lineman'
}

export interface RecalledTicket {
  ticket: KdsTicket
  recalledAt: number
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface KdsStore {
  tickets: Record<string, KdsTicket>
  recallTray: RecalledTicket[]
  demoActive: boolean
  /** tableIds that have been completed — auto-registration skips these */
  completedTableIds: Set<string>

  // Actions
  addTicket: (tableId: string, tableLabel: string, orderType?: 'dine-in' | 'takeaway' | 'delivery', platform?: 'grab' | 'lineman', station?: KdsStation, senderName?: string) => void
  injectDemoTicket: (ticket: KdsTicket) => void
  bumpTicket: (ticketId: string) => void
  completeTicket: (ticketId: string) => void
  checkItem: (ticketId: string, lineId: string) => void
  uncheckItem: (ticketId: string, lineId: string) => void
  recallTicket: (ticketId: string) => void
  clearRecall: (ticketId: string) => void
  toggleDemoActive: () => void
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useKdsStore = create<KdsStore>((set) => ({
  tickets: {},
  recallTray: [],
  demoActive: false,
  completedTableIds: new Set<string>(),

  addTicket: (tableId, tableLabel, orderType, platform, station = 'hot', senderName) =>
    set((state) => {
      const ticketId = `ticket-${Date.now()}-${tableId}`
      const ticket: KdsTicket = {
        ticketId,
        tableId,
        tableLabel,
        addedAt: Date.now(),
        stage: 'New',
        checkedItems: new Set<string>(),
        station,
        senderName,
        orderType,
        platform,
      }
      // Clear from completed set so new orders for this table register again
      const completedTableIds = new Set(state.completedTableIds)
      completedTableIds.delete(tableId)
      return {
        tickets: { ...state.tickets, [ticketId]: ticket },
        completedTableIds,
      }
    }),

  injectDemoTicket: (ticket) =>
    set((state) => ({
      tickets: { ...state.tickets, [ticket.ticketId]: ticket },
    })),

  bumpTicket: (ticketId) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      if (!ticket) return state

      if (ticket.stage === 'New') {
        return {
          tickets: {
            ...state.tickets,
            [ticketId]: { ...ticket, stage: 'InProgress' as KdsStage },
          },
        }
      }

      if (ticket.stage === 'InProgress') {
        return {
          tickets: {
            ...state.tickets,
            [ticketId]: { ...ticket, stage: 'Ready' as KdsStage },
          },
        }
      }

      // Ready → done: remove from board permanently
      const { [ticketId]: _removed, ...remainingTickets } = state.tickets
      return {
        tickets: remainingTickets,
      }
    }),

  completeTicket: (ticketId) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      const { [ticketId]: _removed, ...remainingTickets } = state.tickets
      const completedTableIds = new Set(state.completedTableIds)
      if (ticket) completedTableIds.add(ticket.tableId)
      return { tickets: remainingTickets, completedTableIds }
    }),

  checkItem: (ticketId, lineId) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      if (!ticket) return state
      // Never mutate Set in place — create new Set for Zustand shallow equality detection
      const newCheckedItems = new Set(ticket.checkedItems)
      newCheckedItems.add(lineId)
      return {
        tickets: {
          ...state.tickets,
          [ticketId]: { ...ticket, checkedItems: newCheckedItems },
        },
      }
    }),

  uncheckItem: (ticketId, lineId) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      if (!ticket) return state
      // Never mutate Set in place — create new Set for Zustand shallow equality detection
      const newCheckedItems = new Set(ticket.checkedItems)
      newCheckedItems.delete(lineId)
      return {
        tickets: {
          ...state.tickets,
          [ticketId]: { ...ticket, checkedItems: newCheckedItems },
        },
      }
    }),

  recallTicket: (ticketId) =>
    set((state) => {
      const entry = state.recallTray.find((r) => r.ticket.ticketId === ticketId)
      if (!entry) return state
      const updatedTray = state.recallTray.filter(
        (r) => r.ticket.ticketId !== ticketId
      )
      // Restore to tickets with stage 'Ready'
      const restoredTicket: KdsTicket = { ...entry.ticket, stage: 'Ready' }
      return {
        tickets: { ...state.tickets, [ticketId]: restoredTicket },
        recallTray: updatedTray,
      }
    }),

  clearRecall: (ticketId) =>
    set((state) => ({
      recallTray: state.recallTray.filter(
        (r) => r.ticket.ticketId !== ticketId
      ),
    })),

  toggleDemoActive: () =>
    set((state) => ({ demoActive: !state.demoActive })),
}))
