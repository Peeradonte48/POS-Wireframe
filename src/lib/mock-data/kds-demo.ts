import { MENU_ITEMS, type MenuModifierGroup } from '@/lib/mock-data/menu'
import { MOCK_STAFF } from '@/lib/mock-data/staff'
import type { KdsTicket, KdsStation } from '@/stores/kds.store'
import type { OrderLineItem, LineItemStatus, ModifierSelection } from '@/stores/order.store'

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

// ─── Random modifier picker ──────────────────────────────────────────────────

function pickRandomOption(group: MenuModifierGroup): ModifierSelection {
  const opt = group.options[Math.floor(Math.random() * group.options.length)]
  return {
    groupId: group.id,
    groupLabel: group.label,
    optionId: opt.id,
    optionLabel: opt.label,
  }
}

function buildRandomModifiers(groups: MenuModifierGroup[]): ModifierSelection[] {
  return groups.map((g) => pickRandomOption(g))
}

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

  const SPECIAL_REQUESTS = [
    'แพ้ถั่ว',
    'ไม่ใส่ผักชี',
    'แพ้กุ้ง',
    'ไม่ใส่พริก',
  ]

  const orderItems: OrderLineItem[] = picked.map((menuItem) => {
    const hasModifiers = menuItem.modifierGroups.length > 0
    const modifiers = hasModifiers ? buildRandomModifiers(menuItem.modifierGroups) : []

    // Derive spiceLevel from modifier if present, otherwise random for food
    const spiceMod = modifiers.find((m) => m.groupId === 'spice-level')
    let spiceLevel: number | null = null
    if (spiceMod) {
      const map: Record<string, number> = { 'no-spice': 0, x1: 1, x2: 2, x3: 3, xmax: 5 }
      spiceLevel = map[spiceMod.optionId] ?? 0
    } else if (!isBarOrder) {
      spiceLevel = Math.ceil(Math.random() * 5)
    }

    return {
      lineId: `demo-line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      basePrice: menuItem.basePrice,
      modifiers,
      spiceLevel,
      specialRequest: Math.random() < 0.15
        ? SPECIAL_REQUESTS[Math.floor(Math.random() * SPECIAL_REQUESTS.length)]
        : '',
      quantity: 1 + (Math.random() < 0.2 ? 1 : 0),
      status: 'sent' as LineItemStatus,
      packToGo: !isBarOrder && orderType === 'dine-in' && Math.random() < 0.30,
    }
  })

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
    sentLineIds: new Set(),
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
