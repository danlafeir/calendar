import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import type { CalendarEvent } from '@renderer/types'

export function useVisibleEvents(): CalendarEvent[] {
  const allEvents = useCalendarStore((s) => s.events)
  const events = allEvents.filter((e) => !e.declined)
  const selectedCalendarIds = useSettingsStore((s) => s.selectedCalendarIds)

  if (selectedCalendarIds === null) return events
  return events.filter((e) => selectedCalendarIds.has(e.calendarId))
}
