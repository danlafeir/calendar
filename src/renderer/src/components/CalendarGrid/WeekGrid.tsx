import { useRef, useEffect } from 'react'
import { format, isToday, isSameDay, parseISO } from 'date-fns'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useUIStore } from '@renderer/store/useUIStore'
import {
  getWeekDays,
  minutesFromMidnight,
  totalGridHeight,
  PX_PER_MINUTE,
} from '@renderer/lib/dateUtils'
import { useTouchGestures } from '@renderer/hooks/useTouchGestures'
import { EventBlock } from './EventBlock'
import { TimeIndicator } from './TimeIndicator'
import type { CalendarEvent } from '@renderer/types'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const TIME_COL_WIDTH = 56

function layoutEvents(events: CalendarEvent[]): Map<string, { colIdx: number; colCount: number }> {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  const columns: CalendarEvent[][] = []
  const layout = new Map<string, { colIdx: number; colCount: number }>()

  for (const event of sorted) {
    const eStart = new Date(event.start).getTime()
    let placed = false
    for (let col = 0; col < columns.length; col++) {
      const last = columns[col][columns[col].length - 1]
      if (new Date(last.end).getTime() <= eStart) {
        columns[col].push(event)
        layout.set(event.id, { colIdx: col, colCount: 1 })
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([event])
      layout.set(event.id, { colIdx: columns.length - 1, colCount: 1 })
    }
  }

  for (const event of sorted) {
    const eStart = new Date(event.start).getTime()
    const eEnd = new Date(event.end).getTime()
    let maxCol = layout.get(event.id)!.colIdx
    for (const other of sorted) {
      if (other.id === event.id) continue
      const oStart = new Date(other.start).getTime()
      const oEnd = new Date(other.end).getTime()
      if (oStart < eEnd && oEnd > eStart) {
        maxCol = Math.max(maxCol, layout.get(other.id)!.colIdx)
      }
    }
    layout.get(event.id)!.colCount = maxCol + 1
  }

  return layout
}

export function WeekGrid() {
  const { events, selectedDate } = useCalendarStore()
  const { openNewEvent, openEditEvent } = useUIStore()
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const days = getWeekDays(selectedDate)
  const gridHeight = totalGridHeight()

  useEffect(() => {
    if (scrollRef.current) {
      const nowMins = minutesFromMidnight(new Date())
      const target = nowMins * PX_PER_MINUTE - 300
      scrollRef.current.scrollTop = Math.max(0, target)
    }
  }, [])

  useTouchGestures(gridRef as React.RefObject<HTMLElement>)

  const allDayEvents = events.filter((e) => e.allDay && days.some((d) => isSameDay(parseISO(e.start), d)))

  return (
    <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ width: TIME_COL_WIDTH, flexShrink: 0 }} />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 4px 8px',
              borderLeft: '1px solid var(--color-border-subtle)',
              backgroundColor: isToday(day) ? 'var(--color-today-bg)' : 'transparent',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {format(day, 'EEE')}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                marginTop: 2,
                fontSize: 18,
                fontWeight: isToday(day) ? 700 : 400,
                color: isToday(day) ? '#fff' : 'var(--color-text)',
                backgroundColor: isToday(day) ? 'var(--color-primary)' : 'transparent',
              }}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      {allDayEvents.length > 0 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0, minHeight: 28 }}>
          <div style={{ width: TIME_COL_WIDTH, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>all day</span>
          </div>
          {days.map((day) => {
            const dayAllDay = allDayEvents.filter((e) => isSameDay(parseISO(e.start), day))
            return (
              <div key={day.toISOString()} style={{ flex: 1, padding: '2px', borderLeft: '1px solid var(--color-border-subtle)', minHeight: 28 }}>
                {dayAllDay.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => openEditEvent(e)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      backgroundColor: 'var(--color-primary-dim)', color: 'var(--color-primary)',
                      borderRadius: 3, padding: '1px 4px', fontSize: 11, marginBottom: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
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
                  userSelect: 'none',
                }}
              >
                {hour === 0 ? '' : format(new Date(2000, 0, 1, hour), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = events.filter(
              (e) => !e.allDay && isSameDay(parseISO(e.start), day),
            )
            const layout = layoutEvents(dayEvents)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                style={{
                  flex: 1,
                  position: 'relative',
                  borderLeft: isCurrentDay
                    ? '1px solid var(--color-today-border)'
                    : '1px solid var(--color-border-subtle)',
                  backgroundColor: isCurrentDay ? 'var(--color-today-bg)' : 'transparent',
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
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    style={{
                      position: 'absolute',
                      top: `${hour * 60 * PX_PER_MINUTE}px`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      backgroundColor: 'var(--color-border-subtle)',
                      pointerEvents: 'none',
                    }}
                  />
                ))}
                {/* Half-hour lines */}
                {HOURS.map((hour) => (
                  <div
                    key={`${hour}-half`}
                    style={{
                      position: 'absolute',
                      top: `${(hour * 60 + 30) * PX_PER_MINUTE}px`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      backgroundColor: 'var(--color-border-subtle)',
                      opacity: 0.4,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const info = layout.get(event.id) ?? { colIdx: 0, colCount: 1 }
                  return (
                    <EventBlock
                      key={event.id}
                      event={event}
                      columnIndex={info.colIdx}
                      columnCount={info.colCount}
                      onClick={(ev) => {
                        openEditEvent(ev)
                      }}
                    />
                  )
                })}

                {/* Current time indicator */}
                {isCurrentDay && <TimeIndicator />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
