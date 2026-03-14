import type { QueueOrder, DeliveryPlatform } from '@/stores/queue.store'

const PLATFORMS: DeliveryPlatform[] = ['grab', 'lineman']
const CUSTOMER_NAMES = [
  'Somchai P.', 'Napat W.', 'Araya K.', 'Thanawat B.',
  'Pimchanok L.', 'Krit S.', 'Warisa T.', 'Apirak N.',
]
const ITEMS_SUMMARIES = [
  '2x Tonkotsu, 1x Karaage',
  '1x Shoyu, 1x Gyoza, 2x Chashu',
  '3x Miso, 1x Corn',
  '1x Spicy Tan Tan, 2x Edamame',
  '2x Shio, 1x Extra Noodle',
]

let demoDeliveryCounter = 0

export function buildMockDeliveryOrder(): QueueOrder {
  demoDeliveryCounter++
  const platform = PLATFORMS[demoDeliveryCounter % PLATFORMS.length]
  const name = CUSTOMER_NAMES[demoDeliveryCounter % CUSTOMER_NAMES.length]
  const items = ITEMS_SUMMARIES[demoDeliveryCounter % ITEMS_SUMMARIES.length]
  const orderId = `DL-${platform}-${Date.now()}`
  const now = Date.now()

  return {
    orderId,
    channel: 'delivery',
    platform,
    customerName: name,
    itemsSummary: items,
    status: 'Pending',
    createdAt: now,
    pendingAt: now,
  }
}
