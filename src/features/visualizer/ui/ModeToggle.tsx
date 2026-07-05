import type { Key } from '@heroui/react'
import { ToggleButton, ToggleButtonGroup } from '@heroui/react'
import type { VisualizerMode } from './useVisualizerLoop'

interface ModeToggleProps {
  mode: VisualizerMode
  onModeChange: (mode: VisualizerMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  function handleSelectionChange(keys: Set<Key>) {
    const [next] = keys
    if (next === 'bars' || next === 'waveform') onModeChange(next)
  }

  return (
    <ToggleButtonGroup
      aria-label="Visualizer mode"
      disallowEmptySelection
      selectedKeys={[mode]}
      selectionMode="single"
      size="sm"
      onSelectionChange={handleSelectionChange}
    >
      <ToggleButton id="bars">
        <BarsIcon />
        <span>Bars</span>
      </ToggleButton>
      <ToggleButton id="waveform">
        <ToggleButtonGroup.Separator />
        <WaveIcon />
        <span>Wave</span>
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

function BarsIcon() {
  return (
    <svg
      aria-hidden
      className="size-3.5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="14" rx="1" width="3" x="3" y="6" />
      <rect height="20" rx="1" width="3" x="8" y="2" />
      <rect height="10" rx="1" width="3" x="13" y="8" />
      <rect height="16" rx="1" width="3" x="18" y="4" />
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg
      aria-hidden
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 12h2" />
      <path d="M6 8c2 0 2 8 4 8s2-8 4-8 2 8 4 8h4" />
    </svg>
  )
}
