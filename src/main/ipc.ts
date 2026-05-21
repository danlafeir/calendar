import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../types/ipc'
import { startOAuthFlow, isAuthenticated, getAuthEmail, signOut } from './auth'
import { getEvents, createEvent, updateEvent, deleteEvent } from './calendar'
import { getWeather, fetchAndCache } from './weather'
import { getNotifyConfig, setNotifyConfig, getSettings } from './store'
import { updateEventCache, startScheduler } from './notifications'

let backgroundSyncInterval: ReturnType<typeof setInterval> | null = null

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
    stopBackgroundSync()
  })

  ipcMain.handle(IPC_CHANNELS.CALENDAR_GET_EVENTS, async (_, params) => {
    return getEvents(params.timeMin, params.timeMax)
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

  ipcMain.handle(IPC_CHANNELS.CALENDAR_DELETE_EVENT, async (_, { id }) => {
    await deleteEvent(id)
    await syncCalendar(mainWindow)
  })

  ipcMain.handle(IPC_CHANNELS.WEATHER_GET, async () => {
    return getWeather()
  })

  ipcMain.handle(IPC_CHANNELS.STORE_GET_NOTIFY_CONFIG, (_, { eventId }) => {
    return getNotifyConfig(eventId)
  })

  ipcMain.handle(IPC_CHANNELS.STORE_SET_NOTIFY_CONFIG, (_, { eventId, config }) => {
    setNotifyConfig(eventId, config)
  })

  // Start background services if already authenticated
  if (isAuthenticated()) {
    syncCalendar(mainWindow).catch(console.error)
    startBackgroundSync(mainWindow)
  }

  // Start the notification scheduler
  startScheduler(mainWindow)
}

async function syncCalendar(mainWindow: BrowserWindow): Promise<void> {
  try {
    const now = new Date()
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString()
    const events = await getEvents(timeMin, timeMax)
    updateEventCache(events)
    mainWindow.webContents.send(IPC_CHANNELS.CALENDAR_SYNCED, { events })
  } catch (err) {
    console.error('Calendar sync failed:', err)
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
