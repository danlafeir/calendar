import { describe, it, expect } from 'vitest'
import { choresForDay, toggleChoreDone, isChoreDone } from '../src/renderer/src/lib/home'
import { sanitizeHomeData } from '../src/main/homeValidation'
import type { Chore } from '../src/types/ipc'

const chore = (o: Partial<Chore> = {}): Chore => ({ id: 'c', title: 'Dishes', assignee: null, days: [], doneDates: [], ...o })
const sunday = new Date(2026, 10, 15)
const monday = new Date(2026, 10, 16)

describe('chores', () => {
  it('empty days means every day; otherwise only listed weekdays', () => {
    expect(choresForDay([chore()], monday)).toHaveLength(1)
    expect(choresForDay([chore({ days: [0] })], sunday)).toHaveLength(1)
    expect(choresForDay([chore({ days: [0] })], monday)).toHaveLength(0)
  })
  it('toggles completion per date without affecting other dates', () => {
    const done = toggleChoreDone(chore(), sunday)
    expect(isChoreDone(done, sunday)).toBe(true)
    expect(isChoreDone(done, monday)).toBe(false)
    expect(isChoreDone(toggleChoreDone(done, sunday), sunday)).toBe(false)
  })
})

describe('sanitizeHomeData', () => {
  it('returns empty data for junk', () => {
    expect(sanitizeHomeData(null)).toEqual({ lists: [], chores: [] })
    expect(sanitizeHomeData('x')).toEqual({ lists: [], chores: [] })
  })
  it('drops malformed entries and bounds sizes', () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ id: `i${i}`, text: 'milk', done: false }))
    const out = sanitizeHomeData({
      lists: [{ id: 'l', name: 'Groceries', items }, { id: '', name: 'bad' }, { id: 'x' }],
      chores: [{ id: 'c', title: 'Trash', days: [1, 1, 9, 'a', 3], doneDates: ['2026-11-15', 'nope'], assignee: '' }, { title: 'no id' }],
    })
    expect(out.lists).toHaveLength(1)
    expect(out.lists[0].items).toHaveLength(200)
    expect(out.chores).toHaveLength(1)
    expect(out.chores[0]).toMatchObject({ days: [1, 3], doneDates: ['2026-11-15'], assignee: null })
  })
})
