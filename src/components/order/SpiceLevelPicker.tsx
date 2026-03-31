'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpiceLevel {
  value: number
  label: string
}

export interface SpiceLevelPickerProps {
  value: number | null
  onChange: (level: number) => void
  levels?: SpiceLevel[]
}

const DEFAULT_LEVELS: SpiceLevel[] = [
  { value: 1, label: 'เบา' },
  { value: 2, label: 'กลาง' },
  { value: 3, label: 'เผ็ด' },
  { value: 4, label: 'เผ็ดมาก' },
  { value: 5, label: 'สุดเผ็ด' },
]

// ---------------------------------------------------------------------------
// SpiceLevelPicker
// ---------------------------------------------------------------------------

export function SpiceLevelPicker({
  value,
  onChange,
  levels = DEFAULT_LEVELS,
}: SpiceLevelPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Flame size={16} className="shrink-0 text-foreground" />
        <span className="text-base font-semibold leading-none text-card-foreground">
          ระดับความเผ็ด
        </span>
        <span className="text-sm font-normal leading-snug text-muted-foreground">
          (optional)
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const isSelected = value === level.value
          return (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className={cn(
                'px-3 py-3 rounded-lg text-sm font-medium border transition-colors leading-none',
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/50',
              )}
            >
              <span className="flex items-center gap-1">
                {Array.from({ length: level.value }, (_, i) => (
                  <Flame key={i} size={12} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                ))}
                <span className="ml-1">{level.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
