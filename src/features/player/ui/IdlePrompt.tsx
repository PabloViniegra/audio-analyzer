import type { DragEvent, KeyboardEvent } from 'react'
import { useState } from 'react'
import { Surface } from '@heroui/react'

interface IdlePromptProps {
  onBrowseClick: () => void
  onFileDrop: (file: File) => void
}

export function IdlePrompt({ onBrowseClick, onFileDrop }: IdlePromptProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onBrowseClick()
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingOver(true)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingOver(false)
    const file = event.dataTransfer.files[0]
    if (file) onFileDrop(file)
  }

  return (
    <Surface
      aria-label="Browse or drop an audio file"
      className={`flex w-full max-w-sm cursor-pointer flex-col items-center gap-3 rounded-2xl p-8 text-center transition ${
        isDraggingOver
          ? 'border-accent bg-accent-soft ring-1 ring-accent'
          : 'border-border bg-surface-secondary hover:bg-surface-tertiary'
      }`}
      role="button"
      tabIndex={0}
      variant="transparent"
      onClick={onBrowseClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
    >
      <DropGlyph active={isDraggingOver} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">
          {isDraggingOver ? 'Release to load' : 'Drop a track to load'}
        </p>
        <p className="text-xs text-muted">
          or click to browse · mp3, wav, flac, ogg, m4a
        </p>
      </div>
    </Surface>
  )
}

function DropGlyph({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={`flex size-12 items-center justify-center rounded-full border transition ${
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-border bg-surface text-muted'
      }`}
    >
      <svg
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 4v12" />
        <path d="m6 10 6-6 6 6" />
        <path d="M5 20h14" />
      </svg>
    </div>
  )
}
