import { create } from 'zustand'
import { ipc } from '@renderer/lib/ipc'
import type { HomeData } from '@renderer/types'

interface HomeState {
  data: HomeData
  loaded: boolean
  load: () => Promise<void>
  update: (fn: (d: HomeData) => HomeData) => void
}

export const useHomeStore = create<HomeState>((set, get) => ({
  data: { lists: [], chores: [] },
  loaded: false,
  load: async () => {
    try {
      set({ data: await ipc().getHomeData(), loaded: true })
    } catch (err) {
      console.error('Failed to load home data:', err)
    }
  },
  // Optimistic: apply locally, persist, then adopt main's sanitized copy.
  // On failure reload so the screen never shows data that was not saved.
  update: (fn) => {
    set({ data: fn(get().data) })
    ipc()
      .saveHomeData(get().data)
      .then((saved) => set({ data: saved }))
      .catch((err) => {
        console.error('Failed to save home data:', err)
        void get().load()
      })
  },
}))
