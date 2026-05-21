import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: '16px 12px 12px', borderBottom: '1px solid var(--color-border)' }}>
      <div
        style={{
          fontSize: 52,
          fontWeight: 300,
          letterSpacing: '-0.02em',
          color: 'var(--color-text)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {format(now, 'h:mm')}
        <span style={{ fontSize: 28, color: 'var(--color-text-muted)', marginLeft: 4 }}>
          {format(now, 'a')}
        </span>
      </div>
      <div style={{ marginTop: 6, color: 'var(--color-text-muted)', fontSize: 13 }}>
        {format(now, 'EEEE, MMMM d')}
      </div>
      <div style={{ marginTop: 2, color: 'var(--color-text-faint)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
        {format(now, 'ss')}s
      </div>
    </div>
  )
}
