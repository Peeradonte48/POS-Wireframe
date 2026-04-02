'use client'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CardPanelProps {
  grandTotal: number
}

// ---------------------------------------------------------------------------
// CardPanel
// ---------------------------------------------------------------------------

export function CardPanel({ grandTotal }: CardPanelProps) {
  return (
    <div className="pt-2">
      <p className="text-2xl font-bold text-center">฿{grandTotal.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground text-center mt-2">
        Customer taps or swipes at card reader
      </p>
    </div>
  )
}
