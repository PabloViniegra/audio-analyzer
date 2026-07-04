import { Slider } from '@heroui/react'

interface VolumeSliderProps {
  volume: number
  onVolumeChange: (level: number) => void
}

/**
 * Drives the GainNode's gain directly on every drag tick (not just on
 * release like SeekBar) — unlike seeking, adjusting gain is cheap, and
 * live feedback while dragging is the expected volume-slider UX.
 */
export function VolumeSlider({ volume, onVolumeChange }: VolumeSliderProps) {
  function toLevel(value: number | number[]) {
    return Array.isArray(value) ? value[0] : value
  }

  function handleChange(value: number | number[]) {
    onVolumeChange(toLevel(value))
  }

  return (
    <Slider
      aria-label="Volume"
      className="w-full"
      formatOptions={{ style: 'percent' }}
      maxValue={1}
      minValue={0}
      step={0.01}
      value={volume}
      onChange={handleChange}
    >
      <Slider.Output />
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  )
}
