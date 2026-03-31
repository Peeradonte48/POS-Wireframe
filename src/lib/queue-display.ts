import type { QueueOrder } from '@/stores/queue.store'

/** Badge variant for queue order status — covers both takeaway and delivery statuses */
export function getQueueStatusBadgeVariant(
  status: QueueOrder['status']
): 'outline' | 'ordered' | 'cooking' | 'ready' | 'settled' {
  switch (status) {
    case 'Taking':
      return 'outline'
    case 'Sent':
    case 'Confirmed':
      return 'ordered'
    case 'Preparing':
      return 'cooking'
    case 'ReadyForRider':
    case 'Ready':
      return 'ready'
    case 'PickedUp':
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
    case 'Confirmed':     return 'Confirmed'
    case 'Preparing':     return 'Preparing'
    case 'ReadyForRider': return 'Ready for Rider'
    case 'PickedUp':      return 'Picked Up'
    default:              return status
  }
}
