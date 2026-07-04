import { useState } from 'react'
import { Slider } from '@heroui/react'
import { formatTime } from '../../../shared/utils/formatTime'

interface SeekBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

/**
 * Displays track position/duration and lets the user drag to seek. The
 * thumb tracks the drag live (via local state), but the expensive re-seek
 * (stopping/restarting the underlying audio source) only fires once, on
 * release — not on every intermediate `onChange` — to avoid rebuilding the
 * source dozens of times per second while dragging.
 */
export function SeekBar({ currentTime, duration, onSeek }: SeekBarProps) {
  const [draftTime, setDraftTime] = useState<number | null>(null)
  const displayTime = draftTime ?? currentTime

  function toSeconds(value: number | number[]) {
    return Array.isArray(value) ? value[0] : value
  }

  function handleChange(value: number | number[]) {
    setDraftTime(toSeconds(value))
  }

  function handleChangeEnd(value: number | number[]) {
    const seconds = toSeconds(value)
    setDraftTime(null)
    onSeek(seconds)
  }

  return (
    <Slider
      aria-label="Seek"
      className="w-full"
      maxValue={duration}
      minValue={0}
      step={1}
      value={displayTime}
      onChange={handleChange}
      onChangeEnd={handleChangeEnd}
    >
      <Slider.Output>
        {formatTime(displayTime)} / {formatTime(duration)}
      </Slider.Output>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  )
}
