import { describe, expect, it, vi } from 'vitest'
import { createAudioGraph } from './audioGraph'

function createMockNode() {
  return { connect: vi.fn() }
}

function createMockAudioContext() {
  const source = { ...createMockNode(), buffer: null as AudioBuffer | null }
  const gainNode = createMockNode()
  const analyserNode = createMockNode()

  return {
    destination: {},
    createBufferSource: vi.fn(() => source),
    createGain: vi.fn(() => gainNode),
    createAnalyser: vi.fn(() => analyserNode),
  }
}

describe('createAudioGraph', () => {
  it('wires source -> gain -> analyser -> destination and assigns the buffer', () => {
    const context = createMockAudioContext()
    const buffer = {} as AudioBuffer

    const graph = createAudioGraph(context as unknown as AudioContext, buffer)

    expect(context.createBufferSource).toHaveBeenCalledOnce()
    expect(context.createGain).toHaveBeenCalledOnce()
    expect(context.createAnalyser).toHaveBeenCalledOnce()
    expect(graph.source.buffer).toBe(buffer)
    expect(graph.source.connect).toHaveBeenCalledWith(graph.gainNode)
    expect(graph.gainNode.connect).toHaveBeenCalledWith(graph.analyserNode)
    expect(graph.analyserNode.connect).toHaveBeenCalledWith(context.destination)
  })
})
