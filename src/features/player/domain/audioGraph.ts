export interface AudioGraph {
  source: AudioBufferSourceNode
  gainNode: GainNode
  analyserNode: AnalyserNode
}

/**
 * Wires a decoded buffer into a playback graph:
 * source -> gain -> analyser -> destination.
 *
 * Pure wiring only — does not call `source.start()`.
 */
export function createAudioGraph(context: AudioContext, buffer: AudioBuffer): AudioGraph {
  const source = context.createBufferSource()
  source.buffer = buffer

  const gainNode = context.createGain()
  const analyserNode = context.createAnalyser()

  source.connect(gainNode)
  gainNode.connect(analyserNode)
  analyserNode.connect(context.destination)

  return { source, gainNode, analyserNode }
}
