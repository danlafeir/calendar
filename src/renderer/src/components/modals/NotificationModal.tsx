import { useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { useUIStore } from '@renderer/store/useUIStore'
import { playChime } from '@renderer/lib/soundPlayer'

export function NotificationModal() {
  const { notificationQueue, dismissNotification } = useUIStore()
  const payload = notificationQueue[0]

  useEffect(() => {
    if (payload?.soundEnabled) {
      playChime()
    }
  }, [payload?.event?.id, payload?.soundEnabled])

  if (!payload) return null

  const { event, minutesBefore } = payload

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 48px',
          maxWidth: 480,
          width: '90%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {minutesBefore === 0 ? 'Starting now' : `In ${minutesBefore} minute${minutesBefore === 1 ? '' : 's'}`}
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12, lineHeight: 1.3 }}>
          {event.title}
        </div>
        {!event.allDay && (
          <div style={{ fontSize: 15, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            {format(parseISO(event.start), 'h:mm a')} – {format(parseISO(event.end), 'h:mm a')}
          </div>
        )}
        {event.location && (
          <div style={{ fontSize: 13, color: 'var(--color-text-faint)', marginBottom: 24 }}>
            📍 {event.location}
          </div>
        )}
        <button
          onClick={dismissNotification}
          style={{
            marginTop: 24,
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '14px 48px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            minWidth: 160,
          }}
        >
          Dismiss
        </button>
        {notificationQueue.length > 1 && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-faint)' }}>
            +{notificationQueue.length - 1} more reminder{notificationQueue.length > 2 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
