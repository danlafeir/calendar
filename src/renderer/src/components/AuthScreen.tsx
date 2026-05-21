import { useState } from 'react'
import { ipc } from '@renderer/lib/ipc'

interface AuthScreenProps {
  onAuthenticated: () => void
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setLoading(true)
    setError('')
    try {
      const { success } = await ipc().startOAuth()
      if (success) {
        onAuthenticated()
      } else {
        setError('Authentication was cancelled or failed. Please try again.')
      }
    } catch (err) {
      setError('Failed to start authentication. Check that credentials are configured.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        padding: 40,
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 8 }}>📅</div>
      <h1 style={{ fontSize: 28, fontWeight: 600, textAlign: 'center' }}>Pi Calendar</h1>
      <p style={{ fontSize: 15, color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
        Connect your Google Calendar to get started. Make sure{' '}
        <code style={{ fontSize: 13, backgroundColor: 'var(--color-surface-elevated)', padding: '1px 5px', borderRadius: 3 }}>
          .env
        </code>{' '}
        is configured with your API credentials.
      </p>
      {error && (
        <div style={{ color: '#f85149', fontSize: 13, textAlign: 'center', maxWidth: 360 }}>
          {error}
        </div>
      )}
      <button
        onClick={handleConnect}
        disabled={loading}
        style={{
          marginTop: 8,
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          padding: '16px 40px',
          fontSize: 16,
          fontWeight: 600,
          opacity: loading ? 0.7 : 1,
          minWidth: 240,
        }}
      >
        {loading ? 'Opening browser…' : 'Connect Google Calendar'}
      </button>
    </div>
  )
}
