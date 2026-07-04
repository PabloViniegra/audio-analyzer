import type { CanvasSize } from './drawBars'

export interface WaveformPoint {
  x: number
  y: number
}

/** Trace stroke color. Matches Bars mode's fill so both modes read as one system. */
const WAVEFORM_COLOR = '#8b5cf6'

/** Trace stroke width, in canvas pixels. */
const WAVEFORM_LINE_WIDTH = 2

/**
 * Pure layout math: maps time-domain byte data (one amplitude sample per
 * point, 0-255, with 128 as the zero-signal midline) to a list of points
 * tracing the waveform left to right across `size`. No canvas/DOM involved,
 * so this is the part to unit test directly.
 */
export function computeWaveformPoints(
  timeData: ArrayLike<number>,
  size: CanvasSize,
): WaveformPoint[] {
  const { width, height } = size
  const sampleCount = timeData.length
  if (sampleCount === 0 || width <= 0 || height <= 0) return []

  const stepX = width / sampleCount

  const points: WaveformPoint[] = []
  for (let i = 0; i < sampleCount; i++) {
    const amplitude = timeData[i] / 255
    points.push({ x: i * stepX, y: height - amplitude * height })
  }
  return points
}

/**
 * Draws Waveform mode into `ctx`: clears the canvas, then strokes a single
 * continuous path through `computeWaveformPoints`. Imperative shell only —
 * all layout math lives in `computeWaveformPoints` so it stays testable
 * without a real canvas.
 */
export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  timeData: ArrayLike<number>,
  size: CanvasSize,
): void {
  ctx.clearRect(0, 0, size.width, size.height)

  const points = computeWaveformPoints(timeData, size)
  if (points.length === 0) return

  ctx.strokeStyle = WAVEFORM_COLOR
  ctx.lineWidth = WAVEFORM_LINE_WIDTH
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
}
