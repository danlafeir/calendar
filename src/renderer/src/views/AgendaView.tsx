import { addDays, format, isToday, parseISO, startOfDay } from 'date-fns'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useUIStore } from '@renderer/store/useUIStore'
import { useVisibleEvents } from '@renderer/hooks/useVisibleEvents'
import { useTouchGestures } from '@renderer/hooks/useTouchGestures'
import { AGENDA_DAYS } from '@renderer/lib/viewRange'
import { compareForDay, occursOnDay } from '@renderer/lib/eventSpan'
import { formatEventTime } from '@renderer/lib/dateUtils'
import { eventKey } from '@renderer/types'
import { useRef } from 'react'

export function AgendaView() {
  const selectedDate = useCalendarStore((s) => s.selectedDate)
  const events = useVisibleEvents()
  const { openEditEvent, openNewEvent } = useUIStore()
  const ref = useRef<HTMLDivElement>(null)
  useTouchGestures(ref as React.RefObject<HTMLElement>)

  const days = Array.from({ length: AGENDA_DAYS }, (_, i) => addDays(startOfDay(selectedDate), i))

  return (
    <div ref={ref} style={{ height: '100%', overflowY: 'auto', padding: '8px 24px 24px' }}>
      {days.map((day) => {
        const dayEvents = events.filter((e) => occursOnDay(e, day)).sort(compareForDay)
        const today = isToday(day)
        return (
          <div
            key={day.toISOString()}
            style={{ display: 'flex', gap: 20, padding: '14px 0', borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            <button
              onClick={() => openNewEvent(day)}
              style={{ width: 90, flexShrink: 0, textAlign: 'left' }}
            >
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: today ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {format(day, 'EEE')}
              </div>
              <div style={{ fontSize: 30, fontWeight: today ? 700 : 500, color: today ? 'var(--color-primary)' : 'var(--color-text)' }}>
                {format(day, 'd')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{format(day, 'MMM')}</div>
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              {dayEvents.length === 0 && (
                <div style={{ color: 'var(--color-text-faint)', fontSize: 14, padding: '8px 0' }}>No events</div>
              )}
              {dayEvents.map((e) => (
                <button
                  key={eventKey(e)}
                  onClick={() => openEditEvent(e)}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'baseline',
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    minHeight: 44,
                  }}
                >
                  <span style={{ width: 90, flexShrink: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
                    {e.allDay ? 'All day' : !isSameStart(e.start, day) ? 'Continues' : formatEventTime(e.start)}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.title}
                  </span>
                  {e.location && (
                    <span style={{ fontSize: 13, color: 'var(--color-text-faint)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.location}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function isSameStart(startIso: string, day: Date): boolean {
  return format(parseISO(startIso), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
}
