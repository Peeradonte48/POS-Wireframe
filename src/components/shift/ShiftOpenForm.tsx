'use client'

import { useState } from 'react'
import { BRANCHES } from '@/lib/mock-data/branches'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ShiftOpenFormProps {
  onSubmit: (branchId: string, branchName: string, openingCash: number) => void
}

export function ShiftOpenForm({ onSubmit }: ShiftOpenFormProps) {
  const [branchId, setBranchId] = useState<string>('')
  const [cashValue, setCashValue] = useState<string>('')

  const selectedBranch = BRANCHES.find((b) => b.id === branchId)
  const cashNum = parseFloat(cashValue)
  const isValid = !!branchId && cashValue.trim() !== '' && !isNaN(cashNum)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !selectedBranch) return
    onSubmit(branchId, selectedBranch.name, cashNum)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-xs">
      {/* Branch selection */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="branch-select">Branch</Label>
        <Select value={branchId} onValueChange={(val) => setBranchId(val ?? '')}>
          <SelectTrigger id="branch-select">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {BRANCHES.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Opening cash input */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="opening-cash">Opening Cash</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
            ฿
          </span>
          <Input
            id="opening-cash"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={cashValue}
            onChange={(e) => setCashValue(e.target.value)}
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">Enter 0 if starting with no float.</p>
      </div>

      <Button type="submit" disabled={!isValid} className="w-full mt-2">
        Open Shift
      </Button>
    </form>
  )
}
