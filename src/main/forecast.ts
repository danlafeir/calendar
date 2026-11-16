import type { ForecastDay } from '../types/ipc'

export interface OpenWeatherForecast {
  city: { timezone: number }
  list: Array<{
    dt: number
    main: { temp_min: number; temp_max: number }
    weather: Array<{ id: number; description: string }>
  }>
}

// Collapses OpenWeatherMap's 3-hourly slots into one entry per local day.
// Day boundaries use the city's UTC offset, not the Pi's timezone. The
// condition shown is the slot closest to midday.
export function aggregateForecast(json: OpenWeatherForecast, days = 5): ForecastDay[] {
  const byDate = new Map<string, OpenWeatherForecast['list']>()
  for (const slot of json.list ?? []) {
    const local = new Date((slot.dt + json.city.timezone) * 1000)
    const date = local.toISOString().slice(0, 10)
    const bucket = byDate.get(date) ?? []
    bucket.push(slot)
    byDate.set(date, bucket)
  }

  const out: ForecastDay[] = []
  for (const [date, slots] of [...byDate.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const hourOf = (dt: number) => new Date((dt + json.city.timezone) * 1000).getUTCHours()
    const midday = slots.reduce((best, s) =>
      Math.abs(hourOf(s.dt) - 12) < Math.abs(hourOf(best.dt) - 12) ? s : best,
    )
    out.push({
      date,
      high: Math.round(Math.max(...slots.map((s) => s.main.temp_max))),
      low: Math.round(Math.min(...slots.map((s) => s.main.temp_min))),
      conditionCode: midday.weather[0]?.id ?? 800,
      condition: midday.weather[0]?.description ?? '',
    })
    if (out.length >= days) break
  }
  return out
}
