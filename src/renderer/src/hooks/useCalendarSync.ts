import { useEffect } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useWeatherStore } from '@renderer/store/useWeatherStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { startOfMonth, subMonths, addMonths, endOfMonth } from 'date-fns'

export function useCalendarSync(authenticated: boolean): void {
  const setEvents = useCalendarStore((s) => s.setEvents)
  const setWeather = useWeatherStore((s) => s.setWeather)
  const setStale = useWeatherStore((s) => s.setStale)
  const setCalendars = useSettingsStore((s) => s.setCalendars)
  const setSelectedCalendarIds = useSettingsStore((s) => s.setSelectedCalendarIds)

  useEffect(() => {
    const unsubCalendar = ipc().onCalendarSynced(setEvents)
    const unsubWeather = ipc().onWeatherUpdated(setWeather)

    if (authenticated) {
      const now = new Date()
      const timeMin = startOfMonth(subMonths(now, 1)).toISOString()
      const timeMax = endOfMonth(addMonths(now, 2)).toISOString()

      ipc().getEvents({ timeMin, timeMax }).then(setEvents).catch(console.error)
      ipc()
        .getWeather()
        .then((data) => {
          if (data) setWeather(data)
          else setStale(true)
        })
        .catch(() => setStale(true))
      ipc().getCalendars().then(setCalendars).catch(() => {})
      ipc().getSelectedCalendars().then(setSelectedCalendarIds).catch(() => {})
    }

    return () => {
      unsubCalendar()
      unsubWeather()
    }
  }, [authenticated, setEvents, setWeather, setStale, setCalendars, setSelectedCalendarIds])
}
