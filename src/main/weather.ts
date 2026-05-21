import { getWeatherCache, setWeatherCache, getSettings } from './store'
import type { WeatherData } from '../types/ipc'

const CACHE_TTL_MS = 10 * 60 * 1000

export async function getWeather(): Promise<WeatherData | null> {
  const cached = getWeatherCache()
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }
  return fetchAndCache()
}

export async function fetchAndCache(): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return null

  const { weatherLat: lat, weatherLon: lon } = getSettings()
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`,
    )
    if (!res.ok) return null
    const json = (await res.json()) as OpenWeatherResponse
    const data: WeatherData = {
      temp: Math.round(json.main.temp),
      feelsLike: Math.round(json.main.feels_like),
      humidity: json.main.humidity,
      windSpeed: Math.round(json.wind.speed),
      condition: json.weather[0].description,
      conditionCode: json.weather[0].id,
      iconCode: json.weather[0].icon,
      city: json.name,
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
