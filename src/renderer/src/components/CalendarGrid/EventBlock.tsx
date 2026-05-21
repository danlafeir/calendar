import type { CalendarEvent } from '@renderer/types'
import { eventTop, eventHeight, formatEventTime } from '@renderer/lib/dateUtils'

const COLOR_MAP: Record<string, string> = {
  '1': '#a8c7fa',
  '2': '#81c995',
  '3': '#f28b82',
  '4': '#d4a8f7',
  '5': '#fbbc04',
  '6': '#78d9ec',
  '7': '#ff8bcb',
  '8': '#e8eaed',
  '9': '#aecbfa',
  '10': '#ccff90',
  '11': '#e6c9a8',
}
const DEFAULT_COLOR = '#58a6ff'

interface EventBlockProps {
  event: CalendarEvent
  columnIndex?: number
  columnCount?: number
  onClick: (event: CalendarEvent) => void
}

export function EventBlock({ event, columnIndex = 0, columnCount = 1, onClick }: EventBlockProps) {
  const top = eventTop(event.start)
  const height = eventHeight(event.start, event.end)
  const color = COLOR_MAP[event.colorId ?? ''] ?? DEFAULT_COLOR
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
