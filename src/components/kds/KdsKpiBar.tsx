'use client'

import { Timer, CookingPot, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface KdsKpiBarProps {
  avgCookingTime: string
  onTimePercent: number
  onSettingsClick: () => void
}

export function KdsKpiBar({ avgCookingTime, onTimePercent, onSettingsClick }: KdsKpiBarProps) {
  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        {/* Avg cooking time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Timer size={16} className="text-card-foreground" />
            <span className="text-base font-semibold text-card-foreground">
              เวลาทำอาหารเฉลี่ย
            </span>
          </div>
          <Badge className="bg-foreground text-background text-xs font-semibold">
            {avgCookingTime}
          </Badge>
        </div>

        {/* On-time percentage */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CookingPot size={16} className="text-card-foreground" />
            <span className="text-base font-semibold text-card-foreground">
              ทำอาหารตรงเวลา
            </span>
          </div>
          <Badge className="bg-foreground text-background text-xs font-semibold">
            {onTimePercent}%
          </Badge>
        </div>
      </div>

      {/* Settings gear */}
      <button
        onClick={onSettingsClick}
        className="flex items-center justify-center rounded-lg size-8"
      >
        <Settings size={20} className="text-muted-foreground" />
      </button>
    </div>
  )
}
