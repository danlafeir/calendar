import { create } from 'zustand'
import type { WeatherData } from '@renderer/types'

interface WeatherState {
  weather: WeatherData | null
  isLoading: boolean
  isStale: boolean
  setWeather: (data: WeatherData) => void
  setLoading: (loading: boolean) => void
  setStale: (stale: boolean) => void
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: null,
  isLoading: false,
  isStale: false,
  setWeather: (weather) => set({ weather, isLoading: false, isStale: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setStale: (isStale) => set({ isStale }),
}))
