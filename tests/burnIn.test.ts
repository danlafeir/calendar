import { describe, it, expect } from 'vitest'
import { burnInOffset } from '../src/renderer/src/lib/burnIn'

describe('burnInOffset', () => {
  it('stays within the radius for every minute of the day', () => {
    for (let m = 0; m < 1440; m++) {
      const { x, y } = burnInOffset(m, 24)
      expect(Math.abs(x)).toBeLessThanOrEqual(24)
      expect(Math.abs(y)).toBeLessThanOrEqual(24)
    }
  })
  it('moves between consecutive minutes', () => {
    expect(burnInOffset(100)).not.toEqual(burnInOffset(101))
  })
})
