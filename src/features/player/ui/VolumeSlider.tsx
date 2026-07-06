import { useState } from 'react'
import { Slider } from '@heroui/react'

interface VolumeSliderProps {
  volume: number
  isMuted: boolean
  onVolumeChange: (level: number) => void
}

const MIN_DB = -60

function toLevel(value: number | number[]) {
  return Array.isArray(value) ? value[0] : value
}

export function VolumeSlider({ volume, isMuted, onVolumeChange }: VolumeSliderProps) {
  const [draftLevel, setDraftLevel] = useState<number | null>(null)
  const displayLevel = draftLevel ?? volume
  const dbValue =
    displayLevel <= 0 ? MIN_DB : Math.round(20 * Math.log10(displayLevel))

  function handleChange(value: number | number[]) {
    const next = toLevel(value)
    setDraftLevel(next)
    onVolumeChange(next)
  }

  function handleChangeEnd() {
    setDraftLevel(null)
  }

  return (
    <div className="flex min-w-44 flex-1 items-center gap-3">
      <Slider
        aria-label="Volume"
        className="flex-1"
        maxValue={1}
        minValue={0}
        step={0.01}
        value={displayLevel}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
      >
        <Slider.Output className="numeric text-xs text-muted">
          {isMuted ? '−∞ dB' : `${dbValue} dB`}
        </Slider.Output>
        <Slider.Track className="h-1.5">
          <Slider.Fill className={isMuted ? 'bg-default' : 'bg-accent'} />
          <Slider.Thumb className="size-3.5 border-2 border-background bg-accent" />
        </Slider.Track>
      </Slider>
    </div>
  )
}
