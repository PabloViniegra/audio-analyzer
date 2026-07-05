import { describe, expect, it, vi } from 'vitest'
import { computeWaveformPoints, drawWaveform } from './drawWaveform'

function fakeCtx() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    shadowBlur: 0,
    shadowColor: '',
  } as unknown as CanvasRenderingContext2D
}

describe('computeWaveformPoints', () => {
  it('maps each time-domain sample to a point tracing left to right, amplitude centered vertically', () => {
    const timeData = [0, 64, 128, 192, 255]
    const size = { width: 200, height: 50 }

    const points = computeWaveformPoints(timeData, size)

    expect(points).toHaveLength(5)

    // stepX = 200 / 5 = 40
    expect(points[0].x).toBe(0)
    expect(points[1].x).toBe(40)
    expect(points[2].x).toBe(80)
    expect(points[3].x).toBe(120)
    expect(points[4].x).toBe(160)

    // silence-floor sample (0): amplitude 0 -> bottom edge
    expect(points[0].y).toBe(50)

    // full-scale sample (255): amplitude 1 -> top edge
    expect(points[4].y).toBeCloseTo(0, 5)

    // midline sample (128) sits close to vertical center (128/255 isn't exactly 0.5)
    expect(points[2].y).toBeCloseTo(50 - (128 / 255) * 50, 5)

    expect(points[1].y).toBeCloseTo(50 - (64 / 255) * 50, 5)
    expect(points[3].y).toBeCloseTo(50 - (192 / 255) * 50, 5)
  })

  it('accepts a real Uint8Array, matching what AnalyserNode.getByteTimeDomainData fills', () => {
    const points = computeWaveformPoints(new Uint8Array([0, 255]), { width: 100, height: 10 })

    expect(points).toEqual([
      { x: 0, y: 10 },
      { x: 50, y: 0 },
    ])
  })

  it('returns no points for empty time-domain data', () => {
    expect(computeWaveformPoints([], { width: 100, height: 100 })).toEqual([])
  })

  it('returns no points when the canvas has zero width or height', () => {
    expect(computeWaveformPoints([1, 2, 3], { width: 0, height: 100 })).toEqual([])
    expect(computeWaveformPoints([1, 2, 3], { width: 100, height: 0 })).toEqual([])
  })
})

describe('drawWaveform', () => {
  it('draws the center reference line before stroking the waveform path', () => {
    const ctx = fakeCtx()

    drawWaveform(ctx, [0, 255], { width: 100, height: 20 })

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 20)
    expect(ctx.beginPath).toHaveBeenCalledTimes(2)
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 20)
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 0)
    expect(ctx.stroke).toHaveBeenCalledTimes(2)
  })

  it('only draws the center reference line for empty time-domain data', () => {
    const ctx = fakeCtx()

    drawWaveform(ctx, [], { width: 100, height: 20 })

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 20)
    expect(ctx.beginPath).toHaveBeenCalledTimes(1)
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 10)
  })
})
