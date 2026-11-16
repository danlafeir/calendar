import { getWeatherCache, setWeatherCache, getSettings, getAppSettings } from './store'
import { aggregateForecast, type OpenWeatherForecast } from './forecast'
import type { WeatherData } from '../types/ipc'

const CACHE_TTL_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000
const BASE = 'https://api.openweathermap.org/data/2.5'

export async function getWeather(): Promise<WeatherData | null> {
  const cached = getWeatherCache()
  const { units } = getAppSettings()
  // A cache from before units/forecast existed, or in other units, is not reusable
  if (cached && cached.data.units === units && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }
  return fetchAndCache()
}

async function getJson<T>(path: string, params: URLSearchParams): Promise<T | null> {
  const res = await fetch(`${BASE}/${path}?${params}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) return null
  return (await res.json()) as T
}

export async function fetchAndCache(): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return null

  const { weatherLat: lat, weatherLon: lon } = getSettings()
  const { units } = getAppSettings()
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: apiKey, units })
  try {
    const [current, forecast] = await Promise.all([
      getJson<OpenWeatherResponse>('weather', params),
      // forecast is optional: a failure there must not hide current conditions
      getJson<OpenWeatherForecast>('forecast', params).catch(() => null),
    ])
    if (!current) return null
    const data: WeatherData = {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed),
      condition: current.weather[0].description,
      conditionCode: current.weather[0].id,
      iconCode: current.weather[0].icon,
      city: current.name,
      units,
      forecast: forecast ? aggregateForecast(forecast) : [],
      fetchedAt: Date.now(),
    }
    setWeatherCache(data)
    return data
  } catch {
    return getWeatherCache()?.data ?? null
  }
}

interface OpenWeatherResponse {
  name: string
  main: { temp: number; feels_like: number; humidity: number }
  wind: { speed: number }
  weather: Array<{ id: number; description: string; icon: string }>
}
