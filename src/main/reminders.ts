import { eventKey } from '../types/ipc'
import type { CalendarEvent, NotifyConfig } from '../types/ipc'

export interface DueReminder {
  event: CalendarEvent
  minutesBefore: number
  soundEnabled: boolean
  key: string
  fireAt: number
}

// Reminders whose fire time falls in (from, to]. Events that have already
// started are skipped: "starts in 10 minutes" after the start is wrong.
export function dueReminders(
  events: CalendarEvent[],
  getConfig: (event: CalendarEvent) => NotifyConfig,
  from: number,
  to: number,
): DueReminder[] {
  const due: DueReminder[] = []
  for (const event of events) {
    if (event.allDay || event.declined) continue
    const start = new Date(event.start).getTime()
    if (isNaN(start) || start <= to) continue
    const config = getConfig(event)
    for (const minutesBefore of config.minutesBefore) {
      const fireAt = start - minutesBefore * 60_000
      if (fireAt > from && fireAt <= to) {
        due.push({
          event,
          minutesBefore,
          soundEnabled: config.soundEnabled,
          key: `${eventKey(event)}|${minutesBefore}`,
          fireAt,
        })
      }
    }
  }
  return due
}

// After sleep or a stalled tick the window since the last tick can be huge;
// cap how far back we replay so a wake-up does not dump stale alerts.
export const CATCH_UP_MS = 5 * 60_000

export function windowStart(lastTick: number, now: number): number {
  return Math.max(lastTick, now - CATCH_UP_MS)
}
