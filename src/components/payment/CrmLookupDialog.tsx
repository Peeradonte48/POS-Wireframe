'use client'

import { useState, useEffect } from 'react'
import { Smartphone, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface CrmMember {
  phone: string
  name: string
  level: string
  points: number
}

// Mock CRM database — try: 0812345678 | 0898765432 | 0661234567
const CRM_DATABASE: Record<string, CrmMember> = {
  '0812345678': { phone: '0812345678', name: 'สมหมาย สหายสมปอง', level: 'เริ่มต้น', points: 120 },
  '0898765432': { phone: '0898765432', name: 'สุดา รักดี', level: 'ทอง', points: 850 },
  '0661234567': { phone: '0661234567', name: 'นพรัตน์ ใจดี', level: 'เงิน', points: 430 },
}

interface Props {
  open: boolean
  onClose: () => void
  onMemberFound: (member: CrmMember) => void
}

export function CrmLookupDialog({ open, onClose, onMemberFound }: Props) {
  const [phone, setPhone] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Reset form state whenever dialog opens
  useEffect(() => {
    if (open) {
      setPhone('')
      setNotFound(false)
    }
  }, [open])

  function handleSearch() {
    const normalized = phone.replace(/[\s\-]/g, '')
    const member = CRM_DATABASE[normalized]
    if (member) {
      onClose()
      onMemberFound(member)
    } else {
      setNotFound(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[380px] p-0 gap-0 rounded-[10px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-lg leading-7 text-foreground">
              เพิ่มเบอร์สมาชิกลูกค้า
            </p>
            <p className="text-sm text-muted-foreground">
              กรอกเบอร์โทรศัพท์ของลูกค้าที่เป็นสมาชิก
            </p>
          </div>
          <button
            onClick={onClose}
            className="opacity-70 hover:opacity-100 transition-opacity mt-0.5 shrink-0"
            aria-label="ปิด"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input */}
        <div className="px-6 pb-4 flex flex-col gap-1.5">
          <label htmlFor="crm-search" className="sr-only">ค้นหาสมาชิก</label>
          <div
            className={`flex items-center gap-3 h-9 rounded-lg border bg-background px-3 transition-colors ${
              notFound ? 'border-destructive' : 'border-border'
            }`}
          >
            <Smartphone size={16} className="text-muted-foreground shrink-0" />
            <input
              id="crm-search"
              type="tel"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="เบอร์โทรศัพท์"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setNotFound(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && phone.trim()) handleSearch()
              }}
              autoFocus
            />
          </div>
          {notFound && (
            <p className="text-sm text-muted-foreground">
              ไม่พบรายชื่อสมาชิก กรุณาลองอีกครั้ง
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <Button
            className="flex-1 h-9"
            disabled={!phone.trim()}
            onClick={handleSearch}
          >
            ค้นหา
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-9"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
