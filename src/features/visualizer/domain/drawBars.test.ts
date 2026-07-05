import { describe, expect, it, vi } from 'vitest'
import { computeBars, drawBars } from './drawBars'

function fakeCtx() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D
}

describe('computeBars', () => {
  it('maps each frequency bin to a bar growing up from the bottom, left to right', () => {
    const freqData = [0, 64, 128, 192, 255]
    const size = { width: 200, height: 50 }

    const bars = computeBars(freqData, size)

    expect(bars).toHaveLength(5)

    // slotWidth = 200 / 5 = 40, barWidth = 40 * 0.8 = 32 for every bar
    for (const bar of bars) {
      expect(bar.width).toBe(32)
    }

    // silent bin: zero height, sits flush with the bottom edge
    expect(bars[0]).toMatchObject({ x: 0 })
    expect(bars[0].height).toBe(0)
    expect(bars[0].y).toBe(50)

    // full-scale bin: fills the entire height, starts at the top edge
    expect(bars[4]).toMatchObject({ x: 160 })
    expect(bars[4].height).toBe(50)
    expect(bars[4].y).toBe(0)

    // intermediate bins: amplitude = value / 255, height = amplitude * canvas height
    expect(bars[1].x).toBe(40)
    expect(bars[1].height).toBeCloseTo((64 / 255) * 50, 5)
    expect(bars[1].y).toBeCloseTo(50 - (64 / 255) * 50, 5)

    expect(bars[2].x).toBe(80)
    expect(bars[2].height).toBeCloseTo((128 / 255) * 50, 5)
    expect(bars[2].y).toBeCloseTo(50 - (128 / 255) * 50, 5)

    expect(bars[3].x).toBe(120)
    expect(bars[3].height).toBeCloseTo((192 / 255) * 50, 5)
    expect(bars[3].y).toBeCloseTo(50 - (192 / 255) * 50, 5)
  })

  it('accepts a real Uint8Array, matching what AnalyserNode.getByteFrequencyData fills', () => {
    const bars = computeBars(new Uint8Array([255, 0]), { width: 100, height: 10 })

    expect(bars).toEqual([
      { x: 0, y: 0, width: 40, height: 10 },
      { x: 50, y: 10, width: 40, height: 0 },
    ])
  })

  it('returns no bars for empty frequency data', () => {
    expect(computeBars([], { width: 100, height: 100 })).toEqual([])
  })

  it('returns no bars when the canvas has zero width or height', () => {
    expect(computeBars([1, 2, 3], { width: 0, height: 100 })).toEqual([])
    expect(computeBars([1, 2, 3], { width: 100, height: 0 })).toEqual([])
  })
})

describe('drawBars', () => {
  it('clears the canvas and fills one rect per bin with computeBars geometry', () => {
    const ctx = fakeCtx()

    drawBars(ctx, [255, 0], { width: 100, height: 20 })

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 20)
    expect(ctx.fillRect).toHaveBeenCalledTimes(2)
    expect(ctx.fillRect).toHaveBeenNthCalledWith(1, 0, 0, 40, 20)
    expect(ctx.fillRect).toHaveBeenNthCalledWith(2, 50, 20, 40, 0)
  })

  it('still clears the canvas but draws nothing for empty frequency data', () => {
    const ctx = fakeCtx()

    drawBars(ctx, [], { width: 100, height: 20 })

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 20)
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })
})
