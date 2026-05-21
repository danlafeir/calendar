import type { BrowserWindow } from 'electron'
import type { CalendarEvent } from '../types/ipc'
import { getNotifyConfig } from './store'
import { IPC_CHANNELS } from '../types/ipc'

let cachedEvents: CalendarEvent[] = []
let schedulerInterval: ReturnType<typeof setInterval> | null = null
const firedKeys = new Set<string>()

export function updateEventCache(events: CalendarEvent[]): void {
  cachedEvents = events
}

export function startScheduler(mainWindow: BrowserWindow): void {
  stopScheduler()
  schedulerInterval = setInterval(() => tick(mainWindow), 30_000)
}

export function stopScheduler(): void {
  if (schedulerInterval !== null) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}

function tick(mainWindow: BrowserWindow): void {
  const now = Date.now()
  const windowStart = now - 30_000
  const windowEnd = now

  for (const event of cachedEvents) {
    if (event.allDay) continue
    const config = getNotifyConfig(event.id)
    for (const minutesBefore of config.minutesBefore) {
      const fireAt = new Date(event.start).getTime() - minutesBefore * 60_000
      const key = `${event.id}:${minutesBefore}`
      if (fireAt >= windowStart && fireAt < windowEnd && !firedKeys.has(key)) {
        firedKeys.add(key)
        mainWindow.webContents.send(IPC_CHANNELS.NOTIFICATION_REMINDER, {
          event,
          minutesBefore,
          soundEnabled: config.soundEnabled,
        })
      }
    }
  }

  // Prune fired keys older than 1 day to prevent unbounded growth
  const cutoff = now - 24 * 60 * 60 * 1000
  for (const key of firedKeys) {
    const [eventId] = key.split(':')
    const event = cachedEvents.find((e) => e.id === eventId)
    if (!event || new Date(event.start).getTime() < cutoff) {
      firedKeys.delete(key)
    }
  }
}
