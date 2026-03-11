'use client'

import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

export type KdsStage = 'New' | 'InProgress' | 'Ready'

export interface KdsTicket {
  ticketId: string
  tableId: string
  tableLabel: string
  addedAt: number
  stage: KdsStage
  checkedItems: Set<string>
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

  // Actions
  addTicket: (tableId: string, tableLabel: string) => void
  bumpTicket: (ticketId: string) => void
  checkItem: (ticketId: string, lineId: string) => void
  uncheckItem: (ticketId: string, lineId: string) => void
  recallTicket: (ticketId: string) => void
  clearRecall: (ticketId: string) => void
  toggleDemoActive: () => void
}

// ─── Store Implementation ─────────────────────────────────────────────────────

const RECALL_TRAY_CAP = 5

export const useKdsStore = create<KdsStore>((set) => ({
  tickets: {},
  recallTray: [],
  demoActive: false,

  addTicket: (tableId, tableLabel) =>
    set((state) => {
      const ticketId = `ticket-${Date.now()}-${tableId}`
      const ticket: KdsTicket = {
        ticketId,
        tableId,
        tableLabel,
        addedAt: Date.now(),
        stage: 'New',
        checkedItems: new Set<string>(),
      }
      return {
        tickets: { ...state.tickets, [ticketId]: ticket },
      }
    }),

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

      // Ready → remove from tickets, push snapshot to recallTray (capped at 5)
      const { [ticketId]: _removed, ...remainingTickets } = state.tickets
      const recalled: RecalledTicket = { ticket, recalledAt: Date.now() }
      const updatedTray = [...state.recallTray, recalled]
      const cappedTray =
        updatedTray.length > RECALL_TRAY_CAP
          ? updatedTray.slice(updatedTray.length - RECALL_TRAY_CAP)
          : updatedTray

      return {
        tickets: remainingTickets,
        recallTray: cappedTray,
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
