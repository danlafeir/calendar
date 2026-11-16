import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek, startOfDay, endOfDay } from 'date-fns'
import type { CalendarView } from '@renderer/store/useCalendarStore'

export const AGENDA_DAYS = 7

export function viewRange(view: CalendarView, date: Date): { timeMin: string; timeMax: string } {
  if (view === 'day') {
    return { timeMin: startOfDay(date).toISOString(), timeMax: endOfDay(date).toISOString() }
  }
  if (view === 'agenda') {
    return {
      timeMin: startOfDay(date).toISOString(),
      timeMax: endOfDay(addDays(date, AGENDA_DAYS - 1)).toISOString(),
    }
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
