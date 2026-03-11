'use client'

import { OrderLineItem } from '@/stores/order.store'

interface KdsItemRowProps {
  item: OrderLineItem
  isChecked: boolean
  interactive: boolean
  onCheck: () => void
  onUncheck: () => void
}

export function KdsItemRow({ item, isChecked, interactive, onCheck, onUncheck }: KdsItemRowProps) {
  const isVoided = item.status === 'voided'

  // Build modifier summary: broth (first modifier), spice level, remaining modifiers
  const modifierParts: string[] = []

  if (item.modifiers.length > 0) {
    modifierParts.push(item.modifiers[0].optionLabel)
  }

  if (item.spiceLevel !== null) {
    modifierParts.push(`Spice ${item.spiceLevel}`)
  }

  if (item.modifiers.length > 1) {
    item.modifiers.slice(1).forEach((m) => {
      modifierParts.push(m.optionLabel)
    })
  }

  const modifierSummary = modifierParts.join(' • ')

  if (isVoided) {
    return (
      <div className="flex items-center gap-2 py-2 border-b border-border/20 last:border-b-0">
        <span className="flex-1 line-through text-muted-foreground/40 text-sm font-medium">
          {item.menuItemName}
        </span>
        <span
          className="text-[10px] border border-muted-foreground/30 text-muted-foreground/50 px-1.5 py-0.5 rounded"
          aria-label="voided item"
        >
          VOID
        </span>
      </div>
    )
  }

  return (
    <div className={`py-2 border-b border-border/20 last:border-b-0 ${isChecked ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => (isChecked ? onUncheck() : onCheck())}
          disabled={!interactive}
          className={`mt-0.5 h-4 w-4 shrink-0 accent-primary ${interactive ? 'cursor-pointer' : 'cursor-default opacity-30'}`}
          aria-label={`Mark ${item.menuItemName} done`}
        />
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${isChecked ? 'line-through' : ''}`}>
            {item.menuItemName}
          </span>
          {modifierSummary && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{modifierSummary}</p>
          )}
          {item.specialRequest && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="bg-orange-500 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0">
                ALLERGY
              </span>
              <span className="text-xs text-orange-700 dark:text-orange-300 truncate">
                {item.specialRequest}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
