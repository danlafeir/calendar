import { safeStorage, app } from 'electron'
import Store from 'electron-store'
import { chmod } from 'fs/promises'
import { join } from 'path'
import { DEFAULT_APP_SETTINGS } from '../types/ipc'
import { MAX_NOTIFY_KEYS } from './notifyValidation'
import { randomUUID } from 'crypto'
import type { WeatherData, NotifyConfig, AppSettings, HomeData } from '../types/ipc'

interface StoreSchema {
  encryptedTokens: string
  tokensFallback: string
  notifyConfigs: Record<string, NotifyConfig>
  weatherCache: { data: WeatherData; fetchedAt: number } | null
  selectedCalendarIds: string[] | null
  settings: {
    weatherLat: number
    weatherLon: number
    syncIntervalMs: number
  }
  appSettings: Partial<AppSettings>
  icsSources: IcsSource[]
  homeData: HomeData
}

// url may embed a private token, so it stays in main and is never sent to the renderer
export interface IcsSource {
  id: string
  name: string
  url: string
  color: string
}

const store = new Store<StoreSchema>({
  name: 'pi-calendar',
  defaults: {
    encryptedTokens: '',
    tokensFallback: '',
    notifyConfigs: {},
    weatherCache: null,
    selectedCalendarIds: null,
    appSettings: {},
    icsSources: [],
    homeData: { lists: [], chores: [] },
    settings: {
      weatherLat: parseFloat(process.env.WEATHER_LAT ?? '37.7749'),
      weatherLon: parseFloat(process.env.WEATHER_LON ?? '-122.4194'),
      syncIntervalMs: 60_000,
    },
  },
})

// Protect the store file on disk when safeStorage is unavailable
export async function lockStorePermissions(): Promise<void> {
  try {
    const storePath = join(app.getPath('userData'), 'pi-calendar.json')
    await chmod(storePath, 0o600)
  } catch {
    // ignore — file may not exist yet
  }
}

export function saveTokens(tokens: Record<string, unknown>): void {
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    store.set('encryptedTokens', safeStorage.encryptString(json).toString('base64'))
    store.set('tokensFallback', '')
  } else {
    store.set('tokensFallback', json)
    store.set('encryptedTokens', '')
  }
}

export function loadTokens(): Record<string, unknown> | null {
  const encrypted = store.get('encryptedTokens')
  if (encrypted) {
    try {
      const json = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
      return JSON.parse(json)
    } catch {
      return null
    }
  }
  const fallback = store.get('tokensFallback')
  return fallback ? JSON.parse(fallback) : null
}

export function clearTokens(): void {
  store.set('encryptedTokens', '')
  store.set('tokensFallback', '')
}

// legacyId: configs saved before keys became calendarId:id were keyed by bare event id
export function getNotifyConfig(key: string, legacyId?: string): NotifyConfig {
  const configs = store.get('notifyConfigs')
  const own = (k: string) => (Object.hasOwn(configs, k) ? configs[k] : undefined)
  return own(key) ?? (legacyId ? own(legacyId) : undefined) ?? { minutesBefore: [10], soundEnabled: true }
}

export function setNotifyConfig(key: string, config: NotifyConfig): void {
  const configs = store.get('notifyConfigs')
  if (!Object.hasOwn(configs, key) && Object.keys(configs).length >= MAX_NOTIFY_KEYS) return
  configs[key] = { ...config, savedAt: Date.now() }
  store.set('notifyConfigs', configs)
}

const CONFIG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000

// Drops configs for events that are no longer synced and were saved over a
// year ago. Configs without a timestamp (saved before pruning existed) are
// stamped now so they get the full grace period instead of being dropped.
export function pruneNotifyConfigs(liveKeys: Set<string>): void {
  const configs = store.get('notifyConfigs')
  const now = Date.now()
  let changed = false
  for (const [key, config] of Object.entries(configs)) {
    if (liveKeys.has(key)) continue
    if (config.savedAt === undefined) {
      config.savedAt = now
      changed = true
    } else if (now - config.savedAt > CONFIG_RETENTION_MS) {
      delete configs[key]
      changed = true
    }
  }
  if (changed) store.set('notifyConfigs', configs)
}

export function getWeatherCache(): { data: WeatherData; fetchedAt: number } | null {
  return store.get('weatherCache')
}

export function setWeatherCache(data: WeatherData): void {
  store.set('weatherCache', { data, fetchedAt: Date.now() })
}

export function getSelectedCalendarIds(): string[] | null {
  return store.get('selectedCalendarIds')
}

export function setSelectedCalendarIds(ids: string[] | null): void {
  store.set('selectedCalendarIds', ids)
}

// Stored partially so settings added later fall back to defaults for existing installs
export function getAppSettings(): AppSettings {
  return { ...DEFAULT_APP_SETTINGS, ...store.get('appSettings') }
}

export function updateAppSettings(patch: Partial<AppSettings>): AppSettings {
  store.set('appSettings', { ...store.get('appSettings'), ...patch })
  return getAppSettings()
}

export function getHomeData(): HomeData {
  return store.get('homeData')
}

export function setHomeData(data: HomeData): void {
  store.set('homeData', data)
}

const ICS_COLORS = ['#f2994a', '#bb6bd9', '#27ae60', '#eb5757', '#56ccf2', '#f2c94c']

export function getIcsSources(): IcsSource[] {
  return store.get('icsSources')
}

export const MAX_ICS_SOURCES = 20

export function addIcsSource(name: string, url: string): IcsSource {
  const sources = store.get('icsSources')
  const source: IcsSource = {
    id: randomUUID(),
    name,
    url,
    color: ICS_COLORS[sources.length % ICS_COLORS.length],
  }
  store.set('icsSources', [...sources, source])
  return source
}

export function removeIcsSource(id: string): void {
  store.set('icsSources', store.get('icsSources').filter((s) => s.id !== id))
}

export function getSettings(): StoreSchema['settings'] {
  return store.get('settings')
}

export function updateSettings(patch: Partial<StoreSchema['settings']>): void {
  const current = store.get('settings')
  store.set('settings', { ...current, ...patch })
}
