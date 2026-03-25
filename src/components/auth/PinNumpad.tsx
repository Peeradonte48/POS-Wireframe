'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Delete } from 'lucide-react'

export interface PinNumpadProps {
  onComplete: (pin: string) => void
  error?: boolean
  onErrorClear?: () => void
  label?: string // optional label above PIN dots, e.g. "Enter Manager PIN"
}

export function PinNumpad({ onComplete, error = false, onErrorClear, label }: PinNumpadProps) {
  const [digits, setDigits] = useState<string[]>([])

  // Auto-submit on 4th digit — useEffect ensures the 4-digit display renders first
  useEffect(() => {
    if (digits.length === 4) {
      onComplete(digits.join(''))
    }
  }, [digits, onComplete])

  // Auto-clear digits when error is signaled
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setDigits([])
        onErrorClear?.()
      }, 600) // wait for shake animation to finish
      return () => clearTimeout(timer)
    }
  }, [error, onErrorClear])

  const handleKey = (key: string) => {
    if (error) return // ignore input during error state
    if (key === 'backspace') {
      setDigits((prev) => prev.slice(0, -1))
      return
    }
    if (digits.length >= 4) return
    setDigits((prev) => [...prev, key])
  }

  // 3x4 grid: rows of [1,2,3], [4,5,6], [7,8,9], [backspace, 0, '']
  const KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['backspace', '0', ''],
  ]

  return (
    <div className="flex flex-col items-center gap-6">
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}

      {/* PIN dots display */}
      <div
        className={cn(
          'flex gap-3 p-4 rounded-lg border-2 transition-colors',
          error
            ? 'border-red-500 bg-red-50 animate-shake'
            : 'border-border bg-muted/30'
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full transition-colors',
              i < digits.length
                ? error ? 'bg-red-500' : 'bg-foreground'
                : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.flat().map((key, idx) => {
          if (key === '') return <div key={idx} />
          if (key === 'backspace') {
            return (
              <button
                key={idx}
                onClick={() => handleKey('backspace')}
                className="flex items-center justify-center w-16 h-16 rounded-xl bg-muted hover:bg-muted/80 active:scale-95 transition-all text-foreground"
                aria-label="Backspace"
              >
                <Delete size={20} />
              </button>
            )
          }
          return (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              className="flex items-center justify-center w-16 h-16 rounded-xl bg-card border border-border hover:bg-muted active:scale-95 transition-all text-xl font-semibold"
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
