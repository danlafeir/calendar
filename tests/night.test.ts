import { describe, it, expect } from 'vitest'
import { isNightTime } from '../src/renderer/src/lib/night'
import { sanitizeSettingsPatch } from '../src/main/settingsValidation'

const at = (h: number, m = 0) => new Date(2026, 10, 15, h, m)

describe('isNightTime', () => {
  it('handles a window that wraps past midnight', () => {
    expect(isNightTime(at(23), '22:00', '06:00')).toBe(true)
    expect(isNightTime(at(2), '22:00', '06:00')).toBe(true)
    expect(isNightTime(at(6), '22:00', '06:00')).toBe(false)
    expect(isNightTime(at(12), '22:00', '06:00')).toBe(false)
    expect(isNightTime(at(22), '22:00', '06:00')).toBe(true)
  })
  it('handles a same-day window', () => {
    expect(isNightTime(at(13), '12:00', '14:00')).toBe(true)
    expect(isNightTime(at(15), '12:00', '14:00')).toBe(false)
  })
  it('equal start and end never dims', () => {
    expect(isNightTime(at(3), '22:00', '22:00')).toBe(false)
  })
})

describe('sanitizeSettingsPatch', () => {
  it('drops unknown keys and bad values', () => {
    expect(sanitizeSettingsPatch({ foo: 1, nightStart: '25:00', idleTimeoutMin: 'x', units: 'kelvin' })).toEqual({})
  })
  it('clamps numbers and keeps valid fields', () => {
    expect(sanitizeSettingsPatch({ idleTimeoutMin: 9999, nightDimPercent: -5, nightEnd: '07:30', units: 'metric' })).toEqual({
      idleTimeoutMin: 240,
      nightDimPercent: 0,
      nightEnd: '07:30',
      units: 'metric',
    })
  })
  it('ignores non-object input', () => {
    expect(sanitizeSettingsPatch(null)).toEqual({})
    expect(sanitizeSettingsPatch('x')).toEqual({})
  })
})
