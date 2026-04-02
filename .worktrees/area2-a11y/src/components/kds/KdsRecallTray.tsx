'use client'

import { useKdsStore } from '@/stores/kds.store'

export function KdsRecallTray() {
  const { recallTray, recallTicket } = useKdsStore()

  if (recallTray.length === 0) return null

  return (
    <div className="h-14 shrink-0 border-t bg-muted/20 flex items-center gap-2 px-3 overflow-x-auto">
      <span className="caps mr-1 shrink-0">
        RECALLED
      </span>
      {recallTray.map((entry) => (
        <button
          key={entry.ticket.ticketId}
          onClick={() => recallTicket(entry.ticket.ticketId)}
          className="bg-background border border-border rounded px-3 py-1 text-xs font-medium hover:bg-accent shrink-0"
        >
          {entry.ticket.tableLabel}
        </button>
      ))}
    </div>
  )
}
