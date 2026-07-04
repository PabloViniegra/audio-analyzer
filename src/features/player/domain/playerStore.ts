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
  /** When true, reaching the end of the Track replays it instead of stopping. */
  loop: boolean
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
  /**
   * Enables/disables looping. Backed by the AudioBufferSourceNode's native
   * `loop` flag rather than a manual restart-on-`onended` — it's gapless at
   * the loop point, and unlike the source's buffer/start offset, `loop` can
   * be flipped live on an already-playing source with no rebuild. The
   * tradeoff: a looping source never fires `onended` on its own, so
   * `updateCurrentTime` wraps `currentTime` with a modulo while loop is on
   * instead of clamping, and turning loop off mid-playback rebases
   * `originTime` onto the current lap so that math keeps lining up with the
   * source's actual (now single-lap) remaining playback once it stops
   * looping.
   */
  setLoop: (loop: boolean) => void
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
  loop: false,
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
    const { status, audioBuffer, audioContext, audioGraph, currentTime, volume, muted, loop } =
      get()
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
    // Native looping (see setLoop's doc comment for why): gapless, and a
    // looping source never fires `onended` on its own, so the reset-to-
    // 'ready' below simply won't run again until loop is turned off.
    graph.source.loop = loop
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
    const { status, audioBuffer, audioContext, audioGraph, loop } = get()
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
    // The replacement source starts fresh — it doesn't inherit `loop` from
    // the old one, so it has to be carried over explicitly.
    newSource.loop = loop
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
    const { status, audioContext, duration, originTime, loop } = get()
    if (status !== 'playing' || !audioContext) return
    const elapsed = audioContext.currentTime - originTime
    // A native-looping source keeps advancing past `duration` every lap
    // instead of ending, so wrap it back into a single lap instead of
    // clamping it flat against the end.
    const position = loop && duration > 0 ? elapsed % duration : clamp(elapsed, 0, duration)
    set({ currentTime: position })
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

  setLoop(loop) {
    const { loop: current, audioGraph, audioContext } = get()
    if (loop === current) return

    // Flips live on an already-playing source — no rebuild needed.
    if (audioGraph) {
      audioGraph.source.loop = loop
    }

    if (!loop && audioContext) {
      // originTime may be many laps stale (native looping never resets
      // it), so the plain elapsed/clamp math updateCurrentTime uses once
      // loop is off would jump straight to `duration`. Refresh the in-lap
      // position first — still under the OLD loop=true modulo, since state
      // hasn't flipped yet — then rebase originTime onto it, so it lines up
      // with the source's actual remaining (now non-looping) playback.
      get().updateCurrentTime()
      set({ loop, originTime: audioContext.currentTime - get().currentTime })
      return
    }

    set({ loop })
  },

  dismissError() {
    if (get().status !== 'error') return
    set({ status: 'idle', errorMessage: null })
  },
}))
