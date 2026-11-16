import { format } from 'date-fns'
import type { Chore } from '../../../types/ipc'

export const dateKey = (d: Date): string => format(d, 'yyyy-MM-dd')

export function choresForDay(chores: Chore[], day: Date): Chore[] {
  const dow = day.getDay()
  return chores.filter((c) => c.days.length === 0 || c.days.includes(dow))
}

export function isChoreDone(chore: Chore, day: Date): boolean {
  return chore.doneDates.includes(dateKey(day))
}

export function toggleChoreDone(chore: Chore, day: Date): Chore {
  const key = dateKey(day)
  return {
    ...chore,
    doneDates: chore.doneDates.includes(key)
      ? chore.doneDates.filter((d) => d !== key)
      : [...chore.doneDates, key].sort(),
  }
}

export function newId(): string {
  return crypto.randomUUID()
}
