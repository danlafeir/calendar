import { describe, it, expect } from 'vitest'
import { sanitizeRange } from '../src/main/syncRange'
import { sanitizeNotifyConfig, isValidNotifyKey } from '../src/main/notifyValidation'

const NOW = Date.parse('2026-11-15T12:00:00Z')

describe('sanitizeRange', () => {
  it('rejects junk and inverted ranges', () => {
    expect(sanitizeRange(null, NOW)).toBeNull()
    expect(sanitizeRange({ timeMin: 'x', timeMax: 'y' }, NOW)).toBeNull()
    expect(sanitizeRange({ timeMin: '2026-12-01T00:00:00Z', timeMax: '2026-11-01T00:00:00Z' }, NOW)).toBeNull()
  })
  it('clamps a huge range to two years either side of now', () => {
    const r = sanitizeRange({ timeMin: '0001-01-01T00:00:00Z', timeMax: '9999-12-31T00:00:00Z' }, NOW)!
    expect(Date.parse(r.timeMin)).toBe(NOW - 2 * 365 * 86400_000)
    expect(Date.parse(r.timeMax)).toBe(NOW + 2 * 365 * 86400_000)
  })
  it('leaves a normal range alone', () => {
    const r = sanitizeRange({ timeMin: '2026-11-08T00:00:00.000Z', timeMax: '2026-11-14T00:00:00.000Z' }, NOW)!
    expect(r.timeMin).toBe('2026-11-08T00:00:00.000Z')
  })
})

describe('notify validation', () => {
  it('accepts a normal config and bounds offsets', () => {
    expect(sanitizeNotifyConfig({ minutesBefore: [30, 10, 10, -1, 1.5, 99999999], soundEnabled: true })).toEqual({
      minutesBefore: [10, 30],
      soundEnabled: true,
    })
  })
  it('rejects non-conforming configs', () => {
    expect(sanitizeNotifyConfig({ minutesBefore: 'x', soundEnabled: true })).toBeNull()
    expect(sanitizeNotifyConfig({ minutesBefore: [], soundEnabled: 'yes' })).toBeNull()
    expect(sanitizeNotifyConfig(null)).toBeNull()
  })
  it('validates keys', () => {
    expect(isValidNotifyKey('cal:evt')).toBe(true)
    expect(isValidNotifyKey('')).toBe(false)
    expect(isValidNotifyKey('x'.repeat(300))).toBe(false)
    expect(isValidNotifyKey({})).toBe(false)
  })
})
