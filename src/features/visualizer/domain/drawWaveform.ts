import type { CanvasSize } from "./drawBars"

export interface WaveformPoint {
  x: number
  y: number
}

const WAVEFORM_LINE_WIDTH = 1.6
const CENTER_LINE_OPACITY = 0.18

interface VisualizerPalette {
  barTop: string
  barBottom: string
  barGlow: string
  line: string
  lineGlow: string
}

let cachedPalette: VisualizerPalette | null = null

function readPalette(): VisualizerPalette {
  if (cachedPalette) return cachedPalette
  if (typeof document === "undefined") {
    cachedPalette = {
      barTop: "",
      barBottom: "",
      barGlow: "",
      line: "",
      lineGlow: "",
    }
    return cachedPalette
  }
  const styles = getComputedStyle(document.documentElement)
  cachedPalette = {
    barTop: styles.getPropertyValue("--visualizer-bar-top").trim(),
    barBottom: styles.getPropertyValue("--visualizer-bar-bottom").trim(),
    barGlow: styles.getPropertyValue("--visualizer-bar-glow").trim(),
    line: styles.getPropertyValue("--visualizer-line").trim(),
    lineGlow: styles.getPropertyValue("--visualizer-line-glow").trim(),
  }
  return cachedPalette
}

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

  const palette = readPalette()
  const centerY = size.height / 2

  ctx.strokeStyle = palette.line
  ctx.globalAlpha = CENTER_LINE_OPACITY
  ctx.lineWidth = 1
  ctx.setLineDash([2, 4])
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(size.width, centerY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  const points = computeWaveformPoints(timeData, size)
  if (points.length === 0) return

  ctx.strokeStyle = palette.line
  ctx.lineWidth = WAVEFORM_LINE_WIDTH
  ctx.lineJoin = "round"
  ctx.lineCap = "round"
  ctx.shadowBlur = 10
  ctx.shadowColor = palette.lineGlow

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()

  ctx.shadowBlur = 0
}