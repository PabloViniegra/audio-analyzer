import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Separator, Spinner, toast } from '@heroui/react'
import { usePlaybackTicker } from '../domain/usePlaybackTicker'
import { usePlayerStore, type PlayerStatus } from '../domain/playerStore'
import { IdlePrompt } from './IdlePrompt'
import { LoopButton } from './LoopButton'
import { ModeToggle } from '../../visualizer/ui/ModeToggle'
import { VisualizerCanvas, type VisualizerMode } from '../../visualizer/ui/VisualizerCanvas'
import { MuteButton } from './MuteButton'
import { PlayPauseButton } from './PlayPauseButton'
import { SeekBar } from './SeekBar'
import { VolumeSlider } from './VolumeSlider'

const STATUS_LABEL: Record<PlayerStatus, string> = {
  idle: 'Standby',
  loading: 'Decoding',
  ready: 'Ready',
  playing: 'Playing',
  paused: 'Paused',
  error: 'Error',
}

export function PlayerCard() {
  const [mode, setMode] = useState<VisualizerMode>('bars')

  const status = usePlayerStore((state) => state.status)
  const errorMessage = usePlayerStore((state) => state.errorMessage)
  const analyserNode = usePlayerStore((state) => state.audioGraph?.analyserNode ?? null)
  const duration = usePlayerStore((state) => state.duration)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)
  const loop = usePlayerStore((state) => state.loop)
  const loadFile = usePlayerStore((state) => state.loadFile)
  const play = usePlayerStore((state) => state.play)
  const pause = usePlayerStore((state) => state.pause)
  const seek = usePlayerStore((state) => state.seek)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const setMuted = usePlayerStore((state) => state.setMuted)
  const setLoop = usePlayerStore((state) => state.setLoop)
  const dismissError = usePlayerStore((state) => state.dismissError)

  usePlaybackTicker()

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

  function handleFileDrop(file: File) {
    void loadFile(file)
  }

  function handleToggle() {
    if (status === 'playing') {
      pause()
    } else {
      play()
    }
  }

  const hasTrack =
    status === 'ready' || status === 'playing' || status === 'paused'
  const isLive = status === 'playing'

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-5 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`relative inline-flex size-2 rounded-full ${
              isLive
                ? 'bg-accent shadow-[0_0_10px_var(--accent)]'
                : 'bg-default'
            }`}
          >
            {isLive && (
              <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
            )}
          </span>
          <p className="eyebrow">{STATUS_LABEL[status]}</p>
        </div>
        <p className="numeric text-xs text-muted">
          {hasTrack ? 'signal · live' : '— · no signal'}
        </p>
      </div>

      <div className="instrument-screen relative flex flex-col gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Spectrum</p>
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        <VisualizerCanvas analyserNode={analyserNode} mode={mode} />

        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Spinner aria-label="Decoding audio file" size="lg" />
            <p className="eyebrow">Decoding</p>
          </div>
        )}

        {(status === 'idle' || status === 'error') && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-5">
            <IdlePrompt onBrowseClick={handleBrowseClick} onFileDrop={handleFileDrop} />
          </div>
        )}
      </div>

      <Card.Content className="flex flex-col gap-5 p-5">
        {hasTrack && (
          <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} />
        )}

        <div className="flex flex-wrap items-center gap-4">
          <PlayPauseButton
            isPlaying={isLive}
            isDisabled={!hasTrack}
            onToggle={handleToggle}
          />
          <LoopButton isLooping={loop} onToggle={setLoop} />
          <MuteButton isMuted={muted} onToggle={setMuted} />
          <VolumeSlider volume={volume} isMuted={muted} onVolumeChange={setVolume} />
          {hasTrack && (
            <Button
              variant="tertiary"
              size="sm"
              onPress={handleBrowseClick}
              className="ml-auto"
            >
              Load another file
            </Button>
          )}
        </div>

        {!hasTrack && (
          <>
            <Separator />
            <div className="flex flex-col gap-1 text-xs text-muted">
              <p className="eyebrow">Tip</p>
              <p>
                Drop an MP3, WAV, FLAC, OGG, or M4A file anywhere on the screen
                to load it.
              </p>
            </div>
          </>
        )}
      </Card.Content>

      <input
        ref={inputRef}
        accept="audio/*"
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />
    </Card>
  )
}
