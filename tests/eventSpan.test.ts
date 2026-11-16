import { describe, it, expect } from 'vitest'
import { occursOnDay, clipToDay, lastDayOfAllDay } from '../src/renderer/src/lib/eventSpan'

const d = (s: string) => new Date(`${s}T12:00:00`)

describe('occursOnDay', () => {
  const trip = { start: '2026-11-10', end: '2026-11-13', allDay: true }
  it('covers every day of a multi-day all-day event, end exclusive', () => {
    expect(occursOnDay(trip, d('2026-11-09'))).toBe(false)
    expect(occursOnDay(trip, d('2026-11-10'))).toBe(true)
    expect(occursOnDay(trip, d('2026-11-12'))).toBe(true)
    expect(occursOnDay(trip, d('2026-11-13'))).toBe(false)
  })
  it('single-day all-day event occupies only that day', () => {
    const e = { start: '2026-11-10', end: '2026-11-11', allDay: true }
    expect(occursOnDay(e, d('2026-11-10'))).toBe(true)
    expect(occursOnDay(e, d('2026-11-11'))).toBe(false)
  })
  it('timed event crossing midnight appears on both days', () => {
    const e = { start: '2026-11-10T22:00:00', end: '2026-11-11T02:00:00', allDay: false }
    expect(occursOnDay(e, d('2026-11-10'))).toBe(true)
    expect(occursOnDay(e, d('2026-11-11'))).toBe(true)
    expect(occursOnDay(e, d('2026-11-12'))).toBe(false)
  })
  it('timed event ending at midnight does not touch the next day', () => {
    const e = { start: '2026-11-10T22:00:00', end: '2026-11-11T00:00:00', allDay: false }
    expect(occursOnDay(e, d('2026-11-11'))).toBe(false)
  })
  it('zero-length events show on their own day only', () => {
    const e = { start: '2026-11-10T09:00:00', end: '2026-11-10T09:00:00', allDay: false }
    expect(occursOnDay(e, d('2026-11-10'))).toBe(true)
    expect(occursOnDay(e, d('2026-11-11'))).toBe(false)
  })
})

describe('clipToDay', () => {
  it('clips a cross-midnight event to the day boundaries', () => {
    const e = { start: '2026-11-10T22:00:00', end: '2026-11-11T02:00:00', allDay: false }
    const c = clipToDay(e, d('2026-11-11'))
    expect(c.start.getHours()).toBe(0)
    expect(c.end.getHours()).toBe(2)
  })
})

describe('lastDayOfAllDay', () => {
  it('converts the exclusive end to an inclusive date', () => {
    expect(lastDayOfAllDay({ start: '2026-11-10', end: '2026-11-13', allDay: true })).toBe('2026-11-12')
  })
})
