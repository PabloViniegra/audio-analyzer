import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialPlayerState, usePlayerStore } from './playerStore'

function fakeFile(name = 'track.mp3') {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'audio/mpeg' })
}

class MockOfflineAudioContext {
  decodeAudioData = vi.fn().mockResolvedValue({} as AudioBuffer)
}

function createMockNode() {
  return { connect: vi.fn(), disconnect: vi.fn() }
}

class MockAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'suspended'
  currentTime = 0
  destination = {}
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  suspend = vi.fn(async () => {
    this.state = 'suspended'
  })
  createBufferSource = vi.fn(() => ({
    ...createMockNode(),
    buffer: null as AudioBuffer | null,
    onended: null as (() => void) | null,
    start: vi.fn(),
    stop: vi.fn(),
  }))
  createGain = vi.fn(() => ({ ...createMockNode(), gain: { value: 1 } }))
  createAnalyser = vi.fn(() => createMockNode())
}

beforeEach(() => {
  vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext)
  vi.stubGlobal('AudioContext', MockAudioContext)
  usePlayerStore.setState(initialPlayerState)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePlayerStore', () => {
  it('tracer bullet: loading a valid file transitions idle -> loading -> ready', async () => {
    expect(usePlayerStore.getState().status).toBe('idle')

    const loadPromise = usePlayerStore.getState().loadFile(fakeFile())
    expect(usePlayerStore.getState().status).toBe('loading')

    await loadPromise

    expect(usePlayerStore.getState().status).toBe('ready')
    expect(usePlayerStore.getState().errorMessage).toBeNull()
  })

  it('sets status to error with a message when decoding fails', async () => {
    vi.stubGlobal(
      'OfflineAudioContext',
      class {
        decodeAudioData = vi.fn().mockRejectedValue(new DOMException('bad', 'EncodingError'))
      },
    )

    await usePlayerStore.getState().loadFile(fakeFile('corrupt.mp3'))

    expect(usePlayerStore.getState().status).toBe('error')
    expect(usePlayerStore.getState().errorMessage).toMatch(/unable to decode/i)
  })

  it('play() builds the audio graph and transitions ready -> playing', async () => {
    await usePlayerStore.getState().loadFile(fakeFile())

    usePlayerStore.getState().play()

    const { status, audioGraph } = usePlayerStore.getState()
    expect(status).toBe('playing')
    // Second arg is the buffer offset to start from (0 here — see the seek tests
    // below for the non-zero case).
    expect(audioGraph?.source.start).toHaveBeenCalledWith(0, 0)
  })

  it('pause() suspends the context and transitions playing -> paused', async () => {
    await usePlayerStore.getState().loadFile(fakeFile())
    usePlayerStore.getState().play()

    usePlayerStore.getState().pause()

    expect(usePlayerStore.getState().status).toBe('paused')
    expect(usePlayerStore.getState().audioContext?.suspend).toHaveBeenCalledOnce()
  })

  it('play() after pause resumes the same graph instead of rebuilding it', async () => {
    await usePlayerStore.getState().loadFile(fakeFile())
    usePlayerStore.getState().play()
    const graphAfterFirstPlay = usePlayerStore.getState().audioGraph
    usePlayerStore.getState().pause()

    usePlayerStore.getState().play()

    expect(usePlayerStore.getState().status).toBe('playing')
    expect(usePlayerStore.getState().audioGraph).toBe(graphAfterFirstPlay)
    expect(usePlayerStore.getState().audioContext?.resume).toHaveBeenCalledOnce()
  })

  it('loading a new file while one is playing tears down the previous graph', async () => {
    await usePlayerStore.getState().loadFile(fakeFile('first.mp3'))
    usePlayerStore.getState().play()
    const firstGraph = usePlayerStore.getState().audioGraph

    await usePlayerStore.getState().loadFile(fakeFile('second.mp3'))

    expect(firstGraph?.source.stop).toHaveBeenCalledOnce()
    expect(firstGraph?.source.disconnect).toHaveBeenCalledOnce()
    expect(usePlayerStore.getState().status).toBe('ready')
    expect(usePlayerStore.getState().audioGraph).toBeNull()
  })

  it('ignores a stale onended event from a source that was already replaced', async () => {
    await usePlayerStore.getState().loadFile(fakeFile('first.mp3'))
    usePlayerStore.getState().play()
    const staleSource = usePlayerStore.getState().audioGraph?.source

    await usePlayerStore.getState().loadFile(fakeFile('second.mp3'))
    usePlayerStore.getState().play()
    const currentGraph = usePlayerStore.getState().audioGraph

    staleSource?.onended?.(new Event('ended'))

    expect(usePlayerStore.getState().status).toBe('playing')
    expect(usePlayerStore.getState().audioGraph).toBe(currentGraph)
  })

  describe('seek and time-update transitions', () => {
    async function loadReadyFile(duration = 120) {
      vi.stubGlobal(
        'OfflineAudioContext',
        class {
          decodeAudioData = vi.fn().mockResolvedValue({ duration } as AudioBuffer)
        },
      )
      await usePlayerStore.getState().loadFile(fakeFile())
    }

    it('loadFile sets duration from the decoded buffer', async () => {
      await loadReadyFile(180)

      expect(usePlayerStore.getState().duration).toBe(180)
    })

    it('updateCurrentTime derives position from the audio clock while playing', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()
      const context = usePlayerStore.getState().audioContext as unknown as MockAudioContext

      context.currentTime = 4.5
      usePlayerStore.getState().updateCurrentTime()

      expect(usePlayerStore.getState().currentTime).toBeCloseTo(4.5)
    })

    it('updateCurrentTime is a no-op once no longer playing', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()
      const context = usePlayerStore.getState().audioContext as unknown as MockAudioContext
      context.currentTime = 4.5
      usePlayerStore.getState().updateCurrentTime()

      usePlayerStore.getState().pause()
      context.currentTime = 99
      usePlayerStore.getState().updateCurrentTime()

      expect(usePlayerStore.getState().currentTime).toBeCloseTo(4.5)
    })

    it('seek() while playing stops the old source and starts a new one at the target offset', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()
      const oldSource = usePlayerStore.getState().audioGraph?.source

      usePlayerStore.getState().seek(30)

      expect(oldSource?.stop).toHaveBeenCalledOnce()
      expect(oldSource?.disconnect).toHaveBeenCalledOnce()
      const graph = usePlayerStore.getState().audioGraph
      expect(graph?.source).not.toBe(oldSource)
      expect(graph?.source.start).toHaveBeenCalledWith(0, 30)
      expect(usePlayerStore.getState().currentTime).toBe(30)
      expect(usePlayerStore.getState().status).toBe('playing')
    })

    it('seek() reuses the existing gain/analyser nodes instead of rebuilding the graph', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()
      const { gainNode, analyserNode } = usePlayerStore.getState().audioGraph!

      usePlayerStore.getState().seek(30)

      const graph = usePlayerStore.getState().audioGraph
      expect(graph?.gainNode).toBe(gainNode)
      expect(graph?.analyserNode).toBe(analyserNode)
      expect(graph?.source.connect).toHaveBeenCalledWith(gainNode)
    })

    it('seek() clamps a target past the end of the Track to the duration', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()

      usePlayerStore.getState().seek(999)

      expect(usePlayerStore.getState().currentTime).toBe(120)
    })

    it('seek() clamps a negative target to zero', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()

      usePlayerStore.getState().seek(-10)

      expect(usePlayerStore.getState().currentTime).toBe(0)
    })

    it('seek() before the first play() only remembers the offset', async () => {
      await loadReadyFile(120)

      usePlayerStore.getState().seek(45)

      expect(usePlayerStore.getState().currentTime).toBe(45)
      expect(usePlayerStore.getState().audioContext).toBeNull()
      expect(usePlayerStore.getState().status).toBe('ready')
    })

    it('play() after a seek-while-ready starts the source at the sought offset', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().seek(45)

      usePlayerStore.getState().play()

      expect(usePlayerStore.getState().audioGraph?.source.start).toHaveBeenCalledWith(0, 45)
      expect(usePlayerStore.getState().status).toBe('playing')
    })

    it('seek() while paused updates the position without resuming playback', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()
      usePlayerStore.getState().pause()

      usePlayerStore.getState().seek(60)

      expect(usePlayerStore.getState().status).toBe('paused')
      expect(usePlayerStore.getState().currentTime).toBe(60)
    })

    it('onended resets currentTime to 0 so replaying starts from the beginning', async () => {
      await loadReadyFile(120)
      usePlayerStore.getState().play()
      const source = usePlayerStore.getState().audioGraph?.source

      source?.onended?.(new Event('ended'))

      expect(usePlayerStore.getState().status).toBe('ready')
      expect(usePlayerStore.getState().currentTime).toBe(0)
    })
  })

  describe('volume and mute transitions', () => {
    it('defaults to full volume and unmuted', () => {
      expect(usePlayerStore.getState().volume).toBe(1)
      expect(usePlayerStore.getState().muted).toBe(false)
    })

    it('setVolume updates the stored level and clamps to [0, 1]', () => {
      usePlayerStore.getState().setVolume(0.4)
      expect(usePlayerStore.getState().volume).toBeCloseTo(0.4)

      usePlayerStore.getState().setVolume(1.5)
      expect(usePlayerStore.getState().volume).toBe(1)

      usePlayerStore.getState().setVolume(-1)
      expect(usePlayerStore.getState().volume).toBe(0)
    })

    it('setVolume updates the GainNode value live while a graph exists', async () => {
      await usePlayerStore.getState().loadFile(fakeFile())
      usePlayerStore.getState().play()

      usePlayerStore.getState().setVolume(0.3)

      expect(usePlayerStore.getState().audioGraph?.gainNode.gain.value).toBeCloseTo(0.3)
    })

    it('play() applies a volume set before the first play() to the freshly built graph', async () => {
      await usePlayerStore.getState().loadFile(fakeFile())
      usePlayerStore.getState().setVolume(0.5)

      usePlayerStore.getState().play()

      expect(usePlayerStore.getState().audioGraph?.gainNode.gain.value).toBeCloseTo(0.5)
    })

    it('setMuted(true) forces the GainNode to 0 without changing the stored volume', async () => {
      await usePlayerStore.getState().loadFile(fakeFile())
      usePlayerStore.getState().play()
      usePlayerStore.getState().setVolume(0.6)

      usePlayerStore.getState().setMuted(true)

      expect(usePlayerStore.getState().muted).toBe(true)
      expect(usePlayerStore.getState().volume).toBeCloseTo(0.6)
      expect(usePlayerStore.getState().audioGraph?.gainNode.gain.value).toBe(0)
    })

    it('setMuted(false) restores the previous volume level on the GainNode', async () => {
      await usePlayerStore.getState().loadFile(fakeFile())
      usePlayerStore.getState().play()
      usePlayerStore.getState().setVolume(0.6)
      usePlayerStore.getState().setMuted(true)

      usePlayerStore.getState().setMuted(false)

      expect(usePlayerStore.getState().muted).toBe(false)
      expect(usePlayerStore.getState().audioGraph?.gainNode.gain.value).toBeCloseTo(0.6)
    })

    it('changing volume while muted is silent until unmute, then applies the latest level', async () => {
      await usePlayerStore.getState().loadFile(fakeFile())
      usePlayerStore.getState().play()
      usePlayerStore.getState().setVolume(0.6)
      usePlayerStore.getState().setMuted(true)

      usePlayerStore.getState().setVolume(0.2)
      expect(usePlayerStore.getState().audioGraph?.gainNode.gain.value).toBe(0)

      usePlayerStore.getState().setMuted(false)
      expect(usePlayerStore.getState().audioGraph?.gainNode.gain.value).toBeCloseTo(0.2)
    })

    it('mute set before the first play() is honored by the freshly built graph', async () => {
      await usePlayerStore.getState().loadFile(fakeFile())
      usePlayerStore.getState().setMuted(true)

      usePlayerStore.getState().play()

      expect(usePlayerStore.getState().audioGraph?.gainNode.gain.value).toBe(0)
      expect(usePlayerStore.getState().volume).toBe(1)
    })

    it('loading a new file preserves the current volume and mute settings', async () => {
      usePlayerStore.getState().setVolume(0.7)
      usePlayerStore.getState().setMuted(true)

      await usePlayerStore.getState().loadFile(fakeFile('second.mp3'))

      expect(usePlayerStore.getState().volume).toBeCloseTo(0.7)
      expect(usePlayerStore.getState().muted).toBe(true)
    })
  })
})
