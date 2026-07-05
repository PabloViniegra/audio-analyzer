import { ToggleButton, Tooltip } from '@heroui/react'

interface MuteButtonProps {
  isMuted: boolean
  onToggle: (muted: boolean) => void
}

export function MuteButton({ isMuted, onToggle }: MuteButtonProps) {
  return (
    <Tooltip delay={0}>
      <ToggleButton
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        isSelected={isMuted}
        variant="ghost"
        onChange={onToggle}
      >
        <SpeakerIcon muted={isMuted} />
        <span>{isMuted ? 'Muted' : 'Mute'}</span>
      </ToggleButton>
      <Tooltip.Content showArrow placement="top">
        <p>{isMuted ? 'Unmute output' : 'Mute output'}</p>
      </Tooltip.Content>
    </Tooltip>
  )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
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
      <path d="M11 5 6 9H3v6h3l5 4Z" />
      {!muted ? (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      ) : (
        <path d="m22 9-6 6M16 9l6 6" />
      )}
    </svg>
  )
}
