import { MENU_ITEMS } from '@/lib/mock-data/menu'
import type { KdsTicket } from '@/stores/kds.store'
import type { OrderLineItem, LineItemStatus } from '@/stores/order.store'

// ─── Demo Table Slots ─────────────────────────────────────────────────────────

const DEMO_TABLE_SLOTS = [
  { tableId: 'demo-t01', tableLabel: 'T01' },
  { tableId: 'demo-t02', tableLabel: 'T02' },
  { tableId: 'demo-t03', tableLabel: 'T03' },
  { tableId: 'demo-t04', tableLabel: 'T04' },
  { tableId: 'demo-t05', tableLabel: 'T05' },
]

// ─── Module-level state ───────────────────────────────────────────────────────

let demoCounter = 0

// Maps ticketId → line items so KdsBoard can retrieve them without order.store
const demoItemsMap = new Map<string, OrderLineItem[]>()

// ─── Factory ──────────────────────────────────────────────────────────────────

export function buildMockDemoTicket(): KdsTicket {
  const slot = DEMO_TABLE_SLOTS[demoCounter % DEMO_TABLE_SLOTS.length]
  demoCounter++

  // Pick 1–3 random menu items
  const shuffled = [...MENU_ITEMS].sort(() => Math.random() - 0.5)
  const count = 1 + Math.floor(Math.random() * 3) // 1, 2, or 3
  const picked = shuffled.slice(0, count)

  const ticketId = `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`

  // Channel distribution: 60% dine-in, 25% takeaway, 15% delivery
  const rand = Math.random()
  let orderType: KdsTicket['orderType']
  let platform: KdsTicket['platform']

  if (rand < 0.60) {
    orderType = 'dine-in'
  } else if (rand < 0.85) {
    orderType = 'takeaway'
  } else {
    orderType = 'delivery'
    platform = Math.random() < 0.6 ? 'grab' : 'lineman'
  }

  const orderItems: OrderLineItem[] = picked.map((menuItem) => ({
    lineId: `demo-line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    menuItemId: menuItem.id,
    menuItemName: menuItem.name,
    basePrice: menuItem.basePrice,
    modifiers: [],
    spiceLevel: Math.ceil(Math.random() * 5), // 1–5
    specialRequest: '',
    quantity: 1,
    status: 'sent' as LineItemStatus,
    // packToGo on ~30% of dine-in items so PACK badges appear in demo
    packToGo: orderType === 'dine-in' && Math.random() < 0.30,
  }))

  demoItemsMap.set(ticketId, orderItems)

  return {
    ticketId,
    tableId: slot.tableId,
    tableLabel: slot.tableLabel,
    addedAt: Date.now(),
    stage: 'New',
    checkedItems: new Set(),
    orderType,
    platform,
  }
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export function getDemoOrderItems(ticket: KdsTicket): OrderLineItem[] {
  return demoItemsMap.get(ticket.ticketId) ?? []
}
