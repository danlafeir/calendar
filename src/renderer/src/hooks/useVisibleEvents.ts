import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import type { CalendarEvent } from '@renderer/types'

export function useVisibleEvents(): CalendarEvent[] {
  const allEvents = useCalendarStore((s) => s.events)
  const selectedCalendarIds = useSettingsStore((s) => s.selectedCalendarIds)
  const focusedCalendarId = useSettingsStore((s) => s.focusedCalendarId)

  return allEvents.filter(
    (e) =>
      !e.declined &&
      (selectedCalendarIds === null || selectedCalendarIds.has(e.calendarId)) &&
      (focusedCalendarId === null || e.calendarId === focusedCalendarId),
  )
}
