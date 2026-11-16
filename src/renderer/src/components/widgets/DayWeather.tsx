import { format } from 'date-fns'
import { useWeatherStore } from '@renderer/store/useWeatherStore'
import { conditionEmoji } from '@renderer/components/widgets/WeatherWidget'

export function DayWeather({ day, size = 11 }: { day: Date; size?: number }) {
  const forecast = useWeatherStore((s) => s.weather?.forecast)
  const entry = forecast?.find((f) => f.date === format(day, 'yyyy-MM-dd'))
  if (!entry) return null

  return (
    <div
      title={entry.condition}
      style={{ fontSize: size, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
    >
      {conditionEmoji(entry.conditionCode)} {entry.high}° / {entry.low}°
    </div>
  )
}
