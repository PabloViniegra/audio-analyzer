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

const BAR_GAP_RATIO = 0.2

const BAR_FILL_BOTTOM = '#7c3aed'
const BAR_FILL_TOP = '#c4b5fd'
const BAR_GLOW = 'rgba(167, 139, 250, 0.35)'

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

  ctx.shadowBlur = 12
  ctx.shadowColor = BAR_GLOW

  const gradient =
    typeof ctx.createLinearGradient === 'function'
      ? ctx.createLinearGradient(0, size.height, 0, 0)
      : null
  if (gradient) {
    gradient.addColorStop(0, BAR_FILL_BOTTOM)
    gradient.addColorStop(1, BAR_FILL_TOP)
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = BAR_FILL_TOP
  }

  for (const bar of bars) {
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height)
  }

  ctx.shadowBlur = 0
}
