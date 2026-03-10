'use client'

import { useState } from 'react'
import { MENU_CATEGORIES, MENU_ITEMS } from '@/lib/mock-data/menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MenuPanelProps {
  onItemTap: (itemId: string) => void
}

export function MenuPanel({ onItemTap }: MenuPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>(MENU_CATEGORIES[0].id)

  const filteredItems = MENU_ITEMS.filter((item) => item.categoryId === activeCategory)

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b h-10 px-2">
          {MENU_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs shrink-0">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No items in this category
          </p>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemTap(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b hover:bg-accent transition-colors text-left"
            >
              {/* Thumbnail placeholder */}
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xl shrink-0">
                {item.thumbnailPlaceholder}
              </div>
              {/* Name + Thai name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.nameTh}</p>
              </div>
              {/* Price */}
              <span className="text-sm font-medium shrink-0">฿{item.basePrice}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
