import { safeStorage, app } from 'electron'
import Store from 'electron-store'
import { chmod } from 'fs/promises'
import { join } from 'path'
import type { WeatherData, NotifyConfig } from '../types/ipc'

interface StoreSchema {
  encryptedTokens: string
  tokensFallback: string
  notifyConfigs: Record<string, NotifyConfig>
  weatherCache: { data: WeatherData; fetchedAt: number } | null
  settings: {
    weatherLat: number
    weatherLon: number
    syncIntervalMs: number
  }
}

const store = new Store<StoreSchema>({
  name: 'pi-calendar',
  defaults: {
    encryptedTokens: '',
    tokensFallback: '',
    notifyConfigs: {},
    weatherCache: null,
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

export function getNotifyConfig(eventId: string): NotifyConfig {
  const configs = store.get('notifyConfigs')
  return configs[eventId] ?? { minutesBefore: [10], soundEnabled: true }
}

export function setNotifyConfig(eventId: string, config: NotifyConfig): void {
  const configs = store.get('notifyConfigs')
  configs[eventId] = config
  store.set('notifyConfigs', configs)
}

export function getWeatherCache(): { data: WeatherData; fetchedAt: number } | null {
  return store.get('weatherCache')
}

export function setWeatherCache(data: WeatherData): void {
  store.set('weatherCache', { data, fetchedAt: Date.now() })
}

export function getSettings(): StoreSchema['settings'] {
  return store.get('settings')
}

export function updateSettings(patch: Partial<StoreSchema['settings']>): void {
  const current = store.get('settings')
  store.set('settings', { ...current, ...patch })
}
