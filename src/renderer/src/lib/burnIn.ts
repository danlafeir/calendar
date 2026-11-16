// Slowly drifting offset so static glyphs do not sit on the same pixels.
// Deterministic in the minute so it is testable and changes at most once a minute.
export function burnInOffset(minuteOfDay: number, radius = 24): { x: number; y: number } {
  const span = radius * 2 + 1
  return {
    x: ((minuteOfDay * 37) % span) - radius,
    y: ((minuteOfDay * 53) % span) - radius,
  }
}
