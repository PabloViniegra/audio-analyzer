import { useEffect, useRef } from "react"

interface Ripple {
  x: number
  y: number
  born: number
}

const RIPPLE_LIFE_MS = 750
const MAX_RIPPLES = 8
const MIN_DISTANCE_PX = 22
const MAX_RADIUS_PX = 72
const STROKE_WIDTH = 1.5
const SHADOW_BLUR = 10
const PEAK_ALPHA = 0.85

export function CursorRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() ||
      "oklch(0.8 0.19 145)"

    const ripples: Ripple[] = []
    let lastPos: { x: number; y: number } | null = null
    let raf = 0

    const onMove = (e: PointerEvent) => {
      if (lastPos) {
        const dx = e.clientX - lastPos.x
        const dy = e.clientY - lastPos.y
        if (Math.hypot(dx, dy) < MIN_DISTANCE_PX) return
      }
      lastPos = { x: e.clientX, y: e.clientY }
      if (ripples.length >= MAX_RIPPLES) ripples.shift()
      ripples.push({ x: e.clientX, y: e.clientY, born: performance.now() })
    }
    window.addEventListener("pointermove", onMove)

    const tick = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.lineWidth = STROKE_WIDTH
      ctx.strokeStyle = accent
      ctx.shadowColor = accent
      ctx.shadowBlur = SHADOW_BLUR
      for (const r of ripples) {
        const t = (now - r.born) / RIPPLE_LIFE_MS
        if (t >= 1) continue
        const radius = 4 + t * MAX_RADIUS_PX
        ctx.globalAlpha = (1 - t) * PEAK_ALPHA
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      ctx.shadowColor = "transparent"

      for (let i = ripples.length - 1; i >= 0; i--) {
        if (now - ripples[i].born >= RIPPLE_LIFE_MS) ripples.splice(i, 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}