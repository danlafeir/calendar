import { describe, it, expect } from 'vitest'
import { dueReminders, windowStart, CATCH_UP_MS } from '../src/main/reminders'
import type { CalendarEvent } from '../src/types/ipc'

const NOW = new Date('2026-11-15T10:00:00Z').getTime()
const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'e1', calendarId: 'c1', title: 't', start: new Date(NOW + 10 * 60_000).toISOString(),
  end: new Date(NOW + 70 * 60_000).toISOString(), allDay: false, ...over,
})
const cfg = () => ({ minutesBefore: [10], soundEnabled: true })

describe('dueReminders', () => {
  it('fires when fire time is inside (from, to]', () => {
    const r = dueReminders([ev({})], cfg, NOW - 30_000, NOW)
    expect(r).toHaveLength(1)
    expect(r[0].key).toBe('c1:e1|10')
  })
  it('does not fire outside the window', () => {
    expect(dueReminders([ev({})], cfg, NOW, NOW + 30_000)).toHaveLength(0)
  })
  it('catches up a reminder missed during a stalled tick', () => {
    const e = ev({ start: new Date(NOW + 8 * 60_000).toISOString() })
    expect(dueReminders([e], cfg, windowStart(NOW - 3 * 60_000, NOW), NOW)).toHaveLength(1)
  })
  it('does not replay reminders older than the catch-up cap', () => {
    expect(windowStart(NOW - 3_600_000, NOW)).toBe(NOW - CATCH_UP_MS)
  })
  it('skips events that already started', () => {
    const e = ev({ start: new Date(NOW - 60_000).toISOString() })
    expect(dueReminders([e], () => ({ minutesBefore: [0, 10], soundEnabled: true }), NOW - 600_000, NOW)).toHaveLength(0)
  })
  it('skips all-day and declined events', () => {
    expect(dueReminders([ev({ allDay: true }), ev({ declined: true })], cfg, NOW - 30_000, NOW)).toHaveLength(0)
  })
  it('same event id on two calendars gets distinct keys', () => {
    const r = dueReminders([ev({}), ev({ calendarId: 'c2' })], cfg, NOW - 30_000, NOW)
    expect(new Set(r.map((x) => x.key)).size).toBe(2)
  })
})
