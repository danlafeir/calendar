import ical from 'node-ical'
import type { CalendarEvent } from '../types/ipc'

const MAX_BODY_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 15_000
const MAX_INSTANCES_PER_EVENT = 500
const MAX_VEVENTS = 2000
const MAX_TOTAL_EVENTS = 5000

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

const MAX_REDIRECTS = 3

// Redirects are followed by hand so every hop is re-checked against the same
// scheme rules, and the body is streamed with a running byte count so a
// chunked response without content-length cannot exhaust memory.
export async function fetchIcsBody(url: string): Promise<string> {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  let current = url
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, { signal, redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      const next = location ? normalizeIcsUrl(new URL(location, current).toString()) : null
      if (!next?.ok) throw new Error('ICS redirect rejected')
      current = next.url
      continue
    }
    if (!res.ok || !res.body) throw new Error(`ICS fetch failed: ${res.status}`)
    return readCapped(res.body)
  }
  throw new Error('ICS too many redirects')
}

async function readCapped(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new Error('ICS feed too large')
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

const SUB_DAILY = new Set(['SECONDLY', 'MINUTELY', 'HOURLY'])

// rrule freq may be a name or the numeric enum (HOURLY=4, MINUTELY=5, SECONDLY=6)
export function isSubDailyRule(rrule: unknown): boolean {
  const freq = (rrule as { options?: { freq?: unknown } } | undefined)?.options?.freq
  if (typeof freq === 'number') return freq >= 4
  return typeof freq === 'string' && SUB_DAILY.has(freq.toUpperCase())
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

  let seen = 0
  for (const component of Object.values(parsed)) {
    if (!component || component.type !== 'VEVENT') continue
    if (++seen > MAX_VEVENTS || out.length >= MAX_TOTAL_EVENTS) break
    const vevent = component as ical.VEvent
    if (vevent.status === 'CANCELLED' || !vevent.start) continue
    // expansion materializes every occurrence before we can cap it, so refuse
    // second/minute/hour rules outright instead of walking millions of them
    if (isSubDailyRule(vevent.rrule)) continue

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
