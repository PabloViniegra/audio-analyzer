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
      className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-10 text-center transition hover:opacity-80 ${
        isDraggingOver ? 'border-accent bg-accent-soft' : 'border-transparent'
      }`}
      role="button"
      tabIndex={0}
      variant="secondary"
      onClick={onBrowseClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
    >
      <p className="pointer-events-none text-sm font-medium">No track loaded</p>
      <p className="pointer-events-none text-xs text-muted">
        Click or drop an audio file to load it
      </p>
    </Surface>
  )
}
