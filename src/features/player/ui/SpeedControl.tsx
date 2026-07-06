import { NumberField } from '@heroui/react'
import { SPEED_MAX, SPEED_MIN, SPEED_STEP } from '../domain/playerStore'

interface SpeedControlProps {
  speed: number
  onSpeedChange: (speed: number) => void
}

export function SpeedControl({ speed, onSpeedChange }: SpeedControlProps) {
  function handleChange(value: number | undefined) {
    if (value === undefined) return
    onSpeedChange(value)
  }

  return (
    <div className="flex items-center gap-1.5">
      <NumberField
        aria-label="Playback speed"
        formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        maxValue={SPEED_MAX}
        minValue={SPEED_MIN}
        step={SPEED_STEP}
        value={speed}
        onChange={handleChange}
      >
        <NumberField.Group>
          <NumberField.DecrementButton aria-label="Decrease speed" />
          <NumberField.Input className="numeric w-14 text-center" />
          <NumberField.IncrementButton aria-label="Increase speed" />
        </NumberField.Group>
      </NumberField>
      <span aria-hidden className="numeric text-xs text-muted">
        ×
      </span>
    </div>
  )
}
