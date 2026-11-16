import type { CalendarEvent } from '@renderer/types'
import { eventTop, eventHeight, formatEventTime } from '@renderer/lib/dateUtils'
import { eventColor } from '@renderer/lib/eventColor'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { clipToDay } from '@renderer/lib/eventSpan'

interface EventBlockProps {
  event: CalendarEvent
  columnIndex?: number
  columnCount?: number
  day?: Date
  onClick: (event: CalendarEvent) => void
}

export function EventBlock({ event, columnIndex = 0, columnCount = 1, day, onClick }: EventBlockProps) {
  const calendars = useSettingsStore((s) => s.calendars)
  const clipped = day ? clipToDay(event, day) : null
  const startIso = clipped ? clipped.start.toISOString() : event.start
  const endIso = clipped ? clipped.end.toISOString() : event.end
  const top = eventTop(startIso)
  const height = eventHeight(startIso, endIso)
  const color = eventColor(event, calendars)
  const colWidth = 100 / columnCount
  const left = colWidth * columnIndex

  return (
    <button
      style={{
        position: 'absolute',
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${left}% + 2px)`,
        width: `calc(${colWidth}% - 4px)`,
        backgroundColor: color,
        color: '#fff',
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '11px',
        lineHeight: '1.3',
        overflow: 'hidden',
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        opacity: 0.92,
        zIndex: 1,
        minHeight: '20px',
      }}
      onClick={(e) => { e.stopPropagation(); onClick(event) }}
    >
      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {event.title}
      </div>
      {height > 28 && (
        <div style={{ opacity: 0.85, fontSize: '10px' }}>
          {formatEventTime(event.start)}
        </div>
      )}
    </button>
  )
}
