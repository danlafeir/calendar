import { describe, it, expect } from 'vitest'
import { aggregateForecast } from '../src/main/forecast'

const slot = (iso: string, min: number, max: number, id = 800) => ({
  dt: Date.parse(iso) / 1000,
  main: { temp_min: min, temp_max: max },
  weather: [{ id, description: 'x' }],
})

describe('aggregateForecast', () => {
  it('groups slots by the city local day and takes high/low', () => {
    const json = {
      city: { timezone: 0 },
      list: [
        slot('2026-11-15T09:00:00Z', 50, 55),
        slot('2026-11-15T15:00:00Z', 54, 63),
        slot('2026-11-16T03:00:00Z', 40, 45),
      ],
    }
    const r = aggregateForecast(json)
    expect(r).toHaveLength(2)
    expect(r[0]).toMatchObject({ date: '2026-11-15', high: 63, low: 50 })
    expect(r[1]).toMatchObject({ date: '2026-11-16', high: 45, low: 40 })
  })
  it('applies the city timezone offset when bucketing', () => {
    // 02:00Z is 21:00 the previous day in UTC-5
    const json = { city: { timezone: -5 * 3600 }, list: [slot('2026-11-16T02:00:00Z', 40, 45)] }
    expect(aggregateForecast(json)[0].date).toBe('2026-11-15')
  })
  it('uses the slot closest to midday for the condition', () => {
    const json = {
      city: { timezone: 0 },
      list: [slot('2026-11-15T03:00:00Z', 1, 2, 600), slot('2026-11-15T12:00:00Z', 1, 2, 800)],
    }
    expect(aggregateForecast(json)[0].conditionCode).toBe(800)
  })
  it('limits the number of days', () => {
    const list = [10, 11, 12, 13, 14, 15, 16].map((d) => slot(`2026-11-${d}T12:00:00Z`, 1, 2))
    expect(aggregateForecast({ city: { timezone: 0 }, list }, 3)).toHaveLength(3)
  })
})
