import { Button } from '@heroui/react'

interface PlayPauseButtonProps {
  isPlaying: boolean
  isDisabled?: boolean
  onToggle: () => void
}

export function PlayPauseButton({
  isPlaying,
  isDisabled,
  onToggle,
}: PlayPauseButtonProps) {
  return (
    <Button
      aria-label={isPlaying ? 'Pause' : 'Play'}
      isDisabled={isDisabled}
      size="lg"
      variant="primary"
      onPress={onToggle}
    >
      <PlayPauseIcon playing={isPlaying} />
      <span>{isPlaying ? 'Pause' : 'Play'}</span>
    </Button>
  )
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg
        aria-hidden
        className="size-4"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect height="14" rx="1.5" width="4" x="6" y="5" />
        <rect height="14" rx="1.5" width="4" x="14" y="5" />
      </svg>
    )
  }
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}

