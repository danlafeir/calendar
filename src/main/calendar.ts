import { google, calendar_v3 } from 'googleapis'
import { getAuthenticatedClient } from './auth'
import type { CalendarEvent } from '../types/ipc'

function mapEvent(e: calendar_v3.Schema$Event): CalendarEvent {
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
    colorId: e.colorId ?? undefined,
    extendedProperties: e.extendedProperties
      ? { private: (e.extendedProperties.private as Record<string, string>) ?? undefined }
      : undefined,
  }
}

export async function getEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })
  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500,
  })
  return (res.data.items ?? []).map(mapEvent)
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
  return mapEvent(res.data)
}

export async function updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })
  const res = await cal.events.update({
    calendarId: 'primary',
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
  return mapEvent(res.data)
}

export async function deleteEvent(id: string): Promise<void> {
  const auth = await getAuthenticatedClient()
  const cal = google.calendar({ version: 'v3', auth })
  await cal.events.delete({ calendarId: 'primary', eventId: id })
}
