export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  start: string
  end: string
  allDay: boolean
  calendarId: string
  colorId?: string
  extendedProperties?: {
    private?: Record<string, string>
  }
}

export interface CalendarInfo {
  id: string
  name: string
  color: string
  primary: boolean
}

export interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  condition: string
  conditionCode: number
  iconCode: string
  city: string
  fetchedAt: number
}

export interface NotifyConfig {
  minutesBefore: number[]
  soundEnabled: boolean
}

export interface NotificationPayload {
  event: CalendarEvent
  minutesBefore: number
  soundEnabled: boolean
}

export const IPC_CHANNELS = {
  CALENDAR_GET_EVENTS: 'calendar:getEvents',
  CALENDAR_CREATE_EVENT: 'calendar:createEvent',
  CALENDAR_UPDATE_EVENT: 'calendar:updateEvent',
  CALENDAR_DELETE_EVENT: 'calendar:deleteEvent',
  CALENDAR_GET_CALENDARS: 'calendar:getCalendars',
  AUTH_START_OAUTH: 'auth:startOAuth',
  AUTH_GET_STATUS: 'auth:getStatus',
  AUTH_SIGN_OUT: 'auth:signOut',
  WEATHER_GET: 'weather:get',
  STORE_GET_NOTIFY_CONFIG: 'store:getNotifyConfig',
  STORE_SET_NOTIFY_CONFIG: 'store:setNotifyConfig',
  STORE_GET_SELECTED_CALENDARS: 'store:getSelectedCalendars',
  STORE_SET_SELECTED_CALENDARS: 'store:setSelectedCalendars',
  NOTIFICATION_REMINDER: 'notification:reminder',
  CALENDAR_SYNCED: 'calendar:synced',
  WEATHER_UPDATED: 'weather:updated',
} as const

export interface ElectronAPI {
  getEvents: (params: { timeMin: string; timeMax: string }) => Promise<CalendarEvent[]>
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>
  updateEvent: (event: CalendarEvent) => Promise<CalendarEvent>
  deleteEvent: (params: { id: string }) => Promise<void>
  getCalendars: () => Promise<CalendarInfo[]>
  startOAuth: () => Promise<{ success: boolean }>
  getAuthStatus: () => Promise<{ authenticated: boolean; email?: string }>
  signOut: () => Promise<void>
  getWeather: () => Promise<WeatherData | null>
  getNotifyConfig: (params: { eventId: string }) => Promise<NotifyConfig>
  setNotifyConfig: (params: { eventId: string; config: NotifyConfig }) => Promise<void>
  getSelectedCalendars: () => Promise<string[] | null>
  setSelectedCalendars: (ids: string[] | null) => Promise<void>
  onNotificationReminder: (callback: (payload: NotificationPayload) => void) => () => void
  onCalendarSynced: (callback: (events: CalendarEvent[]) => void) => () => void
  onWeatherUpdated: (callback: (data: WeatherData) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
