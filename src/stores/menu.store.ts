'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  type MenuCategory,
  type MenuItem,
  type MenuModifierGroup,
} from '@/lib/mock-data/menu'
import type { ImportedMenu, RestaurantProfile } from '@/lib/menu-import'

export const DEFAULT_PROFILE: RestaurantProfile = {
  id: 'a-ramen',
  name: 'A Ramen',
  nameTh: 'เอราเมง',
  currency: 'THB',
  locale: 'th-TH',
}

interface MenuStore {
  profile: RestaurantProfile
  categories: MenuCategory[]
  menuItems: MenuItem[]
  modifierGroups: MenuModifierGroup[]
  loadProfile: (imported: ImportedMenu) => void
  resetToDefault: () => void
}

const DEFAULT_STATE = {
  profile: DEFAULT_PROFILE,
  categories: MENU_CATEGORIES,
  menuItems: MENU_ITEMS,
  modifierGroups: MENU_ITEMS.flatMap((item) => item.modifierGroups).filter(
    (g, i, arr) => arr.findIndex((x) => x.id === g.id) === i,
  ),
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      loadProfile: (imported) =>
        set({
          profile: imported.profile,
          categories: imported.categories,
          menuItems: imported.menuItems,
          modifierGroups: imported.modifierGroups,
        }),
      resetToDefault: () => set(DEFAULT_STATE),
    }),
    { name: 'menu-store', version: 1, migrate: () => ({}) },
  ),
)
