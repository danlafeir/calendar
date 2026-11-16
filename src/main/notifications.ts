import type { BrowserWindow } from 'electron'
import type { CalendarEvent } from '../types/ipc'
import { getNotifyConfig } from './store'
import { IPC_CHANNELS, eventKey } from '../types/ipc'
import { dueReminders, windowStart } from './reminders'

const TICK_MS = 30_000
const FIRED_RETENTION_MS = 24 * 60 * 60 * 1000

let cachedEvents: CalendarEvent[] = []
let schedulerInterval: ReturnType<typeof setInterval> | null = null
let lastTick = Date.now()
// key -> fire time, so entries can be pruned by age without re-looking-up events
const firedKeys = new Map<string, number>()

export function updateEventCache(events: CalendarEvent[]): void {
  cachedEvents = events
}

export function startScheduler(mainWindow: BrowserWindow): void {
  stopScheduler()
  lastTick = Date.now()
  schedulerInterval = setInterval(() => tick(mainWindow), TICK_MS)
}

export function stopScheduler(): void {
  if (schedulerInterval !== null) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}

function tick(mainWindow: BrowserWindow): void {
  try {
    runTick(mainWindow)
  } catch (err) {
    // a bad stored config must not turn into an uncaught exception every 30s
    console.error('Reminder tick failed:', err)
    lastTick = Date.now()
  }
}

function runTick(mainWindow: BrowserWindow): void {
  const now = Date.now()
  const due = dueReminders(
    cachedEvents,
    (event) => getNotifyConfig(eventKey(event), event.id),
    windowStart(lastTick, now),
    now,
  )
  lastTick = now

  for (const reminder of due) {
    if (firedKeys.has(reminder.key)) continue
    firedKeys.set(reminder.key, reminder.fireAt)
    mainWindow.webContents.send(IPC_CHANNELS.NOTIFICATION_REMINDER, {
      event: reminder.event,
      minutesBefore: reminder.minutesBefore,
      soundEnabled: reminder.soundEnabled,
    })
  }

  for (const [key, fireAt] of firedKeys) {
    if (fireAt < now - FIRED_RETENTION_MS) firedKeys.delete(key)
  }
}
