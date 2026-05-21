import { useEffect, useState } from 'react'
import { minutesFromMidnight, PX_PER_MINUTE } from '@renderer/lib/dateUtils'

export function TimeIndicator() {
  const [top, setTop] = useState(() => minutesFromMidnight(new Date()) * PX_PER_MINUTE)

  useEffect(() => {
    const interval = setInterval(() => {
      setTop(minutesFromMidnight(new Date()) * PX_PER_MINUTE)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: 'var(--color-time-indicator)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '-4px',
          top: '-4px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-time-indicator)',
        }}
      />
    </div>
  )
}
