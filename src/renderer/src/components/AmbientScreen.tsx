import { useEffect, useState } from 'react'
import { differenceInMinutes, format, parseISO } from 'date-fns'
import { ipc } from '@renderer/lib/ipc'
import { burnInOffset } from '@renderer/lib/burnIn'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useWeatherStore } from '@renderer/store/useWeatherStore'
import { conditionEmoji } from '@renderer/components/widgets/WeatherWidget'
import { formatCountdown, getNextEvent } from '@renderer/components/widgets/NextEventWidget'

const PHOTO_ROTATE_MS = 60_000

export function AmbientScreen({ onWake }: { onWake: () => void }) {
  const events = useCalendarStore((s) => s.events)
  const weather = useWeatherStore((s) => s.weather)
  const [now, setNow] = useState(() => new Date())
  const [photo, setPhoto] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = () =>
      ipc()
        .getNextPhoto()
        .then((p) => {
          if (!cancelled) setPhoto(p)
        })
        .catch(() => {})
    load()
    const timer = setInterval(load, PHOTO_ROTATE_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const next = getNextEvent(events)
  const offset = burnInOffset(now.getHours() * 60 + now.getMinutes())

  return (
    <div
      onClick={onWake}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        backgroundColor: '#000',
        backgroundImage: photo ? `url(${photo})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: photo ? 'flex-start' : 'center',
        cursor: 'pointer',
      }}
    >
      {photo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0) 55%)',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          padding: photo ? '0 48px 40px' : 0,
          alignSelf: photo ? 'flex-end' : 'center',
          textAlign: photo ? 'left' : 'center',
          color: '#e6edf3',
        }}
      >
        <div style={{ fontSize: '18vh', fontWeight: 200, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {format(now, 'h:mm')}
          <span style={{ fontSize: '5vh', marginLeft: 12, color: 'var(--color-text-muted)' }}>
            {format(now, 'a')}
          </span>
        </div>
        <div style={{ fontSize: '4vh', marginTop: 8, color: 'var(--color-text-muted)' }}>
          {format(now, 'EEEE, MMMM d')}
          {weather && (
            <span style={{ marginLeft: 24 }}>
              {conditionEmoji(weather.conditionCode)} {weather.temp}°
            </span>
          )}
        </div>
        {next && (
          <div style={{ fontSize: '3.4vh', marginTop: 20 }}>
            <span style={{ color: 'var(--color-primary)' }}>
              {format(parseISO(next.start), 'h:mm a')}
            </span>{' '}
            {next.title}
            <span style={{ marginLeft: 12, color: 'var(--color-text-muted)' }}>
              in {formatCountdown(differenceInMinutes(parseISO(next.start), now))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
