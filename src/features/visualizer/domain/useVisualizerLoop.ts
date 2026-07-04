import type { RefObject } from 'react'
import { useEffect } from 'react'
import { drawBars, type CanvasSize } from './drawBars'
import { drawWaveform } from './drawWaveform'

export type VisualizerMode = 'bars' | 'waveform'

/**
 * frequencyBinCount = fftSize / 2. The Web Audio default (2048) yields ~1024
 * sub-pixel-wide bars that read as noise rather than distinct bars, so Bars
 * mode asks the analyser for a coarser FFT purely for its own rendering —
 * this is a read/write on the node handed to us via props, not a dependency
 * on anything Player-specific, and it doesn't affect playback.
 */
const BARS_FFT_SIZE = 128

/**
 * Waveform mode reads getByteTimeDomainData, whose sample count equals
 * fftSize directly (not fftSize / 2). A continuous trace wants many samples
 * for a smooth line rather than a chunky one, the opposite tradeoff from
 * Bars mode above, so it asks the same node for a much larger FFT while its
 * effect owns the node.
 */
const WAVEFORM_FFT_SIZE = 2048

interface UseVisualizerLoopArgs {
  analyserNode: AnalyserNode | null
  mode: VisualizerMode
  canvasRef: RefObject<HTMLCanvasElement | null>
  sizeRef: RefObject<CanvasSize>
}

/**
 * Owns the visualizer's requestAnimationFrame loop: each frame, reads
 * frequency- or time-domain data off `analyserNode` (depending on `mode`)
 * and draws it. Starts as soon as an analyser node is available, stops when
 * it becomes `null`, `mode` changes, or the component unmounts. Runs
 * entirely outside React's render cycle — per-frame data never touches
 * React state or Zustand.
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

    node.fftSize = mode === 'bars' ? BARS_FFT_SIZE : WAVEFORM_FFT_SIZE
    const data = new Uint8Array(mode === 'bars' ? node.frequencyBinCount : node.fftSize)
    let frameId: number

    const tick = () => {
      if (mode === 'bars') {
        node.getByteFrequencyData(data)
        drawBars(ctx, data, sizeRef.current)
      } else {
        node.getByteTimeDomainData(data)
        drawWaveform(ctx, data, sizeRef.current)
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameId)
  }, [analyserNode, mode, canvasRef, sizeRef])
}
