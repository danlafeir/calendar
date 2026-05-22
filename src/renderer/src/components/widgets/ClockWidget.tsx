import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
      <div style={{ fontSize: 20, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text)' }}>
        {format(now, 'h:mm')}
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 3 }}>
          {format(now, 'a')}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
        {format(now, 'EEE, MMM d')}
      </div>
    </div>
  )
}
