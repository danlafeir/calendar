import type { CalendarEvent, CalendarInfo } from '../../../types/ipc'

// Google's event colorId palette (per-event override)
const COLOR_MAP: Record<string, string> = {
  '1': '#a8c7fa',
  '2': '#81c995',
  '3': '#f28b82',
  '4': '#d4a8f7',
  '5': '#fbbc04',
  '6': '#78d9ec',
  '7': '#ff8bcb',
  '8': '#e8eaed',
  '9': '#aecbfa',
  '10': '#ccff90',
  '11': '#e6c9a8',
}
export const DEFAULT_EVENT_COLOR = '#58a6ff'

// Explicit event color wins, then the calendar's color (one calendar per
// person), then the default blue.
export function eventColor(event: CalendarEvent, calendars: CalendarInfo[]): string {
  return (
    COLOR_MAP[event.colorId ?? ''] ??
    calendars.find((c) => c.id === event.calendarId)?.color ??
    DEFAULT_EVENT_COLOR
  )
}

const HEX = /^#([0-9a-f]{6})$/i

// Translucent background for pills; falls back to the input if not #rrggbb
export function tint(color: string, alpha = 0.22): string {
  if (!HEX.test(color)) return color
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${color}${a}`
}
