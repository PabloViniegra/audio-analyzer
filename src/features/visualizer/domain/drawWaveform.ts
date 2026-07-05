import type { CanvasSize } from './drawBars'

export interface WaveformPoint {
  x: number
  y: number
}

const WAVEFORM_COLOR = '#c4b5fd'
const WAVEFORM_GLOW = 'rgba(196, 181, 253, 0.4)'
const WAVEFORM_LINE_WIDTH = 1.8

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
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowBlur = 8
  ctx.shadowColor = WAVEFORM_GLOW

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()

  ctx.shadowBlur = 0
}
