import { useEffect, useState } from 'react'
import { useHomeStore } from '@renderer/store/useHomeStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { choresForDay, isChoreDone, newId, toggleChoreDone } from '@renderer/lib/home'
import type { Chore } from '@renderer/types'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const panel: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: 20,
  overflowY: 'auto',
  borderRight: '1px solid var(--color-border)',
}
const heading: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 12,
}
const primaryButton: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#fff',
  borderRadius: 'var(--radius-md)',
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
}

function Check({ done, onClick, color }: { done: boolean; onClick: () => void; color?: string }) {
  const c = color ?? 'var(--color-primary)'
  return (
    <button
      onClick={onClick}
      aria-pressed={done}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        flexShrink: 0,
        border: `2px solid ${c}`,
        backgroundColor: done ? c : 'transparent',
        color: '#0d1117',
        fontSize: 20,
        fontWeight: 700,
      }}
    >
      {done ? '✓' : ''}
    </button>
  )
}

function ChoresPanel({ manage }: { manage: boolean }) {
  const { data, update } = useHomeStore()
  const calendars = useSettingsStore((s) => s.calendars)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState<string>('')
  const [days, setDays] = useState<number[]>([])
  // re-evaluate every minute so a kiosk left on this screen rolls over at midnight
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])
  const todays = choresForDay(data.chores, today)
  const others = data.chores.filter((c) => !todays.includes(c))
  const colorOf = (c: Chore) => calendars.find((cal) => cal.id === c.assignee)?.color
  const remove = (id: string) => update((d) => ({ ...d, chores: d.chores.filter((x) => x.id !== id) }))

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    update((d) => ({
      ...d,
      chores: [...d.chores, { id: newId(), title: title.trim(), assignee: assignee || null, days, doneDates: [] }],
    }))
    setTitle('')
    setDays([])
  }

  const doneCount = todays.filter((c) => isChoreDone(c, today)).length

  return (
    <div style={panel}>
      <div style={heading}>Chores today {todays.length > 0 && `· ${doneCount}/${todays.length}`}</div>
      {todays.length === 0 && (
        <div style={{ color: 'var(--color-text-faint)', fontSize: 14, marginBottom: 12 }}>No chores today</div>
      )}
      {todays.map((c) => {
        const done = isChoreDone(c, today)
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 }}>
            <Check
              done={done}
              color={colorOf(c)}
              onClick={() =>
                update((d) => ({ ...d, chores: d.chores.map((x) => (x.id === c.id ? toggleChoreDone(x, today) : x)) }))
              }
            />
            <span
              style={{
                flex: 1,
                fontSize: 17,
                textDecoration: done ? 'line-through' : 'none',
                color: done ? 'var(--color-text-faint)' : 'var(--color-text)',
              }}
            >
              {c.title}
            </span>
            {c.assignee && (
              <span style={{ fontSize: 12, color: colorOf(c) ?? 'var(--color-text-muted)' }}>
                {calendars.find((cal) => cal.id === c.assignee)?.name}
              </span>
            )}
            {manage && (
              <button onClick={() => remove(c.id)} style={{ color: '#da3633', fontSize: 18, padding: 10 }}>
                ✕
              </button>
            )}
          </div>
        )
      })}

      {manage && others.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...heading, marginTop: 8 }}>Not scheduled today</div>
          {others.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', minHeight: 44 }}>
              <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>{c.title}</span>
              <button onClick={() => remove(c.id)} style={{ color: '#da3633', fontSize: 18, padding: 10 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {manage && (
        <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          <input type="text" placeholder="New chore" value={title} onChange={(e) => setTitle(e.target.value)} />
          {calendars.length > 0 && (
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Anyone</option>
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {DAY_LABELS.map((l, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i]))}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  fontSize: 13,
                  border: '1px solid var(--color-border)',
                  backgroundColor: days.includes(i) ? 'var(--color-primary)' : 'transparent',
                  color: days.includes(i) ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {l}
              </button>
            ))}
            <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>none = every day</span>
          </div>
          <button type="submit" style={{ ...primaryButton, alignSelf: 'flex-start' }}>
            Add chore
          </button>
        </form>
      )}
    </div>
  )
}

function ListsPanel({ manage }: { manage: boolean }) {
  const { data, update } = useHomeStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [newList, setNewList] = useState('')
  const active = data.lists.find((l) => l.id === activeId) ?? data.lists[0]

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!active || !text.trim()) return
    update((d) => ({
      ...d,
      lists: d.lists.map((l) =>
        l.id === active.id ? { ...l, items: [...l.items, { id: newId(), text: text.trim(), done: false }] } : l,
      ),
    }))
    setText('')
  }

  const addList = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newList.trim()) return
    const id = newId()
    update((d) => ({ ...d, lists: [...d.lists, { id, name: newList.trim(), items: [] }] }))
    setActiveId(id)
    setNewList('')
  }

  return (
    <div style={{ ...panel, borderRight: 'none' }}>
      <div style={heading}>Lists</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {data.lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveId(l.id)}
            style={{
              padding: '8px 16px',
              minHeight: 40,
              borderRadius: 20,
              fontSize: 14,
              border: '1px solid',
              borderColor: active?.id === l.id ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: active?.id === l.id ? 'var(--color-primary-dim)' : 'transparent',
              color: active?.id === l.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            {l.name}
          </button>
        ))}
      </div>

      {!active && (
        <div style={{ color: 'var(--color-text-faint)', fontSize: 14 }}>No lists yet. Tap Manage to add one.</div>
      )}

      {active && (
        <>
          {active.items.map((i) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48 }}>
              <Check
                done={i.done}
                onClick={() =>
                  update((d) => ({
                    ...d,
                    lists: d.lists.map((l) =>
                      l.id === active.id
                        ? { ...l, items: l.items.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x)) }
                        : l,
                    ),
                  }))
                }
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 16,
                  textDecoration: i.done ? 'line-through' : 'none',
                  color: i.done ? 'var(--color-text-faint)' : 'var(--color-text)',
                }}
              >
                {i.text}
              </span>
            </div>
          ))}
          <form onSubmit={addItem} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              style={{ flex: 1 }}
              type="text"
              placeholder="Add item"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" style={primaryButton}>
              Add
            </button>
          </form>
          {active.items.some((i) => i.done) && (
            <button
              onClick={() =>
                update((d) => ({
                  ...d,
                  lists: d.lists.map((l) =>
                    l.id === active.id ? { ...l, items: l.items.filter((x) => !x.done) } : l,
                  ),
                }))
              }
              style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-muted)', padding: '10px 0' }}
            >
              Clear completed
            </button>
          )}
        </>
      )}

      {manage && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <form onSubmit={addList} style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1 }}
              type="text"
              placeholder="New list (e.g. Groceries)"
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
            />
            <button type="submit" style={primaryButton}>
              Create
            </button>
          </form>
          {active && (
            <button
              onClick={() => update((d) => ({ ...d, lists: d.lists.filter((l) => l.id !== active.id) }))}
              style={{ alignSelf: 'flex-start', color: '#da3633', fontSize: 13, padding: '10px 0' }}
            >
              Delete “{active.name}”
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function HomeView() {
  const load = useHomeStore((s) => s.load)
  const [manage, setManage] = useState(false)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '8px 16px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={() => setManage((m) => !m)}
          style={{
            fontSize: 13,
            padding: '8px 16px',
            minHeight: 40,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            color: manage ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          {manage ? 'Done' : 'Manage'}
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ChoresPanel manage={manage} />
        <ListsPanel manage={manage} />
      </div>
    </div>
  )
}
