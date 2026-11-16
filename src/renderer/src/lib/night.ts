function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// start/end are "HH:mm"; the window may wrap past midnight (22:00-06:00).
// Equal start and end means "never" rather than "always".
export function isNightTime(now: Date, start: string, end: string): boolean {
  const s = toMinutes(start)
  const e = toMinutes(end)
  if (s === e) return false
  const n = now.getHours() * 60 + now.getMinutes()
  return s < e ? n >= s && n < e : n >= s || n < e
}
