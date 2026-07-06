import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { Button, Card, Separator, Spinner, toast } from "@heroui/react"
import { usePlaybackTicker } from "../domain/usePlaybackTicker"
import { usePlayerStore, type PlayerStatus } from "../domain/playerStore"
import { IdlePrompt } from "./IdlePrompt"
import { LoopButton } from "./LoopButton"
import { ModeToggle } from "../../visualizer/ui/ModeToggle"
import { VisualizerCanvas, type VisualizerMode } from "../../visualizer/ui/VisualizerCanvas"
import { MuteButton } from "./MuteButton"
import { PlayPauseButton } from "./PlayPauseButton"
import { SeekBar } from "./SeekBar"
import { SpeedControl } from "./SpeedControl"
import { VolumeSlider } from "./VolumeSlider"

const STATUS_LABEL: Record<PlayerStatus, string> = {
  idle: "Standby",
  loading: "Decoding",
  ready: "Ready",
  playing: "Playing",
  paused: "Paused",
  error: "Error",
}

export function PlayerCard() {
  const [mode, setMode] = useState<VisualizerMode>("bars")

  const status = usePlayerStore((state) => state.status)
  const errorMessage = usePlayerStore((state) => state.errorMessage)
  const analyserNode = usePlayerStore((state) => state.audioGraph?.analyserNode ?? null)
  const duration = usePlayerStore((state) => state.duration)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)
  const loop = usePlayerStore((state) => state.loop)
  const speed = usePlayerStore((state) => state.speed)
  const loadFile = usePlayerStore((state) => state.loadFile)
  const play = usePlayerStore((state) => state.play)
  const pause = usePlayerStore((state) => state.pause)
  const seek = usePlayerStore((state) => state.seek)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const setMuted = usePlayerStore((state) => state.setMuted)
  const setLoop = usePlayerStore((state) => state.setLoop)
  const setSpeed = usePlayerStore((state) => state.setSpeed)
  const dismissError = usePlayerStore((state) => state.dismissError)

  usePlaybackTicker()

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status !== "error") return
    toast.danger(errorMessage ?? "Failed to decode audio file.")
    dismissError()
  }, [status, errorMessage, dismissError])

  function handleBrowseClick() {
    inputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) void loadFile(file)
  }

  function handleFileDrop(file: File) {
    void loadFile(file)
  }

  function handleToggle() {
    if (status === "playing") {
      pause()
    } else {
      play()
    }
  }

  const hasTrack =
    status === "ready" || status === "playing" || status === "paused"
  const isLive = status === "playing"

  return (
    <Card className="relative overflow-hidden p-0 ring-1 ring-border/60">
      <div className="relative flex items-center justify-between border-b border-border bg-surface-secondary/60 px-5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`relative inline-flex size-2 rounded-full transition-colors ${
              isLive ? "bg-signal" : "bg-border-strong"
            }`}
          >
            {isLive && (
              <>
                <span className="absolute inset-0 rounded-full bg-signal opacity-70 [animation:signal-pulse_1.6s_ease-in-out_infinite]" />
                <span className="absolute -inset-1 rounded-full bg-signal/30 blur-[3px]" />
              </>
            )}
          </span>
          <p className="eyebrow">{STATUS_LABEL[status]}</p>
        </div>
        <p className="numeric text-[11px] uppercase tracking-[0.16em] text-muted">
          {hasTrack ? "Signal · live" : "Signal · muted"}
        </p>
      </div>

      <div className="instrument-screen relative isolate flex flex-col gap-4 px-6 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <p className="eyebrow">Spectrum</p>
            <p className="numeric text-[11px] text-muted">
              {mode === "bars" ? "FFT · 128" : "FFT · 2048"}
            </p>
          </div>
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        <VisualizerCanvas analyserNode={analyserNode} mode={mode} />

        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-md">
            <Spinner aria-label="Decoding audio file" size="lg" />
            <p className="eyebrow">Decoding</p>
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
            <IdlePrompt onBrowseClick={handleBrowseClick} onFileDrop={handleFileDrop} />
          </div>
        )}
      </div>

      <Card.Content className="flex flex-col gap-6 p-6">
        {hasTrack && (
          <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} />
        )}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <PlayPauseButton
            isPlaying={isLive}
            isDisabled={!hasTrack}
            onToggle={handleToggle}
          />
          <LoopButton isLooping={loop} onToggle={setLoop} />
          <MuteButton isMuted={muted} onToggle={setMuted} />
          <VolumeSlider volume={volume} isMuted={muted} onVolumeChange={setVolume} />
          <SpeedControl speed={speed} onSpeedChange={setSpeed} />
          {hasTrack && (
            <Button
              className="ml-auto"
              size="sm"
              variant="tertiary"
              onPress={handleBrowseClick}
            >
              Load another file
            </Button>
          )}
        </div>

        {!hasTrack && (
          <>
            <Separator className="bg-border/60" />
            <div className="flex items-start gap-4">
              <span className="eyebrow shrink-0 pt-0.5">Tip</span>
              <p className="text-xs leading-relaxed text-muted">
                Drop an MP3, WAV, FLAC, OGG, or M4A file anywhere on the screen
                to load it. Everything decodes locally in your browser.
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