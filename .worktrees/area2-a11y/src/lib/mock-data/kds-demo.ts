import { MENU_ITEMS } from '@/lib/mock-data/menu'
import { MOCK_STAFF } from '@/lib/mock-data/staff'
import type { KdsTicket, KdsStation } from '@/stores/kds.store'
import type { OrderLineItem, LineItemStatus } from '@/stores/order.store'

const ROLE_LABEL_TH: Record<string, string> = {
  Waiter:  'พนักงานเสิร์ฟ',
  Cashier: 'แคชเชียร์',
  Manager: 'ผู้จัดการ',
  Kitchen: 'พ่อครัว',
}

// ─── Demo Table Slots ─────────────────────────────────────────────────────────

const DEMO_TABLE_SLOTS = [
  { tableId: 'demo-t01', tableLabel: 'T01' },
  { tableId: 'demo-t02', tableLabel: 'T02' },
  { tableId: 'demo-t03', tableLabel: 'T03' },
  { tableId: 'demo-t04', tableLabel: 'T04' },
  { tableId: 'demo-t05', tableLabel: 'T05' },
]

const FOOD_ITEMS  = MENU_ITEMS.filter((m) => m.categoryId !== 'drinks')
const DRINK_ITEMS = MENU_ITEMS.filter((m) => m.categoryId === 'drinks')

const DEMO_SENDERS = MOCK_STAFF.filter((s) => s.name === 'Somchai' || s.name === 'Nida')

// ─── Module-level state ───────────────────────────────────────────────────────

let demoCounter = 0

// Maps ticketId → line items so KdsBoard can retrieve them without order.store
const demoItemsMap = new Map<string, OrderLineItem[]>()

// ─── Factory ──────────────────────────────────────────────────────────────────

export function buildMockDemoTicket(): KdsTicket {
  const slot = DEMO_TABLE_SLOTS[demoCounter % DEMO_TABLE_SLOTS.length]
  demoCounter++

  // Station distribution: 30% bar (drinks), 70% hot kitchen (food)
  const isBarOrder = Math.random() < 0.30
  const station: KdsStation = isBarOrder ? 'bar' : 'hot'
  const pool = isBarOrder ? DRINK_ITEMS : FOOD_ITEMS

  const count = 1 + Math.floor(Math.random() * 3) // 1–3 items
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count)

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
    spiceLevel: isBarOrder ? null : Math.ceil(Math.random() * 5),
    specialRequest: '',
    quantity: 1,
    status: 'sent' as LineItemStatus,
    packToGo: !isBarOrder && orderType === 'dine-in' && Math.random() < 0.30,
  }))

  demoItemsMap.set(ticketId, orderItems)

  const sender = DEMO_SENDERS[Math.floor(Math.random() * DEMO_SENDERS.length)]
  const senderName = `${sender.name} (${ROLE_LABEL_TH[sender.role] ?? sender.role})`

  return {
    ticketId,
    tableId: slot.tableId,
    tableLabel: slot.tableLabel,
    addedAt: Date.now(),
    stage: 'New',
    checkedItems: new Set(),
    station,
    senderName,
    orderType,
    platform,
  }
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export function getDemoOrderItems(ticket: KdsTicket): OrderLineItem[] {
  return demoItemsMap.get(ticket.ticketId) ?? []
}
