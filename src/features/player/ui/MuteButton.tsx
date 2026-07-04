import { ToggleButton } from '@heroui/react'

interface MuteButtonProps {
  isMuted: boolean
  onToggle: (muted: boolean) => void
}

export function MuteButton({ isMuted, onToggle }: MuteButtonProps) {
  return (
    <ToggleButton aria-label={isMuted ? 'Unmute' : 'Mute'} isSelected={isMuted} onChange={onToggle}>
      {isMuted ? 'Unmute' : 'Mute'}
    </ToggleButton>
  )
}
