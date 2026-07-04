import { ToggleButton } from '@heroui/react'

interface LoopButtonProps {
  isLooping: boolean
  onToggle: (loop: boolean) => void
}

export function LoopButton({ isLooping, onToggle }: LoopButtonProps) {
  return (
    <ToggleButton
      aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
      isSelected={isLooping}
      onChange={onToggle}
    >
      Loop
    </ToggleButton>
  )
}
