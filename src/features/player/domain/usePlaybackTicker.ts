import { useEffect } from 'react'
import { usePlayerStore } from './playerStore'

/** ~10Hz — matches the PRD's throttled seek-bar position requirement. */
const TICK_INTERVAL_MS = 100

/**
 * Keeps `currentTime` in sync with playback while a Track is playing, by
 * calling `updateCurrentTime` on a plain interval. Runs at ~10Hz and is
 * fully decoupled from the Visualizer's independent 60fps rAF loop — this
 * only drives the seek bar's displayed position, never canvas drawing, so
 * it doesn't tie UI re-renders to frame rate.
 */
export function usePlaybackTicker(): void {
  const status = usePlayerStore((state) => state.status)
  const updateCurrentTime = usePlayerStore((state) => state.updateCurrentTime)

  useEffect(() => {
    if (status !== 'playing') return
    const intervalId = setInterval(updateCurrentTime, TICK_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [status, updateCurrentTime])
}
