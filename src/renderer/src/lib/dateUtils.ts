import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  getHours,
  getMinutes,
  differenceInMinutes,
  startOfDay,
  endOfDay,
} from 'date-fns'

export {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  getHours,
  getMinutes,
  differenceInMinutes,
  startOfDay,
  endOfDay,
}

export const MINS_IN_DAY = 24 * 60
export const PX_PER_MINUTE = 0.9

export function minutesFromMidnight(date: Date): number {
  return getHours(date) * 60 + getMinutes(date)
}

export function eventTop(startIso: string): number {
  return minutesFromMidnight(parseISO(startIso)) * PX_PER_MINUTE
}

export function eventHeight(startIso: string, endIso: string): number {
  const mins = differenceInMinutes(parseISO(endIso), parseISO(startIso))
  return Math.max(mins * PX_PER_MINUTE, 20)
}

export function totalGridHeight(): number {
  return MINS_IN_DAY * PX_PER_MINUTE
}

export function formatEventTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a')
}

export function getWeekDays(anchorDate: Date): Date[] {
  const start = startOfWeek(anchorDate, { weekStartsOn: 0 })
  const end = endOfWeek(anchorDate, { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

export function getMonthDays(anchorDate: Date): Date[] {
  const start = startOfMonth(anchorDate)
  const end = endOfMonth(anchorDate)
  // pad to full 6-week grid
  const gridStart = startOfWeek(start, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(end, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}
