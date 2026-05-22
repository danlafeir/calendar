import { useEffect } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useSettingsStore } from '@renderer/store/useSettingsStore'

export function Drawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    calendars,
    selectedCalendarIds,
    setCalendars,
    setSelectedCalendarIds,
    toggleCalendar,
  } = useSettingsStore()

  useEffect(() => {
    if (!isDrawerOpen) return
    ipc()
      .getCalendars()
      .then(setCalendars)
      .catch(() => {})
    ipc()
      .getSelectedCalendars()
      .then(setSelectedCalendarIds)
      .catch(() => {})
  }, [isDrawerOpen, setCalendars, setSelectedCalendarIds])

  function handleToggle(id: string) {
    toggleCalendar(id)
    const { selectedCalendarIds: next } = useSettingsStore.getState()
    const toSave = next === null ? null : [...next]
    ipc().setSelectedCalendars(toSave).catch(() => {})
  }

  function handleSelectAll() {
    setSelectedCalendarIds(null)
    ipc().setSelectedCalendars(null).catch(() => {})
  }

  function isSelected(id: string): boolean {
    return selectedCalendarIds === null || selectedCalendarIds.has(id)
  }

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={closeDrawer}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 300,
          zIndex: 50,
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDrawerOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 'var(--navbar-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
            Settings
          </span>
          <button
            onClick={closeDrawer}
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            Calendars
          </div>

          {calendars.length === 0 && (
            <div style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>
              Loading calendars…
            </div>
          )}

          {calendars.length > 1 && (
            <button
              onClick={handleSelectAll}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                marginBottom: 4,
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: selectedCalendarIds === null ? 'var(--color-primary)' : 'var(--color-text-muted)',
                backgroundColor: selectedCalendarIds === null ? 'var(--color-primary-dim)' : 'transparent',
              }}
            >
              All calendars
            </button>
          )}

          {calendars.map((cal) => {
            const selected = isSelected(cal.id)
            return (
              <button
                key={cal.id}
                onClick={() => handleToggle(cal.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  marginBottom: 2,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  backgroundColor: selected ? 'var(--color-surface-elevated)' : 'transparent',
                  minHeight: 44,
                }}
              >
                {/* Color swatch / checkbox */}
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: selected ? cal.color : 'transparent',
                    border: `2px solid ${cal.color}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cal.name}
                </span>
                {cal.primary && (
                  <span style={{ fontSize: 10, color: 'var(--color-text-faint)', flexShrink: 0 }}>
                    primary
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
