import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { minutesFromMidnight, PX_PER_MINUTE } from '@renderer/lib/dateUtils'

const TIME_COL_WIDTH = 56

export function TimeIndicator() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const top = minutesFromMidnight(now) * PX_PER_MINUTE

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: 0,
        right: 0,
        height: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Time label in the axis column */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: TIME_COL_WIDTH,
          display: 'flex',
          justifyContent: 'flex-end',
          paddingRight: 6,
          transform: 'translateY(-50%)',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--color-time-indicator)',
          fontVariantNumeric: 'tabular-nums',
          userSelect: 'none',
        }}
      >
        {format(now, 'h:mm')}
      </div>

      {/* Line from the right edge of the axis to the end */}
      <div
        style={{
          position: 'absolute',
          left: TIME_COL_WIDTH,
          right: 0,
          top: 0,
          height: 2,
          backgroundColor: 'var(--color-time-indicator)',
        }}
      >
        {/* Dot at the start of the line */}
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: -4,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'var(--color-time-indicator)',
          }}
        />
      </div>
    </div>
  )
}
