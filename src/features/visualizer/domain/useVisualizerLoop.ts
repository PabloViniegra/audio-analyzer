import type { RefObject } from 'react'
import { useEffect } from 'react'
import { drawBars, type CanvasSize } from './drawBars'

/** Only 'bars' is implemented; 'waveform' is reserved for a later slice. */
export type VisualizerMode = 'bars' | 'waveform'

/**
 * frequencyBinCount = fftSize / 2. The Web Audio default (2048) yields ~1024
 * sub-pixel-wide bars that read as noise rather than distinct bars, so Bars
 * mode asks the analyser for a coarser FFT purely for its own rendering —
 * this is a read/write on the node handed to us via props, not a dependency
 * on anything Player-specific, and it doesn't affect playback.
 */
const FFT_SIZE = 128

interface UseVisualizerLoopArgs {
  analyserNode: AnalyserNode | null
  mode: VisualizerMode
  canvasRef: RefObject<HTMLCanvasElement | null>
  sizeRef: RefObject<CanvasSize>
}

/**
 * Owns the visualizer's requestAnimationFrame loop: each frame, reads
 * frequency-domain data off `analyserNode` and draws it. Starts as soon as
 * an analyser node is available, stops when it becomes `null` or the
 * component unmounts. Runs entirely outside React's render cycle — per-frame
 * data never touches React state or Zustand.
 *
 * Canvas size is read from `sizeRef` on every frame instead of being taken
 * as a value prop, so a resize doesn't require tearing down and restarting
 * the loop.
 */
export function useVisualizerLoop({
  analyserNode,
  mode,
  canvasRef,
  sizeRef,
}: UseVisualizerLoopArgs): void {
  useEffect(() => {
    if (!analyserNode) return
    const node = analyserNode

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    node.fftSize = FFT_SIZE
    const freqData = new Uint8Array(node.frequencyBinCount)
    let frameId: number

    const tick = () => {
      if (mode === 'bars') {
        node.getByteFrequencyData(freqData)
        drawBars(ctx, freqData, sizeRef.current)
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameId)
  }, [analyserNode, mode, canvasRef, sizeRef])
}
