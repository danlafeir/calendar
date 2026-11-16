import { useWeatherStore } from '@renderer/store/useWeatherStore'
import { ipc } from '@renderer/lib/ipc'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import type { AppSettings } from '@renderer/types'

const IDLE_OPTIONS = [0, 2, 5, 10, 30]
const DIM_OPTIONS = [0, 30, 60, 90]

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 10,
}

function Chips<T extends number>({
  options,
  value,
  format,
  onPick,
}: {
  options: T[]
  value: number
  format: (v: T) => string
  onPick: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          style={{
            padding: '8px 12px',
            minHeight: 40,
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            border: '1px solid',
            borderColor: value === o ? 'var(--color-primary)' : 'var(--color-border)',
            color: value === o ? 'var(--color-primary)' : 'var(--color-text-muted)',
            backgroundColor: value === o ? 'var(--color-primary-dim)' : 'transparent',
          }}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}

export function DisplaySettings() {
  const prefs = useSettingsStore((s) => s.prefs)
  const setPrefs = useSettingsStore((s) => s.setPrefs)
  const setWeather = useWeatherStore((s) => s.setWeather)

  const update = (patch: Partial<AppSettings>) => {
    setPrefs({ ...prefs, ...patch })
    ipc().updateAppSettings(patch).then(setPrefs).catch(console.error)
    if (patch.units) {
      ipc().getWeather().then((w) => w && setWeather(w)).catch(() => {})
    }
  }

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
      <div style={labelStyle}>Temperature</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['imperial', 'metric'] as const).map((u) => (
          <button
            key={u}
            onClick={() => update({ units: u })}
            style={{
              padding: '8px 12px',
              minHeight: 40,
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              border: '1px solid',
              borderColor: prefs.units === u ? 'var(--color-primary)' : 'var(--color-border)',
              color: prefs.units === u ? 'var(--color-primary)' : 'var(--color-text-muted)',
              backgroundColor: prefs.units === u ? 'var(--color-primary-dim)' : 'transparent',
            }}
          >
            {u === 'imperial' ? '°F' : '°C'}
          </button>
        ))}
      </div>

      <div style={labelStyle}>Screensaver after</div>
      <Chips
        options={IDLE_OPTIONS}
        value={prefs.idleTimeoutMin}
        format={(v) => (v === 0 ? 'Off' : `${v}m`)}
        onPick={(v) => update({ idleTimeoutMin: v })}
      />

      <div style={labelStyle}>Night dimming</div>
      <Chips
        options={DIM_OPTIONS}
        value={prefs.nightDimPercent}
        format={(v) => (v === 0 ? 'Off' : `${v}%`)}
        onPick={(v) => update({ nightDimPercent: v })}
      />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
        <input
          type="time"
          value={prefs.nightStart}
          onChange={(e) => e.target.value && update({ nightStart: e.target.value })}
        />
        <span>to</span>
        <input
          type="time"
          value={prefs.nightEnd}
          onChange={(e) => e.target.value && update({ nightEnd: e.target.value })}
        />
      </div>
    </div>
  )
}
