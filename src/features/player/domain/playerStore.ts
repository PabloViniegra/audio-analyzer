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
  /**
   * Desired playback gain in [0, 1] — what the volume slider shows. Kept
   * separate from `muted` so un-muting can restore it: muting never
   * overwrites this value, it only forces the GainNode's actual gain to 0.
   */
  volume: number
  /** When true, the GainNode's actual gain is forced to 0 regardless of `volume`. */
  muted: boolean
}

interface PlayerState extends PlayerData {
  loadFile: (file: File) => Promise<void>
  play: () => void
  pause: () => void
  /** Jumps playback to `time` seconds, clamped to the Track's duration. */
  seek: (time: number) => void
  /** Recomputes `currentTime` from the audio clock. Call while playing. */
  updateCurrentTime: () => void
  /** Sets the desired volume level, clamped to [0, 1]. No audible effect while muted. */
  setVolume: (level: number) => void
  /** Mutes/unmutes playback. Un-muting restores the current `volume` level. */
  setMuted: (muted: boolean) => void
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
  volume: 1,
  muted: false,
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
    const { status, audioBuffer, audioContext, audioGraph, currentTime, volume, muted } = get()
    if (!audioBuffer || (status !== 'ready' && status !== 'paused')) return

    if (audioGraph && audioContext) {
      void audioContext.resume()
      set({ status: 'playing' })
      return
    }

    const context = audioContext ?? new AudioContext()
    const graph = createAudioGraph(context, audioBuffer)
    // Apply volume/mute set before this Track was ever played (there's no
    // graph yet to carry a gain value until now) — same idea as honoring a
    // pre-first-play seek offset below.
    graph.gainNode.gain.value = muted ? 0 : volume
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

  setVolume(level) {
    const target = clamp(level, 0, 1)
    const { muted, audioGraph } = get()
    // While muted, the audible gain stays at 0 — the new level is only
    // stored, and takes effect once `setMuted(false)` restores it.
    if (audioGraph && !muted) {
      audioGraph.gainNode.gain.value = target
    }
    set({ volume: target })
  },

  setMuted(muted) {
    const { volume, audioGraph } = get()
    if (audioGraph) {
      audioGraph.gainNode.gain.value = muted ? 0 : volume
    }
    set({ muted })
  },

  dismissError() {
    if (get().status !== 'error') return
    set({ status: 'idle', errorMessage: null })
  },
}))
