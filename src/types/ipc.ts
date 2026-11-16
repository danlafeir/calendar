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
  readOnly?: boolean
  declined?: boolean
  extendedProperties?: {
    private?: Record<string, string>
  }
}

export interface CalendarInfo {
  id: string
  name: string
  color: string
  primary: boolean
  accessRole: string
}

export function eventKey(event: Pick<CalendarEvent, 'calendarId' | 'id'>): string {
  return `${event.calendarId}:${event.id}`
}

export function canWrite(accessRole: string): boolean {
  return accessRole === 'owner' || accessRole === 'writer'
}

export interface ForecastDay {
  // YYYY-MM-DD in the weather location's timezone
  date: string
  high: number
  low: number
  conditionCode: number
  condition: string
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
  units: 'imperial' | 'metric'
  forecast: ForecastDay[]
  fetchedAt: number
}

export interface AppSettings {
  // minutes of no touch before ambient mode starts; 0 disables it
  idleTimeoutMin: number
  nightStart: string
  nightEnd: string
  // 0 disables night dimming
  nightDimPercent: number
  units: 'imperial' | 'metric'
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  idleTimeoutMin: 5,
  nightStart: '22:00',
  nightEnd: '06:00',
  nightDimPercent: 60,
  units: 'imperial',
}

export interface ListItem {
  id: string
  text: string
  done: boolean
}

export interface TodoList {
  id: string
  name: string
  items: ListItem[]
}

export interface Chore {
  id: string
  title: string
  // a calendar id (one calendar per person), or null for "anyone"
  assignee: string | null
  // weekdays 0 (Sun) - 6 (Sat); empty means every day
  days: number[]
  // YYYY-MM-DD dates on which it was completed
  doneDates: string[]
}

export interface HomeData {
  lists: TodoList[]
  chores: Chore[]
}

export interface IcsSourceInfo {
  id: string
  name: string
  color: string
}

export type IcsAddResult = { ok: true; sources: IcsSourceInfo[] } | { ok: false; error: string }

export interface SyncPayload {
  // null when the whole sync failed; the renderer keeps what it already has
  events: CalendarEvent[] | null
  failedCalendarIds: string[]
  syncedAt: number
}

export interface NotifyConfig {
  minutesBefore: number[]
  soundEnabled: boolean
  savedAt?: number
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
  CALENDAR_SET_RANGE: 'calendar:setRange',
  PHOTO_NEXT: 'photo:next',
  HOME_GET: 'home:get',
  HOME_SAVE: 'home:save',
  ICS_LIST: 'ics:list',
  ICS_ADD: 'ics:add',
  ICS_REMOVE: 'ics:remove',
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  WEATHER_UPDATED: 'weather:updated',
} as const

export interface ElectronAPI {
  getEvents: (params: { timeMin: string; timeMax: string }) => Promise<CalendarEvent[]>
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>
  updateEvent: (event: CalendarEvent) => Promise<CalendarEvent>
  deleteEvent: (params: { id: string; calendarId: string }) => Promise<void>
  getCalendars: () => Promise<CalendarInfo[]>
  getHomeData: () => Promise<HomeData>
  saveHomeData: (data: HomeData) => Promise<HomeData>
  listIcsSources: () => Promise<IcsSourceInfo[]>
  addIcsSource: (params: { name: string; url: string }) => Promise<IcsAddResult>
  removeIcsSource: (id: string) => Promise<IcsSourceInfo[]>
  getNextPhoto: () => Promise<string | null>
  getAppSettings: () => Promise<AppSettings>
  updateAppSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
  setVisibleRange: (range: { timeMin: string; timeMax: string }) => Promise<void>
  startOAuth: () => Promise<{ success: boolean }>
  getAuthStatus: () => Promise<{ authenticated: boolean; email?: string }>
  signOut: () => Promise<void>
  getWeather: () => Promise<WeatherData | null>
  getNotifyConfig: (params: { eventKey: string }) => Promise<NotifyConfig>
  setNotifyConfig: (params: { eventKey: string; config: NotifyConfig }) => Promise<void>
  getSelectedCalendars: () => Promise<string[] | null>
  setSelectedCalendars: (ids: string[] | null) => Promise<void>
  onNotificationReminder: (callback: (payload: NotificationPayload) => void) => () => void
  onCalendarSynced: (callback: (payload: SyncPayload) => void) => () => void
  onWeatherUpdated: (callback: (data: WeatherData) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
