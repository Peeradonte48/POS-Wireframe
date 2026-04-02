'use client'

import { UserSearch, Coins, User } from 'lucide-react'
import type { CrmMember } from './CrmLookupDialog'

interface Props {
  member: CrmMember
  onChangeMember: () => void
}

export function CrmMemberCard({ member, onChangeMember }: Props) {
  return (
    <div className="flex flex-col w-full rounded-[14px] overflow-hidden">
      {/* Member info row */}
      <div className="flex items-center gap-2 bg-muted px-3.5 py-3">
        {/* Avatar placeholder */}
        <div className="size-8 rounded-full bg-background flex items-center justify-center shrink-0">
          <User size={16} className="text-muted-foreground" />
        </div>

        {/* Name + level badge */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className="font-medium text-sm leading-5 text-foreground truncate">{member.name}</p>
          <span className="inline-flex items-center text-xs font-semibold text-primary-foreground bg-destructive px-2 py-0.5 rounded-md w-fit">
            ระดับ: {member.level}
          </span>
        </div>

        {/* Change member icon button */}
        <button
          className="size-8 rounded-md border border-input bg-background flex items-center justify-center shrink-0 hover:bg-accent transition-colors"
          style={{ boxShadow: 'var(--shadow-card)' }}
          onClick={onChangeMember}
          aria-label="เปลี่ยนสมาชิก"
        >
          <UserSearch size={16} />
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-border" />

      {/* Points row */}
      <div className="flex items-center justify-between bg-muted px-3.5 py-3">
        <div className="flex items-center gap-1">
          <Coins size={16} className="text-accent-foreground shrink-0" />
          <span className="font-medium text-base leading-6 text-accent-foreground">คะแนนสะสม</span>
        </div>
        <span className="font-semibold text-base leading-6 text-destructive">{member.points}</span>
      </div>
    </div>
  )
}
