'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MENU_ITEMS, MENU_CATEGORIES, type MenuItem } from '@/lib/mock-data/menu'
import { cn } from '@/lib/utils'

const ALL_TAB = { id: 'all', label: 'รายการทั้งหมด' }
const TABS = [ALL_TAB, ...MENU_CATEGORIES.map(c => ({ id: c.id, label: c.label }))]

function getImageSrc(item: MenuItem): string | null {
  if (item.imagePath) return item.imagePath
  if (item.unsplashId) return `https://images.unsplash.com/photo-${item.unsplashId}?w=480&q=80`
  return null
}

function MenuCard({ item }: { item: MenuItem }) {
  const src = getImageSrc(item)

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Image — 4:3 aspect ratio matching Figma */}
      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
        {src ? (
          <Image
            src={src}
            alt={item.nameTh}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 240px"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center text-4xl">
            {item.thumbnailPlaceholder}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 shrink-0">
        <p className="text-[18px] font-semibold text-card-foreground leading-7 truncate">
          {item.nameTh}
        </p>
        <p className="text-sm font-bold text-primary leading-5">
          ฿{item.basePrice}
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('all')

  const items =
    activeTab === 'all'
      ? MENU_ITEMS
      : MENU_ITEMS.filter(i => i.categoryId === activeTab)

  return (
    <div className="flex-1 min-h-0 flex flex-col pr-2 py-2 bg-muted">
      {/* White card — matches Figma's rounded main content panel */}
      <div
        className="flex-1 min-h-0 flex flex-col bg-card rounded-xl overflow-hidden w-full"
        style={{ boxShadow: 'var(--shadow-panel)' }}
      >
        {/* Category tabs — matches Figma tabs bar */}
        <div className="border-b border-border px-6 py-3 shrink-0">
          <div className="bg-muted rounded-lg p-[3px] flex items-center">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-card text-foreground border border-border/50'
                    : 'text-foreground hover:text-foreground'
                )}
                style={activeTab === tab.id ? { boxShadow: 'var(--shadow-card)' } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable menu grid */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-muted/50 p-3">
          <div className="grid grid-cols-3 gap-[10px]">
            {items.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
