export interface CanvasSize {
  width: number
  height: number
}

export interface BarRect {
  x: number
  y: number
  width: number
  height: number
}

const BAR_GAP_RATIO = 0.22
const PEAK_DECAY_PER_FRAME = 0.012
const PEAK_HOLD_HEIGHT_PX = 2

interface VisualizerPalette {
  barTop: string
  barBottom: string
  barGlow: string
  line: string
  lineGlow: string
}

let cachedPalette: VisualizerPalette | null = null
let peakHeights: number[] = []

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

export function computeBars(freqData: ArrayLike<number>, size: CanvasSize): BarRect[] {
  const { width, height } = size
  const barCount = freqData.length
  if (barCount === 0 || width <= 0 || height <= 0) return []

  const slotWidth = width / barCount
  const barWidth = slotWidth * (1 - BAR_GAP_RATIO)

  const bars: BarRect[] = []
  for (let i = 0; i < barCount; i++) {
    const amplitude = freqData[i] / 255
    const barHeight = amplitude * height
    bars.push({
      x: i * slotWidth,
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
    })
  }
  return bars
}

export function drawBars(
  ctx: CanvasRenderingContext2D,
  freqData: ArrayLike<number>,
  size: CanvasSize,
): void {
  ctx.clearRect(0, 0, size.width, size.height)

  const bars = computeBars(freqData, size)
  if (bars.length === 0) return

  const palette = readPalette()

  if (peakHeights.length !== bars.length) {
    peakHeights = new Array(bars.length).fill(0)
  }

  ctx.shadowBlur = 14
  ctx.shadowColor = palette.barGlow

  const gradient =
    typeof ctx.createLinearGradient === "function"
      ? ctx.createLinearGradient(0, size.height, 0, 0)
      : null
  if (gradient) {
    gradient.addColorStop(0, palette.barBottom)
    gradient.addColorStop(1, palette.barTop)
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = palette.barTop
  }

  for (const bar of bars) {
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height)
  }

  ctx.shadowBlur = 0
  ctx.fillStyle = palette.barTop

  for (let i = 0; i < bars.length; i++) {
    const current = bars[i].height
    const peak = peakHeights[i] ?? 0
    const next =
      current >= peak
        ? current
        : Math.max(current, peak - size.height * PEAK_DECAY_PER_FRAME)
    peakHeights[i] = next
    if (next > 1) {
      ctx.fillRect(bars[i].x, size.height - next - PEAK_HOLD_HEIGHT_PX, bars[i].width, PEAK_HOLD_HEIGHT_PX)
    }
  }
}