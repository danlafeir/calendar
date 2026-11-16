import { google, calendar_v3 } from 'googleapis'
import { getAuthenticatedClient } from './auth'
import { canWrite } from '../types/ipc'
import type { CalendarEvent, CalendarInfo } from '../types/ipc'
import { getSelectedCalendarIds, getIcsSources } from './store'
import { fetchIcsBody, parseIcsEvents } from './ics'

function mapEvent(
  e: calendar_v3.Schema$Event,
  calendarId: string,
  readOnly = false,
): CalendarEvent {
  const start = e.start?.dateTime ?? e.start?.date ?? ''
  const end = e.end?.dateTime ?? e.end?.date ?? ''
  return {
    id: e.id ?? '',
    title: e.summary ?? '(No title)',
    description: e.description ?? undefined,
    location: e.location ?? undefined,
    start,
    end,
    allDay: !e.start?.dateTime,
    calendarId,
    colorId: e.colorId ?? undefined,
    readOnly: readOnly || undefined,
    declined: e.attendees?.some((a) => a.self && a.responseStatus === 'declined') || undefined,
    extendedProperties: e.extendedProperties
      ? { private: (e.extendedProperties.private as Record<string, string>) ?? undefined }
      : undefined,
  }
}

const REQUEST_TIMEOUT_MS = 15_000
const CALENDAR_LIST_TTL_MS = 10 * 60 * 1000
const MAX_PAGES = 10

async function getClient() {
  const auth = await getAuthenticatedClient()
  return google.calendar({ version: 'v3', auth, timeout: REQUEST_TIMEOUT_MS })
}

let calendarListCache: { at: number; calendars: CalendarInfo[] } | null = null

export function clearCalendarCache(): void {
  calendarListCache = null
  lastGood.clear()
}

export const ICS_PREFIX = 'ics:'

function icsCalendars(): CalendarInfo[] {
  return getIcsSources().map((s) => ({
    id: `${ICS_PREFIX}${s.id}`,
    name: s.name,
    color: s.color,
    primary: false,
    accessRole: 'reader',
  }))
}

export async function getCalendars(force = false): Promise<CalendarInfo[]> {
  return [...(await getGoogleCalendars(force)), ...icsCalendars()]
}

async function getGoogleCalendars(force: boolean): Promise<CalendarInfo[]> {
  if (!force && calendarListCache && Date.now() - calendarListCache.at < CALENDAR_LIST_TTL_MS) {
    return calendarListCache.calendars
  }
  const cal = await getClient()
  const res = await cal.calendarList.list({ minAccessRole: 'reader' })
  const calendars = (res.data.items ?? []).map((c) => ({
    id: c.id ?? '',
    name: c.summary ?? c.id ?? '',
    color: c.backgroundColor ?? '#4285f4',
    primary: c.primary ?? false,
    accessRole: c.accessRole ?? 'reader',
  }))
  calendarListCache = { at: Date.now(), calendars }
  return calendars
}

export interface EventsResult {
  events: CalendarEvent[]
  failedCalendarIds: string[]
}

// Last successful result per calendar, reused when a later fetch for the same
// range fails so a flaky calendar does not blank out its events.
const lastGood = new Map<string, { range: string; events: CalendarEvent[] }>()

const ICS_TTL_MS = 10 * 60 * 1000
const icsBodies = new Map<string, { at: number; body: string }>()

async function fetchIcsCalendarEvents(
  calendar: CalendarInfo,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const source = getIcsSources().find((s) => `${ICS_PREFIX}${s.id}` === calendar.id)
  if (!source) return []
  let cached = icsBodies.get(calendar.id)
  if (!cached || Date.now() - cached.at > ICS_TTL_MS) {
    try {
      cached = { at: Date.now(), body: await fetchIcsBody(source.url) }
      icsBodies.set(calendar.id, cached)
    } catch (err) {
      // serve the previous copy rather than blanking the calendar on a flaky feed
      if (!cached) throw err
    }
  }
  return parseIcsEvents(cached.body, { from: new Date(timeMin), to: new Date(timeMax) }, calendar.id)
}

export function forgetIcsCalendar(sourceId: string): void {
  icsBodies.delete(`${ICS_PREFIX}${sourceId}`)
  lastGood.delete(`${ICS_PREFIX}${sourceId}`)
}

async function fetchCalendarEvents(
  cal: calendar_v3.Calendar,
  calendar: CalendarInfo,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  if (calendar.id.startsWith(ICS_PREFIX)) return fetchIcsCalendarEvents(calendar, timeMin, timeMax)
  const readOnly = !canWrite(calendar.accessRole)
  const events: CalendarEvent[] = []
  let pageToken: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await cal.events.list({
      calendarId: calendar.id,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    })
    for (const e of res.data.items ?? []) events.push(mapEvent(e, calendar.id, readOnly))
    pageToken = res.data.nextPageToken ?? undefined
    if (!pageToken) break
  }
  return events
}

export async function getEvents(timeMin: string, timeMax: string): Promise<EventsResult> {
  const cal = await getClient()

  let allCalendars: CalendarInfo[]
  try {
    allCalendars = await getCalendars()
  } catch {
    allCalendars = [
      { id: 'primary', name: 'Primary', color: '#4285f4', primary: true, accessRole: 'owner' },
      ...icsCalendars(),
    ]
  }

  // null = all calendars selected
  const selectedIds = getSelectedCalendarIds()
  const calendarsToFetch = selectedIds
    ? allCalendars.filter((c) => selectedIds.includes(c.id))
    : allCalendars

  const range = `${timeMin}|${timeMax}`
  const results = await Promise.allSettled(
    calendarsToFetch.map((calendar) => fetchCalendarEvents(cal, calendar, timeMin, timeMax)),
  )

  const events: CalendarEvent[] = []
  const failedCalendarIds: string[] = []
  results.forEach((r, i) => {
    const id = calendarsToFetch[i].id
    if (r.status === 'fulfilled') {
      lastGood.set(id, { range, events: r.value })
      events.push(...r.value)
      return
    }
    failedCalendarIds.push(id)
    const prev = lastGood.get(id)
    if (prev && prev.range === range) events.push(...prev.events)
  })

  if (calendarsToFetch.length > 0 && failedCalendarIds.length === calendarsToFetch.length) {
    throw new Error('All calendars failed to sync')
  }
  return { events, failedCalendarIds }
}

function eventTimes(event: Pick<CalendarEvent, 'start' | 'end' | 'allDay'>) {
  if (event.allDay) {
    return {
      start: { date: event.start.split('T')[0], dateTime: null },
      end: { date: event.end.split('T')[0], dateTime: null },
    }
  }
  return {
    start: { dateTime: event.start, date: null },
    end: { dateTime: event.end, date: null },
  }
}

export async function createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const cal = await getClient()
  const calendarId = event.calendarId || 'primary'
  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      ...eventTimes(event),
      colorId: event.colorId,
      extendedProperties: event.extendedProperties,
    },
  })
  return mapEvent(res.data, calendarId)
}

// patch, not update: update replaces the whole resource and would drop
// attendees, recurrence and reminders that this app does not model.
export async function updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const cal = await getClient()
  const calendarId = event.calendarId || 'primary'
  const res = await cal.events.patch({
    calendarId,
    eventId: event.id,
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      ...eventTimes(event),
      colorId: event.colorId,
    },
  })
  return mapEvent(res.data, calendarId)
}

export async function deleteEvent(id: string, calendarId: string): Promise<void> {
  const cal = await getClient()
  await cal.events.delete({ calendarId, eventId: id })
}
