import type { KeyboardEvent } from 'react'
import { Surface } from '@heroui/react'

interface IdlePromptProps {
  onBrowseClick: () => void
}

export function IdlePrompt({ onBrowseClick }: IdlePromptProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onBrowseClick()
  }

  return (
    <Surface
      aria-label="Browse for an audio file"
      className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl p-10 text-center transition-opacity hover:opacity-80"
      role="button"
      tabIndex={0}
      variant="secondary"
      onClick={onBrowseClick}
      onKeyDown={handleKeyDown}
    >
      <p className="text-sm font-medium">No track loaded</p>
      <p className="text-xs text-muted">Click to browse for an audio file</p>
    </Surface>
  )
}
