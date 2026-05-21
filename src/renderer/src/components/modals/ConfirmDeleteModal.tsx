import { useState } from 'react'
import { useUIStore } from '@renderer/store/useUIStore'
import { ipc } from '@renderer/lib/ipc'

export function ConfirmDeleteModal() {
  const { isDeleteConfirmOpen, deletingEventId, closeDeleteConfirm, closeEventModal } = useUIStore()
  const [deleting, setDeleting] = useState(false)

  if (!isDeleteConfirmOpen || !deletingEventId) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await ipc().deleteEvent({ id: deletingEventId })
      closeDeleteConfirm()
      closeEventModal()
    } catch (err) {
      console.error('Failed to delete event:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={closeDeleteConfirm}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          maxWidth: 400,
          width: '90%',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Delete event?</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28 }}>
          This will remove the event from Google Calendar.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={closeDeleteConfirm}
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              backgroundColor: '#da3633',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 600,
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
