import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../types/ipc'
import type { ElectronAPI, CalendarEvent, WeatherData, NotificationPayload } from '../types/ipc'

const api: ElectronAPI = {
  getEvents: (params) => ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_GET_EVENTS, params),
  createEvent: (event) => ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_CREATE_EVENT, event),
  updateEvent: (event) => ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_UPDATE_EVENT, event),
  deleteEvent: (params) => ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_DELETE_EVENT, params),
  getCalendars: () => ipcRenderer.invoke(IPC_CHANNELS.CALENDAR_GET_CALENDARS),
  startOAuth: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_START_OAUTH),
  getAuthStatus: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_STATUS),
  signOut: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_SIGN_OUT),
  getWeather: () => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_GET),
  getNotifyConfig: (params) => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET_NOTIFY_CONFIG, params),
  setNotifyConfig: (params) => ipcRenderer.invoke(IPC_CHANNELS.STORE_SET_NOTIFY_CONFIG, params),
  getSelectedCalendars: () => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET_SELECTED_CALENDARS),
  setSelectedCalendars: (ids) => ipcRenderer.invoke(IPC_CHANNELS.STORE_SET_SELECTED_CALENDARS, ids),

  onNotificationReminder: (callback: (payload: NotificationPayload) => void) => {
    const handler = (_: Electron.IpcRendererEvent, payload: NotificationPayload) =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.NOTIFICATION_REMINDER, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.NOTIFICATION_REMINDER, handler)
  },

  onCalendarSynced: (callback: (events: CalendarEvent[]) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { events: CalendarEvent[] }) =>
      callback(data.events)
    ipcRenderer.on(IPC_CHANNELS.CALENDAR_SYNCED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CALENDAR_SYNCED, handler)
  },

  onWeatherUpdated: (callback: (data: WeatherData) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: WeatherData) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.WEATHER_UPDATED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.WEATHER_UPDATED, handler)
  },
}

contextBridge.exposeInMainWorld('electronAPI', api)
