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
  createGain = vi.fn(() => createMockNode())
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
    expect(audioGraph?.source.start).toHaveBeenCalledWith(0)
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
})
