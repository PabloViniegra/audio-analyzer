import { useState } from 'react'
import { Slider } from '@heroui/react'
import { formatTime } from '../../../shared/utils/formatTime'

interface SeekBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

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
    <div className="flex w-full flex-col gap-2">
      <Slider
        aria-label="Seek"
        className="w-full"
        maxValue={duration}
        minValue={0}
        step={0.1}
        value={displayTime}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
      >
        <Slider.Output className="numeric flex items-center justify-between text-xs text-muted">
          <span className="text-foreground">
            {formatTime(displayTime)}
          </span>
          <span>{formatTime(duration)}</span>
        </Slider.Output>
        <Slider.Track className="h-1.5">
          <Slider.Fill className="bg-accent" />
          <Slider.Thumb className="size-3.5 border-2 border-background bg-accent shadow-[0_0_8px_var(--accent)]" />
        </Slider.Track>
      </Slider>
    </div>
  )
}
