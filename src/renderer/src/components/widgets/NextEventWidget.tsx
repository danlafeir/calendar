import { useState, useEffect } from 'react'
import { parseISO, isAfter, isBefore, endOfDay, differenceInMinutes, format } from 'date-fns'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import type { CalendarEvent } from '@renderer/types'

function getNextEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = new Date()
  const eod = endOfDay(now)
  return (
    events
      .filter((e) => {
        if (e.allDay) return false
        const start = parseISO(e.start)
        return isAfter(start, now) && isBefore(start, eod)
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ?? null
  )
}

function formatCountdown(minutesUntil: number): string {
  if (minutesUntil < 1) return 'now'
  if (minutesUntil < 60) return `in ${minutesUntil}m`
  const hours = Math.floor(minutesUntil / 60)
  const mins = minutesUntil % 60
  return mins === 0 ? `in ${hours}h` : `in ${hours}h ${mins}m`
}

export function NextEventWidget() {
  const events = useCalendarStore((s) => s.events)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const next = getNextEvent(events)

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Next up today
      </div>
      {!next ? (
        <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>No more events today</div>
      ) : (
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {next.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {format(parseISO(next.start), 'h:mm a')}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-dim)',
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              {formatCountdown(differenceInMinutes(parseISO(next.start), now))}
            </span>
          </div>
          {next.location && (
            <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 3 }}>
              📍 {next.location}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
