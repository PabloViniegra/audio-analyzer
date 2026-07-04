import type { ChangeEvent } from 'react'
import { useEffect, useRef } from 'react'
import { Button, Card, Spinner, toast } from '@heroui/react'
import { usePlayerStore } from '../domain/playerStore'
import { IdlePrompt } from './IdlePrompt'
import { PlayPauseButton } from './PlayPauseButton'

export function PlayerCard() {
  const status = usePlayerStore((state) => state.status)
  const errorMessage = usePlayerStore((state) => state.errorMessage)
  const loadFile = usePlayerStore((state) => state.loadFile)
  const play = usePlayerStore((state) => state.play)
  const pause = usePlayerStore((state) => state.pause)
  const dismissError = usePlayerStore((state) => state.dismissError)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status !== 'error') return
    toast.danger(errorMessage ?? 'Failed to decode audio file.')
    dismissError()
  }, [status, errorMessage, dismissError])

  function handleBrowseClick() {
    inputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void loadFile(file)
  }

  function handleToggle() {
    if (status === 'playing') {
      pause()
    } else {
      play()
    }
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>Player</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col items-center gap-4">
        {status === 'loading' && <Spinner aria-label="Decoding audio file" />}

        {(status === 'idle' || status === 'error') && (
          <IdlePrompt onBrowseClick={handleBrowseClick} />
        )}

        {(status === 'ready' || status === 'playing' || status === 'paused') && (
          <div className="flex items-center gap-3">
            <PlayPauseButton isPlaying={status === 'playing'} onToggle={handleToggle} />
            <Button variant="secondary" onPress={handleBrowseClick}>
              Load another file
            </Button>
          </div>
        )}

        <input
          ref={inputRef}
          accept="audio/*"
          className="hidden"
          type="file"
          onChange={handleFileChange}
        />
      </Card.Content>
    </Card>
  )
}
