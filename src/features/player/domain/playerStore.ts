import { create } from 'zustand'
import { createAudioGraph, type AudioGraph } from './audioGraph'
import { decodeAudioFile } from './decodeAudioFile'

export type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'

interface PlayerData {
  status: PlayerStatus
  errorMessage: string | null
  audioBuffer: AudioBuffer | null
  audioContext: AudioContext | null
  audioGraph: AudioGraph | null
}

interface PlayerState extends PlayerData {
  loadFile: (file: File) => Promise<void>
  play: () => void
  pause: () => void
  dismissError: () => void
}

export const initialPlayerState: PlayerData = {
  status: 'idle',
  errorMessage: null,
  audioBuffer: null,
  audioContext: null,
  audioGraph: null,
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
    set({ status: 'loading', errorMessage: null, audioBuffer: null, audioGraph: null })
    teardownGraph(previousGraph)

    try {
      const audioBuffer = await decodeAudioFile(file)
      set({ status: 'ready', audioBuffer })
    } catch (error) {
      set({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to decode audio file.',
      })
    }
  },

  play() {
    const { status, audioBuffer, audioContext, audioGraph } = get()
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
        set({ status: 'ready', audioGraph: null })
      }
    }
    graph.source.start(0)
    set({ status: 'playing', audioContext: context, audioGraph: graph })
  },

  pause() {
    const { status, audioContext } = get()
    if (status !== 'playing') return
    void audioContext?.suspend()
    set({ status: 'paused' })
  },

  dismissError() {
    if (get().status !== 'error') return
    set({ status: 'idle', errorMessage: null })
  },
}))
