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
