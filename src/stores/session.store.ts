import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useManagerStore } from '@/stores/manager.store'

export type Role = 'Waiter' | 'Cashier' | 'Manager' | 'Kitchen'

interface SessionState {
  // Auth
  role: Role | null
  staffName: string | null
  staffId: string | null
  // Branch + shift
  branch: string | null
  branchName: string | null
  openingCash: number | null
  shiftOpen: boolean
  // Actions
  login: (role: Role, staffName: string, staffId: string) => void
  openShift: (branch: string, branchName: string, openingCash: number) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      staffName: null,
      staffId: null,
      branch: null,
      branchName: null,
      openingCash: null,
      shiftOpen: false,

      login: (role, staffName, staffId) => set({ role, staffName, staffId }),

      openShift: (branch, branchName, openingCash) =>
        set({ branch, branchName, openingCash, shiftOpen: true }),

      logout: () => {
        useManagerStore.getState().resetShift()
        set({
          role: null,
          staffName: null,
          staffId: null,
          branch: null,
          branchName: null,
          openingCash: null,
          shiftOpen: false,
        })
      },
    }),
    { name: 'session-store', version: 1, migrate: () => ({}) },
  ),
)
