import { afterEach, describe, expect, it, vi } from 'vitest'
import { decodeAudioFile } from './decodeAudioFile'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubOfflineAudioContext(decodeAudioData: ReturnType<typeof vi.fn>) {
  vi.stubGlobal(
    'OfflineAudioContext',
    class {
      decodeAudioData = decodeAudioData
    },
  )
}

function fakeFile(name = 'track.mp3') {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'audio/mpeg' })
}

describe('decodeAudioFile', () => {
  it('resolves with the decoded AudioBuffer for a valid file', async () => {
    const decodedBuffer = {} as AudioBuffer
    stubOfflineAudioContext(vi.fn().mockResolvedValue(decodedBuffer))

    await expect(decodeAudioFile(fakeFile())).resolves.toBe(decodedBuffer)
  })

  it('rejects with a friendly message when decoding fails', async () => {
    stubOfflineAudioContext(
      vi.fn().mockRejectedValue(new DOMException('bad data', 'EncodingError')),
    )

    await expect(decodeAudioFile(fakeFile('corrupt.mp3'))).rejects.toThrow(/unable to decode/i)
  })
})
