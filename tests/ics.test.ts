import { describe, it, expect } from 'vitest'
import { parseIcsEvents, normalizeIcsUrl } from '../src/main/ics'

const wrap = (body: string) => `BEGIN:VCALENDAR\nVERSION:2.0\n${body}\nEND:VCALENDAR`
const range = { from: new Date('2026-11-01T00:00:00Z'), to: new Date('2026-12-31T00:00:00Z') }

describe('parseIcsEvents', () => {
  it('maps an all-day multi-day event with an exclusive end', () => {
    const body = wrap(`BEGIN:VEVENT
UID:trip@x
DTSTART;VALUE=DATE:20261112
DTEND;VALUE=DATE:20261114
SUMMARY:Trip
END:VEVENT`)
    const [e] = parseIcsEvents(body, range, 'ics:1')
    expect(e).toMatchObject({ title: 'Trip', allDay: true, start: '2026-11-12', end: '2026-11-14', calendarId: 'ics:1', readOnly: true })
  })

  it('expands a weekly recurrence into distinct, uniquely-id\'d instances', () => {
    const body = wrap(`BEGIN:VEVENT
UID:standup@x
DTSTART:20261109T140000Z
DTEND:20261109T150000Z
RRULE:FREQ=WEEKLY;COUNT=4
SUMMARY:Standup
END:VEVENT`)
    const events = parseIcsEvents(body, range, 'ics:1')
    expect(events).toHaveLength(4)
    expect(new Set(events.map((e) => e.id)).size).toBe(4)
    expect(events[1].start).toBe('2026-11-16T14:00:00.000Z')
  })

  it('applies EXDATE exclusions', () => {
    const body = wrap(`BEGIN:VEVENT
UID:ex@x
DTSTART:20261109T140000Z
DTEND:20261109T150000Z
RRULE:FREQ=WEEKLY;COUNT=3
EXDATE:20261116T140000Z
SUMMARY:Ex
END:VEVENT`)
    expect(parseIcsEvents(body, range, 'ics:1')).toHaveLength(2)
  })

  it('skips cancelled events and events outside the range', () => {
    const body = wrap(`BEGIN:VEVENT
UID:c@x
DTSTART:20261109T140000Z
DTEND:20261109T150000Z
STATUS:CANCELLED
SUMMARY:Gone
END:VEVENT
BEGIN:VEVENT
UID:old@x
DTSTART:20200109T140000Z
DTEND:20200109T150000Z
SUMMARY:Old
END:VEVENT`)
    expect(parseIcsEvents(body, range, 'ics:1')).toHaveLength(0)
  })
})

describe('normalizeIcsUrl', () => {
  it('converts webcal to https and rejects other schemes', () => {
    expect(normalizeIcsUrl('webcal://example.com/a.ics')).toEqual({ ok: true, url: 'https://example.com/a.ics' })
    expect(normalizeIcsUrl('file:///etc/passwd').ok).toBe(false)
    expect(normalizeIcsUrl('javascript:alert(1)').ok).toBe(false)
    expect(normalizeIcsUrl('nonsense').ok).toBe(false)
  })
})

describe('limits', () => {
  it('skips sub-daily recurrence rules', () => {
    const body = wrap(`BEGIN:VEVENT
UID:s@x
DTSTART:20261109T140000Z
DTEND:20261109T140100Z
RRULE:FREQ=SECONDLY
SUMMARY:Spam
END:VEVENT`)
    expect(parseIcsEvents(body, range, 'ics:1')).toHaveLength(0)
  })
})
