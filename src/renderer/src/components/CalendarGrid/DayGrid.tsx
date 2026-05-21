import { useRef, useEffect } from 'react'
import { format, isToday, isSameDay, parseISO } from 'date-fns'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useUIStore } from '@renderer/store/useUIStore'
import {
  minutesFromMidnight,
  totalGridHeight,
  PX_PER_MINUTE,
} from '@renderer/lib/dateUtils'
import { useTouchGestures } from '@renderer/hooks/useTouchGestures'
import { EventBlock } from './EventBlock'
import { TimeIndicator } from './TimeIndicator'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const TIME_COL_WIDTH = 56

export function DayGrid() {
  const { events, selectedDate } = useCalendarStore()
  const { openNewEvent, openEditEvent } = useUIStore()
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const day = selectedDate
  const gridHeight = totalGridHeight()
  const isCurrent = isToday(day)

  useEffect(() => {
    if (scrollRef.current) {
      const nowMins = minutesFromMidnight(new Date())
      scrollRef.current.scrollTop = Math.max(0, nowMins * PX_PER_MINUTE - 300)
    }
  }, [])

  useTouchGestures(gridRef as React.RefObject<HTMLElement>)

  const dayEvents = events.filter((e) => !e.allDay && isSameDay(parseISO(e.start), day))
  const allDayEvents = events.filter((e) => e.allDay && isSameDay(parseISO(e.start), day))

  return (
    <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0, padding: '10px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          <span style={{ color: 'var(--color-text-muted)', marginRight: 8 }}>{format(day, 'EEEE')}</span>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: isCurrent ? 'var(--color-primary)' : 'transparent',
              color: isCurrent ? '#fff' : 'var(--color-text)',
            }}
          >
            {format(day, 'd')}
          </span>
          <span style={{ color: 'var(--color-text-muted)', marginLeft: 4, fontSize: 16 }}>{format(day, 'MMMM yyyy')}</span>
        </div>
      </div>

      {allDayEvents.length > 0 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '4px 8px 4px 72px', gap: 4, flexShrink: 0 }}>
          {allDayEvents.map((e) => (
            <button
              key={e.id}
              onClick={() => openEditEvent(e)}
              style={{
                backgroundColor: 'var(--color-primary-dim)', color: 'var(--color-primary)',
                borderRadius: 3, padding: '2px 8px', fontSize: 12,
              }}
            >
              {e.title}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', height: `${gridHeight}px` }}>
          {/* Time axis */}
          <div style={{ width: TIME_COL_WIDTH, flexShrink: 0, position: 'relative' }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{
                  position: 'absolute',
                  top: `${hour * 60 * PX_PER_MINUTE}px`,
                  right: 8,
                  fontSize: 11,
                  color: 'var(--color-text-faint)',
                  transform: 'translateY(-50%)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}
              >
                {hour === 0 ? '' : format(new Date(2000, 0, 1, hour), 'h a')}
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              borderLeft: '1px solid var(--color-border-subtle)',
              backgroundColor: isCurrent ? 'var(--color-today-bg)' : 'transparent',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const scrollTop = scrollRef.current?.scrollTop ?? 0
              const relY = e.clientY - rect.top + scrollTop
              const totalMins = Math.floor(relY / PX_PER_MINUTE)
              const snapped = Math.round(totalMins / 30) * 30
              const clickDate = new Date(day)
              clickDate.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0)
              openNewEvent(clickDate)
            }}
          >
            {HOURS.map((hour) => (
              <div key={hour} style={{ position: 'absolute', top: `${hour * 60 * PX_PER_MINUTE}px`, left: 0, right: 0, height: 1, backgroundColor: 'var(--color-border-subtle)', pointerEvents: 'none' }} />
            ))}
            {HOURS.map((hour) => (
              <div key={`${hour}-h`} style={{ position: 'absolute', top: `${(hour * 60 + 30) * PX_PER_MINUTE}px`, left: 0, right: 0, height: 1, backgroundColor: 'var(--color-border-subtle)', opacity: 0.4, pointerEvents: 'none' }} />
            ))}

            {dayEvents.map((event) => (
              <EventBlock key={event.id} event={event} onClick={openEditEvent} />
            ))}
            {isCurrent && <TimeIndicator />}
          </div>
        </div>
      </div>
    </div>
  )
}
