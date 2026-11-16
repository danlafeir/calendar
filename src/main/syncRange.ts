export interface SyncRange {
  timeMin: string
  timeMax: string
}

export function defaultRange(now: Date): SyncRange {
  return {
    timeMin: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
    timeMax: new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString(),
  }
}

// Range to sync = default window plus whatever the user is looking at, so
// browsing far from today still shows events without the window growing
// unbounded across navigations.
export function unionRange(base: SyncRange, extra: SyncRange | null): SyncRange {
  if (!extra) return base
  return {
    timeMin: extra.timeMin < base.timeMin ? extra.timeMin : base.timeMin,
    timeMax: extra.timeMax > base.timeMax ? extra.timeMax : base.timeMax,
  }
}

export function rangesEqual(a: SyncRange, b: SyncRange): boolean {
  return a.timeMin === b.timeMin && a.timeMax === b.timeMax
}

const MAX_SPAN_FROM_NOW_MS = 2 * 365 * 24 * 60 * 60 * 1000

// Ranges come from the renderer: require real dates, min < max, and clamp to
// +/- 2 years so a bad value cannot make every sync expand decades of events.
export function sanitizeRange(input: unknown, now = Date.now()): SyncRange | null {
  if (typeof input !== 'object' || input === null) return null
  const { timeMin, timeMax } = input as Record<string, unknown>
  if (typeof timeMin !== 'string' || typeof timeMax !== 'string') return null
  const min = Date.parse(timeMin)
  const max = Date.parse(timeMax)
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null
  const lo = Math.max(min, now - MAX_SPAN_FROM_NOW_MS)
  const hi = Math.min(max, now + MAX_SPAN_FROM_NOW_MS)
  if (lo >= hi) return null
  return { timeMin: new Date(lo).toISOString(), timeMax: new Date(hi).toISOString() }
}
