import { Button } from '@heroui/react'

interface PlayPauseButtonProps {
  isPlaying: boolean
  isDisabled?: boolean
  onToggle: () => void
}

export function PlayPauseButton({ isPlaying, isDisabled, onToggle }: PlayPauseButtonProps) {
  return (
    <Button isDisabled={isDisabled} variant="primary" onPress={onToggle}>
      {isPlaying ? 'Pause' : 'Play'}
    </Button>
  )
}
