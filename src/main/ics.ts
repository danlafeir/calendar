import ical from 'node-ical'
import type { CalendarEvent } from '../types/ipc'

const MAX_BODY_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 15_000
const MAX_INSTANCES_PER_EVENT = 500

export type UrlCheck = { ok: true; url: string } | { ok: false; error: string }

// webcal:// is just https:// with a different label. Only http(s) is fetched.
export function normalizeIcsUrl(input: string): UrlCheck {
  const trimmed = input.trim().replace(/^webcal:\/\//i, 'https://')
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'Not a valid URL' }
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Only http(s) and webcal URLs are supported' }
  }
  return { ok: true, url: parsed.toString() }
}

export async function fetchIcsBody(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`)
  const declared = Number(res.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) throw new Error('ICS feed too large')
  const text = await res.text()
  if (text.length > MAX_BODY_BYTES) throw new Error('ICS feed too large')
  return text
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// node-ical represents date-only values as local-midnight Dates flagged dateOnly
function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDaysLocal(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

function textOf(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'val' in value) return String((value as { val: unknown }).val)
  return undefined
}

export function parseIcsEvents(
  body: string,
  range: { from: Date; to: Date },
  calendarId: string,
): CalendarEvent[] {
  const parsed = ical.sync.parseICS(body)
  const out: CalendarEvent[] = []

  for (const component of Object.values(parsed)) {
    if (!component || component.type !== 'VEVENT') continue
    const vevent = component as ical.VEvent
    if (vevent.status === 'CANCELLED' || !vevent.start) continue

    const instances = vevent.rrule
      ? ical
          .expandRecurringEvent(vevent, { from: range.from, to: range.to, expandOngoing: true })
          .slice(0, MAX_INSTANCES_PER_EVENT)
      : [{ start: vevent.start, end: vevent.end, summary: vevent.summary, isFullDay: vevent.datetype === 'date', event: vevent }]

    for (const inst of instances) {
      const allDay = Boolean(inst.isFullDay)
      const start = inst.start
      const end = inst.end ?? (allDay ? addDaysLocal(start, 1) : start)
      if (end < range.from || start > range.to) continue

      const src = (inst as { event?: ical.VEvent }).event ?? vevent
      out.push({
        id: `${vevent.uid}_${start.getTime()}`,
        title: textOf(inst.summary ?? vevent.summary) ?? '(No title)',
        description: textOf(src.description),
        location: textOf(src.location),
        start: allDay ? localDate(start) : start.toISOString(),
        end: allDay ? localDate(end) : end.toISOString(),
        allDay,
        calendarId,
        readOnly: true,
      })
    }
  }
  return out
}
