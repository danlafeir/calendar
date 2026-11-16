import { useEffect } from 'react'
import { useSettingsStore } from '@renderer/store/useSettingsStore'

export function PersonChips() {
  const calendars = useSettingsStore((s) => s.calendars)
  const selectedIds = useSettingsStore((s) => s.selectedCalendarIds)
  const focused = useSettingsStore((s) => s.focusedCalendarId)
  const setFocused = useSettingsStore((s) => s.setFocusedCalendarId)

  const shown = calendars.filter((c) => selectedIds === null || selectedIds.has(c.id))
  const focusStillShown = focused === null || shown.some((c) => c.id === focused)
  useEffect(() => {
    if (!focusStillShown) setFocused(null)
  }, [focusStillShown, setFocused])

  if (shown.length < 2) return null

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px 16px',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
        flexShrink: 0,
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {shown.map((c) => {
        const active = focused === c.id
        const dimmed = focused !== null && !active
        return (
          <button
            key={c.id}
            onClick={() => setFocused(active ? null : c.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              minHeight: 40,
              borderRadius: 20,
              fontSize: 13,
              whiteSpace: 'nowrap',
              border: `1px solid ${c.color}`,
              backgroundColor: active ? c.color : 'transparent',
              color: active ? '#0d1117' : 'var(--color-text)',
              opacity: dimmed ? 0.45 : 1,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: active ? '#0d1117' : c.color }} />
            {c.name}
          </button>
        )
      })}
    </div>
  )
}
