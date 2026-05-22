import { google, calendar_v3 } from 'googleapis'
import { getAuthenticatedClient } from './auth'
import type { CalendarEvent, CalendarInfo } from '../types/ipc'
import { getSelectedCalendarIds } from './store'

function mapEvent(e: calendar_v3.Schema$Event, calendarId: string): CalendarEvent {
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
    extendedProperties: e.extendedProperties
      ? { private: (e.extendedProperties.private as Record<string, string>) ?? undefined }
      : undefined,
  }
}

export async function getCalendars(): Promise<CalendarInfo[]> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })
  const res = await cal.calendarList.list({ minAccessRole: 'reader' })
  return (res.data.items ?? []).map((c) => ({
    id: c.id ?? '',
    name: c.summary ?? c.id ?? '',
    color: c.backgroundColor ?? '#4285f4',
    primary: c.primary ?? false,
  }))
}

export async function getEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })

  // Fetch from all calendars that the user has selected (null = all)
  let allCalendars: CalendarInfo[]
  try {
    allCalendars = await getCalendars()
  } catch {
    allCalendars = [{ id: 'primary', name: 'Primary', color: '#4285f4', primary: true }]
  }

  const selectedIds = getSelectedCalendarIds()
  const calendarsToFetch = selectedIds
    ? allCalendars.filter((c) => selectedIds.includes(c.id))
    : allCalendars

  const results = await Promise.allSettled(
    calendarsToFetch.map((calendar) =>
      cal.events
        .list({
          calendarId: calendar.id,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 500,
        })
        .then((res) => (res.data.items ?? []).map((e) => mapEvent(e, calendar.id))),
    ),
  )

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}

export async function createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })
  const res = await cal.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay ? { date: event.start.split('T')[0] } : { dateTime: event.start },
      end: event.allDay ? { date: event.end.split('T')[0] } : { dateTime: event.end },
      colorId: event.colorId,
      extendedProperties: event.extendedProperties,
    },
  })
  return mapEvent(res.data, 'primary')
}

export async function updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })
  const calendarId = event.calendarId || 'primary'
  const res = await cal.events.update({
    calendarId,
    eventId: event.id,
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay ? { date: event.start.split('T')[0] } : { dateTime: event.start },
      end: event.allDay ? { date: event.end.split('T')[0] } : { dateTime: event.end },
      colorId: event.colorId,
      extendedProperties: event.extendedProperties,
    },
  })
  return mapEvent(res.data, calendarId)
}

export async function deleteEvent(id: string): Promise<void> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })
  await cal.events.delete({ calendarId: 'primary', eventId: id })
}
