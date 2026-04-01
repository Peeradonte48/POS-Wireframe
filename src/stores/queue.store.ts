'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useOrderStore } from '@/stores/order.store'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderChannel = 'delivery' | 'takeaway'
export type DeliveryPlatform = 'grab' | 'lineman'

export type QueueOrderStatus =
  | 'Ordered'       // delivery: order sent to kitchen
  | 'Cooking'       // delivery: kitchen in progress
  | 'Ready'         // delivery/takeaway: ready for pickup/rider
  | 'Served'        // delivery: picked up / handed off
  | 'Billed'        // delivery: payment complete
  | 'Taking'        // takeaway: being created / order entry not yet sent
  | 'Sent'          // takeaway: sent to KDS
  | 'Collected'     // takeaway: collected by customer
  | 'Cancelled'     // takeaway: cancelled before sending to kitchen

export interface QueueOrder {
  orderId: string
  channel: OrderChannel
  platform?: DeliveryPlatform
  externalId?: string           // delivery only: platform order ref e.g. "GR-4401"
  customerName?: string
  customerPhone?: string
  itemsSummary: string
  status: QueueOrderStatus
  createdAt: number
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface QueueStore {
  orders: Record<string, QueueOrder>
  takeawayCounter: number

  createDeliveryOrder: (platform: DeliveryPlatform, externalId: string, customerName?: string, customerPhone?: string) => string
  updateItemsSummary: (orderId: string, summary: string) => void
  advanceStatus: (orderId: string) => void
  createTakeaway: (customerName: string, customerPhone?: string) => string
  updateCustomer: (orderId: string, name: string, phone?: string) => void
  setStatus: (orderId: string, status: QueueOrderStatus) => void
  cancelOrder: (orderId: string) => void
  stepBack: (orderId: string) => void
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useQueueStore = create<QueueStore>()(
  persist(
    (set, get) => ({
      orders: {},
      takeawayCounter: 0,

      createDeliveryOrder: (platform, externalId, customerName, customerPhone) => {
        const now = Date.now()
        const orderId = `DL-${platform}-${now}`
        const order: QueueOrder = {
          orderId,
          channel: 'delivery',
          platform,
          externalId,
          customerName,
          customerPhone,
          itemsSummary: '',
          status: 'Ordered',
          createdAt: now,
        }
        set((state) => ({ orders: { ...state.orders, [orderId]: order } }))
        return orderId
      },

      updateItemsSummary: (orderId, summary) => {
        const order = get().orders[orderId]
        if (!order) return
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], itemsSummary: summary },
          },
        }))
      },

      advanceStatus: (orderId) => {
        const order = get().orders[orderId]
        if (!order) return

        const transitions: Partial<Record<QueueOrderStatus, QueueOrderStatus>> = {
          Ordered: 'Cooking',
          Cooking: 'Ready',
          Taking: 'Sent',
          Sent: 'Ready',
          Ready: 'Collected',
        }

        const next = transitions[order.status]
        if (!next) return

        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], status: next },
          },
        }))
      },

      createTakeaway: (customerName, customerPhone) => {
        const counter = get().takeawayCounter + 1
        const orderId = `TK-${String(counter).padStart(3, '0')}`
        const order: QueueOrder = {
          orderId,
          channel: 'takeaway',
          customerName,
          customerPhone,
          itemsSummary: 'No items yet',
          status: 'Taking',
          createdAt: Date.now(),
        }
        set((state) => ({
          takeawayCounter: counter,
          orders: { ...state.orders, [orderId]: order },
        }))
        return orderId
      },

      updateCustomer: (orderId, name, phone) => {
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], customerName: name, customerPhone: phone },
          },
        }))
      },

      setStatus: (orderId, status) => {
        const order = get().orders[orderId]
        if (!order) return
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], status },
          },
        }))
      },

      cancelOrder: (orderId) => {
        const order = get().orders[orderId]
        if (!order || order.status !== 'Taking') return
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], status: 'Cancelled' },
          },
        }))
      },

      stepBack: (orderId) => {
        const order = get().orders[orderId]
        if (!order) return

        const transitions: Partial<Record<QueueOrderStatus, QueueOrderStatus>> = {
          Ready: 'Sent',
          Sent: 'Taking',
        }

        const prev = transitions[order.status]
        if (!prev) return

        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], status: prev },
          },
        }))
      },
    }),
    {
      name: 'queue-store',
      version: 2,
      migrate: () => ({}),
      partialize: (state) => ({
        orders: state.orders,
        takeawayCounter: state.takeawayCounter,
      }),
      onRehydrateStorage: () => {
        return (state?: QueueStore) => {
          if (!state) return
          const orderStore = useOrderStore.getState()
          const updates: Record<string, QueueOrder> = {}
          let hasUpdates = false
          for (const [id, queueOrder] of Object.entries(state.orders)) {
            if (
              queueOrder.status !== 'Taking' &&
              queueOrder.status !== 'Cancelled' &&
              queueOrder.status !== 'Collected'
            ) {
              if (!orderStore.orders[id]) {
                updates[id] = { ...queueOrder, itemsSummary: 'items unavailable — reload' }
                hasUpdates = true
              }
            }
          }
          if (hasUpdates) {
            useQueueStore.setState((prev) => ({
              orders: { ...prev.orders, ...updates },
            }))
          }
        }
      },
    }
  )
)
