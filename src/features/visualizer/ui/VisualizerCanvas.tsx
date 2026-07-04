import { useEffect, useRef } from 'react'
import type { CanvasSize } from '../domain/drawBars'
import { useVisualizerLoop, type VisualizerMode } from '../domain/useVisualizerLoop'

export type { VisualizerMode }

interface VisualizerCanvasProps {
  analyserNode: AnalyserNode | null
  mode: VisualizerMode
}

/**
 * Deep module: draws whatever `analyserNode` produces, or nothing if it's
 * `null`. Props-only — no Zustand, no knowledge of playback status, file
 * names, or controls. Whoever wires the analyser node in (e.g. PlayerCard)
 * owns that context; this component only turns analyser data into pixels,
 * which keeps it reusable and testable in isolation from Player.
 */
export function VisualizerCanvas({ analyserNode, mode }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0 })

  // Keeps the canvas's backing store at `CSS size * devicePixelRatio` so
  // bars stay sharp regardless of container size or screen density.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const { width, height } = entry.contentRect
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width, height }
    })

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useVisualizerLoop({ analyserNode, mode, canvasRef, sizeRef })

  return <canvas ref={canvasRef} className="h-32 w-full rounded-xl bg-default" />
}
