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

/** Fraction of each bar's slot left empty as a gap between bars. */
const BAR_GAP_RATIO = 0.2

/** Bar fill color. Fixed rather than theme-derived — keeps this module free of DOM/CSS lookups. */
const BAR_COLOR = '#8b5cf6'

/**
 * Pure layout math: maps frequency-domain byte data (one amplitude value per
 * bin, 0-255) to a list of bar rectangles that fill `size` left to right,
 * growing up from the bottom. No canvas/DOM involved, so this is the part to
 * unit test directly.
 */
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

/**
 * Draws Bars mode into `ctx`: clears the canvas, then fills one rectangle
 * per frequency bin using `computeBars`. Imperative shell only — all layout
 * math lives in `computeBars` so it stays testable without a real canvas.
 */
export function drawBars(
  ctx: CanvasRenderingContext2D,
  freqData: ArrayLike<number>,
  size: CanvasSize,
): void {
  ctx.clearRect(0, 0, size.width, size.height)

  const bars = computeBars(freqData, size)
  if (bars.length === 0) return

  ctx.fillStyle = BAR_COLOR
  for (const bar of bars) {
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height)
  }
}
