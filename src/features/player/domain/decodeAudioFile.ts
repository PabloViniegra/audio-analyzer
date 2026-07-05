const DECODE_ERROR_MESSAGE =
  'Unable to decode this audio file. It may be corrupt or in an unsupported format.'

/**
 * Decodes a local audio File into an AudioBuffer.
 *
 * Uses a throwaway OfflineAudioContext purely as a decoder — this avoids
 * constructing the real (playback) AudioContext at load time, which must
 * only happen on the first play gesture (browser autoplay policy).
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const decoder = new OfflineAudioContext(1, 1, 44100)
    return await decoder.decodeAudioData(arrayBuffer)
  } catch {
    throw new Error(DECODE_ERROR_MESSAGE)
  }
}
