import { create } from 'zustand'
import { addWeeks, subWeeks, addMonths, subMonths, addDays, subDays } from 'date-fns'
import type { CalendarEvent } from '@renderer/types'

export type CalendarView = 'week' | 'month' | 'day'

interface CalendarState {
  events: CalendarEvent[]
  selectedDate: Date
  activeView: CalendarView
  setEvents: (events: CalendarEvent[]) => void
  setSelectedDate: (date: Date) => void
  setActiveView: (view: CalendarView) => void
  navigateForward: () => void
  navigateBackward: () => void
  goToToday: () => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  selectedDate: new Date(),
  activeView: 'week',

  setEvents: (events) => set({ events }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setActiveView: (view) => set({ activeView: view }),
  goToToday: () => set({ selectedDate: new Date() }),

  navigateForward: () => {
    const { selectedDate, activeView } = get()
    const next =
      activeView === 'week'
        ? addWeeks(selectedDate, 1)
        : activeView === 'month'
          ? addMonths(selectedDate, 1)
          : addDays(selectedDate, 1)
    set({ selectedDate: next })
  },

  navigateBackward: () => {
    const { selectedDate, activeView } = get()
    const prev =
      activeView === 'week'
        ? subWeeks(selectedDate, 1)
        : activeView === 'month'
          ? subMonths(selectedDate, 1)
          : subDays(selectedDate, 1)
    set({ selectedDate: prev })
  },
}))
