import { endOfMonth, endOfWeek, startOfMonth, startOfWeek, startOfDay, endOfDay } from 'date-fns'
import type { CalendarView } from '@renderer/store/useCalendarStore'

export function viewRange(view: CalendarView, date: Date): { timeMin: string; timeMax: string } {
  if (view === 'day') {
    return { timeMin: startOfDay(date).toISOString(), timeMax: endOfDay(date).toISOString() }
  }
  if (view === 'week') {
    return {
      timeMin: startOfWeek(date, { weekStartsOn: 0 }).toISOString(),
      timeMax: endOfWeek(date, { weekStartsOn: 0 }).toISOString(),
    }
  }
  return {
    timeMin: startOfWeek(startOfMonth(date), { weekStartsOn: 0 }).toISOString(),
    timeMax: endOfWeek(endOfMonth(date), { weekStartsOn: 0 }).toISOString(),
  }
}
