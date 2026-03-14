'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildMockDeliveryOrder } from '@/lib/mock-data/delivery-demo'
import { useKdsStore } from '@/stores/kds.store'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderChannel = 'delivery' | 'takeaway'
export type DeliveryPlatform = 'grab' | 'lineman'

export type QueueOrderStatus =
  | 'Pending'       // delivery incoming, awaiting staff accept/reject
  | 'Confirmed'     // delivery accepted by staff
  | 'Preparing'     // delivery being cooked (KDS in progress)
  | 'ReadyForRider' // delivery ready, waiting for rider pickup
  | 'PickedUp'      // delivery complete
  | 'Rejected'      // delivery rejected by staff
  | 'Taking'        // takeaway being created / order entry not yet sent
  | 'Sent'          // takeaway sent to KDS
  | 'Ready'         // takeaway ready for collection (KDS complete)
  | 'Collected'     // takeaway collected by customer

export interface QueueOrder {
  orderId: string           // 'DL-grab-7821' or 'TK-001'
  channel: OrderChannel
  platform?: DeliveryPlatform   // delivery only
  customerName: string
  customerPhone?: string        // takeaway only, optional
  itemsSummary: string          // e.g. "2x Tonkotsu, 1x Karaage"
  status: QueueOrderStatus
  createdAt: number             // Date.now() timestamp
  pendingAt?: number            // delivery only: when entered Pending state
  rejectionReason?: string
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface QueueStore {
  orders: Record<string, QueueOrder>
  demoActive: boolean
  autoAccept: boolean
  takeawayCounter: number

  simulateOrder: () => void
  acceptOrder: (orderId: string) => void
  rejectOrder: (orderId: string, reason: string) => void
  advanceStatus: (orderId: string) => void
  createTakeaway: (customerName: string, customerPhone?: string) => void
  toggleDemoActive: () => void
  toggleAutoAccept: () => void
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useQueueStore = create<QueueStore>()(
  persist(
    (set, get) => ({
      orders: {},
      demoActive: false,
      autoAccept: false,
      takeawayCounter: 0,

      simulateOrder: () => {
        const newOrder = buildMockDeliveryOrder()
        newOrder.status = 'Pending'
        newOrder.pendingAt = Date.now()
        set((state) => ({
          orders: { ...state.orders, [newOrder.orderId]: newOrder },
        }))
        if (get().autoAccept) {
          get().acceptOrder(newOrder.orderId)
        }
      },

      acceptOrder: (orderId) => {
        const order = get().orders[orderId]
        if (!order || order.status !== 'Pending') return
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: { ...state.orders[orderId], status: 'Confirmed' },
          },
        }))
        useKdsStore.getState().addTicket(order.orderId, order.orderId)
      },

      rejectOrder: (orderId, reason) => {
        const order = get().orders[orderId]
        if (!order || order.status !== 'Pending') return
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: {
              ...state.orders[orderId],
              status: 'Rejected',
              rejectionReason: reason,
            },
          },
        }))
      },

      advanceStatus: (orderId) => {
        const order = get().orders[orderId]
        if (!order) return

        const transitions: Partial<Record<QueueOrderStatus, QueueOrderStatus>> = {
          Confirmed: 'Preparing',
          Preparing: 'ReadyForRider',
          ReadyForRider: 'PickedUp',
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

      createTakeaway: (customerName, customerPhone) =>
        set((state) => {
          const counter = state.takeawayCounter + 1
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
          return {
            takeawayCounter: counter,
            orders: { ...state.orders, [orderId]: order },
          }
        }),

      toggleDemoActive: () => set((state) => ({ demoActive: !state.demoActive })),
      toggleAutoAccept: () => set((state) => ({ autoAccept: !state.autoAccept })),
    }),
    {
      name: 'queue-store',
      partialize: (state) => ({
        orders: state.orders,
        takeawayCounter: state.takeawayCounter,
      }),
    }
  )
)
