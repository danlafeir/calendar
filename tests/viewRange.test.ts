import { describe, it, expect } from 'vitest'
import { viewRange } from '../src/renderer/src/lib/viewRange'

describe('viewRange', () => {
  const d = new Date(2026, 10, 15, 12)
  it('month view covers the padded grid weeks', () => {
    const r = viewRange('month', d)
    expect(new Date(r.timeMin).getDay()).toBe(0)
    expect(new Date(r.timeMax).getDay()).toBe(6)
    expect(new Date(r.timeMin) <= new Date(2026, 10, 1)).toBe(true)
    expect(new Date(r.timeMax) >= new Date(2026, 10, 30)).toBe(true)
  })
  it('day view covers exactly that day', () => {
    const r = viewRange('day', d)
    expect(new Date(r.timeMin).getDate()).toBe(15)
    expect(new Date(r.timeMax).getDate()).toBe(15)
  })
})
