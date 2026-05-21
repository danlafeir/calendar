import { useEffect } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useWeatherStore } from '@renderer/store/useWeatherStore'
import { startOfMonth, subMonths, addMonths, endOfMonth } from 'date-fns'

export function useCalendarSync(): void {
  const setEvents = useCalendarStore((s) => s.setEvents)
  const setWeather = useWeatherStore((s) => s.setWeather)
  const setStale = useWeatherStore((s) => s.setStale)

  useEffect(() => {
    const now = new Date()
    const timeMin = startOfMonth(subMonths(now, 1)).toISOString()
    const timeMax = endOfMonth(addMonths(now, 2)).toISOString()

    ipc()
      .getEvents({ timeMin, timeMax })
      .then(setEvents)
      .catch(console.error)

    ipc()
      .getWeather()
      .then((data) => {
        if (data) setWeather(data)
        else setStale(true)
      })
      .catch(() => setStale(true))

    const unsubCalendar = ipc().onCalendarSynced(setEvents)
    const unsubWeather = ipc().onWeatherUpdated(setWeather)

    return () => {
      unsubCalendar()
      unsubWeather()
    }
  }, [setEvents, setWeather, setStale])
}
