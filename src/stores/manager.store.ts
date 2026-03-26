'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ManagerStore {
  eightySixedIds: string[]
  shiftClosed: boolean
  toggleEightySix: (menuItemId: string) => void
  isEightySixed: (menuItemId: string) => boolean
  closeShift: () => void
  resetShift: () => void
}

export const useManagerStore = create<ManagerStore>()(
  persist(
    (set, get) => ({
      eightySixedIds: [],
      shiftClosed: false,
      toggleEightySix: (id) =>
        set((state) => ({
          eightySixedIds: state.eightySixedIds.includes(id)
            ? state.eightySixedIds.filter((x) => x !== id)
            : [...state.eightySixedIds, id],
        })),
      isEightySixed: (id) => get().eightySixedIds.includes(id),
      closeShift: () => set({ shiftClosed: true }),
      resetShift: () => set({ shiftClosed: false, eightySixedIds: [] }),
    }),
    { name: 'manager-store', version: 1, migrate: () => ({}) },
  ),
)
