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
  /** Line IDs that have been individually sent from KDS */
  sentLineIds: Set<string>
  /** Line IDs that have been cancelled from POS */
  cancelledLineIds: Set<string>
  /** Line IDs where cancel info has been acknowledged (บันทึก) — enters disabled state before removal */
  acknowledgedCancelLineIds: Set<string>
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
  /** Mark a single line item as sent; removes ticket when all items are sent */
  sendLineItem: (ticketId: string, lineId: string, totalNonVoidedCount: number) => void
  /** Mark all tickets for a table as served and remove from board */
  sendAllTableTickets: (tableId: string) => void
  /** Mark a line item as cancelled from POS */
  cancelLineItem: (ticketId: string, lineId: string) => void
  /** Mark a cancelled item as acknowledged — enters disabled state */
  acknowledgeCancelledItem: (ticketId: string, lineId: string) => void
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
        sentLineIds: new Set<string>(),
        cancelledLineIds: new Set<string>(),
        acknowledgedCancelLineIds: new Set<string>(),
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
      const { [ticketId]: _void, ...remainingTickets } = state.tickets
      return {
        tickets: remainingTickets,
      }
    }),

  completeTicket: (ticketId) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      const { [ticketId]: _void, ...remainingTickets } = state.tickets
      const completedTableIds = new Set(state.completedTableIds)
      if (ticket) completedTableIds.add(ticket.tableId)
      return { tickets: remainingTickets, completedTableIds }
    }),

  sendLineItem: (ticketId, lineId, activeItemCount) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      if (!ticket) return state
      const newSentLineIds = new Set(ticket.sentLineIds)
      newSentLineIds.add(lineId)
      // If all active (non-cancelled) items are now sent, remove the ticket and mark table completed
      if (newSentLineIds.size >= activeItemCount) {
        const { [ticketId]: _void, ...remainingTickets } = state.tickets
        const completedTableIds = new Set(state.completedTableIds)
        completedTableIds.add(ticket.tableId)
        return { tickets: remainingTickets, completedTableIds }
      }
      return {
        tickets: {
          ...state.tickets,
          [ticketId]: { ...ticket, sentLineIds: newSentLineIds },
        },
      }
    }),

  sendAllTableTickets: (tableId) =>
    set((state) => {
      const remainingTickets: Record<string, KdsTicket> = {}
      for (const [id, ticket] of Object.entries(state.tickets)) {
        if (ticket.tableId !== tableId) remainingTickets[id] = ticket
      }
      const completedTableIds = new Set(state.completedTableIds)
      completedTableIds.add(tableId)
      return { tickets: remainingTickets, completedTableIds }
    }),

  cancelLineItem: (ticketId, lineId) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      if (!ticket) return state
      const newCancelledLineIds = new Set(ticket.cancelledLineIds)
      newCancelledLineIds.add(lineId)
      return {
        tickets: {
          ...state.tickets,
          [ticketId]: { ...ticket, cancelledLineIds: newCancelledLineIds },
        },
      }
    }),

  acknowledgeCancelledItem: (ticketId, lineId) =>
    set((state) => {
      const ticket = state.tickets[ticketId]
      if (!ticket) return state
      const newAcknowledged = new Set(ticket.acknowledgedCancelLineIds)
      newAcknowledged.add(lineId)
      return {
        tickets: {
          ...state.tickets,
          [ticketId]: { ...ticket, acknowledgedCancelLineIds: newAcknowledged },
        },
      }
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
