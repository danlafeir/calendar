import type { AppSettings } from '../types/ipc'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function clampInt(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.min(max, Math.max(min, Math.round(value)))
}

// Settings arrive over IPC from the renderer; keep only known, in-range fields.
export function sanitizeSettingsPatch(patch: unknown): Partial<AppSettings> {
  if (typeof patch !== 'object' || patch === null) return {}
  const p = patch as Record<string, unknown>
  const out: Partial<AppSettings> = {}

  const idle = clampInt(p.idleTimeoutMin, 0, 240)
  if (idle !== undefined) out.idleTimeoutMin = idle
  const dim = clampInt(p.nightDimPercent, 0, 95)
  if (dim !== undefined) out.nightDimPercent = dim
  if (typeof p.nightStart === 'string' && TIME_RE.test(p.nightStart)) out.nightStart = p.nightStart
  if (typeof p.nightEnd === 'string' && TIME_RE.test(p.nightEnd)) out.nightEnd = p.nightEnd
  if (p.units === 'imperial' || p.units === 'metric') out.units = p.units
  return out
}
