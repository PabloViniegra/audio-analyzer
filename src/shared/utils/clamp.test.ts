import { describe, expect, it } from 'vitest'
import { clamp } from './clamp'

describe('clamp', () => {
  it('returns the value unchanged when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to the minimum when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to the maximum when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles a zero-width range', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })
})
