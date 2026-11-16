import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS, eventKey } from '../types/ipc'
import { startOAuthFlow, isAuthenticated, getAuthEmail, signOut } from './auth'
import { getEvents, createEvent, updateEvent, deleteEvent, getCalendars, clearCalendarCache, forgetIcsCalendar } from './calendar'
import { defaultRange, unionRange, rangesEqual, type SyncRange } from './syncRange'
import { getWeather, fetchAndCache } from './weather'
import { getNotifyConfig, setNotifyConfig, getSettings, getSelectedCalendarIds, setSelectedCalendarIds, pruneNotifyConfigs, getAppSettings, updateAppSettings, getIcsSources, addIcsSource, removeIcsSource, getHomeData, setHomeData } from './store'
import { fetchIcsBody, normalizeIcsUrl, parseIcsEvents } from './ics'
import { sanitizeHomeData } from './homeValidation'
import { getNextPhoto } from './photos'
import { sanitizeSettingsPatch } from './settingsValidation'
import { updateEventCache, startScheduler } from './notifications'

let backgroundSyncInterval: ReturnType<typeof setInterval> | null = null
let visibleRange: SyncRange | null = null

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.AUTH_START_OAUTH, async () => {
    const success = await startOAuthFlow()
    if (success) {
      await syncCalendar(mainWindow)
      startBackgroundSync(mainWindow)
    }
    return { success }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_STATUS, () => ({
    authenticated: isAuthenticated(),
    email: getAuthEmail(),
  }))

  ipcMain.handle(IPC_CHANNELS.AUTH_SIGN_OUT, () => {
    signOut()
    clearCalendarCache()
    stopBackgroundSync()
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_GET_EVENTS, async (_, params) => {
    return (await getEvents(params.timeMin, params.timeMax)).events
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_SET_RANGE, async (_, range: SyncRange) => {
    const before = unionRange(defaultRange(new Date()), visibleRange)
    visibleRange = range
    const after = unionRange(defaultRange(new Date()), visibleRange)
    if (!rangesEqual(before, after) && isAuthenticated()) await syncCalendar(mainWindow)
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_CREATE_EVENT, async (_, event) => {
    const created = await createEvent(event)
    await syncCalendar(mainWindow)
    return created
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_UPDATE_EVENT, async (_, event) => {
    const updated = await updateEvent(event)
    await syncCalendar(mainWindow)
    return updated
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_DELETE_EVENT, async (_, { id, calendarId }) => {
    await deleteEvent(id, calendarId)
    await syncCalendar(mainWindow)
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_GET_CALENDARS, async () => {
    return getCalendars()
  })

  ipcMain.handle(IPC_CHANNELS.STORE_GET_SELECTED_CALENDARS, () => {
    return getSelectedCalendarIds()
  })

  ipcMain.handle(IPC_CHANNELS.STORE_SET_SELECTED_CALENDARS, async (_, ids: string[] | null) => {
    setSelectedCalendarIds(ids)
    await syncCalendar(mainWindow)
  })

  ipcMain.handle(IPC_CHANNELS.HOME_GET, () => getHomeData())

  ipcMain.handle(IPC_CHANNELS.HOME_SAVE, (_, data: unknown) => {
    const clean = sanitizeHomeData(data)
    setHomeData(clean)
    return clean
  })

  ipcMain.handle(IPC_CHANNELS.ICS_LIST, () => icsInfos())

  ipcMain.handle(IPC_CHANNELS.ICS_ADD, async (_, params: { name?: unknown; url?: unknown }) => {
    const name = typeof params?.name === 'string' ? params.name.trim().slice(0, 60) : ''
    if (!name) return { ok: false, error: 'Name is required' }
    const checked = normalizeIcsUrl(typeof params?.url === 'string' ? params.url : '')
    if (!checked.ok) return checked
    try {
      // verify the feed is reachable and parses before saving it
      parseIcsEvents(await fetchIcsBody(checked.url), { from: new Date(), to: new Date() }, 'check')
    } catch {
      return { ok: false, error: 'Could not read a calendar from that URL' }
    }
    addIcsSource(name, checked.url)
    await syncCalendar(mainWindow)
    return { ok: true, sources: icsInfos() }
  })

  ipcMain.handle(IPC_CHANNELS.ICS_REMOVE, async (_, id: string) => {
    removeIcsSource(id)
    forgetIcsCalendar(id)
    await syncCalendar(mainWindow)
    return icsInfos()
  })

  ipcMain.handle(IPC_CHANNELS.PHOTO_NEXT, () => getNextPhoto())

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => getAppSettings())

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_, patch) =>
    updateAppSettings(sanitizeSettingsPatch(patch)),
  )

  ipcMain.handle(IPC_CHANNELS.WEATHER_GET, async () => {
    return getWeather()
  })

  ipcMain.handle(IPC_CHANNELS.STORE_GET_NOTIFY_CONFIG, (_, { eventKey }) => {
    return getNotifyConfig(eventKey)
  })

  ipcMain.handle(IPC_CHANNELS.STORE_SET_NOTIFY_CONFIG, (_, { eventKey, config }) => {
    setNotifyConfig(eventKey, config)
  })

  // Start background services if already authenticated
  if (isAuthenticated()) {
    syncCalendar(mainWindow).catch(console.error)
    startBackgroundSync(mainWindow)
  }

  // Start the notification scheduler
  startScheduler(mainWindow)
}

function icsInfos() {
  return getIcsSources().map(({ id, name, color }) => ({ id, name, color }))
}

async function syncCalendar(mainWindow: BrowserWindow): Promise<void> {
  try {
    const { timeMin, timeMax } = unionRange(defaultRange(new Date()), visibleRange)
    const { events, failedCalendarIds } = await getEvents(timeMin, timeMax)
    updateEventCache(events)
    pruneNotifyConfigs(new Set(events.map(eventKey)))
    mainWindow.webContents.send(IPC_CHANNELS.CALENDAR_SYNCED, {
      events,
      failedCalendarIds,
      syncedAt: Date.now(),
    })
  } catch (err) {
    console.error('Calendar sync failed:', err)
    mainWindow.webContents.send(IPC_CHANNELS.CALENDAR_SYNCED, {
      events: null,
      failedCalendarIds: [],
      syncedAt: Date.now(),
    })
  }
}

async function syncWeather(mainWindow: BrowserWindow): Promise<void> {
  try {
    const data = await fetchAndCache()
    if (data) mainWindow.webContents.send(IPC_CHANNELS.WEATHER_UPDATED, data)
  } catch {
    // silently ignore weather failures
  }
}

function startBackgroundSync(mainWindow: BrowserWindow): void {
  stopBackgroundSync()
  const { syncIntervalMs } = getSettings()
  backgroundSyncInterval = setInterval(() => {
    syncCalendar(mainWindow).catch(console.error)
    syncWeather(mainWindow).catch(console.error)
  }, syncIntervalMs)

  // Initial weather fetch
  syncWeather(mainWindow).catch(console.error)
}

function stopBackgroundSync(): void {
  if (backgroundSyncInterval !== null) {
    clearInterval(backgroundSyncInterval)
    backgroundSyncInterval = null
  }
}
