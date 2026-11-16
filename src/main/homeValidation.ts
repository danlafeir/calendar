import type { Chore, HomeData, ListItem, TodoList } from '../types/ipc'

const MAX_LISTS = 20
const MAX_ITEMS = 200
const MAX_CHORES = 50
const MAX_DONE_DATES = 90
const MAX_TEXT = 200
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const str = (v: unknown, max = MAX_TEXT): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// Whole-document saves come from the renderer; keep shapes and sizes bounded
// so a bug there cannot grow the settings file without limit.
export function sanitizeHomeData(input: unknown): HomeData {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const lists: TodoList[] = []
  for (const l of Array.isArray(raw.lists) ? raw.lists.slice(0, MAX_LISTS) : []) {
    const id = str(l?.id, 64)
    const name = str(l?.name, 60)
    if (!id || !name) continue
    const items: ListItem[] = []
    for (const i of Array.isArray(l.items) ? l.items.slice(0, MAX_ITEMS) : []) {
      const iid = str(i?.id, 64)
      const text = str(i?.text)
      if (iid && text) items.push({ id: iid, text, done: i.done === true })
    }
    lists.push({ id, name, items })
  }

  const chores: Chore[] = []
  for (const c of Array.isArray(raw.chores) ? raw.chores.slice(0, MAX_CHORES) : []) {
    const id = str(c?.id, 64)
    const title = str(c?.title, 100)
    if (!id || !title) continue
    const days = Array.isArray(c.days)
      ? [...new Set<number>(c.days.filter((d: unknown): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))].sort()
      : []
    const doneDates = Array.isArray(c.doneDates)
      ? c.doneDates.filter((d: unknown): d is string => typeof d === 'string' && DATE_RE.test(d)).sort().slice(-MAX_DONE_DATES)
      : []
    chores.push({ id, title, assignee: str(c.assignee, 200) || null, days, doneDates })
  }
  return { lists, chores }
}
