import { describe, it, expect } from 'vitest'
import { eventColor, tint, DEFAULT_EVENT_COLOR } from '../src/renderer/src/lib/eventColor'
import type { CalendarEvent, CalendarInfo } from '../src/types/ipc'

const cals: CalendarInfo[] = [{ id: 'kid', name: 'Kid', color: '#ff0000', primary: false, accessRole: 'owner' }]
const ev = (o: Partial<CalendarEvent>): CalendarEvent => ({
  id: '1', calendarId: 'kid', title: 't', start: '', end: '', allDay: false, ...o,
})

describe('eventColor', () => {
  it('prefers explicit colorId, then calendar color, then default', () => {
    expect(eventColor(ev({ colorId: '2' }), cals)).toBe('#81c995')
    expect(eventColor(ev({}), cals)).toBe('#ff0000')
    expect(eventColor(ev({ calendarId: 'other' }), cals)).toBe(DEFAULT_EVENT_COLOR)
  })
})

describe('tint', () => {
  it('appends alpha to #rrggbb and leaves other formats alone', () => {
    expect(tint('#ff0000', 0.5)).toBe('#ff000080')
    expect(tint('red')).toBe('red')
  })
})
