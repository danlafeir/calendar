import { eventKey } from '@renderer/types'
import { useRef } from 'react'
import { format, isToday, isSameMonth } from 'date-fns'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useUIStore } from '@renderer/store/useUIStore'
import { useVisibleEvents } from '@renderer/hooks/useVisibleEvents'
import { getMonthDays, formatEventTime } from '@renderer/lib/dateUtils'
import { occursOnDay, compareForDay } from '@renderer/lib/eventSpan'
import { useTouchGestures } from '@renderer/hooks/useTouchGestures'

const MAX_PER_CELL = 3
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthGrid() {
  const { selectedDate, setSelectedDate, setActiveView } = useCalendarStore()
  const events = useVisibleEvents()
  const { openNewEvent, openEditEvent } = useUIStore()
  const gridRef = useRef<HTMLDivElement>(null)

  const days = getMonthDays(selectedDate)
  useTouchGestures(gridRef as React.RefObject<HTMLElement>)

  return (
    <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', overflow: 'hidden' }}>
        {days.map((day) => {
          const allDayEvents = events.filter((e) => occursOnDay(e, day)).sort(compareForDay)
          const dayEvents = allDayEvents.slice(0, MAX_PER_CELL)
          const hiddenCount = allDayEvents.length - dayEvents.length
          const isCurrentMonth = isSameMonth(day, selectedDate)
          const isCurrent = isToday(day)

          return (
            <div
              key={day.toISOString()}
              style={{
                borderRight: '1px solid var(--color-border-subtle)',
                borderBottom: '1px solid var(--color-border-subtle)',
                padding: '6px 4px',
                backgroundColor: isCurrent ? 'var(--color-today-bg)' : 'transparent',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onClick={() => openNewEvent(day)}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    fontSize: 13,
                    fontWeight: isCurrent ? 700 : 400,
                    color: !isCurrentMonth
                      ? 'var(--color-text-faint)'
                      : isCurrent
                        ? '#fff'
                        : 'var(--color-text)',
                    backgroundColor: isCurrent ? 'var(--color-primary)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDate(day)
                    setActiveView('day')
                  }}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {dayEvents.map((event) => (
                <button
                  key={eventKey(event)}
                  onClick={(e) => { e.stopPropagation(); openEditEvent(event) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    backgroundColor: 'var(--color-primary-dim)',
                    color: 'var(--color-primary)',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 11,
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {!event.allDay && (
                    <span style={{ opacity: 0.75, marginRight: 3 }}>
                      {formatEventTime(event.start)}
                    </span>
                  )}
                  {event.title}
                </button>
              ))}
              {hiddenCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setActiveView('day') }}
                  style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '0 5px' }}
                >
                  +{hiddenCount} more
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
