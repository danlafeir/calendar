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
  if (minutesUntil < 60) return `${minutesUntil}m`
  const hours = Math.floor(minutesUntil / 60)
  const mins = minutesUntil % 60
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

export function NextEventWidget() {
  const events = useCalendarStore((s) => s.events)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const next = getNextEvent(events)

  if (!next) {
    return (
      <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>No more events today</div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginBottom: 1 }}>
          {format(parseISO(next.start), 'h:mm a')}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 180,
          }}
        >
          {next.title}
        </div>
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-primary)',
          backgroundColor: 'var(--color-primary-dim)',
          borderRadius: 4,
          padding: '3px 7px',
        }}
      >
        {formatCountdown(differenceInMinutes(parseISO(next.start), now))}
      </span>
    </div>
  )
}
