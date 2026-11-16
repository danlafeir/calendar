import { useEffect, useState } from 'react'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { isNightTime } from '@renderer/lib/night'

export function NightDim() {
  const { nightStart, nightEnd, nightDimPercent } = useSettingsStore((s) => s.prefs)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  if (nightDimPercent === 0 || !isNightTime(now, nightStart, nightEnd)) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: 'none',
        backgroundColor: `rgba(0,0,0,${nightDimPercent / 100})`,
      }}
    />
  )
}
