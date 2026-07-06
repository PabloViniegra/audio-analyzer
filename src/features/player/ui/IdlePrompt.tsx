import type { DragEvent, KeyboardEvent } from "react"
import { useState } from "react"
import { Surface } from "@heroui/react"

interface IdlePromptProps {
  onBrowseClick: () => void
  onFileDrop: (file: File) => void
}

function handleDragOver(event: DragEvent<HTMLDivElement>) {
  event.preventDefault()
  event.dataTransfer.dropEffect = "copy"
}

export function IdlePrompt({ onBrowseClick, onFileDrop }: IdlePromptProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    onBrowseClick()
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingOver(true)
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
      className={`group relative flex w-full max-w-md cursor-pointer flex-col items-center gap-5 overflow-hidden rounded-2xl border p-10 text-center transition-all duration-200 ${
        isDraggingOver
          ? "border-accent bg-accent-soft shadow-[0_0_0_1px_var(--accent),0_20px_60px_-12px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
          : "border-dashed border-border bg-surface-secondary/40 hover:border-border-strong hover:bg-surface-secondary/70"
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
      <div className="flex flex-col gap-1.5">
        <p
          className={`text-sm font-medium tracking-[-0.01em] transition-colors ${
            isDraggingOver ? "text-accent" : "text-foreground"
          }`}
        >
          {isDraggingOver ? "Release to load" : "Drop a track to load"}
        </p>
        <p className="numeric text-[11px] uppercase tracking-[0.16em] text-muted">
          Click to browse · mp3 · wav · flac · ogg · m4a
        </p>
      </div>
      <span
        aria-hidden
        className={`absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 ${
          isDraggingOver ? "opacity-100" : "group-hover:opacity-40"
        }`}
        style={{
          background:
            "radial-gradient(60% 80% at 50% 0%, color-mix(in oklab, var(--accent) 30%, transparent), transparent 70%)",
        }}
      />
    </Surface>
  )
}

function DropGlyph({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={`relative flex size-14 items-center justify-center rounded-2xl border transition-all duration-200 ${
        active
          ? "border-accent bg-accent-soft text-accent scale-105"
          : "border-border bg-surface text-muted group-hover:border-border-strong group-hover:text-foreground"
      }`}
    >
      <svg
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 4v12" />
        <path d="m6 10 6-6 6 6" />
        <path d="M5 20h14" />
      </svg>
      {active && (
        <span
          aria-hidden
          className="absolute -inset-1 rounded-2xl border border-accent/40 opacity-70 [animation:signal-pulse_1.6s_ease-in-out_infinite]"
        />
      )}
    </div>
  )
}