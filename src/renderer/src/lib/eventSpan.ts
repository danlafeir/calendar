import { addDays, endOfDay, format, isBefore, isAfter, parseISO, startOfDay } from 'date-fns'
import type { CalendarEvent } from '../../../types/ipc'

type Span = Pick<CalendarEvent, 'start' | 'end' | 'allDay'>

// All-day events carry date-only strings and Google's `end` is exclusive.
// Timed events that end exactly at midnight do not touch the following day.
export function occursOnDay(event: Span, day: Date): boolean {
  const dayStart = startOfDay(day)
  const nextDayStart = addDays(dayStart, 1)
  const start = parseISO(event.start)
  const end = parseISO(event.end)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false
  if (isBefore(start, end)) return isBefore(start, nextDayStart) && isAfter(end, dayStart)
  // zero-length event: treat as a point in time
  return !isBefore(start, dayStart) && isBefore(start, nextDayStart)
}

export function clipToDay(event: Span, day: Date): { start: Date; end: Date } {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  const start = parseISO(event.start)
  const end = parseISO(event.end)
  return {
    start: isBefore(start, dayStart) ? dayStart : start,
    end: isAfter(end, dayEnd) ? dayEnd : end,
  }
}

export function lastDayOfAllDay(event: Span): string {
  return format(addDays(parseISO(event.end), -1), 'yyyy-MM-dd')
}

export function compareForDay(a: CalendarEvent, b: CalendarEvent): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  return parseISO(a.start).getTime() - parseISO(b.start).getTime()
}
