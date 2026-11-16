import type { NotifyConfig } from '../types/ipc'

export const MAX_NOTIFY_KEYS = 5000
const MAX_KEY_LEN = 256
const MAX_MINUTES = 7 * 24 * 60
const MAX_OFFSETS = 10

export function isValidNotifyKey(key: unknown): key is string {
  return typeof key === 'string' && key.length > 0 && key.length <= MAX_KEY_LEN
}

// Returns null for anything that is not a usable config so the caller can reject it.
export function sanitizeNotifyConfig(input: unknown): NotifyConfig | null {
  if (typeof input !== 'object' || input === null) return null
  const c = input as Record<string, unknown>
  if (!Array.isArray(c.minutesBefore) || typeof c.soundEnabled !== 'boolean') return null
  const minutes = [
    ...new Set(
      c.minutesBefore.filter(
        (m): m is number => Number.isInteger(m) && (m as number) >= 0 && (m as number) <= MAX_MINUTES,
      ),
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, MAX_OFFSETS)
  return { minutesBefore: minutes, soundEnabled: c.soundEnabled }
}
