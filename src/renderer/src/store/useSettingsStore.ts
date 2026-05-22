import { create } from 'zustand'
import type { CalendarInfo } from '@renderer/types'

interface SettingsState {
  isDrawerOpen: boolean
  calendars: CalendarInfo[]
  // null means "all selected"
  selectedCalendarIds: Set<string> | null
  openDrawer: () => void
  closeDrawer: () => void
  setCalendars: (calendars: CalendarInfo[]) => void
  setSelectedCalendarIds: (ids: string[] | null) => void
  toggleCalendar: (id: string) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isDrawerOpen: false,
  calendars: [],
  selectedCalendarIds: null,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setCalendars: (calendars) => set({ calendars }),
  setSelectedCalendarIds: (ids) =>
    set({ selectedCalendarIds: ids === null ? null : new Set(ids) }),
  toggleCalendar: (id) => {
    const { selectedCalendarIds, calendars } = get()
    const allIds = calendars.map((c) => c.id)
    const current = selectedCalendarIds ?? new Set(allIds)
    const next = new Set(current)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    set({ selectedCalendarIds: next.size === allIds.length ? null : next })
  },
}))
