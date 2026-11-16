import { useEffect } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useWeatherStore } from '@renderer/store/useWeatherStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { startOfMonth, subMonths, addMonths, endOfMonth } from 'date-fns'
import { viewRange } from '@renderer/lib/viewRange'

export function useCalendarSync(authenticated: boolean): void {
  const activeView = useCalendarStore((s) => s.activeView)
  const setWeather = useWeatherStore((s) => s.setWeather)
  const setStale = useWeatherStore((s) => s.setStale)
  const setCalendars = useSettingsStore((s) => s.setCalendars)
  const setSelectedCalendarIds = useSettingsStore((s) => s.setSelectedCalendarIds)

  useEffect(() => {
    const unsubCalendar = ipc().onCalendarSynced(applySync)
    const unsubWeather = ipc().onWeatherUpdated(setWeather)

    if (authenticated) {
      const now = new Date()
      const timeMin = startOfMonth(subMonths(now, 1)).toISOString()
      const timeMax = endOfMonth(addMonths(now, 2)).toISOString()

      ipc()
        .getEvents({ timeMin, timeMax })
        .then((events) => applySync({ events, failedCalendarIds: [], syncedAt: Date.now() }))
        .catch(() => applySync({ events: null, failedCalendarIds: [], syncedAt: Date.now() }))
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
  }, [authenticated, applySync, setWeather, setStale, setCalendars, setSelectedCalendarIds])
}

// Tell main which range is on screen so navigating far from today still has
// events; debounced so rapid swiping does not trigger a sync per step.
export function useVisibleRangeSync(authenticated: boolean): void {
  const selectedDate = useCalendarStore((s) => s.selectedDate)
  const activeView = useCalendarStore((s) => s.activeView)

  useEffect(() => {
    if (!authenticated) return
    const timer = setTimeout(() => {
      ipc().setVisibleRange(viewRange(activeView, selectedDate)).catch(console.error)
    }, 400)
    return () => clearTimeout(timer)
  }, [authenticated, activeView, selectedDate])
}
