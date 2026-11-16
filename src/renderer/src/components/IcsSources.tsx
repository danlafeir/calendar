import { useEffect, useState } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import type { IcsSourceInfo } from '@renderer/types'

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 10,
}

export function IcsSources() {
  const setCalendars = useSettingsStore((s) => s.setCalendars)
  const [sources, setSources] = useState<IcsSourceInfo[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ipc().listIcsSources().then(setSources).catch(() => {})
  }, [])

  const refreshCalendars = () => ipc().getCalendars().then(setCalendars).catch(() => {})

  const handleAdd = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await ipc().addIcsSource({ name, url })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSources(result.sources)
      setName('')
      setUrl('')
      setAdding(false)
      await refreshCalendars()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (id: string) => {
    setSources(await ipc().removeIcsSource(id))
    await refreshCalendars()
  }

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
      <div style={labelStyle}>Subscribed calendars (ICS)</div>

      {sources.map((s) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s.color, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.name}
          </span>
          <button
            onClick={() => handleRemove(s.id)}
            style={{ color: '#da3633', fontSize: 13, padding: '10px 8px' }}
          >
            Remove
          </button>
        </div>
      ))}

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          style={{ fontSize: 13, color: 'var(--color-primary)', padding: '10px 0', minHeight: 44 }}
        >
          + Add calendar by URL
        </button>
      )}

      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="text" placeholder="Name (e.g. School)" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            type="text"
            placeholder="https:// or webcal:// link to an .ics feed"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
            Read-only. Private feed links are stored on this device only.
          </div>
          {error && <div style={{ color: '#f85149', fontSize: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAdd}
              disabled={busy}
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: 13, fontWeight: 600, opacity: busy ? 0.6 : 1 }}
            >
              {busy ? 'Checking…' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setError('') }}
              style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
