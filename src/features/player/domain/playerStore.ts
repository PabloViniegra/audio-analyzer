import { create } from 'zustand'
import { clamp } from '../../../shared/utils/clamp'
import { createAudioGraph, type AudioGraph } from './audioGraph'
import { decodeAudioFile } from './decodeAudioFile'

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'

interface PlayerData {
  status: PlayerStatus
  errorMessage: string | null
  audioBuffer: AudioBuffer | null
  audioContext: AudioContext | null
  audioGraph: AudioGraph | null
  /** Track duration in seconds, 0 until a Track is loaded. */
  duration: number
  /** Throttled (~10Hz) playback position in seconds — see usePlaybackTicker. */
  currentTime: number
  /**
   * The `audioContext.currentTime` value that corresponds to track position
   * 0 for the currently playing/paused source. `AudioBufferSourceNode`
   * exposes no playback-position getter, so position is derived as
   * `audioContext.currentTime - originTime`. This works across pause/resume
   * because `suspend()`/`resume()` freeze and resume the context's own
   * clock along with the source. Internal bookkeeping, not for UI reads.
   */
  originTime: number
}

interface PlayerState extends PlayerData {
  loadFile: (file: File) => Promise<void>
  play: () => void
  pause: () => void
  /** Jumps playback to `time` seconds, clamped to the Track's duration. */
  seek: (time: number) => void
  /** Recomputes `currentTime` from the audio clock. Call while playing. */
  updateCurrentTime: () => void
  dismissError: () => void
}

export const initialPlayerState: PlayerData = {
  status: 'idle',
  errorMessage: null,
  audioBuffer: null,
  audioContext: null,
  audioGraph: null,
  duration: 0,
  currentTime: 0,
  originTime: 0,
}

function teardownGraph(graph: AudioGraph | null) {
  if (!graph) return
  try {
    graph.source.stop()
  } catch {
    // already stopped/ended — nothing to do
  }
  graph.source.disconnect()
  graph.gainNode.disconnect()
  graph.analyserNode.disconnect()
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialPlayerState,

  async loadFile(file) {
    const previousGraph = get().audioGraph
    set({
      status: 'loading',
      errorMessage: null,
      audioBuffer: null,
      audioGraph: null,
      duration: 0,
      currentTime: 0,
      originTime: 0,
    })
    teardownGraph(previousGraph)

    try {
      const audioBuffer = await decodeAudioFile(file)
      set({ status: 'ready', audioBuffer, duration: audioBuffer.duration })
    } catch (error) {
      set({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to decode audio file.',
      })
    }
  },

  play() {
    const { status, audioBuffer, audioContext, audioGraph, currentTime } = get()
    if (!audioBuffer || (status !== 'ready' && status !== 'paused')) return

    if (audioGraph && audioContext) {
      void audioContext.resume()
      set({ status: 'playing' })
      return
    }

    const context = audioContext ?? new AudioContext()
    const graph = createAudioGraph(context, audioBuffer)
    graph.source.onended = () => {
      if (get().audioGraph?.source === graph.source) {
        set({ status: 'ready', audioGraph: null, currentTime: 0 })
      }
    }
    // Start from `currentTime` rather than always 0, so a seek performed
    // before the first play() (while there's no graph yet) is honored.
    graph.source.start(0, currentTime)
    set({
      status: 'playing',
      audioContext: context,
      audioGraph: graph,
      originTime: context.currentTime - currentTime,
    })
  },

  pause() {
    const { status, audioContext } = get()
    if (status !== 'playing') return
    // Snap the displayed position to the exact pause instant instead of
    // leaving it up to ~100ms stale from the last throttled tick.
    get().updateCurrentTime()
    void audioContext?.suspend()
    set({ status: 'paused' })
  },

  seek(time) {
    const { status, audioBuffer, audioContext, audioGraph } = get()
    if (!audioBuffer) return
    if (status !== 'playing' && status !== 'paused' && status !== 'ready') return

    const target = clamp(time, 0, audioBuffer.duration)

    if (!audioContext || !audioGraph) {
      // No graph yet — this Track hasn't been played this session, and the
      // AudioContext is only created on the first play() gesture (autoplay
      // policy). Just remember the offset for play() to start from.
      set({ currentTime: target })
      return
    }

    // AudioBufferSourceNode can't be repositioned in place: stop the current
    // source and start a fresh one at the target offset, reusing the same
    // gain/analyser nodes so the rest of the graph (and the Visualizer's
    // analyser reference) stays connected and unchanged.
    audioGraph.source.onended = null
    try {
      audioGraph.source.stop()
    } catch {
      // already stopped/ended — nothing to do
    }
    audioGraph.source.disconnect()

    const newSource = audioContext.createBufferSource()
    newSource.buffer = audioBuffer
    newSource.connect(audioGraph.gainNode)
    newSource.onended = () => {
      if (get().audioGraph?.source === newSource) {
        set({ status: 'ready', audioGraph: null, currentTime: 0 })
      }
    }
    newSource.start(0, target)

    set({
      audioGraph: { ...audioGraph, source: newSource },
      currentTime: target,
      originTime: audioContext.currentTime - target,
    })
  },

  updateCurrentTime() {
    const { status, audioContext, duration, originTime } = get()
    if (status !== 'playing' || !audioContext) return
    set({ currentTime: clamp(audioContext.currentTime - originTime, 0, duration) })
  },

  dismissError() {
    if (get().status !== 'error') return
    set({ status: 'idle', errorMessage: null })
  },
}))
