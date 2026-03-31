'use client'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PaymentMethodPanelProps {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

// ---------------------------------------------------------------------------
// PaymentMethodPanel
// Shared panel skeleton for payment method panels (Cash, Card, QR).
// Renders: icon (centered) + title + optional description + children slot.
// ---------------------------------------------------------------------------

export function PaymentMethodPanel({
  icon,
  title,
  description,
  children,
  className,
}: PaymentMethodPanelProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 pt-2', className)}>
      {/* Icon */}
      <div className="flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>

      {/* Title */}
      <p className="font-semibold text-base leading-6">{title}</p>

      {/* Optional description */}
      {description && (
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      )}

      {/* Panel-specific content */}
      <div className="w-full">{children}</div>
    </div>
  )
}
