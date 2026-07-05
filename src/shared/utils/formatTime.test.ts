import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('formats whole seconds under a minute as 0:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(45)).toBe('0:45')
  })

  it('formats minutes and seconds as m:ss', () => {
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(125)).toBe('2:05')
  })

  it('does not round up to the next minute/second', () => {
    expect(formatTime(59.9)).toBe('0:59')
    expect(formatTime(65.999)).toBe('1:05')
  })

  it('does not overflow past 60 minutes worth of seconds', () => {
    expect(formatTime(3600)).toBe('60:00')
  })

  it('treats negative or non-finite input as 0', () => {
    expect(formatTime(-5)).toBe('0:00')
    expect(formatTime(NaN)).toBe('0:00')
    expect(formatTime(Infinity)).toBe('0:00')
  })
})
