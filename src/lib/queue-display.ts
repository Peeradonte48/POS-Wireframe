import type { QueueOrder } from '@/stores/queue.store'

/** Badge variant for queue order status — covers both takeaway and delivery statuses */
export function getQueueStatusBadgeVariant(
  status: QueueOrder['status']
): 'outline' | 'ordered' | 'cooking' | 'ready' | 'settled' {
  switch (status) {
    case 'Taking':
      return 'outline'
    case 'Sent':
    case 'Ordered':
      return 'ordered'
    case 'Cooking':
      return 'cooking'
    case 'Ready':
      return 'ready'
    case 'Served':
    case 'Billed':
    case 'Collected':
    case 'Cancelled':
      return 'settled'
    default:
      return 'outline'
  }
}

/** Human-readable label for queue order status */
export function getQueueStatusLabel(status: QueueOrder['status']): string {
  switch (status) {
    case 'Taking':        return 'Taking'
    case 'Sent':          return 'Sent to Kitchen'
    case 'Ready':         return 'Ready'
    case 'Collected':     return 'Collected'
    case 'Cancelled':     return 'Cancelled'
    case 'Ordered':       return 'Ordered'
    case 'Cooking':       return 'Cooking'
    case 'Served':        return 'Served'
    case 'Billed':        return 'Billed'
    default:              return status
  }
}
