/**
 * Formats a duration in seconds as `m:ss` (e.g. 65.4 -> "1:05").
 * Seconds are floored, not rounded, so the display never overshoots the
 * actual elapsed/remaining time. Non-finite or negative input is treated as 0.
 */
export function formatTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = Math.floor(safeSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
