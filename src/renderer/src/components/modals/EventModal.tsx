import { useState, useEffect } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { lastDayOfAllDay } from '@renderer/lib/eventSpan'
import { useUIStore } from '@renderer/store/useUIStore'
import { ipc } from '@renderer/lib/ipc'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { canWrite, eventKey } from '@renderer/types'
import type { NotifyConfig } from '@renderer/types'

const NOTIFY_PRESETS = [5, 10, 15, 30, 60]

function toLocalDateString(iso: string) {
  return format(parseISO(iso), 'yyyy-MM-dd')
}
function toLocalTimeString(iso: string) {
  return format(parseISO(iso), 'HH:mm')
}
function buildIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

export function EventModal() {
  const { isEventModalOpen, editingEvent, newEventDate, closeEventModal, openDeleteConfirm } =
    useUIStore()

  const isEditing = !!editingEvent
  const initDate = editingEvent
    ? toLocalDateString(editingEvent.start)
    : newEventDate
      ? format(newEventDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')

  const initStartTime = editingEvent
    ? toLocalTimeString(editingEvent.start)
    : newEventDate
      ? format(newEventDate, 'HH:mm')
      : '09:00'

  const initEndTime = editingEvent
    ? toLocalTimeString(editingEvent.end)
    : newEventDate
      ? format(new Date(newEventDate.getTime() + 60 * 60 * 1000), 'HH:mm')
      : '10:00'

  const [title, setTitle] = useState(editingEvent?.title ?? '')
  const [description, setDescription] = useState(editingEvent?.description ?? '')
  const [location, setLocation] = useState(editingEvent?.location ?? '')
  const [date, setDate] = useState(initDate)
  const initEndDate = editingEvent
    ? editingEvent.allDay
      ? lastDayOfAllDay(editingEvent)
      : toLocalDateString(editingEvent.end)
    : initDate
  const [endDate, setEndDate] = useState(initEndDate)
  const [startTime, setStartTime] = useState(initStartTime)
  const [endTime, setEndTime] = useState(initEndTime)
  const [allDay, setAllDay] = useState(editingEvent?.allDay ?? false)
  const [notifyConfig, setNotifyConfig] = useState<NotifyConfig>({
    minutesBefore: [10],
    soundEnabled: true,
  })
  const calendars = useSettingsStore((s) => s.calendars)
  const writable = calendars.filter((c) => canWrite(c.accessRole))
  const defaultCalendarId = (writable.find((c) => c.primary) ?? writable[0])?.id ?? 'primary'
  const [calendarId, setCalendarId] = useState(defaultCalendarId)
  const readOnly = !!editingEvent?.readOnly
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEventModalOpen) return
    setTitle(editingEvent?.title ?? '')
    setDescription(editingEvent?.description ?? '')
    setLocation(editingEvent?.location ?? '')
    setDate(initDate)
    setEndDate(initEndDate)
    setStartTime(initStartTime)
    setEndTime(initEndTime)
    setAllDay(editingEvent?.allDay ?? false)
    setError('')
    setCalendarId(defaultCalendarId)

    if (editingEvent) {
      ipc()
        .getNotifyConfig({ eventKey: eventKey(editingEvent) })
        .then(setNotifyConfig)
        .catch(console.error)
    } else {
      setNotifyConfig({ minutesBefore: [10], soundEnabled: true })
    }
  }, [isEventModalOpen, editingEvent?.id])

  if (!isEventModalOpen) return null

  const toggleMinute = (min: number) => {
    setNotifyConfig((c) => ({
      ...c,
      minutesBefore: c.minutesBefore.includes(min)
        ? c.minutesBefore.filter((m) => m !== min)
        : [...c.minutesBefore, min].sort((a, b) => a - b),
    }))
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      if (endDate < date) { setError('End date is before start date'); setSaving(false); return }
      // Google's all-day end is exclusive, so a one-day event ends the next day
      const start = allDay ? date : buildIso(date, startTime)
      const end = allDay
        ? format(addDays(parseISO(endDate), 1), 'yyyy-MM-dd')
        : buildIso(endDate, endTime)
      if (!allDay && end <= start) { setError('End must be after start'); setSaving(false); return }

      if (isEditing && editingEvent && readOnly) {
        await ipc().setNotifyConfig({ eventKey: eventKey(editingEvent), config: notifyConfig })
      } else if (isEditing && editingEvent) {
        const updated = await ipc().updateEvent({ ...editingEvent, title: title.trim(), description, location, start, end, allDay })
        await ipc().setNotifyConfig({ eventKey: eventKey(updated), config: notifyConfig })
      } else {
        const created = await ipc().createEvent({ title: title.trim(), description, location, start, end, allDay, calendarId })
        await ipc().setNotifyConfig({ eventKey: eventKey(created), config: notifyConfig })
      }
      closeEventModal()
    } catch (err) {
      setError('Failed to save event. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={closeEventModal}
    >
      <div
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{isEditing ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={closeEventModal} style={{ fontSize: 20, color: 'var(--color-text-muted)', padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ fontSize: 16, padding: '12px 14px' }}
            autoFocus
          />

          {readOnly && (
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              This calendar is read-only. You can still change alerts for this event.
            </div>
          )}

          {!isEditing && writable.length > 1 && (
            <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
              {writable.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="allday" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            <label htmlFor="allday" style={{ fontSize: 14, cursor: 'pointer' }}>All day</label>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Date</div>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  if (endDate < e.target.value) setEndDate(e.target.value)
                }}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>End date</div>
              <input type="date" value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%' }} />
            </div>
            {!allDay && (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Start</div>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>End</div>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: '100%' }} />
                </div>
              </>
            )}
          </div>

          <input
            type="text"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />

          {/* Notifications */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Notifications</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {NOTIFY_PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => toggleMinute(min)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid',
                    borderColor: notifyConfig.minutesBefore.includes(min) ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: notifyConfig.minutesBefore.includes(min) ? 'var(--color-primary-dim)' : 'transparent',
                    color: notifyConfig.minutesBefore.includes(min) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {min}m
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="sound"
                checked={notifyConfig.soundEnabled}
                onChange={(e) => setNotifyConfig((c) => ({ ...c, soundEnabled: e.target.checked }))}
              />
              <label htmlFor="sound" style={{ fontSize: 13, cursor: 'pointer' }}>Play sound</label>
            </div>
          </div>

          {error && <div style={{ color: '#f85149', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            {isEditing && !readOnly && (
              <button
                onClick={() => openDeleteConfirm(editingEvent!)}
                style={{ color: '#da3633', fontSize: 14, padding: '12px 16px', marginRight: 'auto' }}
              >
                Delete
              </button>
            )}
            <button
              onClick={closeEventModal}
              style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-md)', padding: '12px 28px', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : readOnly ? 'Save alerts' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
