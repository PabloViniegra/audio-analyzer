import { ToggleButton, Tooltip } from '@heroui/react'

interface LoopButtonProps {
  isLooping: boolean
  onToggle: (loop: boolean) => void
}

export function LoopButton({ isLooping, onToggle }: LoopButtonProps) {
  return (
    <Tooltip delay={0}>
      <ToggleButton
        aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
        isSelected={isLooping}
        variant="ghost"
        onChange={onToggle}
      >
        <LoopIcon />
        <span>Loop</span>
      </ToggleButton>
      <Tooltip.Content showArrow placement="top">
        <p>{isLooping ? 'Looping on' : 'Loop the track'}</p>
      </Tooltip.Content>
    </Tooltip>
  )
}

function LoopIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
