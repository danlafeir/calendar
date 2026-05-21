import { useWeatherStore } from '@renderer/store/useWeatherStore'

function conditionEmoji(code: number): string {
  if (code >= 200 && code < 300) return '⛈'
  if (code >= 300 && code < 400) return '🌦'
  if (code >= 500 && code < 600) return '🌧'
  if (code >= 600 && code < 700) return '🌨'
  if (code >= 700 && code < 800) return '🌫'
  if (code === 800) return '☀️'
  if (code === 801) return '🌤'
  if (code === 802) return '⛅'
  if (code >= 803) return '☁️'
  return '🌡'
}

export function WeatherWidget() {
  const { weather, isLoading, isStale } = useWeatherStore()

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>Loading weather…</span>
      </div>
    )
  }

  if (!weather) {
    return (
      <div style={containerStyle}>
        <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>
          {isStale ? 'Weather unavailable' : 'No weather data'}
        </span>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {isStale && (
        <div style={{ fontSize: 10, color: '#9e6a03', marginBottom: 4 }}>⚠ Stale data</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 36 }}>{conditionEmoji(weather.conditionCode)}</span>
        <div>
          <div style={{ fontSize: 32, fontWeight: 300, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {weather.temp}°
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            {weather.condition}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>
        {weather.city}
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-faint)', marginTop: 4 }}>
        <span>Feels {weather.feelsLike}°</span>
        <span>💧 {weather.humidity}%</span>
        <span>💨 {weather.windSpeed} mph</span>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid var(--color-border)',
}
