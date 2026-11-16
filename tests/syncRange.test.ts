import { describe, it, expect } from 'vitest'
import { defaultRange, unionRange } from '../src/main/syncRange'

describe('unionRange', () => {
  const base = defaultRange(new Date(2026, 10, 15))
  it('returns base when nothing extra is visible', () => {
    expect(unionRange(base, null)).toEqual(base)
  })
  it('extends forward when viewing a far-future month', () => {
    const far = { timeMin: new Date(2027, 5, 1).toISOString(), timeMax: new Date(2027, 6, 1).toISOString() }
    const u = unionRange(base, far)
    expect(u.timeMin).toBe(base.timeMin)
    expect(u.timeMax).toBe(far.timeMax)
  })
  it('does not shrink when the visible range is inside the base', () => {
    const inside = { timeMin: new Date(2026, 10, 10).toISOString(), timeMax: new Date(2026, 10, 17).toISOString() }
    expect(unionRange(base, inside)).toEqual(base)
  })
})
