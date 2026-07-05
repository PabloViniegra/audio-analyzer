import { useEffect, useRef } from "react"
import type { CanvasSize } from "../domain/drawBars"
import { useVisualizerLoop, type VisualizerMode } from "./useVisualizerLoop"

export type { VisualizerMode }

interface VisualizerCanvasProps {
  analyserNode: AnalyserNode | null
  mode: VisualizerMode
}

const FREQ_TICKS = ["60", "250", "1k", "4k", "16k"]
const DB_TICKS = ["0", "-20", "-40", "-60"]
const AXIS_GUTTER_PX = 32

export function VisualizerCanvas({ analyserNode, mode }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const rect = canvas.getBoundingClientRect()
      const drawWidth = Math.max(0, rect.width - AXIS_GUTTER_PX * 2)
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.round(drawWidth * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width: drawWidth, height: rect.height }
    })

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useVisualizerLoop({ analyserNode, mode, canvasRef, sizeRef })

  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 flex w-8 flex-col justify-between py-1.5 pr-2 text-right"
      >
        {FREQ_TICKS.map((label, i) => (
          <div key={label} className="flex items-center justify-end gap-2">
            <span className="numeric text-[10px] font-medium tracking-[0.04em] text-muted">
              {label}
            </span>
            <span
              className={`h-px w-2 ${
                i === 0 || i === FREQ_TICKS.length - 1
                  ? "bg-border-strong"
                  : "bg-border"
              }`}
            />
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 flex w-8 flex-col justify-between py-1.5 pl-2 text-left"
      >
        {DB_TICKS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`h-px w-2 ${
                i === 0 || i === DB_TICKS.length - 1
                  ? "bg-border-strong"
                  : "bg-border"
              }`}
            />
            <span className="numeric text-[10px] font-medium tracking-[0.04em] text-muted">
              {label}
            </span>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Audio visualizer"
        className="block h-48 w-full"
        style={{ marginLeft: AXIS_GUTTER_PX, marginRight: AXIS_GUTTER_PX }}
      />
    </div>
  )
}